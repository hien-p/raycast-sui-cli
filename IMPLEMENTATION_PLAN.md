# Sui CLI Web - Feature Implementation Plan

## Executive Summary

This document outlines the implementation plan for enhancing Sui CLI Web with features essential for Sui developers. The plan covers:

1. **Partial Features** - Enhancements to existing functionality
2. **HIGH Priority** - Essential developer workflow features
3. **MEDIUM Priority** - Nice-to-have features
4. **Special Exceptions** - Architecture changes for complex requirements

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Partial Features Enhancement](#phase-1-partial-features-enhancement)
3. [Phase 2: HIGH Priority Features](#phase-2-high-priority-features)
4. [Phase 3: MEDIUM Priority Features](#phase-3-medium-priority-features)
5. [Phase 4: Special Exceptions Architecture](#phase-4-special-exceptions-architecture)
6. [Implementation Timeline](#implementation-timeline)
7. [File Structure](#file-structure)

---

## Architecture Overview

### Current Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React + Vite)                    │
│  - Zustand store for state                                   │
│  - React Router 7 for navigation                             │
│  - TailwindCSS + Radix UI for styling                        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Fastify Server (localhost:3001)             │
│  - Routes → Services → SuiCliExecutor                        │
│  - Rate limiting per operation type                          │
│  - CORS whitelist for security                               │
└────────────────────────┬────────────────────────────────────┘
                         │ Child process spawn
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Sui CLI Binary                          │
│  - sui client, sui move, sui keytool, sui validator          │
└─────────────────────────────────────────────────────────────┘
```

### New Architecture (with SSE/WebSocket)
```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React + Vite)                    │
│  + EventSource for SSE streaming                             │
│  + Process manager for long-running tasks                    │
└────────────────────┬───────────────┬────────────────────────┘
                     │ REST          │ SSE/WebSocket
                     ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Fastify Server (localhost:3001)             │
│  + @fastify/websocket for real-time                          │
│  + ProcessManager singleton for long-running tasks           │
│  + StreamingService for chunked responses                    │
└────────────────────┬───────────────┬────────────────────────┘
                     │               │
            ┌────────┴───────┐ ┌─────┴─────┐
            │ One-shot CLI   │ │ Persistent │
            │ (build, test)  │ │ Processes  │
            └────────────────┘ │ (sui start)│
                               └────────────┘
```

---

## Phase 1: Partial Features Enhancement

### 1.1 PTB Visual Builder Enhancement

**Current State**: Basic PTB execution via text input
**Target State**: Visual drag-and-drop PTB builder

#### Server Changes

```typescript
// packages/server/src/services/dev/PtbBuilderService.ts

export interface PtbCommand {
  id: string;
  type: 'split-coins' | 'merge-coins' | 'transfer-objects' | 'move-call' | 'make-move-vec' | 'assign';
  params: Record<string, any>;
  resultVar?: string;
}

export interface PtbBuildRequest {
  commands: PtbCommand[];
  gasBudget?: string;
  gasCoin?: string;
  dryRun?: boolean;
  devInspect?: boolean;
}

export class PtbBuilderService {
  // Validate PTB command sequence
  async validateCommands(commands: PtbCommand[]): Promise<ValidationResult>;

  // Build CLI args from visual commands
  buildCliArgs(request: PtbBuildRequest): string[];

  // Execute PTB with streaming output
  async executePtb(request: PtbBuildRequest): Promise<PtbResult>;

  // Get available types for make-move-vec
  async getCommonTypes(): Promise<string[]>;

  // Suggest variables based on previous commands
  getAvailableVariables(commands: PtbCommand[], currentIndex: number): Variable[];
}
```

```typescript
// packages/server/src/routes/ptb-builder.ts

export async function ptbBuilderRoutes(fastify: FastifyInstance) {
  // POST /api/ptb/validate - Validate PTB commands
  fastify.post<{ Body: { commands: PtbCommand[] } }>('/ptb/validate', async (request) => {
    const service = new PtbBuilderService();
    return service.validateCommands(request.body.commands);
  });

  // POST /api/ptb/build - Build and optionally execute PTB
  fastify.post<{ Body: PtbBuildRequest }>('/ptb/build', async (request) => {
    const service = new PtbBuilderService();
    return service.executePtb(request.body);
  });

  // GET /api/ptb/templates - Get common PTB templates
  fastify.get('/ptb/templates', async () => {
    return {
      templates: [
        { name: 'Split and Transfer', description: 'Split coins and transfer to multiple recipients', commands: [...] },
        { name: 'Batch NFT Transfer', description: 'Transfer multiple NFTs in one transaction', commands: [...] },
        { name: 'DeFi Swap', description: 'Swap tokens using DEX', commands: [...] },
      ]
    };
  });
}
```

#### Client Changes

```typescript
// packages/client/src/components/PtbBuilder/index.tsx

interface PtbBuilderProps {
  onExecute: (result: PtbResult) => void;
}

export function PtbBuilder({ onExecute }: PtbBuilderProps) {
  const [commands, setCommands] = useState<PtbCommand[]>([]);
  const [variables, setVariables] = useState<Map<string, Variable>>();

  // Drag and drop command reordering
  // Visual command blocks with parameter inputs
  // Variable autocomplete from previous results
  // Real-time validation feedback
  // Dry run preview
}

// Command block components
export function SplitCoinsBlock({ command, onChange, variables }: BlockProps);
export function MergeCoinsBlock({ command, onChange, variables }: BlockProps);
export function TransferObjectsBlock({ command, onChange, variables }: BlockProps);
export function MoveCallBlock({ command, onChange, variables }: BlockProps);
export function AssignBlock({ command, onChange, variables }: BlockProps);
```

#### UI Mockup
```
┌─────────────────────────────────────────────────────────────┐
│  PTB Builder                                    [Templates ▼]│
├─────────────────────────────────────────────────────────────┤
│  ┌─ Commands ─────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ 1. Split Coins                              [×] │   │ │
│  │  │    Coin: [gas ▼]                                │   │ │
│  │  │    Amounts: [1000, 2000, 3000]                  │   │ │
│  │  │    Result: $split_result                        │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │                        ↓                               │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ 2. Transfer Objects                         [×] │   │ │
│  │  │    Objects: [$split_result[0], $split_result[1]]│   │ │
│  │  │    To: [0x123...abc]                            │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │                                                         │ │
│  │  [+ Add Command ▼]                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─ Preview ──────────────────────────────────────────────┐ │
│  │ sui client ptb \                                        │ │
│  │   --split-coins gas "[1000, 2000, 3000]" \             │ │
│  │   --assign split_result \                               │ │
│  │   --transfer-objects "[split_result[0], ...]" @0x123   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [Dry Run]  [Dev Inspect]  [Execute]                         │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.2 Replay Enhancement (New `sui replay`)

**Current State**: Uses deprecated `sui client replay-transaction`
**Target State**: Use new `sui replay` with trace support

#### Server Changes

```typescript
// packages/server/src/services/dev/ReplayService.ts

export interface ReplayOptions {
  digest: string;
  trace?: boolean;           // --trace flag
  showEffects?: boolean;     // -e flag
  outputDir?: string;        // -o flag (auto-generate if not provided)
  overwrite?: boolean;       // --overwrite flag
}

export interface ReplayResult {
  success: boolean;
  effects?: TransactionEffects;
  traceDir?: string;         // Path to trace files if --trace used
  traceFiles?: string[];     // List of generated trace files
  error?: string;
}

export class ReplayService {
  private executor: SuiCliExecutor;
  private traceBaseDir: string; // ~/.sui-cli-web/traces/

  async replay(options: ReplayOptions): Promise<ReplayResult> {
    const args = ['replay', '-d', options.digest];

    if (options.trace) {
      args.push('--trace');
      const traceDir = options.outputDir || this.generateTraceDir(options.digest);
      args.push('-o', traceDir);
    }

    if (options.showEffects !== false) {
      args.push('-e', 'true');
    }

    if (options.overwrite) {
      args.push('--overwrite');
    }

    const result = await this.executor.execute(args, { timeout: 120000 });
    return this.parseReplayResult(result, options);
  }

  // Get trace file contents
  async getTraceFile(digest: string, filename: string): Promise<string>;

  // List available trace files for a replay
  async listTraceFiles(digest: string): Promise<TraceFileInfo[]>;

  // Clean old trace files
  async cleanupTraces(olderThanDays: number): Promise<void>;
}
```

```typescript
// packages/server/src/routes/replay.ts

export async function replayRoutes(fastify: FastifyInstance) {
  // POST /api/replay - Replay a transaction
  fastify.post<{ Body: ReplayOptions }>('/replay', async (request) => {
    const service = new ReplayService();
    return service.replay(request.body);
  });

  // GET /api/replay/:digest/traces - List trace files
  fastify.get<{ Params: { digest: string } }>('/replay/:digest/traces', async (request) => {
    const service = new ReplayService();
    return service.listTraceFiles(request.params.digest);
  });

  // GET /api/replay/:digest/trace/:filename - Get trace file content
  fastify.get<{ Params: { digest: string; filename: string } }>(
    '/replay/:digest/trace/:filename',
    async (request) => {
      const service = new ReplayService();
      return service.getTraceFile(request.params.digest, request.params.filename);
    }
  );

  // POST /api/replay/batch - Replay multiple transactions
  fastify.post<{ Body: { digests: string[]; trace?: boolean } }>('/replay/batch', async (request) => {
    // SSE endpoint for streaming results
  });
}
```

#### Client Changes

```typescript
// packages/client/src/components/TransactionReplay/index.tsx

export function TransactionReplay() {
  const [digest, setDigest] = useState('');
  const [enableTrace, setEnableTrace] = useState(false);
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [traceFiles, setTraceFiles] = useState<TraceFileInfo[]>([]);

  // Replay controls
  // Effects display (reuse existing TransactionEffects component)
  // Trace file browser with syntax highlighting
  // Download trace files option
}
```

---

### 1.3 Gas Analysis UI

**Current State**: Marked "coming soon"
**Target State**: Full gas breakdown and optimization suggestions

#### Server Changes

```typescript
// packages/server/src/services/dev/GasAnalysisService.ts

export interface GasBreakdown {
  computationCost: string;
  storageCost: string;
  storageRebate: string;
  nonRefundableStorageFee: string;
  totalGasUsed: string;
  totalGasBudget: string;
  efficiency: number; // percentage of budget used
}

export interface GasOptimization {
  type: 'warning' | 'suggestion' | 'info';
  message: string;
  potentialSavings?: string;
}

export interface GasAnalysisResult {
  breakdown: GasBreakdown;
  optimizations: GasOptimization[];
  historicalComparison?: {
    averageForType: string;
    percentile: number;
  };
}

export class GasAnalysisService {
  // Analyze gas from transaction effects
  async analyzeTransaction(digest: string): Promise<GasAnalysisResult>;

  // Estimate gas for a dry run
  async estimateGas(txBytes: string): Promise<GasBreakdown>;

  // Compare with similar transactions
  async getHistoricalData(functionSignature: string): Promise<HistoricalGasData>;

  // Generate optimization suggestions
  generateOptimizations(breakdown: GasBreakdown, txKind: string): GasOptimization[];
}
```

```typescript
// packages/server/src/routes/gas.ts

export async function gasRoutes(fastify: FastifyInstance) {
  // GET /api/gas/analyze/:digest - Analyze transaction gas
  fastify.get<{ Params: { digest: string } }>('/gas/analyze/:digest', async (request) => {
    const service = new GasAnalysisService();
    return service.analyzeTransaction(request.params.digest);
  });

  // POST /api/gas/estimate - Estimate gas for transaction
  fastify.post<{ Body: { txBytes: string } }>('/gas/estimate', async (request) => {
    const service = new GasAnalysisService();
    return service.estimateGas(request.body.txBytes);
  });

  // GET /api/gas/reference - Get current reference gas price
  fastify.get('/gas/reference', async () => {
    // Use RPC to get reference gas price
  });
}
```

#### Client Changes

```typescript
// packages/client/src/components/GasAnalysis/index.tsx

export function GasAnalysis({ digest }: { digest?: string }) {
  // Gas breakdown pie chart
  // Cost breakdown table
  // Optimization suggestions with severity badges
  // Historical comparison chart
  // Reference gas price display
}

// packages/client/src/components/GasAnalysis/GasBreakdownChart.tsx
export function GasBreakdownChart({ breakdown }: { breakdown: GasBreakdown }) {
  // Pie/donut chart showing computation vs storage costs
}

// packages/client/src/components/GasAnalysis/OptimizationsList.tsx
export function OptimizationsList({ optimizations }: { optimizations: GasOptimization[] }) {
  // List of suggestions with icons and potential savings
}
```

#### UI Mockup
```
┌─────────────────────────────────────────────────────────────┐
│  Gas Analysis                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Breakdown ────────────────────┐ ┌─ Summary ───────────┐ │
│  │         ┌────────┐             │ │ Total Used: 1.2M    │ │
│  │        /  Comp   \             │ │ Budget:     5.0M    │ │
│  │       │   45%     │            │ │ Efficiency: 24%     │ │
│  │       │  Storage  │            │ │                     │ │
│  │        \  55%    /             │ │ Reference: 1000 MIST│ │
│  │         └────────┘             │ └─────────────────────┘ │
│  └────────────────────────────────┘                         │
│                                                              │
│  ┌─ Cost Details ───────────────────────────────────────┐   │
│  │ Computation Cost    │ 540,000 MIST  │ 0.00054 SUI   │   │
│  │ Storage Cost        │ 660,000 MIST  │ 0.00066 SUI   │   │
│  │ Storage Rebate      │ -50,000 MIST  │ -0.00005 SUI  │   │
│  │ ─────────────────────────────────────────────────────│   │
│  │ Total               │ 1,150,000 MIST│ 0.00115 SUI   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Optimizations ──────────────────────────────────────┐   │
│  │ ⚠️  Gas budget 4x higher than needed                  │   │
│  │     Consider reducing to ~1.5M for similar txns       │   │
│  │                                                       │   │
│  │ 💡 Storage cost is 55% of total                       │   │
│  │     Large objects created - consider lazy init        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.4 Event Parsing

**Current State**: Events shown as raw JSON
**Target State**: Parsed, searchable, filterable events

#### Server Changes

```typescript
// packages/server/src/services/dev/EventService.ts

export interface ParsedEvent {
  id: string;
  type: string;
  packageId: string;
  module: string;
  eventName: string;
  sender: string;
  timestamp: number;
  parsedFields: Record<string, any>;
  rawData: any;
}

export interface EventFilter {
  packageId?: string;
  module?: string;
  eventType?: string;
  sender?: string;
  startTime?: number;
  endTime?: number;
}

export class EventService {
  // Parse events from transaction
  async getTransactionEvents(digest: string): Promise<ParsedEvent[]>;

  // Query events with filters (uses sui_queryEvents RPC)
  async queryEvents(filter: EventFilter, cursor?: string, limit?: number): Promise<{
    events: ParsedEvent[];
    nextCursor: string | null;
  }>;

  // Subscribe to events (for SSE)
  async subscribeEvents(filter: EventFilter, callback: (event: ParsedEvent) => void): Promise<Unsubscribe>;

  // Get event type schema (from Move module)
  async getEventSchema(packageId: string, module: string, eventName: string): Promise<EventSchema>;
}
```

```typescript
// packages/server/src/routes/events.ts

export async function eventRoutes(fastify: FastifyInstance) {
  // GET /api/events/transaction/:digest - Get events from transaction
  fastify.get<{ Params: { digest: string } }>('/events/transaction/:digest', async (request) => {
    const service = new EventService();
    return service.getTransactionEvents(request.params.digest);
  });

  // POST /api/events/query - Query events with filters
  fastify.post<{ Body: { filter: EventFilter; cursor?: string; limit?: number } }>(
    '/events/query',
    async (request) => {
      const service = new EventService();
      return service.queryEvents(request.body.filter, request.body.cursor, request.body.limit);
    }
  );

  // GET /api/events/schema/:packageId/:module/:eventName - Get event schema
  fastify.get<{ Params: { packageId: string; module: string; eventName: string } }>(
    '/events/schema/:packageId/:module/:eventName',
    async (request) => {
      const service = new EventService();
      return service.getEventSchema(
        request.params.packageId,
        request.params.module,
        request.params.eventName
      );
    }
  );

  // GET /api/events/subscribe - SSE endpoint for real-time events
  fastify.get('/events/subscribe', async (request, reply) => {
    // Server-Sent Events implementation
  });
}
```

#### Client Changes

```typescript
// packages/client/src/components/EventExplorer/index.tsx

export function EventExplorer() {
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [filter, setFilter] = useState<EventFilter>({});
  const [isLive, setIsLive] = useState(false);

  // Filter controls
  // Event list with expandable details
  // Real-time toggle for live events
  // Export to JSON/CSV
}

// packages/client/src/components/EventExplorer/EventCard.tsx
export function EventCard({ event }: { event: ParsedEvent }) {
  // Collapsible card showing:
  // - Event type with module path
  // - Sender address
  // - Timestamp
  // - Parsed fields in table format
  // - Raw JSON toggle
}

// packages/client/src/components/EventExplorer/EventFilter.tsx
export function EventFilter({ filter, onChange }: EventFilterProps) {
  // Package ID input with suggestions
  // Module dropdown (populated after package selected)
  // Event type dropdown
  // Date range picker
}
```

---

### 1.5 Move Migrate

**Current State**: Not implemented
**Target State**: One-click migration to Move 2024

#### Server Changes

```typescript
// packages/server/src/services/dev/MigrationService.ts

export interface MigrationPreview {
  packagePath: string;
  currentEdition: string;
  targetEdition: string;
  changes: MigrationChange[];
  warnings: string[];
  canAutoMigrate: boolean;
}

export interface MigrationChange {
  file: string;
  line: number;
  type: 'syntax' | 'import' | 'type' | 'function';
  before: string;
  after: string;
  description: string;
}

export interface MigrationResult {
  success: boolean;
  migratedFiles: string[];
  backupPath?: string;
  errors?: string[];
}

export class MigrationService {
  // Preview migration changes without applying
  async preview(packagePath: string): Promise<MigrationPreview>;

  // Apply migration with backup
  async migrate(packagePath: string, createBackup?: boolean): Promise<MigrationResult>;

  // Restore from backup
  async restore(packagePath: string, backupPath: string): Promise<void>;

  // Check if package needs migration
  async checkMigrationStatus(packagePath: string): Promise<{
    needsMigration: boolean;
    currentEdition: string;
    targetEdition: string;
  }>;
}
```

```typescript
// packages/server/src/routes/migration.ts

export async function migrationRoutes(fastify: FastifyInstance) {
  // POST /api/move/migrate/preview - Preview migration
  fastify.post<{ Body: { packagePath: string } }>('/move/migrate/preview', async (request) => {
    const service = new MigrationService();
    return service.preview(request.body.packagePath);
  });

  // POST /api/move/migrate - Apply migration
  fastify.post<{ Body: { packagePath: string; createBackup?: boolean } }>(
    '/move/migrate',
    async (request) => {
      const service = new MigrationService();
      return service.migrate(request.body.packagePath, request.body.createBackup);
    }
  );

  // POST /api/move/migrate/restore - Restore from backup
  fastify.post<{ Body: { packagePath: string; backupPath: string } }>(
    '/move/migrate/restore',
    async (request) => {
      const service = new MigrationService();
      return service.restore(request.body.packagePath, request.body.backupPath);
    }
  );

  // GET /api/move/migrate/status - Check migration status
  fastify.get<{ Querystring: { packagePath: string } }>(
    '/move/migrate/status',
    async (request) => {
      const service = new MigrationService();
      return service.checkMigrationStatus(request.query.packagePath);
    }
  );
}
```

#### Client Changes

```typescript
// packages/client/src/components/MoveMigrate/index.tsx

export function MoveMigrate({ packagePath }: { packagePath: string }) {
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Status badge showing migration needed
  // Preview button to see changes
  // Diff viewer for each file
  // Migrate button with backup option
  // Restore option if backup exists
}

// packages/client/src/components/MoveMigrate/DiffViewer.tsx
export function DiffViewer({ changes }: { changes: MigrationChange[] }) {
  // Side-by-side diff view
  // Syntax highlighting for Move code
  // Line numbers
  // Change type badges
}
```

---

### 1.6 manage-package

**Current State**: Not implemented
**Target State**: Track package versions in Move.lock

#### Server Changes

```typescript
// packages/server/src/services/dev/PackageManagerService.ts

export interface PackageVersion {
  environment: string;
  networkId: string;
  originalId: string;
  latestId: string;
  versionNumber: number;
}

export interface MoveTomlInfo {
  name: string;
  version: string;
  edition?: string;
  publishedAt?: PackageVersion[];
}

export class PackageManagerService {
  // Get package info from Move.toml and Move.lock
  async getPackageInfo(packagePath: string): Promise<MoveTomlInfo>;

  // Record a published package
  async recordPublish(
    packagePath: string,
    environment: string,
    networkId: string,
    originalId: string,
    latestId: string,
    versionNumber: number
  ): Promise<void>;

  // Get publish history
  async getPublishHistory(packagePath: string): Promise<PackageVersion[]>;

  // Auto-detect network from active env
  async getNetworkId(): Promise<string>;
}
```

---

## Phase 2: HIGH Priority Features

### 2.1 Local Network Management (`sui start`)

**Challenge**: Long-running process management
**Solution**: Process Manager with SSE streaming

#### Server Changes

```typescript
// packages/server/src/services/core/ProcessManager.ts

export interface ManagedProcess {
  id: string;
  type: 'local-network' | 'watch' | 'other';
  pid: number;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  startTime: Date;
  config: ProcessConfig;
  lastOutput: string[];
}

export interface LocalNetworkConfig {
  configDir?: string;
  forceRegenesis?: boolean;
  withFaucet?: boolean | string;  // true or "host:port"
  withIndexer?: boolean | string; // true or database URL
  withGraphql?: boolean | string; // true or "host:port"
  envOverrides?: Record<string, string>; // Protocol config overrides
}

export class ProcessManager {
  private static instance: ProcessManager;
  private processes: Map<string, ManagedProcess> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();

  public static getInstance(): ProcessManager;

  // Start local network
  async startLocalNetwork(config: LocalNetworkConfig): Promise<string>;

  // Stop a process
  async stopProcess(id: string): Promise<void>;

  // Get process status
  getProcessStatus(id: string): ManagedProcess | undefined;

  // Get all processes
  getAllProcesses(): ManagedProcess[];

  // Subscribe to process output
  subscribe(id: string, callback: (output: string) => void): Unsubscribe;

  // Stream output via SSE
  createOutputStream(id: string): ReadableStream;

  // Health check for local network
  async checkNetworkHealth(): Promise<NetworkHealth>;

  // Cleanup on server shutdown
  async shutdownAll(): Promise<void>;
}
```

```typescript
// packages/server/src/routes/local-network.ts

export async function localNetworkRoutes(fastify: FastifyInstance) {
  // POST /api/network/start - Start local network
  fastify.post<{ Body: LocalNetworkConfig }>('/network/start', async (request) => {
    const manager = ProcessManager.getInstance();
    const processId = await manager.startLocalNetwork(request.body);
    return { success: true, processId };
  });

  // POST /api/network/stop - Stop local network
  fastify.post<{ Body: { processId: string } }>('/network/stop', async (request) => {
    const manager = ProcessManager.getInstance();
    await manager.stopProcess(request.body.processId);
    return { success: true };
  });

  // GET /api/network/status - Get network status
  fastify.get('/network/status', async () => {
    const manager = ProcessManager.getInstance();
    return manager.getAllProcesses().filter(p => p.type === 'local-network');
  });

  // GET /api/network/health - Health check
  fastify.get('/network/health', async () => {
    const manager = ProcessManager.getInstance();
    return manager.checkNetworkHealth();
  });

  // GET /api/network/stream/:processId - SSE stream for output
  fastify.get<{ Params: { processId: string } }>(
    '/network/stream/:processId',
    async (request, reply) => {
      const manager = ProcessManager.getInstance();

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const unsubscribe = manager.subscribe(request.params.processId, (output) => {
        reply.raw.write(`data: ${JSON.stringify({ output })}\n\n`);
      });

      request.raw.on('close', unsubscribe);
    }
  );
}
```

#### Client Changes

```typescript
// packages/client/src/components/LocalNetwork/index.tsx

export function LocalNetwork() {
  const [config, setConfig] = useState<LocalNetworkConfig>({});
  const [process, setProcess] = useState<ManagedProcess | null>(null);
  const [output, setOutput] = useState<string[]>([]);

  // Config form with toggles for faucet, indexer, graphql
  // Environment variable overrides section
  // Start/Stop buttons
  // Real-time output console
  // Health indicator
  // Quick actions: Open faucet, Open GraphQL playground
}

// packages/client/src/components/LocalNetwork/ConfigForm.tsx
export function ConfigForm({ config, onChange }: ConfigFormProps) {
  // Toggle switches for features
  // Custom port inputs
  // Database URL input for indexer
  // Protocol config overrides (collapsible advanced section)
}

// packages/client/src/components/LocalNetwork/NetworkConsole.tsx
export function NetworkConsole({ processId }: { processId: string }) {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/network/stream/${processId}`);
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setLines(prev => [...prev.slice(-500), data.output]); // Keep last 500 lines
    };
    return () => eventSource.close();
  }, [processId]);

  // Terminal-style output display
  // Auto-scroll
  // Search/filter
  // Clear button
  // Copy all button
}
```

#### UI Mockup
```
┌─────────────────────────────────────────────────────────────┐
│  Local Network                              [● Running]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Configuration ──────────────────────────────────────┐   │
│  │                                                       │   │
│  │  [✓] Faucet          Port: [9123    ]                │   │
│  │  [ ] Indexer         DB:   [postgres://...]          │   │
│  │  [ ] GraphQL         Port: [9125    ]                │   │
│  │  [ ] Force Regenesis (fresh state each run)          │   │
│  │                                                       │   │
│  │  ▼ Advanced: Protocol Config Overrides               │   │
│  │  ┌───────────────────────────────────────────────┐   │   │
│  │  │ min_checkpoint_interval_ms = 1000             │   │   │
│  │  │ [+ Add Override]                              │   │   │
│  │  └───────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Console Output ─────────────────────────────────────┐   │
│  │ [2024-01-15 10:23:45] Starting Sui node...           │   │
│  │ [2024-01-15 10:23:46] Loading genesis config...      │   │
│  │ [2024-01-15 10:23:47] Validator started on 127.0.0.1 │   │
│  │ [2024-01-15 10:23:48] Faucet running on :9123        │   │
│  │ [2024-01-15 10:23:49] Ready to accept connections    │   │
│  │ █                                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Start Network]  [Stop]  [Open Faucet]  [Logs ↓]           │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Consistent Dry-Run/Dev-Inspect

**Current State**: Available for some operations, not all
**Target State**: Consistent dry-run option across all write operations

#### Implementation Pattern

```typescript
// packages/server/src/types/common.ts

export interface ExecutionOptions {
  dryRun?: boolean;
  devInspect?: boolean;
  serializeUnsigned?: boolean;
  serializeSigned?: boolean;
}

// Add to all write operation request bodies
export interface TransferRequest extends ExecutionOptions {
  to: string;
  amount: string;
  // ...
}

// Modify service layer to handle options
export class TransferService {
  async transferSui(request: TransferRequest): Promise<TransferResult> {
    const args = ['client', 'transfer-sui', '--to', request.to, '--amount', request.amount];

    if (request.dryRun) {
      args.push('--dry-run');
    }
    if (request.devInspect) {
      args.push('--dev-inspect');
    }
    if (request.serializeUnsigned) {
      args.push('--serialize-unsigned-transaction');
    }

    return this.executor.executeJson(args);
  }
}
```

#### Client Pattern

```typescript
// packages/client/src/components/common/ExecutionModeSelector.tsx

export function ExecutionModeSelector({
  mode,
  onChange
}: {
  mode: ExecutionOptions;
  onChange: (mode: ExecutionOptions) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        className={mode.dryRun ? 'active' : ''}
        onClick={() => onChange({ dryRun: true })}
      >
        Dry Run
      </button>
      <button
        className={mode.devInspect ? 'active' : ''}
        onClick={() => onChange({ devInspect: true })}
      >
        Dev Inspect
      </button>
      <button
        className={!mode.dryRun && !mode.devInspect ? 'active' : ''}
        onClick={() => onChange({})}
      >
        Execute
      </button>
    </div>
  );
}

// Usage in transfer component
export function TransferSui() {
  const [executionMode, setExecutionMode] = useState<ExecutionOptions>({});

  const handleSubmit = async () => {
    const result = await api.transferSui({
      ...formData,
      ...executionMode,
    });
  };

  return (
    <>
      {/* Form fields */}
      <ExecutionModeSelector mode={executionMode} onChange={setExecutionMode} />
      <button onClick={handleSubmit}>
        {executionMode.dryRun ? 'Preview' : executionMode.devInspect ? 'Inspect' : 'Execute'}
      </button>
    </>
  );
}
```

---

## Phase 3: MEDIUM Priority Features

### 3.1 Pay Commands (Multi-recipient)

```typescript
// packages/server/src/services/PayService.ts

export interface PayRequest {
  recipients: string[];
  amounts: string[];
  inputCoins?: string[];
  gasBudget?: string;
}

export class PayService {
  // Pay using any coins
  async pay(request: PayRequest): Promise<PayResult>;

  // Pay using SUI coins specifically
  async paySui(request: PayRequest): Promise<PayResult>;

  // Pay all remaining SUI to one recipient
  async payAllSui(to: string, inputCoins: string[]): Promise<PayResult>;
}
```

### 3.2 Package Version Tracking

Integration with `sui move manage-package`:

```typescript
// Auto-record on publish success
export class PackageService {
  async publish(packagePath: string): Promise<PublishResult> {
    const result = await this.executor.executeJson(['client', 'publish', packagePath, '--json']);

    if (result.success) {
      // Auto-record to Move.lock
      const packageManager = new PackageManagerService();
      await packageManager.recordPublish(
        packagePath,
        await this.envService.getActiveEnv(),
        await packageManager.getNetworkId(),
        result.packageId,
        result.packageId,
        1
      );
    }

    return result;
  }
}
```

---

## Phase 4: Special Exceptions Architecture

### 4.1 Server-Sent Events (SSE) Infrastructure

```typescript
// packages/server/src/utils/sse.ts

export function createSSEHandler<T>(
  fastify: FastifyInstance,
  path: string,
  generator: (request: FastifyRequest) => AsyncGenerator<T>
) {
  fastify.get(path, async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    try {
      for await (const data of generator(request)) {
        if (reply.raw.destroyed) break;
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    } catch (error) {
      reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: String(error) })}\n\n`);
    } finally {
      reply.raw.end();
    }
  });
}

// Usage
createSSEHandler(fastify, '/api/build/stream', async function* (request) {
  const { packagePath } = request.query;

  yield { type: 'status', message: 'Starting build...' };

  // Stream build output
  for await (const line of buildProcess.stdout) {
    yield { type: 'output', line };
  }

  yield { type: 'complete', success: true };
});
```

### 4.2 Client SSE Hook

```typescript
// packages/client/src/hooks/useSSE.ts

export function useSSE<T>(url: string | null, options?: {
  onMessage?: (data: T) => void;
  onError?: (error: Event) => void;
  onComplete?: () => void;
}) {
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'complete'>('idle');

  useEffect(() => {
    if (!url) return;

    setStatus('connecting');
    const eventSource = new EventSource(url);

    eventSource.onopen = () => setStatus('connected');

    eventSource.onmessage = (e) => {
      const parsed = JSON.parse(e.data) as T;
      setData(prev => [...prev, parsed]);
      options?.onMessage?.(parsed);
    };

    eventSource.onerror = (e) => {
      setStatus('error');
      options?.onError?.(e);
      eventSource.close();
    };

    eventSource.addEventListener('complete', () => {
      setStatus('complete');
      options?.onComplete?.();
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [url]);

  return { data, status, clear: () => setData([]) };
}

// Usage
function BuildOutput({ packagePath }: { packagePath: string }) {
  const { data, status } = useSSE<BuildMessage>(
    packagePath ? `/api/build/stream?packagePath=${encodeURIComponent(packagePath)}` : null
  );

  return (
    <div>
      <span className={`status-${status}`}>{status}</span>
      {data.map((msg, i) => (
        <div key={i}>{msg.line}</div>
      ))}
    </div>
  );
}
```

### 4.3 File System Watching

```typescript
// packages/server/src/services/core/WatchService.ts

import chokidar from 'chokidar';

export class WatchService {
  private watchers: Map<string, FSWatcher> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();

  // Watch a directory for changes
  watch(id: string, path: string, options?: WatchOptions): void {
    const watcher = chokidar.watch(path, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('change', (filePath) => {
      this.eventEmitter.emit(id, { type: 'change', path: filePath });
    });

    watcher.on('add', (filePath) => {
      this.eventEmitter.emit(id, { type: 'add', path: filePath });
    });

    this.watchers.set(id, watcher);
  }

  // Stop watching
  unwatch(id: string): void {
    const watcher = this.watchers.get(id);
    if (watcher) {
      watcher.close();
      this.watchers.delete(id);
    }
  }

  // Subscribe to watch events
  subscribe(id: string, callback: (event: WatchEvent) => void): Unsubscribe {
    this.eventEmitter.on(id, callback);
    return () => this.eventEmitter.off(id, callback);
  }
}

// Auto-rebuild on file change
export class AutoBuildService {
  async startWatch(packagePath: string): Promise<string> {
    const watchId = crypto.randomUUID();

    this.watchService.watch(watchId, packagePath, {
      glob: '**/*.move',
    });

    this.watchService.subscribe(watchId, async (event) => {
      if (event.type === 'change' && event.path.endsWith('.move')) {
        // Trigger rebuild
        const result = await this.moveService.build(packagePath);
        this.emitBuildResult(watchId, result);
      }
    });

    return watchId;
  }
}
```

### 4.4 Large Output Handling

```typescript
// packages/server/src/services/dev/OutputService.ts

const OUTPUT_DIR = path.join(os.homedir(), '.sui-cli-web', 'outputs');

export class OutputService {
  // Store large output to file and return reference
  async storeLargeOutput(data: string, metadata: OutputMetadata): Promise<OutputReference> {
    const id = crypto.randomUUID();
    const filePath = path.join(OUTPUT_DIR, `${id}.json`);

    await fs.writeFile(filePath, JSON.stringify({
      metadata,
      data,
      createdAt: new Date().toISOString(),
    }));

    return {
      id,
      size: data.length,
      preview: data.slice(0, 1000),
      downloadUrl: `/api/outputs/${id}/download`,
    };
  }

  // Stream large output in chunks
  async *streamOutput(id: string, chunkSize: number = 64 * 1024): AsyncGenerator<string> {
    const filePath = path.join(OUTPUT_DIR, `${id}.json`);
    const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    for (let i = 0; i < content.data.length; i += chunkSize) {
      yield content.data.slice(i, i + chunkSize);
    }
  }

  // Download as file
  async downloadOutput(id: string): Promise<{ data: Buffer; filename: string }>;

  // Cleanup old outputs
  async cleanup(olderThanHours: number = 24): Promise<void>;
}

// Route for downloading
fastify.get<{ Params: { id: string } }>('/outputs/:id/download', async (request, reply) => {
  const service = new OutputService();
  const { data, filename } = await service.downloadOutput(request.params.id);

  reply.header('Content-Type', 'application/octet-stream');
  reply.header('Content-Disposition', `attachment; filename="${filename}"`);
  return data;
});
```

### 4.5 Interactive Mode Support

```typescript
// packages/server/src/services/core/InteractiveService.ts

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class InteractiveService {
  private processes: Map<string, ChildProcess> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();

  // Start interactive process
  async startInteractive(command: string, args: string[]): Promise<string> {
    const id = crypto.randomUUID();
    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (data) => {
      this.eventEmitter.emit(`output:${id}`, { type: 'stdout', data: data.toString() });
    });

    proc.stderr.on('data', (data) => {
      this.eventEmitter.emit(`output:${id}`, { type: 'stderr', data: data.toString() });
    });

    proc.on('close', (code) => {
      this.eventEmitter.emit(`output:${id}`, { type: 'exit', code });
      this.processes.delete(id);
    });

    this.processes.set(id, proc);
    return id;
  }

  // Send input to process
  async sendInput(id: string, input: string): Promise<void> {
    const proc = this.processes.get(id);
    if (proc && proc.stdin) {
      proc.stdin.write(input + '\n');
    }
  }

  // Subscribe to output
  subscribe(id: string, callback: (event: ProcessOutput) => void): Unsubscribe {
    const handler = callback;
    this.eventEmitter.on(`output:${id}`, handler);
    return () => this.eventEmitter.off(`output:${id}`, handler);
  }
}

// WebSocket route for interactive sessions
fastify.register(async function (instance) {
  instance.get('/ws/interactive/:id', { websocket: true }, (connection, req) => {
    const { id } = req.params as { id: string };
    const service = new InteractiveService();

    const unsubscribe = service.subscribe(id, (event) => {
      connection.socket.send(JSON.stringify(event));
    });

    connection.socket.on('message', (message) => {
      const data = JSON.parse(message.toString());
      if (data.type === 'input') {
        service.sendInput(id, data.value);
      }
    });

    connection.socket.on('close', () => {
      unsubscribe();
    });
  });
});
```

---

## Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] SSE infrastructure
- [ ] ProcessManager singleton
- [ ] Output service for large files

### Phase 2: Partial Features (Week 3-4)
- [ ] PTB Visual Builder
- [ ] Replay enhancement
- [ ] Gas Analysis UI
- [ ] Event parsing

### Phase 3: HIGH Priority (Week 5-6)
- [ ] Local network management
- [ ] Move Migrate
- [ ] Consistent dry-run

### Phase 4: MEDIUM Priority (Week 7-8)
- [ ] Pay commands
- [ ] Package version tracking
- [ ] File system watching

---

## File Structure

```
packages/server/src/
├── routes/
│   ├── ptb-builder.ts      # NEW
│   ├── replay.ts           # NEW (enhanced)
│   ├── gas.ts              # NEW
│   ├── events.ts           # NEW
│   ├── migration.ts        # NEW
│   ├── local-network.ts    # NEW
│   └── outputs.ts          # NEW
├── services/
│   ├── core/
│   │   ├── ProcessManager.ts   # NEW
│   │   ├── WatchService.ts     # NEW
│   │   ├── InteractiveService.ts # NEW
│   │   └── OutputService.ts    # NEW
│   └── dev/
│       ├── PtbBuilderService.ts  # NEW
│       ├── ReplayService.ts      # NEW (enhanced)
│       ├── GasAnalysisService.ts # NEW
│       ├── EventService.ts       # NEW
│       ├── MigrationService.ts   # NEW
│       └── PayService.ts         # NEW
└── utils/
    └── sse.ts              # NEW

packages/client/src/
├── components/
│   ├── PtbBuilder/         # NEW
│   │   ├── index.tsx
│   │   ├── CommandBlock.tsx
│   │   └── VariableSelector.tsx
│   ├── TransactionReplay/  # NEW (enhanced)
│   │   ├── index.tsx
│   │   └── TraceViewer.tsx
│   ├── GasAnalysis/        # NEW
│   │   ├── index.tsx
│   │   ├── GasBreakdownChart.tsx
│   │   └── OptimizationsList.tsx
│   ├── EventExplorer/      # NEW
│   │   ├── index.tsx
│   │   ├── EventCard.tsx
│   │   └── EventFilter.tsx
│   ├── MoveMigrate/        # NEW
│   │   ├── index.tsx
│   │   └── DiffViewer.tsx
│   ├── LocalNetwork/       # NEW
│   │   ├── index.tsx
│   │   ├── ConfigForm.tsx
│   │   └── NetworkConsole.tsx
│   └── common/
│       └── ExecutionModeSelector.tsx # NEW
└── hooks/
    ├── useSSE.ts           # NEW
    └── useProcess.ts       # NEW
```

---

## Dependencies to Add

```json
// packages/server/package.json
{
  "dependencies": {
    "@fastify/websocket": "^10.0.1",
    "chokidar": "^3.6.0"
  }
}

// packages/client/package.json
{
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "recharts": "^2.12.0"
  }
}
```

---

## Summary

This implementation plan provides:

1. **6 Partial Feature Enhancements** - PTB Builder, Replay, Gas Analysis, Events, Migrate, manage-package
2. **3 HIGH Priority Features** - Local Network, Consistent Dry-Run, Move Migrate
3. **4 MEDIUM Priority Features** - Pay Commands, Package Tracking, File Watching, Interactive Mode
4. **5 Special Exception Architectures** - SSE, ProcessManager, WatchService, OutputService, InteractiveService

The plan maintains backward compatibility while adding powerful new capabilities for Sui developers.
