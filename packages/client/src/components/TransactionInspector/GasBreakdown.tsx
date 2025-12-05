/**
 * Gas Breakdown Visualization
 * Visual representation of gas costs with percentage breakdown
 */
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Zap, TrendingUp, Info } from 'lucide-react';
import { formatMistToSui, type TransactionSummary } from '@/utils/transactionAnalyzer';
import { GlossaryIcon } from '@/components/ui/tooltip';

interface GasBreakdownProps {
  gasUsed: TransactionSummary['gasUsed'];
}

export function GasBreakdown({ gasUsed }: GasBreakdownProps) {
  // Calculate percentages
  const totalCost = gasUsed.computation + gasUsed.storage;
  const computationPercent = totalCost > 0 ? (gasUsed.computation / totalCost) * 100 : 0;
  const storagePercent = totalCost > 0 ? (gasUsed.storage / totalCost) * 100 : 0;
  const rebatePercent = gasUsed.storage > 0 ? (gasUsed.storageRebate / gasUsed.storage) * 100 : 0;

  // Determine if costs are high/low
  const isHighComputation = gasUsed.computation > 5_000_000;
  const isHighStorage = gasUsed.storage > 10_000_000;
  const hasGoodRebate = rebatePercent > 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-cyan-500/5 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-500" />
            <span>Gas Cost Breakdown</span>
            <GlossaryIcon term="GAS_USED" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Cost Banner */}
          <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Gas Cost</p>
                <p className="text-3xl font-bold text-foreground font-mono">
                  {formatMistToSui(gasUsed.total)} <span className="text-xl">SUI</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ({(gasUsed.total / 1_000_000).toLocaleString()} MIST)
                </p>
              </div>
              <Zap className="w-12 h-12 text-cyan-500 opacity-20" />
            </div>
          </div>

          <Separator />

          {/* Cost Breakdown Bars */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              📊 Cost Distribution
            </h3>

            {/* Computation Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Computation
                  <GlossaryIcon term="COMPUTATION_COST" />
                </span>
                <span className="font-mono text-foreground">
                  {computationPercent.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${computationPercent}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-3"
                >
                  {computationPercent > 10 && (
                    <span className="text-xs font-medium text-white">
                      {formatMistToSui(gasUsed.computation)} SUI
                    </span>
                  )}
                </motion.div>
              </div>
              {computationPercent < 10 && (
                <p className="text-xs text-muted-foreground pl-1">
                  {formatMistToSui(gasUsed.computation)} SUI
                </p>
              )}
            </div>

            {/* Storage Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  Storage
                  <GlossaryIcon term="STORAGE_COST" />
                </span>
                <span className="font-mono text-foreground">
                  {storagePercent.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${storagePercent}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-end pr-3"
                >
                  {storagePercent > 10 && (
                    <span className="text-xs font-medium text-white">
                      {formatMistToSui(gasUsed.storage)} SUI
                    </span>
                  )}
                </motion.div>
              </div>
              {storagePercent < 10 && (
                <p className="text-xs text-muted-foreground pl-1">
                  {formatMistToSui(gasUsed.storage)} SUI
                </p>
              )}
            </div>

            {/* Storage Rebate (if any) */}
            {gasUsed.storageRebate > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    Storage Rebate
                    <GlossaryIcon term="STORAGE_REBATE" />
                  </span>
                  <span className="font-mono text-green-600 dark:text-green-400">
                    -{formatMistToSui(gasUsed.storageRebate)} SUI
                  </span>
                </div>
                <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rebatePercent}%` }}
                    transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-end pr-3"
                  >
                    {rebatePercent > 15 && (
                      <span className="text-xs font-medium text-white">
                        {rebatePercent.toFixed(0)}% refunded
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Insights */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Insights
            </h3>

            <div className="space-y-2">
              {/* Computation insights */}
              {isHighComputation ? (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg"
                >
                  <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">High Computation Cost</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This transaction used significant computation. Consider optimizing contract logic or
                      reducing complex operations.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <Info className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">✅ Efficient Computation</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Computation cost is reasonable for this operation type.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Storage insights */}
              {isHighStorage ? (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg"
                >
                  <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">High Storage Cost</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Creating or modifying many objects increases storage costs. Consider reusing existing
                      objects or batching operations.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <Info className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">✅ Reasonable Storage</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Storage cost is typical for this transaction type.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Rebate insights */}
              {gasUsed.storageRebate > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    hasGoodRebate
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-blue-500/10 border border-blue-500/20'
                  }`}
                >
                  <Info
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      hasGoodRebate ? 'text-green-500' : 'text-blue-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">
                      {hasGoodRebate ? '✅ Great Storage Rebate!' : '📊 Storage Rebate'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hasGoodRebate
                        ? `You received ${rebatePercent.toFixed(0)}% rebate from cleaning up or modifying existing storage!`
                        : `Received ${rebatePercent.toFixed(0)}% rebate. Modifying or deleting objects provides storage refunds.`}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Comparison to typical costs */}
          <div className="p-4 bg-muted/30 border border-border/50 rounded-lg">
            <h4 className="text-xs font-semibold text-foreground mb-2">💡 Typical Costs Reference</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Simple Transfer:</span>
                <span className="font-mono text-foreground">~0.001 SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract Call:</span>
                <span className="font-mono text-foreground">~0.005 SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">NFT Mint:</span>
                <span className="font-mono text-foreground">~0.010 SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Package Deploy:</span>
                <span className="font-mono text-foreground">~0.050+ SUI</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
