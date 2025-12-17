import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileSearch,
  Binary,
  Unlock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  FolderOpen,
  Copy,
  RefreshCw,
  Activity,
  Info,
  ChevronDown,
  Lightbulb,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FileBrowser } from '@/components/MoveDeploy/FileBrowser';
import { verifySource, verifyBytecode, decodeTransaction } from '@/api/client';

// Simplified warning for user-friendly display
interface SimplifiedWarning {
  id: string;
  title: string;
  description: string;
  suggestion: string;
  location?: string;
  rawOutput: string;
}

// Map warning codes to user-friendly explanations
const WARNING_EXPLANATIONS: Record<string, { title: string; description: string; suggestion: string }> = {
  'W99001': {
    title: 'Better return pattern available',
    description: 'Your function sends an object directly to the caller. This works, but returning the object instead makes your code more flexible.',
    suggestion: 'Consider using "public fun" that returns the object, so callers can decide what to do with it.',
  },
  'W09001': {
    title: 'Unused variable',
    description: 'You declared a variable but never used it.',
    suggestion: 'Remove the variable or prefix with underscore (_) if intentional.',
  },
  'W09002': {
    title: 'Unused import',
    description: 'You imported something but never used it.',
    suggestion: 'Remove the unused import to keep code clean.',
  },
  'W09003': {
    title: 'Unused function',
    description: 'You defined a function but it\'s never called.',
    suggestion: 'Remove if not needed, or add "public" if it should be accessible.',
  },
};

// Parse raw warning into simplified format
function parseWarningToSimplified(rawWarning: string): SimplifiedWarning {
  // Note: Sui CLI uses "Lint" (capital L) in output
  const codeMatch = rawWarning.match(/warning\[(?:[Ll]int\s+)?(W\d+)\]:/);
  const warningCode = codeMatch ? codeMatch[1] : 'unknown';
  const locationMatch = rawWarning.match(/┌─\s+([^:]+):(\d+):\d+/);
  const location = locationMatch ? `${locationMatch[1].split('/').pop()}:${locationMatch[2]}` : undefined;

  const explanation = WARNING_EXPLANATIONS[warningCode] || {
    title: 'Code suggestion',
    description: 'The compiler found something that could be improved.',
    suggestion: 'Review the details below if you want to address this.',
  };

  return {
    id: warningCode,
    title: explanation.title,
    description: explanation.description,
    suggestion: explanation.suggestion,
    location,
    rawOutput: rawWarning,
  };
}

// Helper to parse CLI output and separate warnings from actual content
interface ParsedOutput {
  hasWarnings: boolean;
  warnings: SimplifiedWarning[];
  content: string;
}

function parseCliWarnings(output: string): ParsedOutput {
  // Pre-process: Remove "Error: " prefix if followed by warning (API wraps warnings in error response)
  let processedOutput = output;
  if (processedOutput.startsWith('Error: warning[')) {
    processedOutput = processedOutput.substring(7); // Remove "Error: "
  }

  const lines = processedOutput.split('\n');
  const rawWarnings: string[] = [];
  const contentLines: string[] = [];

  let inWarningBlock = false;
  let currentWarning = '';

  // Helper to check if line is part of warning block
  const isWarningContinuation = (line: string): boolean => {
    const boxChars = /^[\s┌─│└├╭╮╯╰]/;
    return boxChars.test(line) ||
           line.startsWith('   ') ||
           line.startsWith(' ') ||
           line.startsWith('=') ||
           line.includes('This warning can be suppressed') ||
           line.includes('Returning an object') ||
           line.includes('Transaction sender') ||
           line.includes('Transfer of an object') ||
           line.includes('^^^^') ||
           line.trim() === '';
  };

  for (const line of lines) {
    // Detect warning start - Note: Sui CLI uses "Lint" (capital L)
    if (/^warning\[(?:[Ll]int\s+)?W\d+\]:/.test(line)) {
      if (currentWarning) {
        rawWarnings.push(currentWarning.trim());
      }
      inWarningBlock = true;
      currentWarning = line;
    }
    // Continue warning block
    else if (inWarningBlock && isWarningContinuation(line)) {
      currentWarning += '\n' + line;
    }
    // Normal content
    else {
      if (inWarningBlock && currentWarning) {
        rawWarnings.push(currentWarning.trim());
        currentWarning = '';
      }
      inWarningBlock = false;
      contentLines.push(line);
    }
  }

  if (currentWarning) {
    rawWarnings.push(currentWarning.trim());
  }

  return {
    hasWarnings: rawWarnings.length > 0,
    warnings: rawWarnings.map(parseWarningToSimplified),
    content: contentLines.join('\n').trim(),
  };
}

