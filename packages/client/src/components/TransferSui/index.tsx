import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import { ArrowRight, Zap, Info, CheckCircle2 } from 'lucide-react';
import { showErrorToast, showSuccessToast, showInfoToast } from '@/lib/toast';

interface TransferableCoin {
  coinObjectId: string;
  balance: string;
  balanceSui: string;
}

export function TransferSui() {
  const { addresses } = useAppStore();
  const activeAddress = addresses.find((a) => a.isActive);

  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<string>('');
  const [coins, setCoins] = useState<TransferableCoin[]>([]);
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string>('');
  const [transferResult, setTransferResult] = useState<{
    success: boolean;
    digest?: string;
    error?: string;
  } | null>(null);

  // Load transferable coins
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

  const handleEstimateGas = async () => {
    if (!validateInputs()) return;

    setIsEstimating(true);
    setEstimatedGas('');
    try {
      const response = await fetch('http://localhost:3001/api/transfers/sui/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toAddress,
          amount,
          coinId: selectedCoin || undefined,
        }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        setEstimatedGas(data.data.estimatedGas);
        showInfoToast({
          message: `Estimated gas: ${data.data.estimatedGas} SUI`,
          icon: '⚡',
        });
      } else {
        showErrorToast({
          message: 'Failed to estimate gas',
          hint: data.error || 'Please check your inputs and try again',
        });
      }
    } catch (error) {
      showErrorToast({
        message: 'Failed to estimate gas',
        hint: 'Make sure the server is running and try again',
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleTransfer = async () => {
    if (!validateInputs()) return;

    setIsTransferring(true);
    setTransferResult(null);
    try {
      const response = await fetch('http://localhost:3001/api/transfers/sui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toAddress,
          amount,
          coinId: selectedCoin || undefined,
        }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        setTransferResult({
          success: true,
          digest: data.data.digest,
        });

        showSuccessToast({
          message: 'Transfer successful!',
          details: `Sent ${amount} SUI. Gas used: ${data.data.gasUsed || 'N/A'} SUI`,
          icon: '🎉',
        });

        // Reset form
        setToAddress('');
        setAmount('');
        setSelectedCoin('');
        setEstimatedGas('');

        // Reload coins
        setTimeout(() => loadCoins(), 1500);
      } else {
        setTransferResult({
          success: false,
          error: data.error || 'Transfer failed',
        });

        showErrorToast({
          message: 'Transfer failed',
          hint: data.error || 'Please check your inputs and try again',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setTransferResult({
        success: false,
        error: errorMsg,
      });

      showErrorToast({
        message: 'Transfer failed',
        hint: 'Make sure the server is running and you have enough balance',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const validateInputs = (): boolean => {
    if (!activeAddress) {
      showErrorToast({
        message: 'No active address',
        hint: 'Please select an address first',
      });
      return false;
    }

    if (!toAddress || toAddress.trim().length === 0) {
      showErrorToast({
        message: 'Recipient address required',
        hint: 'Please enter a valid Sui address',
      });
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showErrorToast({
        message: 'Invalid amount',
        hint: 'Please enter a positive amount',
      });
      return false;
    }

    return true;
  };

  const totalBalance = coins.reduce((sum, coin) => sum + parseFloat(coin.balanceSui), 0);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#4da2ff] to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-[#4da2ff]/30">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Transfer SUI</h2>
            <p className="text-sm text-white/60">Send SUI tokens to another address</p>
          </div>
        </div>
      </div>

      {/* Balance Info */}
      {activeAddress && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70">From Address</span>
            {isLoadingCoins && <Spinner size="sm" />}
          </div>
          <div className="font-mono text-white text-sm mb-3 break-all">
            {activeAddress.address}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Available Balance</span>
            <span className="text-lg font-bold text-green-400">
              {totalBalance.toFixed(4)} SUI
            </span>
          </div>
          {coins.length > 1 && (
            <div className="text-xs text-white/50 mt-1">
              {coins.length} coin objects
            </div>
          )}
        </div>
      )}

      {/* Transfer Form */}
      <div className="space-y-4 mb-6">
        {/* To Address */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#4da2ff]/50 focus:border-[#4da2ff]/50 transition-all font-mono text-sm"
          />
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-white/80">
              Amount (SUI)
            </label>
            <button
              onClick={() => setAmount(totalBalance.toString())}
              className="text-xs text-[#4da2ff] hover:text-[#5cb0ff] transition-colors"
              disabled={isLoadingCoins || totalBalance === 0}
            >
              Max
            </button>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.001"
            min="0"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#4da2ff]/50 focus:border-[#4da2ff]/50 transition-all"
          />
        </div>

        {/* Coin Selection (optional) */}
        {coins.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Specific Coin (Optional)
            </label>
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4da2ff]/50 focus:border-[#4da2ff]/50 transition-all"
            >
              <option value="">Auto-select (recommended)</option>
              {coins.map((coin) => (
                <option key={coin.coinObjectId} value={coin.coinObjectId}>
                  {coin.balanceSui} SUI - {coin.coinObjectId.slice(0, 20)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Estimated Gas */}
      {estimatedGas && (
        <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
          <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-400">Estimated Gas Fee</div>
            <div className="text-xs text-blue-300/80 mt-1">
              ~{estimatedGas} SUI
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
        <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-yellow-300/90">
          <strong>Tip:</strong> Estimate gas first to see transaction cost before sending.
          Transaction is irreversible once confirmed.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleEstimateGas}
          disabled={isEstimating || isTransferring || !activeAddress}
          className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/15 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isEstimating ? (
            <>
              <Spinner size="sm" />
              Estimating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Estimate Gas
            </>
          )}
        </button>

        <button
          onClick={handleTransfer}
          disabled={isTransferring || isEstimating || !activeAddress}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-[#4da2ff] to-blue-600 hover:from-[#5cb0ff] hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#4da2ff]/30"
        >
          {isTransferring ? (
            <>
              <Spinner size="sm" />
              Sending...
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              Transfer
            </>
          )}
        </button>
      </div>

      {/* Success Result */}
      {transferResult && transferResult.success && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg animate-slide-up">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-green-400 font-semibold mb-2">
                Transfer Successful!
              </div>
              {transferResult.digest && (
                <div className="text-xs font-mono text-green-300/80 bg-green-500/10 rounded px-2 py-1 break-all">
                  TX: {transferResult.digest}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
