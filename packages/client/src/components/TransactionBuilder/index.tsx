import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
        toast.success('✅ Transaction inspected successfully!');
        setOperationProgress(100);
      } else {
        const errorMsg = data.error || 'Inspection failed';
        setInspectResult({ success: false, error: errorMsg });
        toast.error('❌ ' + errorMsg);
        setOperationProgress(0);
      }
    } catch (error: any) {
      const msg = error.message || String(error);
      setInspectResult({ success: false, error: 'Connection error: ' + msg });
      toast.error('❌ Inspection failed: ' + msg);
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
        toast.success('✅ Transaction replayed successfully!');
        setOperationProgress(100);
      } else {
        const errorMsg = data.error || 'Replay failed';
        setReplayResult({
          success: false,
          output: '',
          error: errorMsg,
        });
        toast.error('❌ ' + errorMsg);
        setOperationProgress(0);
      }
    } catch (error: any) {
      const msg = error.message || String(error);
      setReplayResult({ success: false, output: '', error: 'Connection error: ' + msg });
      toast.error('❌ Replay failed: ' + msg);
      setOperationProgress(0);
    } finally {
      setReplaying(false);
      setActiveOperation('idle');
    }
  };

  const isAnyLoading = inspecting || replaying;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header with entrance animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
          >
            <Search className="w-8 h-8 text-primary" />
          </motion.div>
          Transaction Inspector
        </h1>
        <p className="text-muted-foreground">
          Debug and analyze Sui transactions with detailed inspection and replay capabilities
        </p>
      </motion.div>

      {/* Operation Progress with AnimatePresence */}
      <AnimatePresence mode="wait">
        {isAnyLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-medium text-foreground"
                    >
                      {activeOperation === 'inspect' && '🔍 Inspecting transaction...'}
                      {activeOperation === 'replay' && '▶️ Replaying transaction...'}
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-muted-foreground"
                    >
                      {operationProgress}%
                    </motion.span>
                  </div>
                  <Progress value={operationProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tabs with entrance animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
      >
        <Tabs defaultValue="inspect" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inspect" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Inspect Transaction
            </TabsTrigger>
            <TabsTrigger value="replay" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Replay Transaction
            </TabsTrigger>
          </TabsList>

        {/* Inspect Tab */}
        <TabsContent value="inspect" className="space-y-6 mt-6">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                Inspect Transaction Block
              </CardTitle>
              <CardDescription>
                View detailed information about an executed transaction including events and effects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inspect-digest" className="text-sm font-medium">
                  Transaction Digest <span className="text-destructive">*</span>
                </Label>
                <input
                  id="inspect-digest"
                  type="text"
                  value={inspectDigest}
                  onChange={(e) => setInspectDigest(e.target.value)}
                  placeholder="e.g., Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3"
                  disabled={isAnyLoading}
                  className="w-full px-3 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm transition-all"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  Enter transaction digest (base58 from Sui Explorer or hex format)
                </p>
              </div>

              <motion.button
                onClick={handleInspect}
                disabled={!inspectDigest.trim() || inspecting || isAnyLoading}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-primary/20"
              >
                {inspecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Inspecting Transaction...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Inspect Transaction
                  </>
                )}
              </motion.button>

              {/* Loading State */}
              {inspecting && !inspectResult && (
                <div className="space-y-3 pt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inspect Result with beautiful animations */}
          <AnimatePresence mode="wait">
            {inspectResult && (
              <motion.div
                key="inspect-result"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Card
                  className={
                    inspectResult.success
                      ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20 shadow-lg shadow-green-500/10'
                      : 'border-destructive/50 bg-destructive/5 shadow-lg shadow-destructive/10'
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {inspectResult.success ? (
                        <>
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </motion.div>
                          <span className="text-green-700 dark:text-green-400">
                            Inspection Complete
                          </span>
                        </>
                      ) : (
                        <>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                          >
                            <XCircle className="w-5 h-5 text-destructive" />
                          </motion.div>
                          <span className="text-destructive">Inspection Failed</span>
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
              <CardContent className="space-y-4">
                {inspectResult.success ? (
                  <>
                    {/* Enhanced Transaction Summary */}
                    <div className="space-y-4 mb-6">
                      <TransactionSummary
                        txData={inspectResult.results}
                        digest={inspectDigest}
                      />
                      <GasBreakdown
                        gasUsed={analyzeTransaction(inspectResult.results).gasUsed}
                      />
                    </div>

                    <Separator className="my-6" />

                    {/* Raw Data Tabs */}
                    <Tabs defaultValue="results" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="results">
                          <FileText className="w-4 h-4 mr-2" />
                          Raw Data
                        </TabsTrigger>
                        <TabsTrigger value="events">
                          <Zap className="w-4 h-4 mr-2" />
                          Events {inspectResult.events && `(${inspectResult.events.length})`}
                        </TabsTrigger>
                        <TabsTrigger value="effects">
                          <Layers className="w-4 h-4 mr-2" />
                          Effects
                        </TabsTrigger>
                      </TabsList>

                    <TabsContent value="results" className="mt-4">
                      {inspectResult.results ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Execution Results</Label>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  JSON.stringify(inspectResult.results, null, 2),
                                  'Results'
                                )
                              }
                              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                          </div>
                          <div className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                            <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                              {JSON.stringify(inspectResult.results, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>No execution results available</AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    <TabsContent value="events" className="mt-4">
                      {inspectResult.events && inspectResult.events.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              Transaction Events ({inspectResult.events.length})
                            </Label>
                          </div>
                          <div className="space-y-2">
                            {inspectResult.events.map((event: any, idx: number) => (
                              <Card key={idx} className="bg-background">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">Event #{idx + 1}</CardTitle>
                                    <button
                                      onClick={() =>
                                        copyToClipboard(JSON.stringify(event, null, 2), 'Event')
                                      }
                                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                    >
                                      <Copy className="w-3 h-3" />
                                      Copy
                                    </button>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="bg-muted/50 border border-border rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">
                                    <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                                      {JSON.stringify(event, null, 2)}
                                    </pre>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>No events emitted by this transaction</AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    <TabsContent value="effects" className="mt-4">
                      {inspectResult.effects ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Transaction Effects</Label>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  JSON.stringify(inspectResult.effects, null, 2),
                                  'Effects'
                                )
                              }
                              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                          </div>
                          <div className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                            <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                              {JSON.stringify(inspectResult.effects, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>No effects data available</AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>
                  </Tabs>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{inspectResult.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inspect Tips */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm text-blue-900 dark:text-blue-100 space-y-2">
              <div>
                <strong>Use Case:</strong> Inspect shows you detailed information about an already executed
                transaction. View events, effects, and all transaction data. Great for understanding what
                happened on-chain.
              </div>
              <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                <strong className="block mb-1">💡 Try This Sample Transaction:</strong>
                <button
                  onClick={() => setInspectDigest('Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3')}
                  className="font-mono text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Click to load: Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Replay Tab */}
        <TabsContent value="replay" className="space-y-6 mt-6">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Replay On-Chain Transaction
              </CardTitle>
              <CardDescription>
                Replay an already executed transaction to debug and understand its execution flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="replay-digest" className="text-sm font-medium">
                  Transaction Digest <span className="text-destructive">*</span>
                </Label>
                <input
                  id="replay-digest"
                  type="text"
                  value={replayDigest}
                  onChange={(e) => setReplayDigest(e.target.value)}
                  placeholder="e.g., Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3"
                  disabled={isAnyLoading}
                  className="w-full px-3 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm transition-all"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  Enter transaction digest (base58 from Sui Explorer or hex format)
                </p>
              </div>

              <motion.button
                onClick={handleReplay}
                disabled={!replayDigest.trim() || replaying || isAnyLoading}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40"
              >
                {replaying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Replaying Transaction...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Replay Transaction
                  </>
                )}
              </motion.button>

              {/* Loading State */}
              {replaying && !replayResult && (
                <div className="space-y-3 pt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Replay Result with beautiful animations */}
          <AnimatePresence mode="wait">
            {replayResult && (
              <motion.div
                key="replay-result"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Card
                  className={
                    replayResult.success
                      ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20 shadow-lg shadow-green-500/10'
                      : 'border-destructive/50 bg-destructive/5 shadow-lg shadow-destructive/10'
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {replayResult.success ? (
                        <>
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </motion.div>
                          <span className="text-green-700 dark:text-green-400">Replay Complete</span>
                        </>
                      ) : (
                        <>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                          >
                            <XCircle className="w-5 h-5 text-destructive" />
                          </motion.div>
                          <span className="text-destructive">Replay Failed</span>
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
              <CardContent className="space-y-4">
                {replayResult.success ? (
                  <EnhancedReplaySummary
                    output={replayResult.output}
                    digest={replayDigest}
                  />
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{replayResult.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replay Tips */}
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-sm text-amber-900 dark:text-amber-100 space-y-2">
              <div>
                <strong>Use Case:</strong> Replay helps you debug transactions that have already
                executed. Understand why a transaction succeeded or failed, and see the detailed
                execution trace. Great for post-mortem analysis.
              </div>
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
                <strong className="block mb-1">💡 Try This Sample Transaction:</strong>
                <button
                  onClick={() => setReplayDigest('Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3')}
                  className="font-mono text-xs bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                >
                  Click to load: Gma9Re9HDNKEaAK9JPXDFZ6YyoepKjH3pGC8ASWGytf3
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
      </motion.div>

      {/* General Tips with animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
      >
        <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Inspector Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-foreground mb-2">🔍 Inspect vs. ▶️ Replay:</p>
            <div className="space-y-2 text-muted-foreground ml-4">
              <div className="flex gap-2">
                <span className="font-medium text-foreground">Inspect:</span>
                <span>Dry-run unsigned transactions before execution (testing)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-foreground">Replay:</span>
                <span>Debug already-executed transactions (post-analysis)</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="font-medium text-foreground mb-2">⚠️ Important Notes:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Both operations are read-only and safe</li>
              <li>No gas fees or state changes occur</li>
              <li>Perfect for debugging without risk</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
