import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import {
  Zap,
  Info,
  CheckCircle2,
  Plus,
  X,
  Users,
  Clock,
  Star,
  Wallet,
  Send,
  Repeat,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Copy,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { showErrorToast, showSuccessToast, showInfoToast } from '@/lib/toast';

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
  const { addresses, fetchAddresses } = useAppStore();
  const activeAddress = addresses.find((a) => a.isActive);
  const internalAddresses = addresses.filter((a) => !a.isActive);

  // Transfer mode
  const [transferMode, setTransferMode] = useState<TransferMode>('external');

  // Basic transfer
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<string>('');

  // Internal wallet transfer
  const [selectedInternalAddress, setSelectedInternalAddress] = useState('');

  // Batch transfer
  const [batchRecipients, setBatchRecipients] = useState<BatchRecipient[]>([
    { id: '1', address: '', amount: '' }
  ]);

  // Saved addresses
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

  // Load saved/recent addresses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sui-saved-addresses');
    const recent = localStorage.getItem('sui-recent-addresses');
    if (saved) {
      try {
        setSavedAddresses(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved addresses:', e);
      }
    }
    if (recent) {
      try {
        setRecentAddresses(JSON.parse(recent));
      } catch (e) {
        console.error('Failed to load recent addresses:', e);
      }
    }
  }, []);

  // Load coins
  useEffect(() => {
    if (activeAddress) {
      loadCoins();
    }
  }, [activeAddress?.address]);

  const loadCoins = async () => {
    if (!activeAddress) return;

    setIsLoadingCoins(true);
    try {
      const response = await fetch(`http://localhost:3001/api/transfers/sui/coins/${activeAddress.address}`);
      const data = await response.json();

      if (data.success && data.data) {
        setCoins(data.data);
      }
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

    const newAddress: SavedAddress = {
      address: addressToSave,
      alias: saveAlias,
      lastUsed: Date.now(),
    };

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
    setBatchRecipients(
      batchRecipients.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const estimateGas = async () => {
    setIsEstimating(true);
    setEstimatedGas('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (transferMode === 'batch') {
        const gasPerTx = 0.001;
        const totalGas = gasPerTx * batchRecipients.length;
        setEstimatedGas(totalGas.toFixed(6));
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

    // Store balance before transfer
    const balanceBefore = activeAddress.balance;

    setIsTransferring(true);
    setTransferResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/transfers/sui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: finalToAddress,
          amount: amount, // Send as SUI string, backend will handle conversion
          coinId: selectedCoin,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh addresses to get new balance
        await fetchAddresses();

        // Get updated balance
        const updatedAddress = addresses.find(a => a.address === activeAddress.address);
        const balanceAfter = updatedAddress?.balance || balanceBefore;

        setTransferResult({
          success: true,
          digest: data.data.digest,
          balanceBefore,
          balanceAfter,
          amountSent: parseFloat(amount),
        });

        showSuccessToast({ message: '✅ Transfer successful!' });

        if (transferMode === 'external') {
          addToRecent(finalToAddress);
        }

        setToAddress('');
        setSelectedInternalAddress('');
        setAmount('');
        setSelectedCoin('');
        setShowPreview(false);
        await loadCoins();
      } else {
        setTransferResult({ success: false, error: data.error || 'Transfer failed' });
        showErrorToast({ message: data.error || 'Transfer failed' });
      }
    } catch (error: any) {
      const msg = error.message || String(error);
      setTransferResult({ success: false, error: msg });
      showErrorToast({ message: 'Connection error: ' + msg });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleBatchTransfer = async () => {
    showInfoToast({ message: '🚧 Batch transfer backend coming soon!' });
  };

  const getTotalAmount = () => {
    if (transferMode === 'batch') {
      return batchRecipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    }
    return parseFloat(amount) || 0;
  };

  const getTotalWithGas = () => {
    return getTotalAmount() + (parseFloat(estimatedGas) || 0);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-4">
          <Send className="w-10 h-10 text-primary" />
          Transfer SUI
        </h1>
        <p className="text-lg text-muted-foreground">
          Send SUI to external addresses, internal wallets, or multiple recipients at once
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-4">
        <button
          onClick={() => setTransferMode('external')}
          className={`flex-1 px-8 py-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
            transferMode === 'external'
              ? 'border-primary bg-primary/10 text-foreground shadow-lg shadow-primary/20'
              : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Send className="w-8 h-8" />
          <div className="text-center">
            <div className="font-semibold text-base">External Transfer</div>
            <div className="text-sm opacity-80 mt-1">Send to any address</div>
          </div>
        </button>

        <button
          onClick={() => setTransferMode('internal')}
          className={`flex-1 px-8 py-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
            transferMode === 'internal'
              ? 'border-primary bg-primary/10 text-foreground shadow-lg shadow-primary/20'
              : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Repeat className="w-8 h-8" />
          <div className="text-center">
            <div className="font-semibold text-base">Internal Transfer</div>
            <div className="text-sm opacity-80 mt-1">Between your wallets</div>
          </div>
        </button>

        <button
          onClick={() => setTransferMode('batch')}
          className={`flex-1 px-8 py-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
            transferMode === 'batch'
              ? 'border-primary bg-primary/10 text-foreground shadow-lg shadow-primary/20'
              : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-8 h-8" />
          <div className="text-center">
            <div className="font-semibold text-base">Batch Transfer</div>
            <div className="text-sm opacity-80 mt-1">Multiple recipients</div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Address Book */}
        <div className="lg:col-span-1 space-y-6">
          {/* Saved Addresses */}
          <div className="rounded-xl border-2 border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3 text-base font-semibold">
              <Star className="w-5 h-5 text-yellow-500" />
              Saved Addresses
            </div>

            <div className="space-y-3">
              {savedAddresses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No saved addresses yet</p>
              ) : (
                savedAddresses.map((addr) => (
                  <div
                    key={addr.address}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors border border-transparent hover:border-primary/30"
                    onClick={() => {
                      if (transferMode === 'external') {
                        setToAddress(addr.address);
                        showInfoToast({ message: `Using ${addr.alias}` });
                      } else if (transferMode === 'batch') {
                        // For batch mode, update the first recipient or add new one
                        if (batchRecipients.length === 1 && !batchRecipients[0].address) {
                          // First recipient is empty, use it
                          updateBatchRecipient(batchRecipients[0].id, 'address', addr.address);
                          showInfoToast({ message: `Added ${addr.alias} to batch` });
                        } else {
                          // Add as new recipient
                          const newId = Date.now().toString();
                          setBatchRecipients([...batchRecipients, { id: newId, address: addr.address, amount: '' }]);
                          showInfoToast({ message: `Added ${addr.alias} to batch` });
                        }
                      }
                    }}
                  >
                    <Wallet className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">{addr.alias}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                        {addr.address.slice(0, 10)}...{addr.address.slice(-8)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSavedAddress(addr.address);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/20 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t-2 border-border space-y-3">
              <input
                type="text"
                value={addressToSave}
                onChange={(e) => setAddressToSave(e.target.value)}
                placeholder="0x... address to save"
                autoComplete="off"
                spellCheck={false}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono transition-all"
              />
              <input
                type="text"
                value={saveAlias}
                onChange={(e) => setSaveAlias(e.target.value)}
                placeholder="Alias (e.g., Alice, Bob)"
                autoComplete="off"
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                onClick={saveAddress}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold shadow-lg shadow-primary/20"
              >
                💾 Save Address
              </button>
            </div>
          </div>

          {/* Recent Addresses */}
          {recentAddresses.length > 0 && (
            <div className="rounded-xl border-2 border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3 text-base font-semibold">
                <Clock className="w-5 h-5 text-primary" />
                Recent Transfers
              </div>

              <div className="space-y-3">
                {recentAddresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-primary/30"
                    onClick={() => {
                      if (transferMode === 'external') {
                        setToAddress(addr.address);
                        showInfoToast({ message: 'Address loaded' });
                      } else if (transferMode === 'batch') {
                        // For batch mode, update the first recipient or add new one
                        if (batchRecipients.length === 1 && !batchRecipients[0].address) {
                          updateBatchRecipient(batchRecipients[0].id, 'address', addr.address);
                          showInfoToast({ message: 'Added to batch' });
                        } else {
                          const newId = Date.now().toString();
                          setBatchRecipients([...batchRecipients, { id: newId, address: addr.address, amount: '' }]);
                          showInfoToast({ message: 'Added to batch' });
                        }
                      }
                    }}
                  >
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {addr.address.slice(0, 10)}...{addr.address.slice(-8)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(addr.lastUsed || 0).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Transfer Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Transfer Card with 3D curved sphere effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{
              scale: 1.005,
              rotateY: 0.5,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              transformStyle: "preserve-3d",
              perspective: "2000px",
              transform: "perspective(2000px) rotateY(0deg)",
            }}
            className="curved-panel rounded-xl border-2 border-border bg-card p-8 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                {transferMode === 'external' && <Send className="w-8 h-8 text-primary" />}
                {transferMode === 'internal' && <Repeat className="w-8 h-8 text-primary" />}
                {transferMode === 'batch' && <Users className="w-8 h-8 text-primary" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {transferMode === 'external' && 'External Transfer'}
                  {transferMode === 'internal' && 'Internal Wallet Transfer'}
                  {transferMode === 'batch' && 'Batch Transfer'}
                </h3>
                <p className="text-base text-muted-foreground mt-1">
                  {transferMode === 'external' && 'Send SUI to any external address'}
                  {transferMode === 'internal' && 'Transfer between your own addresses'}
                  {transferMode === 'batch' && 'Send to multiple addresses at once'}
                </p>
              </div>
            </div>

            {/* From Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">From</label>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <Wallet className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{activeAddress?.alias || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {activeAddress?.address.slice(0, 12)}...{activeAddress?.address.slice(-8)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{activeAddress?.balance || '0'} SUI</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
              </div>
            </div>

            {/* To Address - External */}
            {transferMode === 'external' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  To Address <span className="text-destructive">*</span>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </label>
                <input
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  onPaste={(e) => {
                    e.stopPropagation();
                  }}
                  placeholder="0x... paste recipient address here"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono transition-all"
                />
                <p className="text-xs text-muted-foreground">Paste or type the recipient's Sui address (0x + 64 hex chars)</p>
              </div>
            )}

            {/* To Address - Internal */}
            {transferMode === 'internal' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  To Your Wallet <span className="text-destructive">*</span>
                </label>
                {internalAddresses.length === 0 ? (
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">No other wallets found</p>
                        <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                          Create additional addresses in <strong>Manage Addresses</strong> to enable internal transfers
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedInternalAddress}
                    onChange={(e) => setSelectedInternalAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select wallet...</option>
                    {internalAddresses.map((addr) => (
                      <option key={addr.address} value={addr.address}>
                        {addr.alias} - {addr.address.slice(0, 8)}...{addr.address.slice(-6)} ({addr.balance} SUI)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Batch Recipients */}
            {transferMode === 'batch' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Recipients</label>
                  <button
                    onClick={addBatchRecipient}
                    className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3" />
                    Add Recipient
                  </button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {batchRecipients.map((recipient, idx) => (
                    <div key={recipient.id} className="flex gap-2 p-4 rounded-lg bg-muted/30 border border-border relative">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-base font-medium text-primary">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={recipient.address}
                          onChange={(e) => updateBatchRecipient(recipient.id, 'address', e.target.value)}
                          onPaste={(e) => {
                            // Explicitly handle paste
                            e.stopPropagation();
                          }}
                          placeholder="0x... paste address here"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono transition-all"
                        />
                        <input
                          type="text"
                          value={recipient.amount}
                          onChange={(e) => updateBatchRecipient(recipient.id, 'amount', e.target.value)}
                          onPaste={(e) => {
                            e.stopPropagation();
                          }}
                          placeholder="Amount (e.g., 0.5)"
                          autoComplete="off"
                          className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <button
                        onClick={() => removeBatchRecipient(recipient.id)}
                        className="flex-shrink-0 w-10 h-10 rounded-lg hover:bg-destructive/20 flex items-center justify-center transition-colors group"
                        disabled={batchRecipients.length === 1}
                        title="Remove recipient"
                      >
                        <X className="w-5 h-5 text-destructive group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amount - Single/Internal */}
            {transferMode !== 'batch' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  Amount <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 pr-16 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-medium"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    SUI
                  </div>
                </div>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val.toString())}
                      className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                    >
                      {val} SUI
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Select Coin */}
            {transferMode !== 'batch' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Coin</label>
                {isLoadingCoins ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <select
                    value={selectedCoin}
                    onChange={(e) => setSelectedCoin(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Choose a coin object...</option>
                    {coins.map((coin) => (
                      <option key={coin.coinObjectId} value={coin.coinObjectId}>
                        {coin.balanceSui} SUI - {coin.coinObjectId.slice(0, 8)}...
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={estimateGas}
                disabled={isEstimating || isTransferring}
                className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {isEstimating ? (
                  <>
                    <Spinner size="sm" />
                    Estimating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Preview Transfer
                  </>
                )}
              </button>

              {showPreview && (
                <button
                  onClick={transferMode === 'batch' ? handleBatchTransfer : handleTransfer}
                  disabled={isTransferring}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-primary/20"
                >
                  {isTransferring ? (
                    <>
                      <Spinner size="sm" />
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Confirm & Send
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* Transaction Preview */}
          {showPreview && estimatedGas && (
            <div className="rounded-xl border border-primary/50 bg-primary/5 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Transaction Preview
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-base font-medium text-foreground">{getTotalAmount().toFixed(6)} SUI</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Estimated Gas Fee</span>
                  <span className="text-base font-medium text-foreground">{estimatedGas} SUI</span>
                </div>

                {transferMode === 'batch' && (
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Recipients</span>
                    <span className="text-base font-medium text-foreground">{batchRecipients.length}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-medium text-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">{getTotalWithGas().toFixed(6)} SUI</span>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Result - Beautiful redesign */}
          {transferResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="rounded-xl border-2 border-border bg-card overflow-hidden shadow-lg"
            >
              {/* Success Header */}
              {transferResult.success ? (
                <div className="bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 border-b-2 border-green-500/30 p-6">
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                      className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/40"
                    >
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        Transfer Successful!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Your transaction has been confirmed on the blockchain
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-destructive/10 border-b-2 border-destructive/30 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-destructive mb-1">
                        Transfer Failed
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Something went wrong with your transaction
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Content */}
              {transferResult.success && transferResult.digest && (
                <div className="p-6 space-y-6">
                  {/* Balance Changes - Modern Card Design */}
                  {transferResult.balanceBefore && transferResult.balanceAfter && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-6"
                    >
                      <h4 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Balance Update
                      </h4>
                      <div className="grid grid-cols-[1fr,auto,1fr] gap-6 items-center">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Before</p>
                          <p className="text-2xl font-bold text-foreground">{transferResult.balanceBefore}</p>
                          <p className="text-xs text-muted-foreground mt-1">SUI</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3, repeat: Infinity, duration: 1.5 }}
                          >
                            <ArrowRight className="w-6 h-6 text-primary" />
                          </motion.div>
                          {transferResult.amountSent && (
                            <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                              -{transferResult.amountSent} SUI
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">After</p>
                          <p className="text-2xl font-bold text-primary">{transferResult.balanceAfter}</p>
                          <p className="text-xs text-muted-foreground mt-1">SUI</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Transaction Digest - Clean Design */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                  >
                    <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Transaction Digest
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-xs text-foreground break-all">
                        {transferResult.digest}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(transferResult.digest || '');
                          showSuccessToast({ message: 'Copied!' });
                        }}
                        className="px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center gap-2 flex-shrink-0 group"
                      >
                        <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Copy</span>
                      </button>
                    </div>
                  </motion.div>

                  {/* Explorer Button - Modern Glass Design */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <a
                      href={`https://testnet.suivision.xyz/txblock/${transferResult.digest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 group"
                    >
                      <span>View on SuiVision Explorer</span>
                      <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  </motion.div>
                </div>
              )}

              {/* Error Content */}
              {!transferResult.success && transferResult.error && (
                <div className="p-6">
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                    <p className="text-sm text-destructive font-medium">{transferResult.error}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
