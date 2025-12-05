/**
 * Enhanced Replay Summary - Clean Terminal Style
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  parseReplayOutput,
  formatMistToSui,
  shortenAddress,
  type ReplayParsedData,
} from '@/utils/replayParser';

interface EnhancedReplaySummaryProps {
  output: string;
  digest?: string;
}

export function EnhancedReplaySummary({ output, digest }: EnhancedReplaySummaryProps) {
  const [showRawOutput, setShowRawOutput] = useState(false);
  const [showObjects, setShowObjects] = useState(false);
  const data: ReplayParsedData = parseReplayOutput(output);

  const totalGas = data.gasInfo.computationCost + data.gasInfo.storageCost - data.gasInfo.storageRebate;

  return (
    <div className="space-y-3">
      {/* Main Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-mono uppercase tracking-wider">
              Replay Results
            </span>
            <span className="text-white/40 text-xs font-mono">
              Epoch #{data.executedEpoch}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            {data.status === 'Success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm font-mono ${data.status === 'Success' ? 'text-green-400' : 'text-red-400'}`}>
              {data.status}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center py-2 bg-white/5 rounded">
              <div className="text-lg font-mono text-white">{data.createdObjects.length}</div>
              <div className="text-xs text-white/40 font-mono">Created</div>
            </div>
            <div className="text-center py-2 bg-white/5 rounded">
              <div className="text-lg font-mono text-white">{data.mutatedObjects.length}</div>
              <div className="text-xs text-white/40 font-mono">Modified</div>
            </div>
            <div className="text-center py-2 bg-white/5 rounded">
              <div className="text-lg font-mono text-white">{formatMistToSui(totalGas)}</div>
              <div className="text-xs text-white/40 font-mono">SUI</div>
            </div>
            <div className="text-center py-2 bg-white/5 rounded">
              <div className="text-lg font-mono text-white">{data.dependencies.length}</div>
              <div className="text-xs text-white/40 font-mono">Deps</div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Gas Details */}
          <div className="space-y-2">
            <div className="text-white/40 text-xs font-mono uppercase tracking-wider">Gas</div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-white/50">Computation</span>
                <span className="text-white/80">{formatMistToSui(data.gasInfo.computationCost)} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Storage</span>
                <span className="text-white/80">{formatMistToSui(data.gasInfo.storageCost)} SUI</span>
              </div>
              {data.gasInfo.storageRebate > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/50">Rebate</span>
                  <span className="text-green-400">-{formatMistToSui(data.gasInfo.storageRebate)} SUI</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-white/10">
                <span className="text-white/70">Total</span>
                <span className="text-white font-medium">{formatMistToSui(totalGas)} SUI</span>
              </div>
              <div className="flex justify-between text-white/30">
                <span>Budget</span>
                <span>{formatMistToSui(data.gasInfo.gasBudget)} SUI</span>
              </div>
            </div>
          </div>

          {/* Objects Toggle */}
          {(data.createdObjects.length > 0 || data.mutatedObjects.length > 0) && (
            <>
              <div className="border-t border-white/10" />
              <button
                onClick={() => setShowObjects(!showObjects)}
                className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors w-full justify-center py-2 font-mono"
              >
                {showObjects ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showObjects ? 'Hide' : 'Show'} Objects ({data.createdObjects.length + data.mutatedObjects.length})
              </button>

              <AnimatePresence>
                {showObjects && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-3"
                  >
                    {/* Created Objects */}
                    {data.createdObjects.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-white/40 text-xs font-mono">Created</div>
                        <div className="space-y-1">
                          {data.createdObjects.map((obj, idx) => (
                            <div key={idx} className="bg-white/5 rounded p-2 text-xs font-mono">
                              <div className="text-white/70">{shortenAddress(obj.id)}</div>
                              <div className="text-white/40">Owner: {shortenAddress(obj.owner)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mutated Objects */}
                    {data.mutatedObjects.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-white/40 text-xs font-mono">Modified</div>
                        <div className="space-y-1">
                          {data.mutatedObjects.map((obj, idx) => (
                            <div key={idx} className="bg-white/5 rounded p-2 text-xs font-mono">
                              <div className="text-white/70">{shortenAddress(obj.id)}</div>
                              <div className="text-white/40">Version: {obj.version}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Raw Output Toggle */}
          <div className="border-t border-white/10" />
          <button
            onClick={() => setShowRawOutput(!showRawOutput)}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors w-full justify-center py-2 font-mono"
          >
            {showRawOutput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showRawOutput ? 'Hide' : 'Show'} Raw Output
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
                <div className="bg-black/50 border border-white/10 rounded p-3 overflow-x-auto max-h-64 overflow-y-auto">
                  <pre className="text-xs text-white/60 font-mono whitespace-pre">
                    {data.rawOutput}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
