import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import {
  Scissors,
  ChevronLeft,
  Plus,
  X,
  Terminal,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Divide,
  Calculator,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import * as api from '@/api/client';
import type { CoinInfo, CoinMetadata, CoinOperationResult } from '@sui-cli-web/shared';

// Format balance with proper decimals
function formatBalance(balance: string, decimals: number): string {
  const balanceBigInt = BigInt(balance);
  const divisor = BigInt(10 ** decimals);
  const integerPart = balanceBigInt / divisor;
  const fractionalPart = balanceBigInt % divisor;

  let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  fractionalStr = fractionalStr.replace(/0+$/, '');
  if (fractionalStr.length === 0) {
    fractionalStr = '0';
  }

  return `${integerPart}.${fractionalStr}`;
}

// Convert human-readable amount to raw amount (MIST equivalent)
function toRawAmount(amount: string, decimals: number): string {
  const [intPart, fracPart = ''] = amount.split('.');
  const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);
  const rawStr = intPart + paddedFrac;
  return BigInt(rawStr).toString();
}

// Parse raw amount to human-readable
function fromRawAmount(raw: string, decimals: number): string {
  return formatBalance(raw, decimals);
}

interface SplitAmount {
  id: string;
  value: string;
  rawValue: string;
}

export function CoinSplit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addresses } = useAppStore();
  const activeAddress = addresses.find((a) => a.isActive);

  // URL params
  const coinIdParam = searchParams.get('coinId');
  const coinTypeParam = searchParams.get('type');

  // State
  const [coin, setCoin] = useState<CoinInfo | null>(null);
  const [metadata, setMetadata] = useState<CoinMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [splitAmounts, setSplitAmounts] = useState<SplitAmount[]>([
    { id: '1', value: '', rawValue: '' },
  ]);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<CoinOperationResult | null>(null);
  const [splitResult, setSplitResult] = useState<CoinOperationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const decimals = metadata?.decimals ?? 9;
  const symbol = metadata?.symbol ?? 'COIN';

  // Load coin and metadata
  useEffect(() => {
    async function loadData() {
      if (!coinIdParam || !coinTypeParam || !activeAddress) return;

      setIsLoading(true);
      try {
        // Load coins of this type - getCoinsByType returns CoinInfo[] directly
        const coins = await api.getCoinsByType(activeAddress.address, coinTypeParam);
        if (coins && coins.length > 0) {
          const foundCoin = coins.find((c) => c.coinObjectId === coinIdParam);
          if (foundCoin) {
            setCoin(foundCoin);
          } else {
            showErrorToast({ message: 'Coin not found in this type' });
          }
        } else {
          showErrorToast({ message: 'No coins found of this type' });
        }

        // Load metadata - getCoinMetadata returns CoinMetadata | null directly
        const metadata = await api.getCoinMetadata(coinTypeParam);
        if (metadata) {
          setMetadata(metadata);
        }
      } catch (error) {
        console.error('Failed to load coin data:', error);
        showErrorToast({ message: 'Failed to load coin data' });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [coinIdParam, coinTypeParam, activeAddress?.address]);

  // Calculate totals
  const totalSplitAmount = useMemo(() => {
    return splitAmounts.reduce((sum, a) => {
      const val = a.rawValue ? BigInt(a.rawValue) : BigInt(0);
      return sum + val;
    }, BigInt(0));
  }, [splitAmounts]);

  const remainingBalance = useMemo(() => {
    if (!coin) return BigInt(0);
    const coinBalance = BigInt(coin.balance);
    return coinBalance - totalSplitAmount;
  }, [coin, totalSplitAmount]);

  const isValidSplit = useMemo(() => {
    if (!coin) return false;
    if (splitAmounts.length === 0) return false;
    if (splitAmounts.some((a) => !a.rawValue || BigInt(a.rawValue) <= 0)) return false;
    if (totalSplitAmount >= BigInt(coin.balance)) return false;
    return true;
  }, [coin, splitAmounts, totalSplitAmount]);

  // Handlers
  const addSplitAmount = () => {
    setSplitAmounts([...splitAmounts, { id: Date.now().toString(), value: '', rawValue: '' }]);
  };

  const removeSplitAmount = (id: string) => {
    if (splitAmounts.length === 1) {
      showErrorToast({ message: 'At least one amount required' });
      return;
    }
    setSplitAmounts(splitAmounts.filter((a) => a.id !== id));
  };

  const updateSplitAmount = (id: string, value: string) => {
    // Validate input - allow only numbers and one decimal point
    if (value && !/^\d*\.?\d*$/.test(value)) return;

    const rawValue = value ? toRawAmount(value, decimals) : '';
    setSplitAmounts(
      splitAmounts.map((a) => (a.id === id ? { ...a, value, rawValue } : a))
    );
    setShowPreview(false);
    setDryRunResult(null);
  };

  // Quick split presets
  const applyPreset = (preset: 'half' | '3equal' | '5equal' | '10equal') => {
    if (!coin) return;
    const balance = BigInt(coin.balance);

    let amounts: bigint[] = [];
    switch (preset) {
      case 'half':
        amounts = [balance / BigInt(2)];
        break;
      case '3equal':
        amounts = [balance / BigInt(3), balance / BigInt(3)];
        break;
      case '5equal':
        amounts = Array(4).fill(balance / BigInt(5));
        break;
      case '10equal':
        amounts = Array(9).fill(balance / BigInt(10));
        break;
    }

    setSplitAmounts(
      amounts.map((raw, idx) => ({
        id: `preset-${idx}`,
        value: fromRawAmount(raw.toString(), decimals),
        rawValue: raw.toString(),
      }))
    );
    setShowPreview(false);
    setDryRunResult(null);
  };

  const handleDryRun = async () => {
    if (!coin || !coinTypeParam || !isValidSplit) return;

    setIsEstimating(true);
    setDryRunResult(null);

    try {
      const amounts = splitAmounts.map((a) => a.rawValue);
      // fetchApi returns data.data directly, which is CoinOperationResult
      const result = await api.dryRunSplitCoin({
        coinId: coin.coinObjectId,
        coinType: coinTypeParam,
        amounts,
      });

      // result IS the CoinOperationResult directly (success, gasUsed, error)
      if (result.success) {
        setDryRunResult(result);
        setShowPreview(true);
      } else {
        showErrorToast({ message: result.error || 'Dry run failed' });
      }
    } catch (error) {
      console.error('Dry run error:', error);
      showErrorToast({ message: 'Failed to estimate split' });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSplit = async () => {
    if (!coin || !coinTypeParam || !isValidSplit) return;

    setIsSplitting(true);
    setSplitResult(null);

    try {
      const amounts = splitAmounts.map((a) => a.rawValue);
      // fetchApi returns data.data directly, which is CoinOperationResult
      const result = await api.splitGenericCoin({
        coinId: coin.coinObjectId,
        coinType: coinTypeParam,
        amounts,
      });

      // result IS the CoinOperationResult directly (success, digest, error)
      setSplitResult(result);
      if (result.success) {
        showSuccessToast({ message: 'Coin split successfully!' });
      } else {
        showErrorToast({ message: result.error || 'Split failed' });
      }
    } catch (error) {
      console.error('Split error:', error);
      showErrorToast({ message: 'Failed to split coin' });
    } finally {
      setIsSplitting(false);
    }
  };

  const isAnyLoading = isLoading || isEstimating || isSplitting;

  if (!coinIdParam || !coinTypeParam) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Invalid parameters. Please select a coin first.</p>
        <button
          onClick={() => navigate('/app/coins')}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
        >
          Go to Coins
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="max-w-2xl mx-auto space-y-3">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-yellow-400" style={{ filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.5))' }} />
            <h1 className="text-lg font-bold text-yellow-400 font-mono">$ split-coin</h1>
          </div>
          <span className="text-yellow-500/60 font-mono text-xs hidden sm:block ml-auto">
            {symbol}
          </span>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !coin ? (
          <div className="text-center py-8 text-muted-foreground">
            Coin not found
          </div>
        ) : (
          <>
            {/* Source Coin Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-lg p-4"
            >
              <div className="text-xs font-mono text-yellow-400 mb-2">SOURCE_COIN</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-lg">
                  {symbol[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {symbol}
                    </span>
                    <span className="text-xs text-muted-foreground">v{coin.version}</span>
                  </div>
                  <div className="text-lg font-bold text-foreground mt-1">
                    {formatBalance(coin.balance, decimals)} {symbol}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-yellow-500/20">
                <div className="text-xs font-mono text-yellow-400/80 truncate">
                  {coin.coinObjectId}
                </div>
              </div>
            </motion.div>

            {/* Split Amounts */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-yellow-400 flex items-center gap-2">
                  <Divide className="w-4 h-4" />
                  SPLIT_AMOUNTS
                </div>
                <button
                  onClick={addSplitAmount}
                  className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition-colors flex items-center gap-1 font-mono"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'half', label: 'Half' },
                  { key: '3equal', label: '3 Equal' },
                  { key: '5equal', label: '5 Equal' },
                  { key: '10equal', label: '10 Equal' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key as any)}
                    className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition-colors font-mono"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Amount Inputs */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {splitAmounts.map((amount, idx) => (
                  <div
                    key={amount.id}
                    className="flex items-center gap-2 p-2 rounded bg-black/30 border border-yellow-500/20"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-yellow-500/20 flex items-center justify-center text-xs font-mono text-yellow-400">
                      {idx + 1}
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={amount.value}
                        onChange={(e) => updateSplitAmount(amount.id, e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 pr-16 bg-black/50 border border-yellow-500/30 rounded text-yellow-400 placeholder:text-yellow-500/40 focus:outline-none focus:border-yellow-500 font-mono text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-yellow-400/80">
                        {symbol}
                      </span>
                    </div>
                    <button
                      onClick={() => removeSplitAmount(amount.id)}
                      className="flex-shrink-0 w-8 h-8 rounded hover:bg-red-500/20 flex items-center justify-center transition-colors"
                      disabled={splitAmounts.length === 1}
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="pt-3 border-t border-yellow-500/20 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-yellow-400">Split Total</span>
                  <span className="text-yellow-400">
                    {formatBalance(totalSplitAmount.toString(), decimals)} {symbol}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-yellow-400">Remaining</span>
                  <span className={remainingBalance < 0 ? 'text-red-400' : 'text-green-400'}>
                    {formatBalance(remainingBalance.toString(), decimals)} {symbol}
                  </span>
                </div>
                {remainingBalance < 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Split amounts exceed balance</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleDryRun}
                disabled={!isValidSplit || isAnyLoading}
                className="flex-1 px-4 py-2.5 bg-black/30 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/10 hover:border-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-xs font-mono"
              >
                {isEstimating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    Estimating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-3.5 h-3.5" />
                    Preview
                  </>
                )}
              </button>
              {showPreview && dryRunResult?.success && (
                <button
                  onClick={handleSplit}
                  disabled={isSplitting}
                  className="flex-1 px-4 py-2.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-xs font-mono shadow-lg shadow-yellow-500/20"
                >
                  {isSplitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                      Splitting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Execute Split
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Dry Run Preview */}
            {showPreview && dryRunResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-black/40 backdrop-blur-md border rounded-lg p-4 space-y-3 ${
                  dryRunResult.success ? 'border-yellow-500/50' : 'border-red-500/50'
                }`}
              >
                <h3 className="text-sm font-mono text-yellow-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  DRY_RUN_RESULT
                </h3>
                {dryRunResult.success ? (
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-yellow-400">Status</span>
                      <span className="text-green-400">Success</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-400">Gas Estimate</span>
                      <span className="text-yellow-400">{dryRunResult.gasUsed || '~0.01'} SUI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-400">New Coins</span>
                      <span className="text-yellow-400">{splitAmounts.length} coins</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                    <p className="text-xs text-red-400 font-mono">{dryRunResult.error}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Split Result */}
            <AnimatePresence>
              {splitResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-black/40 backdrop-blur-md border rounded-lg overflow-hidden ${
                    splitResult.success ? 'border-green-500/50' : 'border-red-500/50'
                  }`}
                >
                  <div
                    className={`px-4 py-3 ${
                      splitResult.success
                        ? 'bg-green-500/10 border-b border-green-500/30'
                        : 'bg-red-500/10 border-b border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {splitResult.success ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <span className="text-sm font-mono font-semibold text-green-400">
                            SPLIT_SUCCESS
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <span className="text-sm font-mono font-semibold text-red-400">
                            SPLIT_FAILED
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {splitResult.success && splitResult.digest && (
                      <>
                        {/* Digest */}
                        <div className="space-y-1">
                          <div className="text-xs font-mono text-yellow-400">TX_DIGEST</div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-2 py-1.5 bg-black/50 border border-yellow-500/20 rounded text-xs font-mono text-yellow-300 truncate">
                              {splitResult.digest}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(splitResult.digest || '');
                                showSuccessToast({ message: 'Copied!' });
                              }}
                              className="p-1.5 hover:bg-yellow-500/20 rounded transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5 text-yellow-400" />
                            </button>
                          </div>
                        </div>

                        {/* New Coin IDs */}
                        {splitResult.newCoinIds && splitResult.newCoinIds.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-mono text-yellow-400">
                              NEW_COINS ({splitResult.newCoinIds.length})
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {splitResult.newCoinIds.map((id, idx) => (
                                <div
                                  key={id}
                                  className="flex items-center gap-2 px-2 py-1 bg-black/30 rounded"
                                >
                                  <span className="text-xs font-mono text-yellow-400">
                                    {idx + 1}.
                                  </span>
                                  <code className="flex-1 text-xs font-mono text-yellow-300 truncate">
                                    {id}
                                  </code>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(id);
                                      showSuccessToast({ message: 'Copied!' });
                                    }}
                                    className="p-1 hover:bg-yellow-500/20 rounded transition-colors"
                                  >
                                    <Copy className="w-3 h-3 text-yellow-400" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Explorer Link */}
                        <a
                          href={`https://testnet.suivision.xyz/txblock/${splitResult.digest}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded hover:bg-yellow-500/30 transition-all text-xs font-mono"
                        >
                          View on Explorer
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Back to Coins */}
                        <button
                          onClick={() => navigate('/app/coins')}
                          className="w-full px-4 py-2 bg-black/30 border border-yellow-500/30 text-yellow-400 rounded hover:bg-yellow-500/10 transition-all text-xs font-mono"
                        >
                          Back to Coins
                        </button>
                      </>
                    )}
                    {!splitResult.success && splitResult.error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                        <p className="text-xs text-red-400 font-mono">{splitResult.error}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
