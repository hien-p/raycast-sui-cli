import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, TestTube2, Copy } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface TerminalTestOutputProps {
  output: string;
  passed: number;
  failed: number;
}

export function TerminalTestOutput({ output, passed, failed }: TerminalTestOutputProps) {
  const [showCopied, setShowCopied] = useState(false);
  const hasFailures = failed > 0;

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setShowCopied(true);
      toast.success('Test results copied');
      setTimeout(() => setShowCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const parseTestOutput = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line) => {
      if (line.includes('Running') || line.includes('Test result')) {
        return { type: 'info', text: line };
      } else if (line.includes('✓') || line.includes('ok') || line.includes('PASS')) {
        return { type: 'pass', text: line };
      } else if (line.includes('✗') || line.includes('FAILED') || line.includes('error')) {
        return { type: 'fail', text: line };
      } else if (line.includes('test_') || line.includes('Testing')) {
        return { type: 'test', text: line };
      }
      return { type: 'normal', text: line };
    });
  };

  const parsedLines = parseTestOutput(output);
  const colorClass = hasFailures ? 'red' : 'green';
  const borderColor = hasFailures ? 'border-red-500/30' : 'border-green-500/30';
  const bgColor = hasFailures ? 'bg-red-950/30' : 'bg-green-950/30';
  const textColor = hasFailures ? 'text-red-400' : 'text-green-400';

  const getLineColor = (type: string) => {
    switch (type) {
      case 'pass':
        return 'text-green-400/90';
      case 'fail':
        return 'text-red-400/90';
      case 'test':
        return 'text-cyan-400/80';
      case 'info':
        return 'text-blue-400/70';
      default:
        return 'text-muted-foreground/70';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative"
    >
      {/* Terminal Container */}
      <div className={`relative bg-black/20 backdrop-blur-md border ${borderColor} rounded-lg overflow-hidden font-mono shadow-2xl shadow-${colorClass}-500/20`}>
        {/* Scanlines overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${hasFailures ? '239, 68, 68' : '34, 197, 94'}, 0.03) 2px, rgba(${hasFailures ? '239, 68, 68' : '34, 197, 94'}, 0.03) 4px)`,
          }}
        />

        {/* Terminal glow effect */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className={`absolute inset-0 bg-gradient-to-b from-${colorClass}-500/10 via-transparent to-transparent`} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Terminal Header */}
          <div className={`border-b ${borderColor} ${bgColor} px-4 py-2.5 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{
                  scale: 1,
                  ...(hasFailures && { rotate: [0, -10, 10, -10, 10, 0] })
                }}
                transition={{
                  scale: { type: "spring", stiffness: 200 },
                  rotate: { duration: 0.5 }
                }}
              >
                <TestTube2 className={`w-4 h-4 ${textColor}`}
                  style={{ filter: `drop-shadow(0 0 4px rgba(${hasFailures ? '239, 68, 68' : '34, 197, 94'}, 0.5))` }}
                />
              </motion.div>
              <span className={`${textColor} text-xs font-semibold tracking-wide`}
                style={{ textShadow: `0 0 10px rgba(${hasFailures ? '239, 68, 68' : '34, 197, 94'}, 0.5)` }}
              >
                TEST RESULTS
              </span>
            </div>
            <button
              onClick={copyOutput}
              className={`p-1.5 hover:bg-${colorClass}-500/20 rounded transition-colors group`}
              title="Copy results"
            >
              {showCopied ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-400 text-xs"
                >
                  ✓
                </motion.span>
              ) : (
                <Copy className={`w-3 h-3 text-${colorClass}-400/60 group-hover:text-${colorClass}-400`} />
              )}
            </button>
          </div>

          {/* Terminal Body */}
          <div className="p-4 space-y-4">
            {/* Test Output */}
            <div className="space-y-0 text-xs">
              <div className={`text-${colorClass}-400/60`}>
                ┌─ TEST OUTPUT ───────────────────────────────────┐
              </div>
              <div className={`bg-black/40 border-l-2 border-r-2 border-${colorClass}-500/20 px-4 py-3`}>
                <div className={`text-${colorClass}-500/70 mb-2`}>$ sui move test</div>
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                  {parsedLines.map((line, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`${getLineColor(line.type)} leading-relaxed flex items-start gap-2`}
                      style={{
                        textShadow: line.type === 'fail' ? '0 0 8px rgba(239, 68, 68, 0.3)' :
                                   line.type === 'pass' ? '0 0 8px rgba(34, 197, 94, 0.3)' : 'none',
                        fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace'
                      }}
                    >
                      {line.type === 'pass' && <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" />}
                      {line.type === 'fail' && <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />}
                      <span>{line.text || '\u00A0'}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className={`text-${colorClass}-400/60`}>
                └─────────────────────────────────────────────────┘
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-0 text-xs">
              <div className={`text-${colorClass}-400/60`}>
                ┌─ SUMMARY ───────────────────────────────────────┐
              </div>
              <div className={`bg-black/40 border-l-2 border-r-2 border-${colorClass}-500/20 px-4 py-3 space-y-2`}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-cyan-400/80">Tests:</span>
                  <span className={`${textColor} font-semibold`}>
                    {passed + failed} total
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-green-400/80 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Passed:
                  </span>
                  <span className="text-green-400 font-semibold"
                    style={{ textShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
                  >
                    {passed}
                  </span>
                </motion.div>
                {failed > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-red-400/80 flex items-center gap-1.5">
                      <XCircle className="w-3 h-3" />
                      Failed:
                    </span>
                    <span className="text-red-400 font-semibold"
                      style={{ textShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}
                    >
                      {failed}
                    </span>
                  </motion.div>
                )}
              </div>
              <div className={`text-${colorClass}-400/60`}>
                └─────────────────────────────────────────────────┘
              </div>
            </div>
          </div>
        </div>

        {/* Flash effect for failures */}
        {hasFailures && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.3, repeat: 2, repeatDelay: 0.5 }}
            className="absolute inset-0 pointer-events-none bg-red-500/10"
          />
        )}
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(${hasFailures ? '239, 68, 68' : '34, 197, 94'}, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(${hasFailures ? '239, 68, 68' : '34, 197, 94'}, 0.5);
        }
      `}</style>
    </motion.div>
  );
}
