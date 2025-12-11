import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import {
  Zap,
  CheckCircle2,
  Plus,
  X,
  Users,
  Clock,
  Star,
  Wallet,
  Send,
  Repeat,
  AlertCircle,
  ArrowRight,
  Copy,
  FileText,
  ExternalLink,
  Terminal,
} from 'lucide-react';
import { showErrorToast, showSuccessToast, showInfoToast } from '@/lib/toast';
import { getApiBaseUrl } from '@/api/client';
import { trackEvent, ClarityEvents } from '@/lib/clarity';

interface TransferableCoin {
  coinObjectId: string;
  balance: string;
  balanceSui: string;
}

interface SavedAddress {
  address: string;
  alias: string;
  lastUsed?: number;
}

interface BatchRecipient {
  id: string;
  address: string;
  amount: string;
}

type TransferMode = 'external' | 'internal' | 'batch';

export function TransferSui() {
  const [searchParams] = useSearchParams();
  const { addresses, fetchAddresses } = useAppStore();
  const activeAddress = addresses.find((a) => a.isActive);
  const internalAddresses = addresses.filter((a) => !a.isActive);

  // URL params for pre-selecting coin
  const coinIdParam = searchParams.get('coinId');
  const coinTypeParam = searchParams.get('type');

  const [transferMode, setTransferMode] = useState<TransferMode>('external');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<string>(coinIdParam || '');
  const [selectedInternalAddress, setSelectedInternalAddress] = useState('');
  const [batchRecipients, setBatchRecipients] = useState<BatchRecipient[]>([
    { id: '1', address: '', amount: '' }
  ]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [recentAddresses, setRecentAddresses] = useState<SavedAddress[]>([]);
  const [addressToSave, setAddressToSave] = useState('');
  const [saveAlias, setSaveAlias] = useState('');
  const [coins, setCoins] = useState<TransferableCoin[]>([]);
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [transferResult, setTransferResult] = useState<{
    success: boolean;
    digest?: string;
    error?: string;
    balanceBefore?: string;
    balanceAfter?: string;
    amountSent?: number;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sui-saved-addresses');
    const recent = localStorage.getItem('sui-recent-addresses');
    if (saved) {
      try { setSavedAddresses(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    if (recent) {
      try { setRecentAddresses(JSON.parse(recent)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (activeAddress) loadCoins();
  }, [activeAddress?.address]);

  // Pre-select coin from URL params
  useEffect(() => {
    if (coinIdParam && coins.length > 0) {
      const coinExists = coins.some(c => c.coinObjectId === coinIdParam);
      if (coinExists) {
        setSelectedCoin(coinIdParam);
      }
    }
  }, [coinIdParam, coins]);

  const loadCoins = async () => {
    if (!activeAddress) return;
    setIsLoadingCoins(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/transfers/sui/coins/${activeAddress.address}`);
      const data = await response.json();
      if (data.success && data.data) setCoins(data.data);
    } catch (error) {
      console.error('Failed to load coins:', error);
    } finally {
      setIsLoadingCoins(false);
    }
  };

  const saveAddress = () => {
    if (!addressToSave || !saveAlias) {
      showErrorToast({ message: 'Please enter both address and alias' });
      return;
    }
    const newAddress: SavedAddress = { address: addressToSave, alias: saveAlias, lastUsed: Date.now() };
    const updated = [newAddress, ...savedAddresses.filter((a) => a.address !== addressToSave)];
    setSavedAddresses(updated);
    localStorage.setItem('sui-saved-addresses', JSON.stringify(updated));
    setAddressToSave('');
    setSaveAlias('');
    showSuccessToast({ message: `Saved ${saveAlias}` });
  };

  const addToRecent = (address: string) => {
    const updated = [
      { address, alias: 'Recent', lastUsed: Date.now() },
      ...recentAddresses.filter((a) => a.address !== address).slice(0, 4)
    ];
    setRecentAddresses(updated);
    localStorage.setItem('sui-recent-addresses', JSON.stringify(updated));
  };

  const removeSavedAddress = (address: string) => {
    const updated = savedAddresses.filter((a) => a.address !== address);
    setSavedAddresses(updated);
    localStorage.setItem('sui-saved-addresses', JSON.stringify(updated));
    showInfoToast({ message: 'Address removed' });
  };

  const addBatchRecipient = () => {
    setBatchRecipients([...batchRecipients, { id: Date.now().toString(), address: '', amount: '' }]);
  };

  const removeBatchRecipient = (id: string) => {
    if (batchRecipients.length === 1) {
      showErrorToast({ message: 'At least one recipient required' });
      return;
    }
    setBatchRecipients(batchRecipients.filter((r) => r.id !== id));
  };

  const updateBatchRecipient = (id: string, field: 'address' | 'amount', value: string) => {
    setBatchRecipients(batchRecipients.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const estimateGas = async () => {
    setIsEstimating(true);
    setEstimatedGas('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (transferMode === 'batch') {
        const gasPerTx = 0.001;
        setEstimatedGas((gasPerTx * batchRecipients.length).toFixed(6));
      } else {
        setEstimatedGas('0.001');
      }
      setShowPreview(true);
    } catch (error) {
      showErrorToast({ message: 'Failed to estimate gas' });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleTransfer = async () => {
    if (!activeAddress) {
      showErrorToast({ message: 'No active address' });
      return;
    }
    const finalToAddress = transferMode === 'internal' ? selectedInternalAddress : toAddress;
    if (!finalToAddress || !amount || !selectedCoin) {
      showErrorToast({ message: 'Please fill all fields' });
      return;
    }
    const balanceBefore = activeAddress.balance;
    setIsTransferring(true);
    setTransferResult(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/transfers/sui`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: finalToAddress, amount, coinId: selectedCoin }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchAddresses();
        const updatedAddress = addresses.find(a => a.address === activeAddress.address);
        setTransferResult({
          success: true,
          digest: data.data.digest,
          balanceBefore,
          balanceAfter: updatedAddress?.balance || balanceBefore,
          amountSent: parseFloat(amount),
        });
        showSuccessToast({ message: 'Transfer successful!' });
        trackEvent(ClarityEvents.TRANSFER_COMPLETED);
        if (transferMode === 'external') addToRecent(finalToAddress);
        setToAddress('');
        setSelectedInternalAddress('');
        setAmount('');
        setSelectedCoin('');
        setShowPreview(false);
        await loadCoins();
      } else {
        setTransferResult({ success: false, error: data.error || 'Transfer failed' });
        showErrorToast({ message: data.error || 'Transfer failed' });
        trackEvent(ClarityEvents.TRANSFER_FAILED);
      }
    } catch (error: any) {
      const msg = error.message || String(error);
      setTransferResult({ success: false, error: msg });
      showErrorToast({ message: 'Connection error: ' + msg });
      trackEvent(ClarityEvents.TRANSFER_FAILED);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleBatchTransfer = async () => {
    showInfoToast({ message: 'Batch transfer coming soon!' });
  };

  const getTotalAmount = () => {
    if (transferMode === 'batch') {
      return batchRecipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    }
    return parseFloat(amount) || 0;
  };

  const getTotalWithGas = () => getTotalAmount() + (parseFloat(estimatedGas) || 0);

  const isAnyLoading = isLoadingCoins || isEstimating || isTransferring;

  return (
    <div className="p-3 sm:p-4">
      <div className="max-w-[1600px] mx-auto space-y-3">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" style={{ filter: 'drop-shadow(0 0 4px rgba(77, 162, 255, 0.5))' }} />
            <h1 className="text-lg font-bold text-blue-400 font-mono">$ sui transfer</h1>
          </div>
          <span className="text-blue-500/60 font-mono text-xs hidden sm:block">
            External • Internal • Batch
          </span>
        </motion.div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { mode: 'external' as TransferMode, icon: Send, label: 'External', desc: 'Any address' },
            { mode: 'internal' as TransferMode, icon: Repeat, label: 'Internal', desc: 'Your wallets' },
            { mode: 'batch' as TransferMode, icon: Users, label: 'Batch', desc: 'Multiple' },
          ].map(({ mode, icon: Icon, label, desc }) => (
            <button
              key={mode}
              onClick={() => setTransferMode(mode)}
              className={`px-3 py-2.5 rounded-lg border font-mono text-xs transition-all ${
                transferMode === mode
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20'
                  : 'border-blue-500/30 bg-black/30 text-blue-500/60 hover:border-blue-500/50 hover:text-blue-400'
              }`}
            >
              <Icon className="w-4 h-4 mx-auto mb-1" />
              <div className="font-semibold">{label}</div>
              <div className="text-[10px] opacity-70">{desc}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Address Book */}
          <div className="lg:col-span-1 space-y-2">
            {/* Saved Addresses */}
            <div className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-mono text-blue-400">
                <Star className="w-4 h-4 text-yellow-500" />
                Saved
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {savedAddresses.length === 0 ? (
                  <p className="text-xs text-blue-500/50 font-mono text-center py-2">No saved addresses</p>
                ) : (
                  savedAddresses.map((addr) => (
                    <div
                      key={addr.address}
                      className="flex items-center gap-2 p-2 rounded bg-black/30 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30 cursor-pointer group transition-all"
                      onClick={() => {
                        if (transferMode === 'external') {
                          setToAddress(addr.address);
                          showInfoToast({ message: `Using ${addr.alias}` });
                        }
                      }}
                    >
                      <Wallet className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-blue-400 font-mono">{addr.alias}</div>
                        <div className="text-[10px] text-blue-500/50 font-mono truncate">
                          {addr.address.slice(0, 8)}...{addr.address.slice(-6)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSavedAddress(addr.address); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-2 border-t border-blue-500/20 space-y-1.5">
                <input
                  type="text"
                  value={addressToSave}
                  onChange={(e) => setAddressToSave(e.target.value)}
                  placeholder="0x... address"
                  className="w-full px-2.5 py-1.5 bg-black/50 border border-blue-500/30 rounded text-blue-400 placeholder:text-blue-500/40 focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
                <input
                  type="text"
                  value={saveAlias}
                  onChange={(e) => setSaveAlias(e.target.value)}
                  placeholder="Alias (e.g., Alice)"
                  className="w-full px-2.5 py-1.5 bg-black/50 border border-blue-500/30 rounded text-blue-400 placeholder:text-blue-500/40 focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
                <button
                  onClick={saveAddress}
                  className="w-full px-2.5 py-1.5 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded hover:bg-blue-500/30 transition-all text-xs font-mono"
                >
                  Save Address
                </button>
              </div>
            </div>

            {/* Recent */}
            {recentAddresses.length > 0 && (
              <div className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-mono text-blue-400">
                  <Clock className="w-4 h-4" />
                  Recent
                </div>
                <div className="space-y-1">
                  {recentAddresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded bg-black/30 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30 cursor-pointer transition-all"
                      onClick={() => {
                        if (transferMode === 'external') {
                          setToAddress(addr.address);
                          showInfoToast({ message: 'Address loaded' });
                        }
                      }}
                    >
                      <Clock className="w-3 h-3 text-blue-500/50 flex-shrink-0" />
                      <div className="text-[10px] text-blue-500/70 font-mono truncate">
                        {addr.address.slice(0, 8)}...{addr.address.slice(-6)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transfer Form */}
          <div className="lg:col-span-2 space-y-2">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-lg p-4 space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/50" />

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  {transferMode === 'external' && <Send className="w-5 h-5 text-blue-400" />}
                  {transferMode === 'internal' && <Repeat className="w-5 h-5 text-blue-400" />}
                  {transferMode === 'batch' && <Users className="w-5 h-5 text-blue-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-400 font-mono">
                    {transferMode === 'external' && 'External Transfer'}
                    {transferMode === 'internal' && 'Internal Transfer'}
                    {transferMode === 'batch' && 'Batch Transfer'}
                  </h3>
                  <p className="text-[10px] text-blue-500/60 font-mono">
                    {transferMode === 'external' && 'Send to any Sui address'}
                    {transferMode === 'internal' && 'Between your wallets'}
                    {transferMode === 'batch' && 'Multiple recipients'}
                  </p>
                </div>
              </div>

              {/* From */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-blue-500/70">FROM</label>
                <div className="flex items-center gap-2 p-2.5 rounded bg-black/30 border border-blue-500/20">
                  <Wallet className="w-4 h-4 text-blue-400" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-blue-400 font-mono">{activeAddress?.alias || 'Unknown'}</div>
                    <div className="text-[10px] text-blue-500/50 font-mono">
                      {activeAddress?.address.slice(0, 10)}...{activeAddress?.address.slice(-6)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-blue-400 font-mono">{activeAddress?.balance || '0'} SUI</div>
                  </div>
                </div>
              </div>

              {/* To - External */}
              {transferMode === 'external' && (
                <div className="space-y-1">
                  <label className="text-xs font-mono text-blue-500/70">TO ADDRESS <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="0x... recipient address"
                    className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded text-blue-400 placeholder:text-blue-500/40 focus:outline-none focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              )}

              {/* To - Internal */}
              {transferMode === 'internal' && (
                <div className="space-y-1">
                  <label className="text-xs font-mono text-blue-500/70">TO WALLET <span className="text-red-400">*</span></label>
                  {internalAddresses.length === 0 ? (
                    <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-yellow-400 font-mono">No other wallets</p>
                          <p className="text-[10px] text-yellow-500/70 font-mono">Create more addresses first</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={selectedInternalAddress}
                      onChange={(e) => setSelectedInternalAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded text-blue-400 focus:outline-none focus:border-blue-500 font-mono text-xs"
                    >
                      <option value="">Select wallet...</option>
                      {internalAddresses.map((addr) => (
                        <option key={addr.address} value={addr.address}>
                          {addr.alias} - {addr.address.slice(0, 8)}... ({addr.balance} SUI)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Batch Recipients */}
              {transferMode === 'batch' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-blue-500/70">RECIPIENTS</label>
                    <button
                      onClick={addBatchRecipient}
                      className="px-2 py-1 text-[10px] bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors flex items-center gap-1 font-mono"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {batchRecipients.map((recipient, idx) => (
                      <div key={recipient.id} className="flex gap-2 p-2 rounded bg-black/30 border border-blue-500/20">
                        <div className="flex-shrink-0 w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-xs font-mono text-blue-400">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <input
                            type="text"
                            value={recipient.address}
                            onChange={(e) => updateBatchRecipient(recipient.id, 'address', e.target.value)}
                            placeholder="0x... address"
                            className="w-full px-2 py-1 bg-black/50 border border-blue-500/30 rounded text-blue-400 placeholder:text-blue-500/40 font-mono text-[10px]"
                          />
                          <input
                            type="text"
                            value={recipient.amount}
                            onChange={(e) => updateBatchRecipient(recipient.id, 'amount', e.target.value)}
                            placeholder="Amount (SUI)"
                            className="w-full px-2 py-1 bg-black/50 border border-blue-500/30 rounded text-blue-400 placeholder:text-blue-500/40 font-mono text-[10px]"
                          />
                        </div>
                        <button
                          onClick={() => removeBatchRecipient(recipient.id)}
                          className="flex-shrink-0 w-6 h-6 rounded hover:bg-red-500/20 flex items-center justify-center transition-colors"
                          disabled={batchRecipients.length === 1}
                        >
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount */}
              {transferMode !== 'batch' && (
                <div className="space-y-1">
                  <label className="text-xs font-mono text-blue-500/70">AMOUNT <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 pr-12 bg-black/50 border border-blue-500/30 rounded text-blue-400 placeholder:text-blue-500/40 focus:outline-none focus:border-blue-500 font-mono text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-blue-500/50">SUI</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[0.1, 0.5, 1, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setAmount(val.toString())}
                        className="px-2 py-1 text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded font-mono transition-colors"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Coin Selection */}
              {transferMode !== 'batch' && (
                <div className="space-y-1">
                  <label className="text-xs font-mono text-blue-500/70">SELECT COIN</label>
                  {isLoadingCoins ? (
                    <div className="flex items-center justify-center py-3">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <select
                      value={selectedCoin}
                      onChange={(e) => setSelectedCoin(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded text-blue-400 focus:outline-none focus:border-blue-500 font-mono text-xs"
                    >
                      <option value="">Choose coin...</option>
                      {coins.map((coin) => (
                        <option key={coin.coinObjectId} value={coin.coinObjectId}>
                          {coin.balanceSui} SUI - {coin.coinObjectId.slice(0, 8)}...
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={estimateGas}
                  disabled={isAnyLoading}
                  className="flex-1 px-4 py-2.5 bg-black/30 border border-blue-500/30 text-blue-400 rounded hover:bg-blue-500/10 hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-xs font-mono"
                >
                  {isEstimating ? (
                    <><div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Estimating...</>
                  ) : (
                    <><Terminal className="w-3.5 h-3.5" /> Preview</>
                  )}
                </button>
                {showPreview && (
                  <button
                    onClick={transferMode === 'batch' ? handleBatchTransfer : handleTransfer}
                    disabled={isTransferring}
                    className="flex-1 px-4 py-2.5 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-xs font-mono shadow-lg shadow-blue-500/20"
                  >
                    {isTransferring ? (
                      <><div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Sending...</>
                    ) : (
                      <><Zap className="w-3.5 h-3.5" /> Execute</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>

            {/* Preview */}
            {showPreview && estimatedGas && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-md border border-blue-500/50 rounded-lg p-4 space-y-3"
              >
                <h3 className="text-sm font-mono text-blue-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  TX_PREVIEW
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-blue-500/70">Amount</span>
                    <span className="text-blue-400">{getTotalAmount().toFixed(6)} SUI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-500/70">Gas</span>
                    <span className="text-blue-400">{estimatedGas} SUI</span>
                  </div>
                  {transferMode === 'batch' && (
                    <div className="flex justify-between">
                      <span className="text-blue-500/70">Recipients</span>
                      <span className="text-blue-400">{batchRecipients.length}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-blue-500/30">
                    <span className="text-blue-400 font-semibold">Total</span>
                    <span className="text-blue-400 font-semibold">{getTotalWithGas().toFixed(6)} SUI</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Result */}
            <AnimatePresence>
              {transferResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-black/40 backdrop-blur-md border rounded-lg overflow-hidden ${
                    transferResult.success ? 'border-green-500/50' : 'border-red-500/50'
                  }`}
                >
                  <div className={`px-4 py-3 ${transferResult.success ? 'bg-green-500/10 border-b border-green-500/30' : 'bg-red-500/10 border-b border-red-500/30'}`}>
                    <div className="flex items-center gap-2">
                      {transferResult.success ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <span className="text-sm font-mono font-semibold text-green-400">SUCCESS</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <span className="text-sm font-mono font-semibold text-red-400">FAILED</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {transferResult.success && transferResult.digest && (
                      <>
                        {/* Balance Change */}
                        {transferResult.balanceBefore && transferResult.balanceAfter && (
                          <div className="bg-black/30 border border-blue-500/20 rounded-lg p-3">
                            <div className="text-[10px] font-mono text-blue-500/70 mb-2">BALANCE_CHANGE</div>
                            <div className="grid grid-cols-3 gap-2 items-center text-center">
                              <div>
                                <div className="text-lg font-bold text-blue-400 font-mono">{transferResult.balanceBefore}</div>
                                <div className="text-[10px] text-blue-500/50 font-mono">BEFORE</div>
                              </div>
                              <div className="flex flex-col items-center">
                                <ArrowRight className="w-4 h-4 text-blue-400" />
                                {transferResult.amountSent && (
                                  <span className="text-[10px] font-mono text-blue-400 mt-1">-{transferResult.amountSent}</span>
                                )}
                              </div>
                              <div>
                                <div className="text-lg font-bold text-green-400 font-mono">{transferResult.balanceAfter}</div>
                                <div className="text-[10px] text-blue-500/50 font-mono">AFTER</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Digest */}
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono text-blue-500/70">TX_DIGEST</div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-2 py-1.5 bg-black/50 border border-blue-500/20 rounded text-[10px] font-mono text-blue-300 truncate">
                              {transferResult.digest}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(transferResult.digest || '');
                                showSuccessToast({ message: 'Copied!' });
                              }}
                              className="p-1.5 hover:bg-blue-500/20 rounded transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                          </div>
                        </div>
                        {/* Explorer Link */}
                        <a
                          href={`https://testnet.suivision.xyz/txblock/${transferResult.digest}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded hover:bg-blue-500/30 transition-all text-xs font-mono"
                        >
                          View on Explorer
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                    {!transferResult.success && transferResult.error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                        <p className="text-xs text-red-400 font-mono">{transferResult.error}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
