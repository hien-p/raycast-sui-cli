import { SuiCliExecutor } from '../../cli/SuiCliExecutor';
import { sanitizeErrorMessage } from '../../utils/errorHandler';

export interface InspectResult {
    success: boolean;
    results?: any;
    events?: any[];
    effects?: any;
    error?: string;
}

export interface ReplayResult {
    success: boolean;
    output: string;
    error?: string;
}

export interface PackageInspectResult {
    success: boolean;
    modules?: ModuleInfo[];
    packageId?: string;
    error?: string;
}

export interface ModuleInfo {
    name: string;
    functions: FunctionInfo[];
}

export interface FunctionInfo {
    name: string;
    visibility: string;
    parameters: ParameterInfo[];
    returnTypes: string[];
    typeParameters: string[];
}

export interface ParameterInfo {
    name: string;
    type: string;
}

export interface ParsedFunctionSignature {
    functionName: string;
    parameters: ParameterInfo[];
    returnTypes: string[];
    typeParameters: string[];
}

export class InspectorService {
    private executor: SuiCliExecutor;

    constructor() {
        this.executor = SuiCliExecutor.getInstance();
    }

    /**
     * Inspect a transaction block using tx-block command
     * Note: This requires a transaction digest, not raw bytes
     * For inspecting unsigned transactions, use the dry-run functionality in transfer/call services
     * @param txDigest Transaction digest to inspect
     */
    public async inspectTransaction(txDigest: string): Promise<InspectResult> {
        try {
            // Note: tx-block takes digest as positional argument, not a flag
            const args = ['client', 'tx-block', txDigest];

            const output = await this.executor.execute(args, { json: true });
            const data = JSON.parse(output);

            return {
                success: true,
                results: data,
                events: data.events,
                effects: data.effects,
            };
        } catch (error: any) {
            console.error('[InspectorService] Inspection failed:', error);
            return {
                success: false,
                error: sanitizeErrorMessage(error),
            };
        }
    }

    /**
     * Replay a transaction to debug it
     * @param txDigest Transaction digest to replay
     */
    public async replayTransaction(txDigest: string): Promise<ReplayResult> {
        try {
            // Use 'sui replay' command with --digest flag (not deprecated 'client replay-transaction')
            // --overwrite flag allows replaying the same transaction multiple times
            const args = [
                'replay',
                '--digest', txDigest,
                '--show-effects', 'true',
                '--overwrite'
            ];

            // Replay produces verbose output with transaction effects
            const output = await this.executor.execute(args);

            return {
                success: true,
                output,
            };
        } catch (error: any) {
            console.error('[InspectorService] Replay failed:', error);
            return {
                success: false,
                output: error.message || String(error),
                error: 'Replay failed',
            };
        }
    }

    /**
     * Inspect a package to retrieve its modules and functions
     * @param packageId Package object ID
     */
    public async inspectPackage(packageId: string): Promise<PackageInspectResult> {
        try {
            // Get package object data first
            const args = ['client', 'object', packageId];
            const output = await this.executor.execute(args, { json: true });
            const data = JSON.parse(output);

            // Check if this is a package object
            const content = data.content || data.data?.content;
            if (!content || content.dataType !== 'package') {
                return {
                    success: false,
                    error: 'Object is not a package',
                };
            }

            // Extract modules from package content
            const modules: ModuleInfo[] = [];
            const disassembled = content.disassembled;

            if (disassembled && typeof disassembled === 'object') {
                for (const [moduleName, moduleData] of Object.entries(disassembled)) {
                    const functions: FunctionInfo[] = [];

                    // Parse module functions if available
                    if (typeof moduleData === 'string') {
                        // moduleData is disassembled bytecode string
                        // Pattern: "entry public function_name(Arg0: type, Arg1: type, ...)" or "public function_name(...): return_type"

                        // Match function signatures with parameters
                        const functionSignatureMatches = moduleData.matchAll(
                            /(entry\s+)?public\s+(\w+)\s*\((.*?)\)\s*(?::\s*(.+?))?\s*\{/gs
                        );

                        for (const match of functionSignatureMatches) {
                            const isEntry = !!match[1];
                            const functionName = match[2];
                            const paramsStr = match[3] || '';
                            const returnType = match[4]?.trim();

                            // Parse parameters
                            const parameters: Array<{ name: string; type: string }> = [];

                            if (paramsStr.trim()) {
                                // Split by comma, but be careful with nested types like "&mut TxContext"
                                const paramParts = paramsStr.split(',').map(p => p.trim());

                                for (const paramPart of paramParts) {
                                    // Format: "Arg0: vector<u8>" or "Arg1: u64" or "Arg2: &mut TxContext"
                                    const paramMatch = paramPart.match(/(\w+):\s*(.+)/);
                                    if (paramMatch) {
                                        const paramName = paramMatch[1];
                                        const paramType = paramMatch[2].trim();

                                        // Skip TxContext parameters (auto-provided by blockchain)
                                        if (!paramType.includes('TxContext')) {
                                            parameters.push({
                                                name: paramName,
                                                type: paramType,
                                            });
                                        }
                                    }
                                }
                            }

                            functions.push({
                                name: functionName,
                                visibility: isEntry ? 'public(entry)' : 'public',
                                parameters,
                                returnTypes: returnType ? [returnType] : [],
                                typeParameters: [], // Type parameters are harder to parse from bytecode
                            });
                        }
                    }

                    modules.push({
                        name: moduleName,
                        functions,
                    });
                }
            }

            return {
                success: true,
                packageId,
                modules,
            };
        } catch (error: any) {
            console.error('[InspectorService] Package inspection failed:', error);
            return {
                success: false,
                error: sanitizeErrorMessage(error),
            };
        }
    }

    /**
     * Parse a Move function signature string
     * @param signature Function signature string (e.g., "public fun transfer(coin: Coin, recipient: address)")
     */
    public parseFunctionSignature(signature: string): ParsedFunctionSignature | null {
        try {
            // Parse function name
            const nameMatch = signature.match(/fun\s+(\w+)/);
            if (!nameMatch) {
                return null;
            }
            const functionName = nameMatch[1];

            // Parse type parameters
            const typeParams: string[] = [];
            const typeParamMatch = signature.match(/<([^>]+)>/);
            if (typeParamMatch) {
                typeParams.push(...typeParamMatch[1].split(',').map(t => t.trim()));
            }

            // Parse parameters
            const parameters: ParameterInfo[] = [];
            const paramsMatch = signature.match(/\(([^)]*)\)/);
            if (paramsMatch && paramsMatch[1].trim()) {
                const paramStrs = paramsMatch[1].split(',');
                for (const paramStr of paramStrs) {
                    const parts = paramStr.trim().split(':');
                    if (parts.length === 2) {
                        parameters.push({
                            name: parts[0].trim(),
                            type: parts[1].trim(),
                        });
                    }
                }
            }

            // Parse return types
            const returnTypes: string[] = [];
            const returnMatch = signature.match(/\):\s*(.+)$/);
            if (returnMatch) {
                returnTypes.push(returnMatch[1].trim());
            }

            return {
                functionName,
                parameters,
                returnTypes,
                typeParameters: typeParams,
            };
        } catch (error) {
            console.error('[InspectorService] Function signature parsing failed:', error);
            return null;
        }
    }
}
