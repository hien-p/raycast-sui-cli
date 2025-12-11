import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import { ObjectDetail } from './ObjectDetail';
import toast from 'react-hot-toast';
import { extractCoinType } from '@sui-cli-web/shared';
import { getObject } from '@/api/client';

type ObjectCategory = 'all' | 'coin' | 'nft' | 'cap' | 'game' | 'other';

// Known/priority coins for sorting (lower = higher priority)
const COIN_PRIORITY: Record<string, number> = {
  '0x2::sui::SUI': 1,
  '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL': 2, // WAL mainnet
  '0x9f992cc2430a1f442ca7a5ca7638169f5d5c00e0ebc3977a65e9ac6e497fe5ef::wal::WAL': 2, // WAL testnet
  '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN': 3, // USDC
  '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN': 4, // USDT
};

const VERIFIED_COINS = new Set(Object.keys(COIN_PRIORITY));

interface CategoryConfig {
  id: ObjectCategory;
  label: string;
  icon: string;
  match: (type: string) => boolean;
}

// Game demo package ID for filtering
const GAME_PACKAGE_ID = '0xd5a27c2bc7870cde3e3104bf9946ad93eccec5b3ab517b29c7d3bc732003f4b5';

const CATEGORIES: CategoryConfig[] = [
  { id: 'all', label: 'All', icon: '📋', match: () => true },
  { id: 'coin', label: 'Coins', icon: '🪙', match: (t) => t.toLowerCase().includes('coin') },
  { id: 'nft', label: 'NFTs', icon: '🖼️', match: (t) => t.toLowerCase().includes('nft') || t.toLowerCase().includes('display') },
  { id: 'game', label: 'Game Demo', icon: '🎮', match: (t) => t.includes(GAME_PACKAGE_ID) || t.toLowerCase().includes('character') || t.toLowerCase().includes('::item::item') },
  { id: 'cap', label: 'Capabilities', icon: '🔑', match: (t) => t.toLowerCase().includes('cap') },
  { id: 'other', label: 'Other', icon: '📄', match: () => true },
];

// Helper to get coin balance from object
function getCoinBalance(obj: Record<string, unknown>): string | null {
  const content = obj.data?.content || obj.content;
  if (content?.dataType === 'moveObject' && content?.fields) {
    return content.fields.balance as string || null;
  }
  return null;
}

// Helper to format balance with decimals
function formatCoinBalance(balance: string, decimals: number = 9): string {
  const balanceBigInt = BigInt(balance);
  const divisor = BigInt(10 ** decimals);
  const integerPart = balanceBigInt / divisor;
  const fractionalPart = balanceBigInt % divisor;

  let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  fractionalStr = fractionalStr.replace(/0+$/, '');
  if (fractionalStr.length < 2) {
    fractionalStr = fractionalStr.padEnd(2, '0');
  } else if (fractionalStr.length > 4) {
    fractionalStr = fractionalStr.slice(0, 4);
  }

  return `${integerPart}.${fractionalStr}`;
}

// Get coin symbol from type
function getCoinSymbol(coinType: string): string {
  const parts = coinType.split('::');
  const typeName = parts[parts.length - 1] || '';

  // Known mappings
  if (coinType.includes('sui::SUI')) return 'SUI';
  if (coinType.includes('wal::WAL')) return 'WAL';
  if (coinType === '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN') return 'USDC';
  if (coinType === '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN') return 'USDT';

  return typeName;
}

// Get package ID from type
function getPackageId(type: string): string {
  const parts = type.split('::');
  return parts[0] || '';
}

