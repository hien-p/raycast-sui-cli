/**
 * Enhanced Replay Summary - Redesigned for both Newbies and Seniors
 * Makes replay understandable for everyone with visual execution flow
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  Play,
  Package,
  Coins,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Hash,
  Info,
  Lightbulb,
  Eye,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  parseReplayOutput,
  formatMistToSui,
  shortenAddress,
  type ReplayParsedData,
} from '@/utils/replayParser';
import { GlossaryIcon, GlossaryTerm } from '@/components/ui/tooltip';

interface EnhancedReplaySummaryProps {
  output: string;
  digest?: string;
}

export function EnhancedReplaySummary({ output, digest }: EnhancedReplaySummaryProps) {
  const [showRawOutput, setShowRawOutput] = useState(false);
  const [showExecutionFlow, setShowExecutionFlow] = useState(true);
  const data: ReplayParsedData = parseReplayOutput(output);

  const totalGas = data.gasInfo.computationCost + data.gasInfo.storageCost - data.gasInfo.storageRebate;

  return (
    <div className="space-y-4">
      {/* What is Replay? - For Newbies */}
      <Alert className="border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-foreground">
              🎬 What is "Replay"? (For Beginners)
            </p>
            <p className="text-muted-foreground">
              Replay is like <strong>watching a video replay</strong> of your transaction.
              It re-executes everything that happened on the blockchain so you can see exactly:
            </p>
            <ul className="ml-4 space-y-1 text-muted-foreground list-disc">
              <li>What objects were created or changed</li>
              <li>How much gas was used and why</li>
              <li>Each step of the execution</li>
              <li>Any errors or issues that occurred</li>
            </ul>
            <p className="text-xs text-muted-foreground italic">
              💡 Think of it as: "Show me exactly what happened when this transaction ran"
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Main Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-green-500/30 bg-gradient-to-br from-card via-card to-green-500/5 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5 text-green-500" />
                Replay Results
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${
                    data.status === 'Success'
                      ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900'
                      : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900'
                  } font-medium px-3 py-1`}
                >
                  {data.status === 'Success' ? '✅ Success' : '❌ Failed'}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  Epoch #{data.executedEpoch}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plain English Summary */}
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                {data.status === 'Success' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <p className="text-lg font-semibold text-foreground">
                    {data.status === 'Success'
                      ? '✅ Transaction replayed successfully!'
                      : '❌ Transaction replay failed'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.status === 'Success'
                      ? `Re-executed at epoch #${data.executedEpoch}. All operations completed exactly as they did on-chain.`
                      : 'The transaction failed during replay. Check the error details below.'}
                  </p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                    <div className="text-center p-2 bg-card/50 rounded-lg border border-border/50">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {data.createdObjects.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Created</div>
                    </div>
                    <div className="text-center p-2 bg-card/50 rounded-lg border border-border/50">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {data.mutatedObjects.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Modified</div>
                    </div>
                    <div className="text-center p-2 bg-card/50 rounded-lg border border-border/50">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatMistToSui(totalGas)}
                      </div>
                      <div className="text-xs text-muted-foreground">SUI Cost</div>
                    </div>
                    <div className="text-center p-2 bg-card/50 rounded-lg border border-border/50">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {data.dependencies.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Dependencies</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Execution Flow - Visual Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    📋 What Happened (Step by Step)
                  </h3>
                </div>
                <button
                  onClick={() => setShowExecutionFlow(!showExecutionFlow)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showExecutionFlow ? 'Hide' : 'Show'} Details
                </button>
              </div>

              <AnimatePresence>
                {showExecutionFlow && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    {/* Step 1: Transaction Started */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                        </div>
                        <div className="w-0.5 h-full bg-gradient-to-b from-blue-500 to-green-500"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                          <p className="text-sm font-medium text-foreground mb-1">
                            🚀 Transaction Started
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Epoch #{data.executedEpoch} • Preparing to execute transaction
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Objects Created */}
                    {data.createdObjects.length > 0 && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                            <span className="text-xs font-bold text-green-600 dark:text-green-400">2</span>
                          </div>
                          <div className="w-0.5 h-full bg-gradient-to-b from-green-500 to-purple-500"></div>
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                            <p className="text-sm font-medium text-foreground mb-2">
                              ✨ Created {data.createdObjects.length} New Object{data.createdObjects.length > 1 ? 's' : ''}
                            </p>
                            {data.createdObjects.map((obj, idx) => (
                              <div key={idx} className="mt-2 p-2 bg-card/50 rounded border border-border/50">
                                <div className="flex items-start gap-2 text-xs">
                                  <Package className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 space-y-1">
                                    <div className="font-mono text-foreground">{shortenAddress(obj.id)}</div>
                                    <div className="text-muted-foreground">
                                      → Owned by: <span className="font-mono">{shortenAddress(obj.owner)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground mt-2">
                              💡 These are brand new objects stored on the blockchain
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Objects Modified */}
                    {data.mutatedObjects.length > 0 && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                              {data.createdObjects.length > 0 ? '3' : '2'}
                            </span>
                          </div>
                          <div className="w-0.5 h-full bg-gradient-to-b from-purple-500 to-orange-500"></div>
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                            <p className="text-sm font-medium text-foreground mb-2">
                              🔄 Modified {data.mutatedObjects.length} Existing Object{data.mutatedObjects.length > 1 ? 's' : ''}
                            </p>
                            {data.mutatedObjects.map((obj, idx) => (
                              <div key={idx} className="mt-2 p-2 bg-card/50 rounded border border-border/50">
                                <div className="flex items-start gap-2 text-xs">
                                  <Package className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 space-y-1">
                                    <div className="font-mono text-foreground">{shortenAddress(obj.id)}</div>
                                    <div className="text-muted-foreground">
                                      → Version updated to: {obj.version}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground mt-2">
                              💡 These objects already existed and were updated
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Gas Paid */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                            {data.createdObjects.length > 0 && data.mutatedObjects.length > 0 ? '4' :
                             data.createdObjects.length > 0 || data.mutatedObjects.length > 0 ? '3' : '2'}
                          </span>
                        </div>
                        <div className="w-0.5 h-full bg-gradient-to-b from-orange-500 to-green-500"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                          <p className="text-sm font-medium text-foreground mb-2">
                            💰 Gas Payment Processed
                          </p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Computation (running code):</span>
                              <span className="font-mono text-foreground">
                                {formatMistToSui(data.gasInfo.computationCost)} SUI
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Storage (saving data):</span>
                              <span className="font-mono text-foreground">
                                {formatMistToSui(data.gasInfo.storageCost)} SUI
                              </span>
                            </div>
                            {data.gasInfo.storageRebate > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Rebate (cleanup bonus):</span>
                                <span className="font-mono text-green-600 dark:text-green-400">
                                  -{formatMistToSui(data.gasInfo.storageRebate)} SUI
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-border/50">
                              <span className="font-medium text-foreground">Total Paid:</span>
                              <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                                {formatMistToSui(totalGas)} SUI
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            💡 Gas is like paying for computing power and storage space
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 5: Completion */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                          <p className="text-sm font-medium text-foreground mb-1">
                            ✅ Transaction Completed
                          </p>
                          <p className="text-xs text-muted-foreground">
                            All changes permanently saved to the blockchain
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator />

            {/* Performance Insights - For Seniors */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  📊 Performance Analysis (For Developers)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Gas Efficiency */}
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs font-semibold text-foreground">Gas Efficiency</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-mono">{formatMistToSui(data.gasInfo.gasBudget)} SUI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Used:</span>
                      <span className="font-mono">{formatMistToSui(totalGas)} SUI</span>
                    </div>
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Efficiency:</span>
                      <span className="font-mono">
                        {((totalGas / data.gasInfo.gasBudget) * 100).toFixed(1)}% of budget
                      </span>
                    </div>
                  </div>
                </div>

                {/* Object Impact */}
                <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-3 h-3 text-blue-500" />
                    <span className="text-xs font-semibold text-foreground">Object Impact</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Objects:</span>
                      <span className="font-mono">
                        {data.createdObjects.length + data.mutatedObjects.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage/Object:</span>
                      <span className="font-mono">
                        {formatMistToSui(
                          data.gasInfo.storageCost /
                          Math.max(1, data.createdObjects.length + data.mutatedObjects.length)
                        )} SUI
                      </span>
                    </div>
                    {data.gasInfo.storageRebate > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Rebate Rate:</span>
                        <span className="font-mono">
                          {((data.gasInfo.storageRebate / data.gasInfo.storageCost) * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dependencies */}
            {data.dependencies.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">
                      🔗 Transaction Dependencies
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    This transaction needed {data.dependencies.length} other transaction{data.dependencies.length > 1 ? 's' : ''} to complete first
                  </p>
                  <div className="pl-6 space-y-1">
                    {data.dependencies.slice(0, 3).map((dep, idx) => (
                      <div key={idx} className="text-xs font-mono text-muted-foreground">
                        • {dep}
                      </div>
                    ))}
                    {data.dependencies.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {data.dependencies.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Learning Tips */}
            <Alert className="border-purple-500/30 bg-purple-500/5">
              <Lightbulb className="h-4 w-4 text-purple-500" />
              <AlertDescription className="text-xs space-y-1">
                <p className="font-semibold text-foreground">💡 Learning Tips:</p>
                <ul className="ml-4 space-y-1 text-muted-foreground list-disc">
                  <li>Use Replay to understand how your transactions work</li>
                  <li>Compare gas costs between different approaches</li>
                  <li>Debug failed transactions by seeing exactly where they stopped</li>
                  <li>Learn Move patterns by replaying successful transactions</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Expandable Raw Terminal Output */}
            <div className="pt-2">
              <button
                onClick={() => setShowRawOutput(!showRawOutput)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2 rounded-lg hover:bg-muted/50"
              >
                {showRawOutput ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide Raw Terminal Output
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show Raw Terminal Output (Advanced)
                  </>
                )}
              </button>

              <AnimatePresence>
                {showRawOutput && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-4 bg-muted/50 border border-border rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                      <pre className="text-xs text-foreground font-mono whitespace-pre">
                        {data.rawOutput}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
