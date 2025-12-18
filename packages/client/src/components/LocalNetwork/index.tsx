/**
 * LocalNetwork - Manage local Sui network (sui start)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  RefreshCw,
  Server,
  Activity,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/api/client';

interface NetworkStatus {
  running: boolean;
  processId?: string;
  rpcUrl?: string;
  faucetUrl?: string;
  uptime?: number;
}

export function LocalNetwork() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string[]>([]);

  // Options
  const [withFaucet, setWithFaucet] = useState(true);
  const [forceRegenesis, setForceRegenesis] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await apiClient.get('/network/status');
      if (response.success) {
        setStatus(response as NetworkStatus);
      }
    } catch (err) {
      // Network might not be running
      setStatus({ running: false });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const startNetwork = async () => {
    setIsStarting(true);
    setError(null);
    setOutput([]);

    try {
      const response = await apiClient.post('/network/start', {
        withFaucet,
        forceRegenesis,
      });

      if (response.success) {
        setOutput(prev => [...prev, 'Network starting...']);
        await fetchStatus();
      } else {
        setError(response.error || 'Failed to start network');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start network');
    } finally {
      setIsStarting(false);
    }
  };

  const stopNetwork = async () => {
    setIsStopping(true);
    setError(null);

    try {
      const response = await apiClient.post('/network/stop', {});

      if (response.success) {
        setOutput(prev => [...prev, 'Network stopped']);
        setStatus({ running: false });
      } else {
        setError(response.error || 'Failed to stop network');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop network');
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Local Network</h1>
            <p className="text-xs text-white/60 font-mono">sui start - Local development network</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono ${
          status?.running
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-white/10 text-white/60 border border-white/20'
        }`}>
          {status?.running ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              Running
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              Stopped
            </>
          )}
        </div>
      </motion.div>

      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-4 space-y-4"
      >
        {/* Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/80">Options</h3>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={withFaucet}
              onChange={(e) => setWithFaucet(e.target.checked)}
              className="w-4 h-4 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500/50"
            />
            <div>
              <span className="text-sm text-white">Enable Faucet</span>
              <p className="text-xs text-white/50">Run local faucet for test tokens</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={forceRegenesis}
              onChange={(e) => setForceRegenesis(e.target.checked)}
              className="w-4 h-4 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500/50"
            />
            <div>
              <span className="text-sm text-white">Force Regenesis</span>
              <p className="text-xs text-white/50">Start fresh (clears all data)</p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!status?.running ? (
            <button
              onClick={startNetwork}
              disabled={isStarting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 font-mono text-sm transition-all disabled:opacity-50"
            >
              {isStarting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isStarting ? 'Starting...' : 'Start Network'}
            </button>
          ) : (
            <button
              onClick={stopNetwork}
              disabled={isStopping}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 font-mono text-sm transition-all disabled:opacity-50"
            >
              {isStopping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {isStopping ? 'Stopping...' : 'Stop Network'}
            </button>
          )}

          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/80 font-mono text-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-mono">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status Info */}
      {status?.running && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/40 backdrop-blur-md border border-green-500/20 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-green-400">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Network Active</span>
          </div>

          <div className="grid gap-2 text-xs font-mono">
            {status.rpcUrl && (
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-white/60">RPC URL:</span>
                <span className="text-white">{status.rpcUrl}</span>
              </div>
            )}
            {status.faucetUrl && (
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-white/60">Faucet URL:</span>
                <span className="text-white">{status.faucetUrl}</span>
              </div>
            )}
            {status.processId && (
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-white/60">Process ID:</span>
                <span className="text-white">{status.processId}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Output Console */}
      {output.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/60 border border-white/10 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-white/60 mb-3">
            <Terminal className="w-4 h-4" />
            <span className="text-xs font-mono">Output</span>
          </div>
          <div className="font-mono text-xs text-white/80 space-y-1 max-h-40 overflow-y-auto">
            {output.map((line, i) => (
              <div key={i} className="text-green-400/80">{line}</div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Help */}
      <div className="text-xs text-white/40 font-mono space-y-1 p-3 bg-white/5 rounded-lg">
        <p><span className="text-blue-400">Note:</span> Local network requires Sui CLI installed</p>
        <p>Use <span className="text-yellow-400">Force Regenesis</span> to start fresh (new addresses)</p>
        <p>Faucet provides unlimited test tokens on local network</p>
      </div>
    </div>
  );
}

export default LocalNetwork;