export function ObjectList() {
  const {
    objects,
    addresses,
    isLoading,
    searchQuery,
    fetchObjects,
  } = useAppStore();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { objectId: urlObjectId } = useParams<{ objectId: string }>();
  const [selectedObject, setSelectedObject] = useState<Record<string, unknown> | null>(null);
  const [activeCategory, setActiveCategory] = useState<ObjectCategory>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [directLookupObject, setDirectLookupObject] = useState<Record<string, unknown> | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [fetchedUrlObjectId, setFetchedUrlObjectId] = useState<string | null>(null);

  // Support viewing objects for any address via query param (e.g., multi-sig addresses)
  const queryAddress = searchParams.get('address');
  const activeAddress = addresses.find((a) => a.isActive);

  // Use query address if provided, otherwise use active address
  const targetAddress = queryAddress || activeAddress?.address;
  const displayLabel = queryAddress
    ? `${queryAddress.slice(0, 10)}...${queryAddress.slice(-6)}`
    : (activeAddress?.alias || `${activeAddress?.address.slice(0, 16)}...`);
  const isExternalAddress = !!queryAddress && queryAddress !== activeAddress?.address;

  useEffect(() => {
    if (targetAddress) {
      fetchObjects(targetAddress);
    }
  }, [targetAddress, fetchObjects]);

  // Auto-fetch object when navigated via URL param (e.g., from DynamicFieldExplorer)
  useEffect(() => {
    // Only fetch if we have a new URL objectId that we haven't fetched yet
    if (urlObjectId && urlObjectId !== fetchedUrlObjectId) {
      const fetchObjectFromUrl = async () => {
        setIsLookingUp(true);
        try {
          // getObject returns the object data directly (fetchApi unwraps the response)
          const objectData = await getObject(urlObjectId);
          if (objectData) {
            setSelectedObject(objectData);
            setFetchedUrlObjectId(urlObjectId);
          } else {
            toast.error('Object not found');
            navigate('/app/objects');
          }
        } catch {
          toast.error('Failed to fetch object');
          navigate('/app/objects');
        } finally {
          setIsLookingUp(false);
        }
      };
      fetchObjectFromUrl();
    } else if (!urlObjectId && fetchedUrlObjectId) {
      // Clear when navigating away from object detail URL
      setSelectedObject(null);
      setFetchedUrlObjectId(null);
    }
  }, [urlObjectId, fetchedUrlObjectId, navigate]);

  // Check if search query is a full Object ID (0x + 64 hex chars = 66 total)
  const isFullObjectId = useCallback((query: string) => {
    return query && query.startsWith('0x') && query.length === 66 && /^0x[a-fA-F0-9]{64}$/.test(query);
  }, []);

  // Direct object lookup when user searches for a full Object ID
  useEffect(() => {
    const lookupObject = async () => {
      if (!searchQuery || !isFullObjectId(searchQuery)) {
        setDirectLookupObject(null);
        return;
      }

      setIsLookingUp(true);
      try {
        // getObject returns the object data directly (fetchApi unwraps the response)
        const objectData = await getObject(searchQuery);
        if (objectData) {
          setDirectLookupObject(objectData);
        } else {
          setDirectLookupObject(null);
        }
      } catch {
        setDirectLookupObject(null);
      } finally {
        setIsLookingUp(false);
      }
    };

    // Debounce the lookup
    const timer = setTimeout(lookupObject, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isFullObjectId]);

  // Helper to check if type is a game object
  const isGameObject = (type: string) => {
    return type.includes(GAME_PACKAGE_ID) ||
           type.toLowerCase().includes('character') ||
           type.toLowerCase().includes('::item::item');
  };

  // Group objects by type
  const { filteredObjects, categoryCounts } = useMemo(() => {
    const counts: Record<ObjectCategory, number> = {
      all: 0,
      coin: 0,
      nft: 0,
      cap: 0,
      game: 0,
      other: 0,
    };

    const filtered = objects.filter((obj) => {
      const objectId = obj.data?.objectId || obj.objectId || '';
      const type = obj.data?.type || obj.type || '';

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!objectId.toLowerCase().includes(query) && !type.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Count by category
      counts.all++;
      const lower = type.toLowerCase();
      if (lower.includes('coin')) {
        counts.coin++;
      } else if (lower.includes('nft') || lower.includes('display')) {
        counts.nft++;
      } else if (isGameObject(type)) {
        counts.game++;
      } else if (lower.includes('cap')) {
        counts.cap++;
      } else {
        counts.other++;
      }

      // Category filter
      if (activeCategory === 'all') return true;
      if (activeCategory === 'coin') return lower.includes('coin');
      if (activeCategory === 'nft') return lower.includes('nft') || lower.includes('display');
      if (activeCategory === 'game') return isGameObject(type);
      if (activeCategory === 'cap') return lower.includes('cap');
      if (activeCategory === 'other') {
        return !lower.includes('coin') && !lower.includes('nft') && !lower.includes('display') && !isGameObject(type) && !lower.includes('cap');
      }
      return true;
    });

    // Sort coins by priority when in coin category
    if (activeCategory === 'coin') {
      filtered.sort((a, b) => {
        const typeA = a.data?.type || a.type || '';
        const typeB = b.data?.type || b.type || '';

        const coinTypeA = extractCoinType(typeA) || '';
        const coinTypeB = extractCoinType(typeB) || '';

        const priorityA = COIN_PRIORITY[coinTypeA] ?? 999;
        const priorityB = COIN_PRIORITY[coinTypeB] ?? 999;

        // Both have priority - sort by priority
        if (priorityA !== 999 && priorityB !== 999) {
          return priorityA - priorityB;
        }
        // Only A has priority
        if (priorityA !== 999) return -1;
        // Only B has priority
        if (priorityB !== 999) return 1;

        // Neither has priority - sort by balance descending
        const balanceA = getCoinBalance(a);
        const balanceB = getCoinBalance(b);
        if (balanceA && balanceB) {
          return BigInt(balanceB) > BigInt(balanceA) ? 1 : -1;
        }

        return 0;
      });
    }

    return { filteredObjects: filtered, categoryCounts: counts };
  }, [objects, searchQuery, activeCategory]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const getTypeDisplay = (type: string) => {
    if (!type) return 'Unknown';
    const parts = type.split('::');
    return parts[parts.length - 1] || type;
  };

  const getModuleName = (type: string) => {
    if (!type) return '';
    const parts = type.split('::');
    return parts.length >= 2 ? parts[1] : '';
  };

  const getTypeIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('coin')) return '🪙';
    if (lower.includes('nft')) return '🖼️';
    if (lower.includes('package')) return '📦';
    if (lower.includes('upgradecap')) return '⬆️';
    if (lower.includes('admincap')) return '👑';
    if (lower.includes('cap')) return '🔑';
    if (lower.includes('test')) return '🧪';
    // Game objects
    if (lower.includes('character')) return '🧙';
    if (lower.includes('::item::item')) return '⚔️';
    if (type.includes(GAME_PACKAGE_ID)) return '🎮';
    return '📄';
  };

  const getTypeColor = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('coin')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (lower.includes('nft')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (lower.includes('upgradecap')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (lower.includes('admincap')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (lower.includes('cap')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (lower.includes('test')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    // Game objects - cyan/teal color
    if (lower.includes('character')) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (lower.includes('::item::item')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (type.includes(GAME_PACKAGE_ID)) return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  // Handle closing object detail view
  const handleCloseDetail = () => {
    setSelectedObject(null);
    setFetchedUrlObjectId(null);
    // If we came from URL, navigate back to objects list
    if (urlObjectId) {
      navigate('/app/objects');
    }
  };

  // Show loading state when fetching object from URL
  if (urlObjectId && !selectedObject) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Spinner />
        <span className="text-sm text-muted-foreground font-mono">Loading object...</span>
      </div>
    );
  }

  // Show object detail view
  if (selectedObject) {
    return (
      <ObjectDetail
        object={selectedObject}
        onBack={handleCloseDetail}
        onCopy={copyToClipboard}
      />
    );
  }

  if (!targetAddress) {
    return (
      <div className="px-3 py-8 text-center text-muted-foreground">
        No address selected
      </div>
    );
  }

  if (isLoading && objects.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-2 py-2">
      {/* Header with address */}
      <div className="mb-3 px-3 py-2 bg-muted/30 rounded-lg flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            Objects owned by
            {isExternalAddress && (
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded">
                External Address
              </span>
            )}
          </div>
          <div
            className="text-sm font-mono text-foreground truncate cursor-pointer hover:text-accent transition-colors"
            onClick={() => { navigator.clipboard.writeText(targetAddress); toast.success('Address copied'); }}
            title="Click to copy"
          >
            {displayLabel}
          </div>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="List view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Grid view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 px-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id];
          if (cat.id !== 'all' && count === 0) return null;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeCategory === cat.id
                  ? 'bg-white/20'
                  : 'bg-black/20'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Direct Object Lookup Result - when user searches for a full Object ID */}
      {isFullObjectId(searchQuery) && (
        <div className="mb-3 px-2">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Direct Object Lookup
          </div>
          {isLookingUp ? (
            <div className="flex items-center gap-2 px-3 py-4 bg-muted/30 rounded-lg">
              <Spinner />
              <span className="text-sm text-muted-foreground">Looking up object...</span>
            </div>
          ) : directLookupObject ? (
            <div
              className="flex items-center gap-3 px-3 py-3 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors cursor-pointer"
              onClick={() => setSelectedObject(directLookupObject)}
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-lg">
                {getTypeIcon((directLookupObject as any).data?.type || (directLookupObject as any).type || '')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-400">Found Object</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeColor((directLookupObject as any).data?.type || (directLookupObject as any).type || '')}`}>
                    {getTypeDisplay((directLookupObject as any).data?.type || (directLookupObject as any).type || '')}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono truncate mt-1">
                  {searchQuery}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  v{(directLookupObject as any).data?.version || (directLookupObject as any).version || '?'}
                </span>
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-red-400">❌</span>
              <span className="text-sm text-red-400">Object not found or deleted</span>
            </div>
          )}
        </div>
      )}

      {filteredObjects.length === 0 && !isFullObjectId(searchQuery) ? (
        <div className="px-3 py-8 text-center text-muted-foreground">
          <div className="text-4xl mb-2">{objects.length === 0 ? '📭' : '🔍'}</div>
          <div className="mb-2">{objects.length === 0 ? 'This address has no objects yet' : 'No objects match your filter'}</div>

          {objects.length === 0 && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg text-left max-w-sm mx-auto">
              <p className="text-xs text-muted-foreground mb-3">
                {isExternalAddress
                  ? 'This might be a new multi-sig address. To start using it:'
                  : 'To add objects to this address:'}
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Get test SUI from faucet</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Transfer assets to this address</span>
                </div>
              </div>
              <a
                href={`/app/faucet?address=${targetAddress}`}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs transition-colors"
              >
                💧 Request from Faucet
              </a>
            </div>
          )}

          {activeCategory !== 'all' && objects.length > 0 && (
            <button
              onClick={() => setActiveCategory('all')}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Show all objects
            </button>
          )}
        </div>
      ) : filteredObjects.length === 0 && isFullObjectId(searchQuery) ? (
        /* Only direct lookup result shown - no grid/list needed */
        null
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 gap-2 px-1">
          {filteredObjects.map((obj, index) => {
            const objectId = obj.data?.objectId || obj.objectId || `obj-${index}`;
            const type = obj.data?.type || obj.type || '';
            const version = obj.data?.version || obj.version || '';

            // Check if this is a coin object
            const isCoin = type.toLowerCase().includes('coin');
            const coinType = isCoin ? extractCoinType(type) : null;
            const coinBalance = isCoin ? getCoinBalance(obj) : null;
            const coinSymbol = coinType ? getCoinSymbol(coinType) : '';
            const isVerified = coinType ? VERIFIED_COINS.has(coinType) : false;
            const packageId = getPackageId(coinType || type);

            return (
              <div
                key={objectId}
                className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-border transition-all cursor-pointer group"
                onClick={() => setSelectedObject(obj)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{getTypeIcon(type)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeColor(type)}`}>
                    {isCoin && coinSymbol ? coinSymbol : getTypeDisplay(type)}
                  </span>
                  {isCoin && isVerified && (
                    <span className="px-1 py-0.5 bg-green-500/20 text-green-400 rounded text-[8px]">✓</span>
                  )}
                </div>
                {/* Coin balance */}
                {isCoin && coinBalance && (
                  <div className="text-sm font-medium text-foreground mb-1">
                    {formatCoinBalance(coinBalance)} {coinSymbol}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground font-mono truncate mb-1">
                  {objectId.slice(0, 10)}...{objectId.slice(-6)}
                </div>
                <div className="flex items-center justify-between">
                  {isCoin && packageId ? (
                    <span
                      className="text-[9px] font-mono text-muted-foreground/60 truncate"
                      title={packageId}
                    >
                      📦 {packageId.slice(0, 6)}...
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      {getModuleName(type)}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">v{version}</span>
                </div>
                {/* Action buttons for coins */}
                {isCoin && coinType && (
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/coins/transfer?coinId=${objectId}&type=${encodeURIComponent(coinType)}`);
                      }}
                      className="flex-1 px-2 py-1 text-[9px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                    >
                      Send
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/coins/split?coinId=${objectId}&type=${encodeURIComponent(coinType)}`);
                      }}
                      className="flex-1 px-2 py-1 text-[9px] bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                    >
                      Split
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-1">
          {filteredObjects.map((obj, index) => {
            const objectId = obj.data?.objectId || obj.objectId || `obj-${index}`;
            const type = obj.data?.type || obj.type || '';
            const version = obj.data?.version || obj.version || '';

            // Check if this is a coin object
            const isCoin = type.toLowerCase().includes('coin');
            const coinType = isCoin ? extractCoinType(type) : null;
            const coinBalance = isCoin ? getCoinBalance(obj) : null;
            const coinSymbol = coinType ? getCoinSymbol(coinType) : '';
            const isVerified = coinType ? VERIFIED_COINS.has(coinType) : false;
            const packageId = getPackageId(coinType || type);

            return (
              <div
                key={objectId}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group border border-transparent hover:border-border/50"
                onClick={() => setSelectedObject(obj)}
              >
                <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                  {getTypeIcon(type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isCoin && coinSymbol ? (
                      <>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeColor(type)}`}>
                          {coinSymbol}
                        </span>
                        {isVerified && (
                          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px] font-medium">
                            ✓
                          </span>
                        )}
                      </>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeColor(type)}`}>
                        {getTypeDisplay(type)}
                      </span>
                    )}
                    {/* Package ID for coins */}
                    {isCoin && packageId && (
                      <span
                        className="text-[9px] font-mono text-muted-foreground/60 cursor-pointer hover:text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(packageId, 'Package ID');
                        }}
                        title={`Package: ${packageId}`}
                      >
                        📦 {packageId.length > 12 ? `${packageId.slice(0, 6)}...${packageId.slice(-4)}` : packageId}
                      </span>
                    )}
                    {!isCoin && getModuleName(type) && (
                      <span className="text-[10px] text-muted-foreground">
                        {getModuleName(type)}
                      </span>
                    )}
                  </div>
                  {/* Coin balance display */}
                  {isCoin && coinBalance ? (
                    <div className="text-sm font-medium text-foreground mt-0.5">
                      {formatCoinBalance(coinBalance)} {coinSymbol}
                    </div>
                  ) : null}
                  <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                    {objectId.slice(0, 16)}...{objectId.slice(-8)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Transfer/Split buttons for coins */}
                  {isCoin && coinType && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/coins/transfer?coinId=${objectId}&type=${encodeURIComponent(coinType)}`);
                        }}
                        className="px-2 py-1 text-[10px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                        title="Transfer"
                      >
                        Send
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/coins/split?coinId=${objectId}&type=${encodeURIComponent(coinType)}`);
                        }}
                        className="px-2 py-1 text-[10px] bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                        title="Split"
                      >
                        Split
                      </button>
                    </>
                  )}
                  <div className="text-right min-w-[40px]">
                    <div className="text-[9px] text-muted-foreground">v{version}</div>
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer stats */}
      <div className="mt-3 px-3 py-2 bg-muted/20 rounded-lg flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filteredObjects.length} of {objects.length} object{objects.length !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Click to view details
        </span>
      </div>
    </div>
  );
}
