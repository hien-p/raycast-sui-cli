import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';
import * as api from '@/api/client';
import type { CoinGroupedResponse, CoinGroup, CoinInfo } from '@sui-cli-web/shared';

// Format balance with proper decimals
function formatBalance(balance: string, decimals: number): string {
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
}

// Get coin type color
function getCoinColor(coinType: string): string {
  if (coinType.includes('sui::SUI')) {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
  if (coinType.toLowerCase().includes('usdc')) {
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
  if (coinType.toLowerCase().includes('usdt')) {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  }
  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
}

export function CoinList() {
  const navigate = useNavigate();
  const { addresses, isLoading: storeLoading, searchQuery } = useAppStore();
  const [coinData, setCoinData] = useState<CoinGroupedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const activeAddress = addresses.find((a) => a.isActive);

  useEffect(() => {
    async function loadCoins() {
      if (!activeAddress?.address) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getCoinsGrouped(activeAddress.address);
        if (response.success && response.data) {
          setCoinData(response.data);
          // Auto-expand first group (usually SUI)
          if (response.data.groups.length > 0) {
            setExpandedGroups(new Set([response.data.groups[0].coinType]));
          }
        } else {
          setError(response.error || 'Failed to load coins');
        }
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    }

    loadCoins();
  }, [activeAddress?.address]);

  const toggleGroup = (coinType: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(coinType)) {
        next.delete(coinType);
      } else {
        next.add(coinType);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    if (!coinData?.groups) return [];
    if (!searchQuery) return coinData.groups;

    const query = searchQuery.toLowerCase();
    return coinData.groups.filter(
      (g) =>
        g.symbol.toLowerCase().includes(query) ||
        g.name.toLowerCase().includes(query) ||
        g.coinType.toLowerCase().includes(query)
    );
  }, [coinData?.groups, searchQuery]);

  // Actions handlers
  const handleTransfer = (coin: CoinInfo) => {
    navigate(`/app/transfer?coinId=${coin.coinObjectId}&type=${encodeURIComponent(coin.coinType)}`);
  };

  const handleSplit = (coin: CoinInfo) => {
    navigate(`/app/coins/split?coinId=${coin.coinObjectId}&type=${encodeURIComponent(coin.coinType)}`);
  };

  const handleMerge = (group: CoinGroup) => {
    if (group.coins.length < 2) {
      toast.error('Need at least 2 coins to merge');
      return;
    }
    navigate(`/app/coins/merge?type=${encodeURIComponent(group.coinType)}`);
  };

  if (!activeAddress) {
    return (
      <div className="px-3 py-8 text-center text-muted-foreground">
        No address selected
      </div>
    );
  }

  if (isLoading || storeLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-8 text-center">
        <div className="text-4xl mb-2">Error</div>
        <div className="text-muted-foreground">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!coinData || filteredGroups.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-muted-foreground">
        <div className="text-4xl mb-2">No coins found</div>
        <p className="text-sm">This address doesn't have any coins yet.</p>
        <button
          onClick={() => navigate('/app/faucet')}
          className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
        >
          Request from Faucet
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 py-2">
      {/* Header */}
      <div className="mb-3 px-3 py-2 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Coins owned by</div>
            <div
              className="text-sm font-mono text-foreground truncate cursor-pointer hover:text-primary"
              onClick={() => copyToClipboard(activeAddress.address, 'Address')}
            >
              {activeAddress.alias || `${activeAddress.address.slice(0, 16)}...`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total Types</div>
            <div className="text-sm font-medium text-foreground">{coinData.totalCoinTypes}</div>
          </div>
        </div>
      </div>

      {/* Coin Groups */}
      <div className="space-y-2">
        {filteredGroups.map((group) => (
          <CoinGroupCard
            key={group.coinType}
            group={group}
            isExpanded={expandedGroups.has(group.coinType)}
            onToggle={() => toggleGroup(group.coinType)}
            onTransfer={handleTransfer}
            onSplit={handleSplit}
            onMerge={() => handleMerge(group)}
            onCopy={copyToClipboard}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 px-3 py-2 bg-muted/20 rounded-lg flex items-center justify-between text-xs text-muted-foreground">
        <span>{coinData.totalCoins} total coin objects</span>
        <span>Click group to expand</span>
      </div>
    </div>
  );
}

// CoinGroup Card Component
interface CoinGroupCardProps {
  group: CoinGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onTransfer: (coin: CoinInfo) => void;
  onSplit: (coin: CoinInfo) => void;
  onMerge: () => void;
  onCopy: (text: string, label: string) => void;
}

function CoinGroupCard({
  group,
  isExpanded,
  onToggle,
  onTransfer,
  onSplit,
  onMerge,
  onCopy,
}: CoinGroupCardProps) {
  const colorClass = getCoinColor(group.coinType);

  // Truncate package ID for display
  const truncatedPackageId = group.packageId
    ? group.packageId.length > 16
      ? `${group.packageId.slice(0, 8)}...${group.packageId.slice(-4)}`
      : group.packageId
    : '';

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Icon - use iconUrl if available */}
          {group.iconUrl ? (
            <img
              src={group.iconUrl}
              alt={group.symbol}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-2xl w-8 h-8 flex items-center justify-center">
              {group.coinType.includes('sui::SUI') ? 'S' : group.symbol[0]}
            </span>
          )}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
                {group.symbol}
              </span>
              {/* Verified badge */}
              {group.isVerified && (
                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-medium">
                  ✓ Verified
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                ({group.coinCount} coin{group.coinCount > 1 ? 's' : ''})
              </span>
            </div>
            <div className="text-lg font-medium text-foreground">
              {group.formattedBalance} {group.symbol}
            </div>
            {/* Package info */}
            {group.packageId && (
              <div
                className="text-[10px] font-mono text-muted-foreground/70 flex items-center gap-1 cursor-pointer hover:text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(group.packageId, 'Package ID');
                }}
                title={`Package: ${group.packageId}`}
              >
                <span>📦</span>
                <span>{truncatedPackageId}</span>
                {group.moduleName && <span className="text-muted-foreground/50">::{group.moduleName}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Merge button (only if > 1 coin) */}
          {group.coinCount > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMerge();
              }}
              className="px-3 py-1.5 text-xs bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
            >
              Merge All
            </button>
          )}

          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Coin List */}
      {isExpanded && (
        <div className="divide-y divide-border/30">
          {/* Description (if available) */}
          {group.description && (
            <div className="px-4 py-2 bg-muted/10 text-xs text-muted-foreground italic">
              {group.description}
            </div>
          )}
          {group.coins.map((coin) => (
            <CoinItem
              key={coin.coinObjectId}
              coin={coin}
              symbol={group.symbol}
              decimals={group.decimals}
              onTransfer={() => onTransfer(coin)}
              onSplit={() => onSplit(coin)}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual Coin Item Component
interface CoinItemProps {
  coin: CoinInfo;
  symbol: string;
  decimals: number;
  onTransfer: () => void;
  onSplit: () => void;
  onCopy: (text: string, label: string) => void;
}

function CoinItem({ coin, symbol, decimals, onTransfer, onSplit, onCopy }: CoinItemProps) {
  const formattedBalance = formatBalance(coin.balance, decimals);

  return (
    <div className="px-4 py-3 hover:bg-muted/20 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-mono text-foreground truncate cursor-pointer hover:text-primary"
            onClick={() => onCopy(coin.coinObjectId, 'Coin ID')}
            title="Click to copy"
          >
            {coin.coinObjectId.slice(0, 16)}...{coin.coinObjectId.slice(-8)}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-medium text-foreground">
              {formattedBalance} {symbol}
            </span>
            <span className="text-xs text-muted-foreground">v{coin.version}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTransfer}
            className="px-2.5 py-1.5 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
            title="Transfer"
          >
            Send
          </button>
          <button
            onClick={onSplit}
            className="px-2.5 py-1.5 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
            title="Split"
          >
            Split
          </button>
        </div>
      </div>
    </div>
  );
}
