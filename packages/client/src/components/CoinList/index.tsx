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
    <div className="px-2 py-2 font-mono">
      {/* Terminal-style header */}
      <div className="mb-3 px-3 py-2 bg-black/40 border border-white/10 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#4da2ff]">$</span>
            <span className="text-white/60">sui client coins</span>
            <span className="text-white/30">|</span>
            <span
              className="text-white/50 hover:text-white/70 cursor-pointer transition-colors"
              onClick={() => copyToClipboard(activeAddress.address, 'Address')}
            >
              {activeAddress.alias || `${activeAddress.address.slice(0, 12)}...`}
            </span>
          </div>
          <span className="text-white/40">
            {coinData.totalCoinTypes} type{coinData.totalCoinTypes !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Coin Groups - Terminal style */}
      <div className="space-y-1">
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

      {/* Terminal-style footer */}
      <div className="mt-3 px-3 py-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/30">
        <span>{coinData.totalCoins} coin objects</span>
        <span># click to expand</span>
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
  // Truncate package ID for display
  const truncatedPackageId = group.packageId
    ? group.packageId.length > 16
      ? `${group.packageId.slice(0, 8)}...${group.packageId.slice(-4)}`
      : group.packageId
    : '';

  return (
    <div className="border border-white/10 rounded overflow-hidden">
      {/* Group Header - Terminal style */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2 transition-all duration-150 ${
          isExpanded
            ? 'bg-white/5 border-l-2 border-l-[#4da2ff]'
            : 'bg-black/30 border-l-2 border-l-transparent hover:bg-white/[0.02] hover:border-l-white/20'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Expand indicator */}
          <span className={`text-xs transition-opacity ${isExpanded ? 'text-[#4da2ff]' : 'text-white/30'}`}>
            {isExpanded ? '▼' : '▶'}
          </span>

          {/* Icon */}
          {group.iconUrl ? (
            <img
              src={group.iconUrl}
              alt={group.symbol}
              className="w-5 h-5 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-sm w-5 text-center">
              {group.coinType.includes('sui::SUI') ? '💧' : '🪙'}
            </span>
          )}

          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isExpanded ? 'text-white' : 'text-white/70'}`}>
                {group.symbol}
              </span>
              {group.isVerified && (
                <span className="text-[10px] text-green-400">✓</span>
              )}
              <span className="text-[10px] text-white/30">
                ({group.coinCount})
              </span>
            </div>
            <div className={`text-xs ${isExpanded ? 'text-[#4da2ff]' : 'text-white/50'}`}>
              {group.formattedBalance} <span className="text-white/30">{group.symbol}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Merge button */}
          {group.coinCount > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMerge();
              }}
              className="px-2 py-0.5 text-[10px] text-orange-400/70 hover:text-orange-400 hover:bg-orange-500/20 rounded transition-colors"
            >
              [merge]
            </button>
          )}

          {/* Package info */}
          {group.packageId && (
            <span
              className="text-[10px] text-white/20 hover:text-white/40 cursor-pointer hidden sm:block"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(group.packageId, 'Package ID');
              }}
            >
              {truncatedPackageId}
            </span>
          )}
        </div>
      </button>

      {/* Expanded Coin List - Terminal style */}
      {isExpanded && (
        <div className="bg-black/20">
          {group.description && (
            <div className="px-4 py-1.5 text-[10px] text-white/30 border-b border-white/5">
              // {group.description}
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
    <div className="flex items-center gap-2 px-4 py-2 hover:bg-white/[0.02] transition-colors group border-l-2 border-l-transparent hover:border-l-white/10">
      {/* Indent marker */}
      <span className="text-white/10 text-xs">├─</span>

      <div className="flex-1 min-w-0">
        <div
          className="text-[10px] text-white/40 truncate cursor-pointer hover:text-white/60"
          onClick={() => onCopy(coin.coinObjectId, 'Coin ID')}
        >
          {coin.coinObjectId}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70">
            {formattedBalance} <span className="text-white/30">{symbol}</span>
          </span>
          <span className="text-[10px] text-white/20">v{coin.version}</span>
        </div>
      </div>

      {/* Actions - show on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onTransfer}
          className="px-1.5 py-0.5 text-[10px] text-white/40 hover:text-white/70 hover:bg-white/10 rounded transition-colors"
        >
          [send]
        </button>
        <button
          onClick={onSplit}
          className="px-1.5 py-0.5 text-[10px] text-white/40 hover:text-white/70 hover:bg-white/10 rounded transition-colors"
        >
          [split]
        </button>
      </div>
    </div>
  );
}