interface VerifySourceResult {
  verified: boolean;
  output: string;
  packagePath: string;
}

interface VerifyBytecodeResult {
  output: string;
  withinLimits: boolean;
  meterUsage?: { current: number; limit: number };
}

interface DecodeTransactionResult {
  decoded: any;
  signatureValid?: boolean;
}

export function SecurityTools() {
  // URL params for tab switching
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const validTabs = ['source', 'bytecode', 'decode'];
  const [activeTab, setActiveTab] = useState(() =>
    tabParam && validTabs.includes(tabParam) ? tabParam : 'source'
  );

  // Sync tab state when URL changes (e.g., from FileTree navigation)
  useEffect(() => {
    const newTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'source';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [tabParam]);

  // Sync URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'source') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams, { replace: true });
  };

  // Source Verification State
  const [packagePath, setPackagePath] = useState('');
  const [verifyDeps, setVerifyDeps] = useState(false);
  const [skipSource, setSkipSource] = useState(false);
  const [verifyingSource, setVerifyingSource] = useState(false);
  const [sourceResult, setSourceResult] = useState<VerifySourceResult | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);

  // Bytecode Verification State
  const [bytecodePackagePath, setBytecodePackagePath] = useState('');
  const [modulePaths, setModulePaths] = useState('');
  const [protocolVersion, setProtocolVersion] = useState('');
  const [verifyingBytecode, setVerifyingBytecode] = useState(false);
  const [bytecodeResult, setBytecodeResult] = useState<VerifyBytecodeResult | null>(null);
  const [showBytecodeBrowser, setShowBytecodeBrowser] = useState(false);

  // Transaction Decoding State
  const [txBytes, setTxBytes] = useState('');
  const [signature, setSignature] = useState('');
  const [decodingTx, setDecodingTx] = useState(false);
  const [txResult, setTxResult] = useState<DecodeTransactionResult | null>(null);

  // Handle Source Verification
  const handleVerifySource = async () => {
    if (!packagePath.trim()) {
      toast.error('Please select a package path');
      return;
    }

    setVerifyingSource(true);
    setSourceResult(null);

    try {
      const data = await verifySource(packagePath.trim(), verifyDeps, skipSource);
      setSourceResult(data);
      if (data.verified) {
        toast.success('Source verification successful!');
      } else {
        toast.error('Source verification failed');
      }
    } catch (error: any) {
      const msg = error.message || String(error);
      setSourceResult({ verified: false, output: msg, packagePath: packagePath.trim() });
      toast.error('Verification failed: ' + msg);
    } finally {
      setVerifyingSource(false);
    }
  };

  // Handle Bytecode Verification
  const handleVerifyBytecode = async () => {
    if (!bytecodePackagePath.trim() && !modulePaths.trim()) {
      toast.error('Please provide a package path or module paths');
      return;
    }

    setVerifyingBytecode(true);
    setBytecodeResult(null);

    try {
      const modulePathsArray = modulePaths.trim() ? modulePaths.trim().split(',').map(p => p.trim()) : undefined;
      const protocolVer = protocolVersion.trim() ? parseInt(protocolVersion.trim(), 10) : undefined;

      const data = await verifyBytecode(
        bytecodePackagePath.trim() || undefined,
        modulePathsArray,
        protocolVer
      );
      setBytecodeResult(data);
      if (data.withinLimits) {
        toast.success('Bytecode within meter limits!');
      } else {
        toast.error('Bytecode exceeds meter limits');
      }
    } catch (error: any) {
      const msg = error.message || String(error);
      setBytecodeResult({ output: msg, withinLimits: false });
      toast.error('Verification failed: ' + msg);
    } finally {
      setVerifyingBytecode(false);
    }
  };

  // Handle Transaction Decoding
  const handleDecodeTx = async () => {
    if (!txBytes.trim()) {
      toast.error('Please provide transaction bytes');
      return;
    }

    setDecodingTx(true);
    setTxResult(null);

    try {
      const data = await decodeTransaction(txBytes.trim(), signature.trim() || undefined);
      setTxResult(data);
      toast.success('Transaction decoded successfully!');
    } catch (error: any) {
      const msg = error.message || String(error);
      toast.error('Decoding failed: ' + msg);
    } finally {
      setDecodingTx(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <>
      <div className="relative z-10 p-3 sm:p-4">
        <div className="relative max-w-[1600px] mx-auto space-y-3">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" style={{ filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))' }} />
              <h1 className="text-lg font-bold text-green-400 font-mono">Security Tools</h1>
            </div>
            <p className="text-green-500/60 font-mono text-xs hidden sm:block">
              Verify • Audit • Decode
            </p>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          >
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-black/30 border border-green-500/30 h-9">
                <TabsTrigger value="source" className="flex items-center justify-center gap-1.5 text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-green-500/60 hover:text-green-400 font-mono h-8">
                  <FileSearch className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">Verify Source</span>
                </TabsTrigger>
                <TabsTrigger value="bytecode" className="flex items-center justify-center gap-1.5 text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-green-500/60 hover:text-green-400 font-mono h-8">
                  <Binary className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">Verify Bytecode</span>
                </TabsTrigger>
                <TabsTrigger value="decode" className="flex items-center justify-center gap-1.5 text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-green-500/60 hover:text-green-400 font-mono h-8">
                  <Unlock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">Decode TX</span>
                </TabsTrigger>
              </TabsList>

              {/* Verify Source Tab */}
              <TabsContent value="source" className="space-y-3 mt-2">
                {/* Prerequisite Info */}
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded text-xs font-mono">
                  <p className="text-blue-400 flex items-center gap-1.5 mb-1">
                    <Info className="w-3.5 h-3.5" />
                    Prerequisite: Package must be published on-chain first
                  </p>
                  <p className="text-blue-300/70 pl-5">
                    This verifies that your local source code matches the bytecode deployed on the current network.
                  </p>
                </div>

                <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors shadow-md">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center gap-1.5 text-green-400 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                      Source Verification
                    </CardTitle>
                    <CardDescription className="text-xs text-green-500/60 font-mono">
                      Verify on-chain bytecode matches local source
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2">
                    {/* Package Path */}
                    <div className="space-y-1">
                      <Label htmlFor="source-package-path" className="text-xs font-medium flex items-center gap-1 text-green-400 font-mono">
                        Package Path <span className="text-red-400">*</span>
                      </Label>
                      <div className="flex gap-1.5">
                        <input
                          id="source-package-path"
                          type="text"
                          value={packagePath}
                          onChange={(e) => setPackagePath(e.target.value)}
                          placeholder="/path/to/move/package"
                          className="flex-1 px-2.5 py-1.5 bg-black/50 border border-green-500/30 rounded text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500 transition-all text-xs font-mono"
                          disabled={verifyingSource}
                        />
                        <button
                          onClick={() => setShowBrowser(true)}
                          disabled={verifyingSource}
                          className="px-2.5 py-1.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded hover:bg-green-500/30 transition-colors disabled:opacity-50"
                          title="Browse"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-green-400 font-mono">Options</Label>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={verifyDeps}
                            onChange={(e) => setVerifyDeps(e.target.checked)}
                            disabled={verifyingSource}
                            className="w-3 h-3 text-green-500 bg-black/50 border-green-500/50 rounded focus:ring-1 focus:ring-green-500/50"
                          />
                          <span className="text-[11px] text-green-400 font-mono">Verify dependencies</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={skipSource}
                            onChange={(e) => setSkipSource(e.target.checked)}
                            disabled={verifyingSource}
                            className="w-3 h-3 text-green-500 bg-black/50 border-green-500/50 rounded focus:ring-1 focus:ring-green-500/50"
                          />
                          <span className="text-[11px] text-green-400 font-mono">Skip source verification</span>
                        </label>
                      </div>
                    </div>

                    {/* Verify Button */}
                    <button
                      onClick={handleVerifySource}
                      disabled={!packagePath.trim() || verifyingSource}
                      className="w-full px-4 py-2.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm font-mono"
                    >
                      {verifyingSource ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Verify Source
                        </>
                      )}
                    </button>
                  </CardContent>
                </Card>

                {/* Source Result */}
                <AnimatePresence mode="wait">
                  {sourceResult && (() => {
                    const parsed = parseCliWarnings(sourceResult.output);
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                      >
                        {/* User-friendly Lint Warnings */}
                        {parsed.hasWarnings && (
                          <div className="space-y-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                            {/* Simple header */}
                            <div className="flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-400" />
                              <span className="text-sm font-medium text-amber-400">
                                {parsed.warnings.length} code suggestion{parsed.warnings.length > 1 ? 's' : ''} found
                              </span>
                              <span className="text-xs text-green-500/60 ml-auto">
                                Not verification errors
                              </span>
                            </div>

                            {/* Simple warning cards */}
                            <div className="space-y-2">
                              {parsed.warnings.map((warning, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-black/20 border border-amber-500/10 rounded"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className="text-xs font-medium text-amber-300">
                                      {warning.title}
                                    </span>
                                    {warning.location && (
                                      <span className="text-xs text-amber-500/50 font-mono whitespace-nowrap">
                                        {warning.location}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-white/60 mb-1.5">
                                    {warning.description}
                                  </p>
                                  <p className="text-[11px] text-green-400/70 flex items-start gap-1">
                                    <span className="text-green-500">→</span>
                                    {warning.suggestion}
                                  </p>
                                  <details className="mt-1.5">
                                    <summary className="text-xs text-amber-500/40 cursor-pointer hover:text-amber-500/60 flex items-center gap-1">
                                      <ChevronDown className="w-2.5 h-2.5" />
                                      Show compiler output
                                    </summary>
                                    <pre className="mt-1.5 p-1.5 bg-black/30 rounded text-xs text-amber-400/50 font-mono overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto">
                                      {warning.rawOutput}
                                    </pre>
                                  </details>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Verification Result */}
                        <Card className={`bg-black/40 backdrop-blur-md border ${sourceResult.verified ? 'border-green-500/50' : 'border-red-500/50'} shadow-md`}>
                          <CardHeader className="py-2 px-3">
                            <CardTitle className="text-sm flex items-center gap-1.5 font-mono">
                              {sourceResult.verified ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                  <span className="text-green-400">Verification Successful</span>
                                  {parsed.hasWarnings && (
                                    <span className="text-xs text-amber-400 ml-1">(with lint warnings)</span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-400" />
                                  <span className="text-red-400">Verification Failed</span>
                                </>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 pb-3 space-y-2">
                            {/* Helpful message for failed verification */}
                            {!sourceResult.verified && (
                              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs font-mono">
                                <p className="text-red-400 flex items-center gap-1.5 mb-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Common reasons for verification failure:
                                </p>
                                <ul className="text-red-400/70 pl-5 space-y-0.5 list-disc text-xs">
                                  <li>Package not yet published on current network</li>
                                  <li>Local source differs from deployed bytecode</li>
                                  <li>Wrong network (check active environment)</li>
                                  <li>Package ID mismatch in Move.toml</li>
                                </ul>
                              </div>
                            )}

                            {/* Output */}
                            <div className="bg-black/50 border border-green-500/30 rounded p-2 max-h-64 overflow-y-auto">
                              <pre className={`text-xs font-mono whitespace-pre-wrap break-all ${sourceResult.verified ? 'text-green-400' : 'text-red-400'}`}>
                                {parsed.content || sourceResult.output}
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </TabsContent>

              {/* Verify Bytecode Tab */}
              <TabsContent value="bytecode" className="space-y-3 mt-2">
                <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors shadow-md">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center gap-1.5 text-green-400 font-mono">
                      <Binary className="w-3.5 h-3.5 text-green-500" />
                      Bytecode Verification
                    </CardTitle>
                    <CardDescription className="text-xs text-green-500/60 font-mono">
                      Check bytecode meter limits and validity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2">
                    {/* Package Path */}
                    <div className="space-y-1">
                      <Label htmlFor="bytecode-package-path" className="text-xs font-medium text-green-400 font-mono">
                        Package Path
                      </Label>
                      <div className="flex gap-1.5">
                        <input
                          id="bytecode-package-path"
                          type="text"
                          value={bytecodePackagePath}
                          onChange={(e) => setBytecodePackagePath(e.target.value)}
                          placeholder="/path/to/move/package"
                          className="flex-1 px-2.5 py-1.5 bg-black/50 border border-green-500/30 rounded text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500/50 text-xs font-mono"
                          disabled={verifyingBytecode}
                        />
                        <button
                          onClick={() => setShowBytecodeBrowser(true)}
                          disabled={verifyingBytecode}
                          className="px-2.5 py-1.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded hover:bg-green-500/30 transition-colors disabled:opacity-50"
                          title="Browse"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Module Paths */}
                    <div className="space-y-1">
                      <Label htmlFor="module-paths" className="text-xs font-medium text-green-400 font-mono">
                        Module Paths (comma-separated)
                      </Label>
                      <input
                        id="module-paths"
                        type="text"
                        value={modulePaths}
                        onChange={(e) => setModulePaths(e.target.value)}
                        placeholder="/path/to/module1.mv,/path/to/module2.mv"
                        className="w-full px-2.5 py-1.5 bg-black/50 border border-green-500/30 rounded text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500/50 text-xs font-mono"
                        disabled={verifyingBytecode}
                      />
                    </div>

                    {/* Protocol Version */}
                    <div className="space-y-1">
                      <Label htmlFor="protocol-version" className="text-xs font-medium text-green-400 font-mono">
                        Protocol Version (optional)
                      </Label>
                      <input
                        id="protocol-version"
                        type="text"
                        value={protocolVersion}
                        onChange={(e) => setProtocolVersion(e.target.value)}
                        placeholder="e.g., 1"
                        className="w-full px-2.5 py-1.5 bg-black/50 border border-green-500/30 rounded text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500/50 text-xs font-mono"
                        disabled={verifyingBytecode}
                      />
                    </div>

                    {/* Verify Button */}
                    <button
                      onClick={handleVerifyBytecode}
                      disabled={(!bytecodePackagePath.trim() && !modulePaths.trim()) || verifyingBytecode}
                      className="w-full px-4 py-2.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm font-mono"
                    >
                      {verifyingBytecode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Binary className="w-4 h-4" />
                          Verify Bytecode
                        </>
                      )}
                    </button>
                  </CardContent>
                </Card>

                {/* Bytecode Result */}
                <AnimatePresence mode="wait">
                  {bytecodeResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card className={`bg-black/40 backdrop-blur-md border ${bytecodeResult.withinLimits ? 'border-green-500/50' : 'border-red-500/50'} shadow-md`}>
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-sm flex items-center gap-1.5 font-mono">
                            {bytecodeResult.withinLimits ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-green-400">Within Limits</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-4 h-4 text-red-400" />
                                <span className="text-red-400">Exceeds Limits</span>
                              </>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3 space-y-2">
                          {/* Meter Usage */}
                          {bytecodeResult.meterUsage && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-green-400">Meter Usage</span>
                                <Badge className={`${bytecodeResult.withinLimits ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} text-xs font-mono`}>
                                  {bytecodeResult.meterUsage.current} / {bytecodeResult.meterUsage.limit}
                                </Badge>
                              </div>
                              {/* Progress Bar */}
                              <div className="w-full bg-black/50 border border-green-500/30 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full transition-all ${bytecodeResult.withinLimits ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{
                                    width: `${Math.min((bytecodeResult.meterUsage.current / bytecodeResult.meterUsage.limit) * 100, 100)}%`
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-1 text-xs text-green-500/60 font-mono">
                                <Activity className="w-2.5 h-2.5" />
                                {Math.round((bytecodeResult.meterUsage.current / bytecodeResult.meterUsage.limit) * 100)}% used
                              </div>
                            </div>
                          )}

                          {/* Output */}
                          <div className="bg-black/50 border border-green-500/30 rounded p-2 max-h-64 overflow-y-auto">
                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
                              {bytecodeResult.output}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              {/* Decode Transaction Tab */}
              <TabsContent value="decode" className="space-y-3 mt-2">
                <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors shadow-md">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center gap-1.5 text-green-400 font-mono">
                      <Unlock className="w-3.5 h-3.5 text-green-500" />
                      Transaction Decoder
                    </CardTitle>
                    <CardDescription className="text-xs text-green-500/60 font-mono">
                      Decode and verify transaction bytes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2">
                    {/* Transaction Bytes */}
                    <div className="space-y-1">
                      <Label htmlFor="tx-bytes" className="text-xs font-medium flex items-center gap-1 text-green-400 font-mono">
                        Transaction Bytes <span className="text-red-400">*</span>
                      </Label>
                      <textarea
                        id="tx-bytes"
                        value={txBytes}
                        onChange={(e) => setTxBytes(e.target.value)}
                        placeholder="Paste base64-encoded transaction bytes here..."
                        className="w-full px-2.5 py-1.5 bg-black/50 border border-green-500/30 rounded text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500/50 text-xs font-mono min-h-[80px] resize-y"
                        disabled={decodingTx}
                      />
                    </div>

                    {/* Signature (Optional) */}
                    <div className="space-y-1">
                      <Label htmlFor="signature" className="text-xs font-medium text-green-400 font-mono">
                        Signature (optional)
                      </Label>
                      <input
                        id="signature"
                        type="text"
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        placeholder="Optional signature for verification"
                        className="w-full px-2.5 py-1.5 bg-black/50 border border-green-500/30 rounded text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500/50 text-xs font-mono"
                        disabled={decodingTx}
                      />
                    </div>

                    {/* Decode Button */}
                    <button
                      onClick={handleDecodeTx}
                      disabled={!txBytes.trim() || decodingTx}
                      className="w-full px-4 py-2.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm font-mono"
                    >
                      {decodingTx ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Decoding...
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4" />
                          Decode Transaction
                        </>
                      )}
                    </button>
                  </CardContent>
                </Card>

                {/* Decode Result */}
                <AnimatePresence mode="wait">
                  {txResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card className="bg-black/40 backdrop-blur-md border-green-500/50 shadow-md">
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-sm flex items-center gap-1.5 text-green-400 font-mono">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Decoded Transaction
                            {txResult.signatureValid !== undefined && (
                              <Badge className={`ml-auto ${txResult.signatureValid ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} text-xs font-mono`}>
                                {txResult.signatureValid ? 'Valid Signature' : 'Invalid Signature'}
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="bg-black/50 border border-green-500/30 rounded p-2 max-h-96 overflow-y-auto relative">
                            <button
                              onClick={() => copyToClipboard(JSON.stringify(txResult.decoded, null, 2), 'Transaction data')}
                              className="absolute top-2 right-2 p-1.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                              title="Copy to clipboard"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all pr-8">
                              {JSON.stringify(txResult.decoded, null, 2)}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 px-3 py-2 border border-green-500/30 bg-green-500/10 backdrop-blur-md rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
              <span className="text-xs text-green-300/80 font-mono">
                <strong className="text-green-400">Security Tip:</strong> Always verify source code before deployment. Check bytecode limits to prevent runtime failures.
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* File Browser Modals */}
      <AnimatePresence>
        {showBrowser && (
          <FileBrowser
            onSelect={(path) => {
              setPackagePath(path);
              toast.success(`Selected: ${path.split('/').pop()}`);
            }}
            onClose={() => setShowBrowser(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBytecodeBrowser && (
          <FileBrowser
            onSelect={(path) => {
              setBytecodePackagePath(path);
              toast.success(`Selected: ${path.split('/').pop()}`);
            }}
            onClose={() => setShowBytecodeBrowser(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
