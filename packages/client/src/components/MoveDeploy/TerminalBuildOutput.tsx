import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Copy } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface TerminalBuildOutputProps {
  output: string;
  isError?: boolean;
  title?: string;
}

export function TerminalBuildOutput({
  output,
  isError = false,
  title = isError ? 'BUILD FAILED' : 'BUILD OUTPUT'
}: TerminalBuildOutputProps) {
  const [showCopied, setShowCopied] = useState(false);

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setShowCopied(true);
      toast.success('Output copied to clipboard');
      setTimeout(() => setShowCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const parseOutput = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line) => {
      const trimmed = line.trim();

      // Detect different line types for coloring
      if (line.includes('INCLUDING DEPENDENCY')) {
        return { type: 'dependency', text: line };
      } else if (line.includes('BUILDING')) {
        return { type: 'building', text: line };
      } else if (/^(error|Error|ERROR)[\[\]:]/i.test(trimmed)) {
        return { type: 'error', text: line };
      } else if (line.toLowerCase().includes('failed') || line.toLowerCase().includes('error')) {
        return { type: 'error', text: line };
      } else if (/^(warning|Warning)[\[\]:]/i.test(trimmed) || line.includes('warning')) {
        return { type: 'warning', text: line };
      } else if (/^\[Note\]|^Note:/i.test(trimmed)) {
        return { type: 'note', text: line };
      } else if (/at .+:\d+:\d+/i.test(trimmed) || /─+>/.test(trimmed)) {
        return { type: 'location', text: line };
      } else if (line.includes('✓') || line.toLowerCase().includes('success')) {
        return { type: 'success', text: line };
      }
      return { type: 'normal', text: line };
    });
  };

  const parsedLines = parseOutput(output);
  const colorClass = isError ? 'red' : 'green';
  const borderColor = isError ? 'border-red-500/60' : 'border-green-500/30';
  const bgColor = isError ? 'bg-red-950/60' : 'bg-green-950/30';
  const textColor = isError ? 'text-red-500' : 'text-green-400';
  const iconColor = isError ? 'red' : 'green';

  const getLineColor = (type: string) => {
    switch (type) {
      case 'dependency':
        return 'text-cyan-400/80';
      case 'building':
        return 'text-blue-400/90';
      case 'error':
        return 'text-red-400 font-bold';
      case 'warning':
        return 'text-amber-400 font-semibold';
      case 'note':
        return 'text-blue-400/90';
      case 'location':
        return 'text-purple-400/80';
      case 'success':
        return 'text-green-400/90';
      default:
        return `text-${colorClass}-400/70`;
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
      <div
        className={`relative bg-black/20 backdrop-blur-md border ${borderColor} rounded-lg overflow-hidden font-mono ${
          isError ? 'shadow-2xl shadow-red-500/60' : 'shadow-2xl shadow-green-500/20'
        }`}
        style={isError ? {
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.5), inset 0 0 30px rgba(239, 68, 68, 0.15)'
        } : undefined}
      >
        {/* Scanlines overlay */}
        <div
          className={`absolute inset-0 pointer-events-none ${isError ? 'opacity-50' : 'opacity-30'}`}
          style={{
            backgroundImage: isError
              ? 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239, 68, 68, 0.1) 2px, rgba(239, 68, 68, 0.1) 4px)'
              : 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.03) 2px, rgba(34, 197, 94, 0.03) 4px)',
          }}
        />

        {/* Terminal glow effect */}
        <div className={`absolute inset-0 pointer-events-none ${isError ? 'opacity-70' : 'opacity-50'}`}>
          <div className={`absolute inset-0 bg-gradient-to-b from-${iconColor}-500/${isError ? '20' : '10'} via-transparent to-transparent`} />
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
                  ...(isError && { rotate: [0, -10, 10, -10, 10, 0] })
                }}
                transition={{
                  scale: { type: "spring", stiffness: 200 },
                  rotate: { duration: 0.5 }
                }}
              >
                {isError ? (
                  <XCircle className="w-4 h-4 text-red-500"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))' }}
                  />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-400"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))' }}
                  />
                )}
              </motion.div>
              <span className={`${textColor} text-xs font-semibold tracking-wide`}
                style={{ textShadow: `0 0 10px rgba(${isError ? '239, 68, 68' : '34, 197, 94'}, 0.5)` }}
              >
                {title}
              </span>
            </div>
            <button
              onClick={copyOutput}
              className={`p-1.5 hover:bg-${iconColor}-500/20 rounded transition-colors group`}
              title="Copy output"
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
                <Copy className={`w-3 h-3 text-${iconColor}-400/60 group-hover:text-${iconColor}-400`} />
              )}
            </button>
          </div>

          {/* Terminal Body */}
          <div className="p-4">
            <div className="space-y-0 text-xs">
              <div className={`text-${iconColor}-400/60`}>
                ┌─ {title} ──────────────────────────────────────┐
              </div>
              <div className={`bg-black/40 border-l-2 border-r-2 border-${iconColor}-500/20 px-4 py-3`}>
                <div className={`text-${iconColor}-500/70 mb-2`}>$ sui move build</div>
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                  {parsedLines.map((line, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`${getLineColor(line.type)} leading-relaxed`}
                      style={{
                        textShadow: line.type === 'error' ? '0 0 12px rgba(239, 68, 68, 0.6)' :
                                   line.type === 'warning' ? '0 0 10px rgba(251, 191, 36, 0.4)' :
                                   line.type === 'success' ? '0 0 8px rgba(34, 197, 94, 0.3)' : 'none',
                        fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace'
                      }}
                    >
                      {line.text || '\u00A0'}
                    </motion.div>
                  ))}
                </div>
                {!isError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: parsedLines.length * 0.03 + 0.2 }}
                    className="text-green-400/90 mt-3 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>✓ Build completed successfully</span>
                  </motion.div>
                )}
              </div>
              <div className={`text-${iconColor}-400/60`}>
                └─────────────────────────────────────────────────┘
              </div>
            </div>
          </div>
        </div>
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
          background: rgba(${isError ? '239, 68, 68' : '34, 197, 94'}, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(${isError ? '239, 68, 68' : '34, 197, 94'}, 0.5);
        }
      `}</style>
    </motion.div>
  );
}
