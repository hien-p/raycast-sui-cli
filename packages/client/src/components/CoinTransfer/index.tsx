import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { getApiBaseUrl } from '@/api/client';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, AlertCircle, CheckCircle, ChevronDown, Wallet } from 'lucide-react';

interface CoinMetadata {
  coinType: string;
  name: string;
  symbol: string;
  decimals: number;
  description?: string;
  iconUrl?: string;
}

export function CoinTransfer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addresses } = useAppStore();
  const activeAddress = addresses.find((a) => a.isActive);

  // URL params
  const coinIdParam = searchParams.get('coinId') || '';
  const coinTypeParam = searchParams.get('type') || '';

  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [metadata, setMetadata] = useState<CoinMetadata | null>(null);
  const [coinBalance, setCoinBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string>('');
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<{
    success: boolean;
    digest?: string;
    error?: string;
  } | null>(null);

  // Filter out current active address from recipient options
  const otherAddresses = addresses.filter((a) => !a.isActive);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWalletDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load coin metadata and balance
  useEffect(() => {
    async function loadCoinInfo() {
      if (!coinTypeParam || !coinIdParam || !activeAddress) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch metadata
        const metaRes = await fetch(
          `${getApiBaseUrl()}/coins/metadata?type=${encodeURIComponent(coinTypeParam)}`
        );
        const metaData = await metaRes.json();
        if (metaData.success && metaData.data) {
          setMetadata(metaData.data);
        } else {
          // Default metadata
          const parts = coinTypeParam.split('::');
          setMetadata({
            coinType: coinTypeParam,
            name: parts[parts.length - 1] || 'Unknown',
            symbol: parts[parts.length - 1] || '???',
            decimals: 9,
          });
        }

        // Fetch coin balance from grouped coins
        const coinsRes = await fetch(`${getApiBaseUrl()}/coins/${activeAddress.address}`);
        const coinsData = await coinsRes.json();
        if (coinsData.success && coinsData.data?.groups) {
          for (const group of coinsData.data.groups) {
            for (const coin of group.coins) {
              if (coin.coinObjectId === coinIdParam) {
                setCoinBalance(coin.balance);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load coin info:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCoinInfo();
  }, [coinIdParam, coinTypeParam, activeAddress]);

  const formatBalance = (balance: string, decimals: number): string => {
    const balanceBigInt = BigInt(balance);
    const divisor = BigInt(10 ** decimals);
    const integerPart = balanceBigInt / divisor;
    const fractionalPart = balanceBigInt % divisor;

    let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    fractionalStr = fractionalStr.replace(/0+$/, '');
    if (fractionalStr.length < 4) {
      fractionalStr = fractionalStr.padEnd(4, '0');
    }

    return `${integerPart}.${fractionalStr}`;
  };

  const parseAmount = (amountStr: string, decimals: number): string => {
    // Convert human-readable amount to base units
    const parts = amountStr.split('.');
    const intPart = parts[0] || '0';
    let fracPart = parts[1] || '';

    // Pad or truncate fractional part
    if (fracPart.length > decimals) {
      fracPart = fracPart.slice(0, decimals);
    } else {
      fracPart = fracPart.padEnd(decimals, '0');
    }

    return BigInt(intPart + fracPart).toString();
  };

  const handleEstimate = async () => {
    if (!toAddress || !amount || !metadata) {
      toast.error('Please fill all fields');
      return;
    }

    setIsEstimating(true);
    setEstimatedGas('');

    try {
      const amountInBaseUnits = parseAmount(amount, metadata.decimals);

      const response = await fetch(`${getApiBaseUrl()}/coins/transfer/dry-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coinId: coinIdParam,
          coinType: coinTypeParam,
          to: toAddress,
          amount: amountInBaseUnits,
        }),
      });

      const data = await response.json();
      if (data.success && data.data?.success) {
        const gasUsed = data.data.gasUsed || '0';
        setEstimatedGas(formatBalance(gasUsed, 9));
        toast.success('Gas estimated');
      } else {
        toast.error(data.data?.error || data.error || 'Estimation failed');
      }
    } catch (error) {
      toast.error('Failed to estimate gas');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleTransfer = async () => {
    if (!toAddress || !amount || !metadata) {
      toast.error('Please fill all fields');
      return;
    }

    setIsTransferring(true);
    setResult(null);

    try {
      const amountInBaseUnits = parseAmount(amount, metadata.decimals);

      const response = await fetch(`${getApiBaseUrl()}/coins/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coinId: coinIdParam,
          coinType: coinTypeParam,
          to: toAddress,
          amount: amountInBaseUnits,
        }),
      });

      const data = await response.json();
      if (data.success && data.data?.success) {
        setResult({
          success: true,
          digest: data.data.digest,
        });
        toast.success('Transfer successful!');
      } else {
        setResult({
          success: false,
          error: data.data?.error || data.error || 'Transfer failed',
        });
        toast.error(data.data?.error || data.error || 'Transfer failed');
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to execute transfer',
      });
      toast.error('Failed to execute transfer');
    } finally {
      setIsTransferring(false);
    }
  };

  const setMaxAmount = () => {
    if (metadata && coinBalance !== '0') {
      setAmount(formatBalance(coinBalance, metadata.decimals));
    }
  };

  if (!coinIdParam || !coinTypeParam) {
    return (
      <div className="px-3 py-8 text-center text-muted-foreground">
        <div className="text-4xl mb-2">Missing coin info</div>
        <button
          onClick={() => navigate('/app/objects')}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
        >
          Go to Objects
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-2 py-2 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">Transfer {metadata?.symbol || 'Coin'}</h1>
          <p className="text-xs text-muted-foreground">Send to any address</p>
        </div>
      </div>

      {/* Coin Info */}
      <div className="mb-4 p-4 bg-black/40 backdrop-blur-md rounded-lg border border-yellow-500/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-yellow-400 font-mono">Coin</span>
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium border border-yellow-500/30">
            {metadata?.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-yellow-400 font-mono">Balance</span>
          <span className="text-sm font-mono text-yellow-400">
            {formatBalance(coinBalance, metadata?.decimals || 9)} {metadata?.symbol}
          </span>
        </div>
        <div className="text-xs font-mono text-yellow-400/80 truncate">
          {coinIdParam}
        </div>
      </div>

      {/* Transfer Form */}
      {!result ? (
        <div className="space-y-4">
          {/* To Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-yellow-400 font-mono">Recipient Address</label>
              {otherAddresses.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                  >
                    <Wallet className="w-3 h-3" />
                    My Wallets
                    <ChevronDown className={`w-3 h-3 transition-transform ${showWalletDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showWalletDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-black/90 backdrop-blur-md border border-yellow-500/30 rounded-lg shadow-lg z-50 overflow-hidden">
                      <div className="px-3 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-xs text-yellow-400 font-mono">
                        Select from your wallets
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {otherAddresses.map((addr) => (
                          <button
                            key={addr.address}
                            type="button"
                            onClick={() => {
                              setToAddress(addr.address);
                              setShowWalletDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-yellow-500/10 transition-colors border-b border-yellow-500/10 last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">📋</span>
                              <div className="flex-1 min-w-0">
                                {addr.alias && (
                                  <div className="text-xs font-medium text-yellow-400 truncate">
                                    {addr.alias}
                                  </div>
                                )}
                                <div className="text-xs font-mono text-yellow-400/80 truncate">
                                  {addr.address.slice(0, 10)}...{addr.address.slice(-8)}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-black/50 border border-yellow-500/30 rounded-lg text-sm font-mono text-yellow-400 placeholder:text-yellow-500/40 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm text-yellow-400 font-mono mb-1">Amount</label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-3 py-2 pr-20 bg-black/50 border border-yellow-500/30 rounded-lg text-sm font-mono text-yellow-400 placeholder:text-yellow-500/40 focus:outline-none focus:border-yellow-500"
              />
              <button
                onClick={setMaxAmount}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Estimated Gas */}
          {estimatedGas && (
            <div className="p-3 bg-black/30 border border-yellow-500/20 rounded-lg text-sm">
              <span className="text-yellow-400 font-mono">Estimated Gas:</span>{' '}
              <span className="font-mono text-yellow-400">{estimatedGas} SUI</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleEstimate}
              disabled={isEstimating || !toAddress || !amount}
              className="flex-1 px-4 py-2.5 bg-black/30 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm font-mono hover:bg-yellow-500/10 hover:border-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEstimating ? 'Estimating...' : 'Estimate Gas'}
            </button>
            <button
              onClick={handleTransfer}
              disabled={isTransferring || !toAddress || !amount}
              className="flex-1 px-4 py-2.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg text-sm font-mono hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
            >
              {isTransferring ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Result */
        <div className={`p-4 rounded-lg ${result.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? 'Transfer Successful' : 'Transfer Failed'}
            </span>
          </div>

          {result.digest && (
            <div className="mb-3">
              <div className="text-xs text-yellow-400 font-mono mb-1">Transaction Digest</div>
              <div
                className="text-sm font-mono bg-black/30 border border-yellow-500/20 p-2 rounded cursor-pointer hover:bg-yellow-500/10 text-yellow-300"
                onClick={() => {
                  navigator.clipboard.writeText(result.digest!);
                  toast.success('Copied!');
                }}
              >
                {result.digest}
              </div>
            </div>
          )}

          {result.error && (
            <div className="text-sm text-red-400">{result.error}</div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setResult(null)}
              className="flex-1 px-4 py-2 bg-black/30 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm font-mono hover:bg-yellow-500/10"
            >
              Transfer Again
            </button>
            <button
              onClick={() => navigate('/app/objects')}
              className="flex-1 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg text-sm font-mono hover:bg-yellow-500/30"
            >
              Back to Objects
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
