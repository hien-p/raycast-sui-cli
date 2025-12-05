/**
 * Transaction Summary Card
 * Provides a newbie-friendly overview of transaction details
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Coins,
  Package,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
} from 'lucide-react';
import {
  analyzeTransaction,
  formatMistToSui,
  formatAddress,
  formatRelativeTime,
  getGasOptimizationTips,
  type TransactionSummary as TxSummary,
} from '@/utils/transactionAnalyzer';
import { GlossaryTerm, GlossaryIcon } from '@/components/ui/tooltip';

interface TransactionSummaryProps {
  txData: any;
  digest?: string;
}

export function TransactionSummary({ txData, digest }: TransactionSummaryProps) {
  const [showRawData, setShowRawData] = useState(false);
  const summary: TxSummary = analyzeTransaction(txData);

  // Get icon color based on transaction type
  const getTypeColor = () => {
    const colors: Record<string, string> = {
      green: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900',
      blue: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900',
      purple: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900',
      yellow: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
      orange: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900',
      cyan: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900',
      gray: 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-900',
    };
    return colors[summary.type.color] || colors.gray;
  };

  const gasOptimizationTips = getGasOptimizationTips(summary.gasUsed, summary.objectChanges);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Transaction Summary
            </span>
            <Badge
              variant="outline"
              className={`${getTypeColor()} font-medium px-3 py-1`}
            >
              <span className="mr-1.5">{summary.type.icon}</span>
              {summary.type.type}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status and Type Explanation */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {summary.status === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {summary.status === 'success' ? (
                    <span className="text-green-600 dark:text-green-400">
                      ✅ Transaction Succeeded
                    </span>
                  ) : (
                    <span className="text-destructive">❌ Transaction Failed</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{summary.type.explanation}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sender */}
            {summary.sender && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Sender</p>
                  <p className="text-sm font-mono text-foreground break-all">
                    {formatAddress(summary.sender)}
                  </p>
                </div>
              </div>
            )}

            {/* Time */}
            {summary.timestamp && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Time</p>
                  <p className="text-sm text-foreground">{formatRelativeTime(summary.timestamp)}</p>
                </div>
              </div>
            )}

            {/* Block Height */}
            {summary.blockHeight && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    Epoch <GlossaryIcon term="EPOCH" />
                  </p>
                  <p className="text-sm font-mono text-foreground">#{summary.blockHeight}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Gas Costs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                💰 Costs
                <GlossaryIcon term="GAS_USED" />
              </h3>
            </div>

            <div className="space-y-2 pl-6">
              {/* Computation Cost */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <GlossaryTerm term="computation" definition="Gas spent on executing the transaction logic and Move code">
                    Computation
                  </GlossaryTerm>
                  :
                </span>
                <span className="font-mono text-foreground">
                  {formatMistToSui(summary.gasUsed.computation)} SUI
                </span>
              </div>

              {/* Storage Cost */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <GlossaryTerm term="storage" definition="Gas spent on storing new data on the blockchain">
                    Storage
                  </GlossaryTerm>
                  :
                </span>
                <span className="font-mono text-foreground">
                  {formatMistToSui(summary.gasUsed.storage)} SUI
                </span>
              </div>

              {/* Storage Rebate */}
              {summary.gasUsed.storageRebate > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <GlossaryTerm term="rebate" definition="Gas refunded from cleaning up or modifying existing storage">
                      Rebate
                    </GlossaryTerm>
                    :
                  </span>
                  <span className="font-mono text-green-600 dark:text-green-400">
                    -{formatMistToSui(summary.gasUsed.storageRebate)} SUI
                  </span>
                </div>
              )}

              {/* Total Cost */}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <span className="font-medium text-foreground">Total Cost:</span>
                <span className="font-mono font-semibold text-lg text-primary">
                  {formatMistToSui(summary.gasUsed.total)} SUI
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Object Changes Impact */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                📦 Impact
                <GlossaryIcon term="EFFECTS" />
              </h3>
            </div>

            <div className="space-y-2 pl-6 text-sm">
              {summary.objectChanges.created > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">•</span>
                  <span className="text-muted-foreground">
                    Created <span className="font-medium text-foreground">{summary.objectChanges.created}</span> new{' '}
                    <GlossaryTerm term="object" definition="A piece of data stored on the Sui blockchain">
                      object{summary.objectChanges.created > 1 ? 's' : ''}
                    </GlossaryTerm>
                  </span>
                </div>
              )}

              {summary.objectChanges.mutated > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  <span className="text-muted-foreground">
                    Modified <span className="font-medium text-foreground">{summary.objectChanges.mutated}</span>{' '}
                    existing object{summary.objectChanges.mutated > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {summary.objectChanges.deleted > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-red-600 dark:text-red-400">•</span>
                  <span className="text-muted-foreground">
                    Deleted <span className="font-medium text-foreground">{summary.objectChanges.deleted}</span>{' '}
                    object{summary.objectChanges.deleted > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {summary.eventsCount > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  <span className="text-muted-foreground">
                    Emitted <span className="font-medium text-foreground">{summary.eventsCount}</span>{' '}
                    <GlossaryTerm
                      term="event"
                      definition="Log emitted by a smart contract during execution to track important state changes"
                    >
                      event{summary.eventsCount > 1 ? 's' : ''}
                    </GlossaryTerm>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">No events emitted</span>
                </div>
              )}
            </div>
          </div>

          {/* Optimization Tips */}
          {gasOptimizationTips.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">💡 Optimization Tips</h3>
                </div>
                <div className="space-y-2 pl-6">
                  {gasOptimizationTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary flex-shrink-0 mt-0.5">→</span>
                      <span className="text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Expandable Raw Data */}
          <div className="pt-2">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2 rounded-lg hover:bg-muted/50"
            >
              {showRawData ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Raw Data
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show Raw Data (Advanced)
                </>
              )}
            </button>

            <AnimatePresence>
              {showRawData && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-4 bg-muted/50 border border-border rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                    <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                      {JSON.stringify(txData, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
