import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Play,
  FileText,
  Code,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Copy,
  Eye,
  Layers,
  Zap,
  Terminal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TransactionSummary } from '@/components/TransactionInspector/TransactionSummary';
import { GasBreakdown } from '@/components/TransactionInspector/GasBreakdown';
import { EnhancedReplaySummary } from '@/components/TransactionInspector/EnhancedReplaySummary';
import { analyzeTransaction } from '@/utils/transactionAnalyzer';

interface InspectResult {
  success: boolean;
  results?: any;
  events?: any[];
  effects?: any;
  error?: string;
}

interface ReplayResult {
  success: boolean;
  output: string;
  error?: string;
}

type ActiveOperation = 'inspect' | 'replay' | 'idle';

export function TransactionBuilder() {
  const [inspectDigest, setInspectDigest] = useState('');
  const [replayDigest, setReplayDigest] = useState('');

  const [activeOperation, setActiveOperation] = useState<ActiveOperation>('idle');
  const [operationProgress, setOperationProgress] = useState(0);

  const [inspecting, setInspecting] = useState(false);
  const [replaying, setReplaying] = useState(false);

  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);
  const [replayResult, setReplayResult] = useState<ReplayResult | null>(null);

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Inspect transaction
  const handleInspect = async () => {
    if (!inspectDigest.trim()) {
      toast.error('Please enter transaction digest');
      return;
    }

    setInspecting(true);
    setInspectResult(null);
    setActiveOperation('inspect');
    setOperationProgress(33);

    try {
      const response = await fetch('http://localhost:3001/api/inspector/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txDigest: inspectDigest.trim() }),
      });

      const data: { success: boolean; data?: any; error?: string; message?: string; details?: any } = await response.json();
      setOperationProgress(66);

      // Handle 403 Membership Required
      if (response.status === 403 || data.error === 'MEMBERSHIP_REQUIRED') {
        const msg = data.message || '🔒 Transaction Inspector is a Member-Only Feature';
        setInspectResult({ success: false, error: msg });
        toast.error(msg);
        setOperationProgress(0);
      } else if (data.success && data.data) {
        setInspectResult({
          success: true,
          results: data.data.results,
          events: data.data.events,
          effects: data.data.effects,
        });
        toast.success('Transaction inspected successfully!');
        setOperationProgress(100);
      } else {
        const errorMsg = data.error || 'Inspection failed';
        setInspectResult({ success: false, error: errorMsg });
        toast.error(errorMsg);
        setOperationProgress(0);
      }
    } catch (error: any) {
      const msg = error.message || String(error);
      setInspectResult({ success: false, error: 'Connection error: ' + msg });
      toast.error('Inspection failed: ' + msg);
      setOperationProgress(0);
    } finally {
      setInspecting(false);
      setActiveOperation('idle');
    }
  };

  // Replay transaction
  const handleReplay = async () => {
    if (!replayDigest.trim()) {
      toast.error('Please enter transaction digest');
      return;
    }

    setReplaying(true);
    setReplayResult(null);
    setActiveOperation('replay');
    setOperationProgress(33);

    try {
      const response = await fetch('http://localhost:3001/api/inspector/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txDigest: replayDigest.trim() }),
      });

      const data: { success: boolean; data?: { output: string }; error?: string; message?: string; details?: any } =
        await response.json();
      setOperationProgress(66);

      // Handle 403 Membership Required
      if (response.status === 403 || data.error === 'MEMBERSHIP_REQUIRED') {
        const msg = data.message || '🔒 Transaction Inspector is a Member-Only Feature';
        setReplayResult({
          success: false,
          output: '',
          error: msg,
        });
        toast.error(msg);
        setOperationProgress(0);
      } else if (data.success && data.data) {
        setReplayResult({ success: true, output: data.data.output });
        toast.success('Transaction replayed successfully!');
        setOperationProgress(100);
      } else {
        const errorMsg = data.error || 'Replay failed';
        setReplayResult({
          success: false,
          output: '',
          error: errorMsg,
        });
        toast.error(errorMsg);
        setOperationProgress(0);
      }
    } catch (error: any) {
      const msg = error.message || String(error);
      setReplayResult({ success: false, output: '', error: 'Connection error: ' + msg });
      toast.error('Replay failed: ' + msg);
      setOperationProgress(0);
    } finally {
      setReplaying(false);
      setActiveOperation('idle');
    }
  };

  const isAnyLoading = inspecting || replaying;

  return (
    <div className="space-y-4 p-4 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Search
          className="w-5 h-5 text-blue-400"
          style={{ filter: 'drop-shadow(0 0 4px rgba(77, 162, 255, 0.5))' }}
        />
        <h1 className="text-lg font-bold text-blue-400 font-mono">$ sui client tx-inspector</h1>
      </motion.div>

      {/* Operation Progress */}
      <AnimatePresence mode="wait">
        {isAnyLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-lg p-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-blue-400">
                  {activeOperation === 'inspect' && '> Inspecting transaction...'}
                  {activeOperation === 'replay' && '> Replaying transaction...'}
                </span>
                <span className="text-blue-500/70">{operationProgress}%</span>
              </div>
              <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${operationProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue="inspect" className="w-full">
          {/* Custom Tab List */}
          <TabsList className="flex gap-1 p-1 bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-lg mb-4 h-auto">
            <TabsTrigger
              value="inspect"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono rounded transition-all data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border data-[state=active]:border-blue-500/50 data-[state=inactive]:text-blue-500/60 data-[state=inactive]:hover:text-blue-400 data-[state=inactive]:bg-transparent"
            >
              <Eye className="w-3.5 h-3.5" />
              Inspect
            </TabsTrigger>
            <TabsTrigger
              value="replay"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono rounded transition-all data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border data-[state=active]:border-blue-500/50 data-[state=inactive]:text-blue-500/60 data-[state=inactive]:hover:text-blue-400 data-[state=inactive]:bg-transparent"
            >
              <Play className="w-3.5 h-3.5" />
              Replay
            </TabsTrigger>
          </TabsList>

          {/* Inspect Tab */}
          <TabsContent value="inspect" className="space-y-4 mt-0">
            {/* Input Card */}
            <div className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-mono">
                <Code className="w-4 h-4" />
                <span>Inspect Transaction Block</span>
              </div>

              <p className="text-xs text-blue-500/60 font-mono">
                View detailed information about an executed transaction
              </p>

              <div className="space-y-2">
                <label className="text-xs text-blue-400/80 font-mono flex items-center gap-1">
                  Transaction Digest <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={inspectDigest}
                  onChange={(e) => setInspectDigest(e.target.value)}
                  placeholder="e.g., Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3"
                  disabled={isAnyLoading}
                  className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded text-blue-400 placeholder:text-blue-500/40 focus:outline-none focus:border-blue-500 font-mono text-xs disabled:opacity-50"
                />
                <p className="text-xs text-blue-500/50 font-mono flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Enter transaction digest (base58 from Sui Explorer)
                </p>
              </div>

              <motion.button
                onClick={handleInspect}
                disabled={!inspectDigest.trim() || inspecting || isAnyLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full px-4 py-2.5 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-mono text-sm"
              >
                {inspecting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Inspecting...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    Inspect Transaction
                  </>
                )}
              </motion.button>

              {/* Loading Skeleton */}
              {inspecting && !inspectResult && (
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-3 w-full bg-blue-500/10" />
                  <Skeleton className="h-3 w-3/4 bg-blue-500/10" />
                  <Skeleton className="h-20 w-full bg-blue-500/10" />
                </div>
              )}
            </div>

            {/* Inspect Result */}
            <AnimatePresence mode="wait">
              {inspectResult && (
                <motion.div
                  key="inspect-result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {inspectResult.success ? (
                    <>
                      {/* Success Header */}
                      <div className="bg-black/40 backdrop-blur-md border border-green-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-mono text-sm">Inspection Complete</span>
                        </div>
                      </div>

                      {/* Transaction Summary & Gas Breakdown */}
                      <div className="space-y-4">
                        <TransactionSummary
                          txData={inspectResult.results}
                          digest={inspectDigest}
                        />
                        <GasBreakdown
                          gasUsed={analyzeTransaction(inspectResult.results).gasUsed}
                        />
                      </div>

                      {/* Raw Data Tabs */}
                      <div className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-lg p-4">
                        <Tabs defaultValue="results" className="w-full">
                          <TabsList className="flex gap-1 p-1 bg-black/30 rounded mb-3 h-auto">
                            <TabsTrigger
                              value="results"
                              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-mono rounded transition-all data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=inactive]:text-blue-500/60 data-[state=inactive]:bg-transparent"
                            >
                              <FileText className="w-3 h-3" />
                              Raw Data
                            </TabsTrigger>
                            <TabsTrigger
                              value="events"
                              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-mono rounded transition-all data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=inactive]:text-blue-500/60 data-[state=inactive]:bg-transparent"
                            >
                              <Zap className="w-3 h-3" />
                              Events ({inspectResult.events?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger
                              value="effects"
                              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-mono rounded transition-all data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=inactive]:text-blue-500/60 data-[state=inactive]:bg-transparent"
                            >
                              <Layers className="w-3 h-3" />
                              Effects
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="results" className="mt-0">
                            {inspectResult.results ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-blue-400/80 font-mono">Execution Results</span>
                                  <button
                                    onClick={() => copyToClipboard(JSON.stringify(inspectResult.results, null, 2), 'Results')}
                                    className="text-xs text-blue-500/60 hover:text-blue-400 flex items-center gap-1 font-mono transition-colors"
                                  >
                                    <Copy className="w-3 h-3" />
                                    Copy
                                  </button>
                                </div>
                                <div className="bg-black/50 border border-blue-500/20 rounded p-3 overflow-x-auto max-h-64 overflow-y-auto">
                                  <pre className="text-xs text-blue-400/80 font-mono whitespace-pre-wrap">
                                    {JSON.stringify(inspectResult.results, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-blue-500/60 font-mono flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                No execution results available
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="events" className="mt-0">
                            {inspectResult.events && inspectResult.events.length > 0 ? (
                              <div className="space-y-2">
                                <span className="text-xs text-blue-400/80 font-mono">
                                  Transaction Events ({inspectResult.events.length})
                                </span>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {inspectResult.events.map((event: any, idx: number) => (
                                    <div key={idx} className="bg-black/50 border border-blue-500/20 rounded p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-blue-400 font-mono">Event #{idx + 1}</span>
                                        <button
                                          onClick={() => copyToClipboard(JSON.stringify(event, null, 2), 'Event')}
                                          className="text-xs text-blue-500/60 hover:text-blue-400 flex items-center gap-1 font-mono transition-colors"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <pre className="text-xs text-blue-400/70 font-mono whitespace-pre-wrap overflow-x-auto">
                                        {JSON.stringify(event, null, 2)}
                                      </pre>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-blue-500/60 font-mono flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                No events emitted by this transaction
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="effects" className="mt-0">
                            {inspectResult.effects ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-blue-400/80 font-mono">Transaction Effects</span>
                                  <button
                                    onClick={() => copyToClipboard(JSON.stringify(inspectResult.effects, null, 2), 'Effects')}
                                    className="text-xs text-blue-500/60 hover:text-blue-400 flex items-center gap-1 font-mono transition-colors"
                                  >
                                    <Copy className="w-3 h-3" />
                                    Copy
                                  </button>
                                </div>
                                <div className="bg-black/50 border border-blue-500/20 rounded p-3 overflow-x-auto max-h-64 overflow-y-auto">
                                  <pre className="text-xs text-blue-400/80 font-mono whitespace-pre-wrap">
                                    {JSON.stringify(inspectResult.effects, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-blue-500/60 font-mono flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                No effects data available
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    </>
                  ) : (
                    /* Error Result */
                    <div className="bg-black/40 backdrop-blur-md border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-400 font-mono text-sm mb-1">Inspection Failed</p>
                          <p className="text-red-400/70 font-mono text-xs">{inspectResult.error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inspect Tips */}
            <div className="bg-black/40 backdrop-blur-md border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-xs font-mono">
                  <p className="text-blue-400">
                    <span className="text-blue-300">Use Case:</span> View detailed information about executed transactions.
                  </p>
                  <div className="pt-2 border-t border-blue-500/20">
                    <p className="text-blue-400/80 mb-1">Try This Sample:</p>
                    <button
                      onClick={() => setInspectDigest('Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3')}
                      className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded hover:bg-blue-500/20 transition-colors"
                    >
                      Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Replay Tab */}
          <TabsContent value="replay" className="space-y-4 mt-0">
            {/* Input Card */}
            <div className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-mono">
                <Play className="w-4 h-4" />
                <span>Replay On-Chain Transaction</span>
              </div>

              <p className="text-xs text-blue-500/60 font-mono">
                Replay an executed transaction to debug execution flow
              </p>

              <div className="space-y-2">
                <label className="text-xs text-blue-400/80 font-mono flex items-center gap-1">
                  Transaction Digest <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={replayDigest}
                  onChange={(e) => setReplayDigest(e.target.value)}
                  placeholder="e.g., Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3"
                  disabled={isAnyLoading}
                  className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded text-blue-400 placeholder:text-blue-500/40 focus:outline-none focus:border-blue-500 font-mono text-xs disabled:opacity-50"
                />
                <p className="text-xs text-blue-500/50 font-mono flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Enter transaction digest (base58 from Sui Explorer)
                </p>
              </div>

              <motion.button
                onClick={handleReplay}
                disabled={!replayDigest.trim() || replaying || isAnyLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full px-4 py-2.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-mono text-sm"
              >
                {replaying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    Replaying...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Replay Transaction
                  </>
                )}
              </motion.button>

              {/* Loading Skeleton */}
              {replaying && !replayResult && (
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-3 w-full bg-green-500/10" />
                  <Skeleton className="h-3 w-3/4 bg-green-500/10" />
                  <Skeleton className="h-20 w-full bg-green-500/10" />
                </div>
              )}
            </div>

            {/* Replay Result */}
            <AnimatePresence mode="wait">
              {replayResult && (
                <motion.div
                  key="replay-result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {replayResult.success ? (
                    <>
                      {/* Success Header */}
                      <div className="bg-black/40 backdrop-blur-md border border-green-500/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-mono text-sm">Replay Complete</span>
                        </div>
                      </div>

                      {/* Enhanced Replay Summary */}
                      <EnhancedReplaySummary
                        output={replayResult.output}
                        digest={replayDigest}
                      />
                    </>
                  ) : (
                    /* Error Result */
                    <div className="bg-black/40 backdrop-blur-md border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-400 font-mono text-sm mb-1">Replay Failed</p>
                          <p className="text-red-400/70 font-mono text-xs">{replayResult.error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Replay Tips */}
            <div className="bg-black/40 backdrop-blur-md border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-xs font-mono">
                  <p className="text-amber-400">
                    <span className="text-amber-300">Use Case:</span> Debug already-executed transactions with detailed execution trace.
                  </p>
                  <div className="pt-2 border-t border-amber-500/20">
                    <p className="text-amber-400/80 mb-1">Try This Sample:</p>
                    <button
                      onClick={() => setReplayDigest('Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3')}
                      className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded hover:bg-amber-500/20 transition-colors"
                    >
                      Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-black/40 backdrop-blur-md border border-blue-500/20 rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 font-mono text-sm">Inspector Overview</span>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div className="text-blue-400/80">
            <span className="text-blue-300">Inspect vs Replay:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
            <div className="flex gap-2">
              <Eye className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
              <span className="text-blue-400/70">
                <span className="text-blue-400">Inspect:</span> View executed transaction data
              </span>
            </div>
            <div className="flex gap-2">
              <Play className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-blue-400/70">
                <span className="text-green-400">Replay:</span> Debug with execution trace
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-blue-500/20">
            <span className="text-blue-400/60">Both operations are read-only and safe. No gas fees or state changes.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
