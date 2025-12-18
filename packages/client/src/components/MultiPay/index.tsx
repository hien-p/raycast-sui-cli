/**
 * MultiPay - Send SUI to multiple recipients
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Coins,
  Copy,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/api/client';

interface Recipient {
  id: string;
  address: string;
  amount: string;
}

interface PayResult {
  success: boolean;
  digest?: string;
  error?: string;
}

export function MultiPay() {
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', address: '', amount: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PayResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addRecipient = () => {
    setRecipients(prev => [
      ...prev,
      { id: Date.now().toString(), address: '', amount: '' },
    ]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.length > 1) {
      setRecipients(prev => prev.filter(r => r.id !== id));
    }
  };

  const updateRecipient = (id: string, field: 'address' | 'amount', value: string) => {
    setRecipients(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const getTotalAmount = () => {
    return recipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const handleSubmit = async () => {
    // Validate
    const validRecipients = recipients.filter(r => r.address && r.amount);
    if (validRecipients.length === 0) {
      setError('Please add at least one recipient with address and amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.post('/pay/sui', {
        recipients: validRecipients.map(r => ({
          address: r.address,
          amount: r.amount,
        })),
      });

      if (response.success) {
        setResult(response as PayResult);
        toast.success('Payment sent successfully!');
      } else {
        setError(response.error || 'Payment failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyDigest = () => {
    if (result?.digest) {
      navigator.clipboard.writeText(result.digest);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Users className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Multi-Pay</h1>
          <p className="text-xs text-white/60 font-mono">Send SUI to multiple recipients</p>
        </div>
      </motion.div>

      {/* Recipients List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/80">Recipients</h3>
          <button
            onClick={addRecipient}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-mono transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        <div className="space-y-3">
          {recipients.map((recipient, index) => (
            <motion.div
              key={recipient.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex gap-3 items-start"
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white/10 rounded text-xs text-white/60 font-mono">
                {index + 1}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="0x... recipient address"
                  value={recipient.address}
                  onChange={(e) => updateRecipient(recipient.id, 'address', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount (SUI)"
                    value={recipient.amount}
                    onChange={(e) => updateRecipient(recipient.id, 'amount', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                  />
                  {recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(recipient.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 text-white/60">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-mono">Total</span>
          </div>
          <span className="text-lg font-semibold text-white font-mono">
            {getTotalAmount().toFixed(4)} SUI
          </span>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 font-mono text-sm transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isLoading ? 'Sending...' : 'Send Payment'}
        </button>

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

      {/* Result */}
      <AnimatePresence>
        {result?.success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-black/40 backdrop-blur-md border border-green-500/20 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Payment Successful!</span>
            </div>

            {result.digest && (
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                <span className="text-xs text-white/60 font-mono">TX:</span>
                <span className="flex-1 text-xs text-white font-mono truncate">
                  {result.digest}
                </span>
                <button
                  onClick={copyDigest}
                  className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`https://suiscan.xyz/testnet/tx/${result.digest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help */}
      <div className="text-xs text-white/40 font-mono space-y-1 p-3 bg-white/5 rounded-lg">
        <p><span className="text-blue-400">Tip:</span> Use this to airdrop tokens or pay multiple addresses</p>
        <p>All payments are sent in a single transaction for gas efficiency</p>
      </div>
    </div>
  );
}

export default MultiPay;
