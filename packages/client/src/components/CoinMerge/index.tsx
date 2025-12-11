import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import {
  Combine,
  ChevronLeft,
  Terminal,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Layers,
  Calculator,
  Check,
} from 'lucide-react';
import { showErrorToast, showSuccessToast, showInfoToast } from '@/lib/toast';
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

export function CoinMerge() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addresses } = useAppStore();
  const activeAddress = addresses.find((a) => a.isActive);

  // URL params
  const coinTypeParam = searchParams.get('type');
  const primaryCoinIdParam = searchParams.get('coinId');

  // State
  const [coins, setCoins] = useState<CoinInfo[]>([]);
  const [metadata, setMetadata] = useState<CoinMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [primaryCoinId, setPrimaryCoinId] = useState<string>(primaryCoinIdParam || '');
  const [selectedCoinIds, setSelectedCoinIds] = useState<Set<string>>(new Set());
  const [isEstimating, setIsEstimating] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<CoinOperationResult | null>(null);
  const [mergeResult, setMergeResult] = useState<CoinOperationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const decimals = metadata?.decimals ?? 9;
  const symbol = metadata?.symbol ?? 'COIN';

  // Load coins and metadata
  useEffect(() => {
    async function loadData() {
      if (!coinTypeParam || !activeAddress) return;

      setIsLoading(true);
      try {
        // Load all coins of this type - getCoinsByType returns CoinInfo[] directly
        const coins = await api.getCoinsByType(activeAddress.address, coinTypeParam);
        if (coins && coins.length > 0) {
          setCoins(coins);
          // If we have a primary coin from URL, use it
          if (primaryCoinIdParam) {
            setPrimaryCoinId(primaryCoinIdParam);
          } else {
            // Otherwise select the first coin as primary
            setPrimaryCoinId(coins[0].coinObjectId);
          }
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
  }, [coinTypeParam, activeAddress?.address, primaryCoinIdParam]);

  // Primary coin
  const primaryCoin = useMemo(() => {
    return coins.find((c) => c.coinObjectId === primaryCoinId);
  }, [coins, primaryCoinId]);

  // Available coins to merge (excluding primary)
  const availableCoins = useMemo(() => {
    return coins.filter((c) => c.coinObjectId !== primaryCoinId);
  }, [coins, primaryCoinId]);

  // Calculate totals
  const selectedCoins = useMemo(() => {
    return availableCoins.filter((c) => selectedCoinIds.has(c.coinObjectId));
  }, [availableCoins, selectedCoinIds]);

  const selectedBalance = useMemo(() => {
    return selectedCoins.reduce((sum, c) => sum + BigInt(c.balance), BigInt(0));
  }, [selectedCoins]);

  const totalAfterMerge = useMemo(() => {
    if (!primaryCoin) return BigInt(0);
    return BigInt(primaryCoin.balance) + selectedBalance;
  }, [primaryCoin, selectedBalance]);

  const isValidMerge = useMemo(() => {
    return primaryCoinId && selectedCoinIds.size > 0;
  }, [primaryCoinId, selectedCoinIds]);

  // Handlers
  const toggleCoinSelection = (coinId: string) => {
    setSelectedCoinIds((prev) => {
      const next = new Set(prev);
      if (next.has(coinId)) {
        next.delete(coinId);
      } else {
        next.add(coinId);
      }
      return next;
    });
    setShowPreview(false);
    setDryRunResult(null);
  };

  const selectAllCoins = () => {
    setSelectedCoinIds(new Set(availableCoins.map((c) => c.coinObjectId)));
    setShowPreview(false);
    setDryRunResult(null);
  };

  const clearSelection = () => {
    setSelectedCoinIds(new Set());
    setShowPreview(false);
    setDryRunResult(null);
  };

  const handleDryRun = async () => {
    if (!coinTypeParam || !isValidMerge) return;

    setIsEstimating(true);
    setDryRunResult(null);

    try {
      const coinIdsToMerge = Array.from(selectedCoinIds);
      const response = await api.dryRunMergeCoins({
        primaryCoinId,
        coinIdsToMerge,
        coinType: coinTypeParam,
      });

      if (response.success && response.data) {
        setDryRunResult(response.data);
        setShowPreview(true);
      } else {
        showErrorToast({ message: response.error || 'Dry run failed' });
      }
    } catch (error) {
      console.error('Dry run error:', error);
      showErrorToast({ message: 'Failed to estimate merge' });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleMerge = async () => {
    if (!coinTypeParam || !isValidMerge) return;

    setIsMerging(true);
    setMergeResult(null);

    try {
      const coinIdsToMerge = Array.from(selectedCoinIds);
      const response = await api.mergeGenericCoins({
        primaryCoinId,
        coinIdsToMerge,
        coinType: coinTypeParam,
      });

      if (response.success && response.data) {
        setMergeResult(response.data);
        if (response.data.success) {
          showSuccessToast({ message: 'Coins merged successfully!' });
        } else {
          showErrorToast({ message: response.data.error || 'Merge failed' });
        }
      } else {
        showErrorToast({ message: response.error || 'Merge failed' });
      }
    } catch (error) {
      console.error('Merge error:', error);
      showErrorToast({ message: 'Failed to merge coins' });
    } finally {
      setIsMerging(false);
    }
  };

  const isAnyLoading = isLoading || isEstimating || isMerging;

  if (!coinTypeParam) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Invalid parameters. Please select a coin type first.</p>
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
            <Combine className="w-5 h-5 text-yellow-400" style={{ filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.5))' }} />
            <h1 className="text-lg font-bold text-yellow-400 font-mono">$ merge-coins</h1>
          </div>
          <span className="text-yellow-500/60 font-mono text-xs hidden sm:block ml-auto">
            {symbol}
          </span>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : coins.length < 2 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-muted-foreground">
              Need at least 2 coins to merge. You have {coins.length} {symbol} coin(s).
            </p>
            <button
              onClick={() => navigate('/app/coins')}
              className="mt-4 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors"
            >
              Back to Coins
            </button>
          </div>
        ) : (
          <>
            {/* Primary Coin Selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-lg p-4"
            >
              <div className="text-xs font-mono text-yellow-500/70 mb-2">PRIMARY_COIN (receives merged balance)</div>
              <select
                value={primaryCoinId}
                onChange={(e) => {
                  setPrimaryCoinId(e.target.value);
                  // Remove from selection if it was selected
                  setSelectedCoinIds((prev) => {
                    const next = new Set(prev);
                    next.delete(e.target.value);
                    return next;
                  });
                  setShowPreview(false);
                  setDryRunResult(null);
                }}
                className="w-full px-3 py-2 bg-black/50 border border-yellow-500/30 rounded text-yellow-400 focus:outline-none focus:border-yellow-500 font-mono text-sm"
              >
                {coins.map((coin) => (
                  <option key={coin.coinObjectId} value={coin.coinObjectId}>
                    {formatBalance(coin.balance, decimals)} {symbol} - {coin.coinObjectId.slice(0, 12)}...
                  </option>
                ))}
              </select>
              {primaryCoin && (
                <div className="mt-3 pt-3 border-t border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-lg">
                      {symbol[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-bold text-foreground">
                        {formatBalance(primaryCoin.balance, decimals)} {symbol}
                      </div>
                      <div className="text-[10px] font-mono text-yellow-500/50 truncate">
                        {primaryCoin.coinObjectId}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Coins to Merge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-yellow-500/70 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  SELECT_COINS_TO_MERGE
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllCoins}
                    className="px-2 py-1 text-[10px] bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition-colors font-mono"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-2 py-1 text-[10px] bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition-colors font-mono"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Coin List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableCoins.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No other coins available to merge
                  </div>
                ) : (
                  availableCoins.map((coin) => {
                    const isSelected = selectedCoinIds.has(coin.coinObjectId);
                    return (
                      <div
                        key={coin.coinObjectId}
                        onClick={() => toggleCoinSelection(coin.coinObjectId)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-yellow-500/20 border border-yellow-500/50'
                            : 'bg-black/30 border border-yellow-500/20 hover:border-yellow-500/40'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-yellow-500/40'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono text-foreground">
                            {formatBalance(coin.balance, decimals)} {symbol}
                          </div>
                          <div className="text-[10px] font-mono text-yellow-500/50 truncate">
                            {coin.coinObjectId}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">v{coin.version}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Summary */}
              <div className="pt-3 border-t border-yellow-500/20 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-yellow-500/70">Selected</span>
                  <span className="text-yellow-400">
                    {selectedCoinIds.size} coin{selectedCoinIds.size !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-yellow-500/70">Selected Balance</span>
                  <span className="text-yellow-400">
                    {formatBalance(selectedBalance.toString(), decimals)} {symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-mono pt-2 border-t border-yellow-500/20">
                  <span className="text-yellow-400 font-semibold">After Merge</span>
                  <span className="text-green-400 font-semibold">
                    {formatBalance(totalAfterMerge.toString(), decimals)} {symbol}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-yellow-500/70">Coins Reduced</span>
                  <span className="text-yellow-400">
                    {coins.length} → {coins.length - selectedCoinIds.size}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleDryRun}
                disabled={!isValidMerge || isAnyLoading}
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
                  onClick={handleMerge}
                  disabled={isMerging}
                  className="flex-1 px-4 py-2.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-xs font-mono shadow-lg shadow-yellow-500/20"
                >
                  {isMerging ? (
                    <>
                      <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Execute Merge
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
                      <span className="text-yellow-500/70">Status</span>
                      <span className="text-green-400">Success</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-500/70">Gas Estimate</span>
                      <span className="text-yellow-400">{dryRunResult.gasUsed || '~0.01'} SUI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-500/70">Coins Merged</span>
                      <span className="text-yellow-400">{selectedCoinIds.size} → 1</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                    <p className="text-xs text-red-400 font-mono">{dryRunResult.error}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Merge Result */}
            <AnimatePresence>
              {mergeResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-black/40 backdrop-blur-md border rounded-lg overflow-hidden ${
                    mergeResult.success ? 'border-green-500/50' : 'border-red-500/50'
                  }`}
                >
                  <div
                    className={`px-4 py-3 ${
                      mergeResult.success
                        ? 'bg-green-500/10 border-b border-green-500/30'
                        : 'bg-red-500/10 border-b border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {mergeResult.success ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <span className="text-sm font-mono font-semibold text-green-400">
                            MERGE_SUCCESS
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <span className="text-sm font-mono font-semibold text-red-400">
                            MERGE_FAILED
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {mergeResult.success && mergeResult.digest && (
                      <>
                        {/* Summary */}
                        <div className="bg-black/30 border border-yellow-500/20 rounded-lg p-3">
                          <div className="text-[10px] font-mono text-yellow-500/70 mb-2">MERGE_RESULT</div>
                          <div className="grid grid-cols-3 gap-2 items-center text-center">
                            <div>
                              <div className="text-lg font-bold text-yellow-400 font-mono">
                                {selectedCoinIds.size + 1}
                              </div>
                              <div className="text-[10px] text-yellow-500/50 font-mono">COINS</div>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-lg">→</span>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-green-400 font-mono">1</div>
                              <div className="text-[10px] text-yellow-500/50 font-mono">COIN</div>
                            </div>
                          </div>
                        </div>

                        {/* Digest */}
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono text-yellow-500/70">TX_DIGEST</div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-2 py-1.5 bg-black/50 border border-yellow-500/20 rounded text-[10px] font-mono text-yellow-300 truncate">
                              {mergeResult.digest}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(mergeResult.digest || '');
                                showSuccessToast({ message: 'Copied!' });
                              }}
                              className="p-1.5 hover:bg-yellow-500/20 rounded transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5 text-yellow-400" />
                            </button>
                          </div>
                        </div>

                        {/* Explorer Link */}
                        <a
                          href={`https://testnet.suivision.xyz/txblock/${mergeResult.digest}`}
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
                    {!mergeResult.success && mergeResult.error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                        <p className="text-xs text-red-400 font-mono">{mergeResult.error}</p>
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
