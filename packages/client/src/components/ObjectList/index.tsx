import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import { ObjectDetail } from './ObjectDetail';
import toast from 'react-hot-toast';

type ObjectCategory = 'all' | 'coin' | 'nft' | 'cap' | 'other';

interface CategoryConfig {
  id: ObjectCategory;
  label: string;
  icon: string;
  match: (type: string) => boolean;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'all', label: 'All', icon: '📋', match: () => true },
  { id: 'coin', label: 'Coins', icon: '🪙', match: (t) => t.toLowerCase().includes('coin') },
  { id: 'nft', label: 'NFTs', icon: '🖼️', match: (t) => t.toLowerCase().includes('nft') || t.toLowerCase().includes('display') },
  { id: 'cap', label: 'Capabilities', icon: '🔑', match: (t) => t.toLowerCase().includes('cap') },
  { id: 'other', label: 'Other', icon: '📄', match: () => true },
];

export function ObjectList() {
  const {
    objects,
    addresses,
    isLoading,
    searchQuery,
    fetchObjects,
  } = useAppStore();

  const [searchParams] = useSearchParams();
  const [selectedObject, setSelectedObject] = useState<Record<string, unknown> | null>(null);
  const [activeCategory, setActiveCategory] = useState<ObjectCategory>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  // Group objects by type
  const { filteredObjects, categoryCounts } = useMemo(() => {
    const counts: Record<ObjectCategory, number> = {
      all: 0,
      coin: 0,
      nft: 0,
      cap: 0,
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
      } else if (lower.includes('cap')) {
        counts.cap++;
      } else {
        counts.other++;
      }

      // Category filter
      if (activeCategory === 'all') return true;
      if (activeCategory === 'coin') return lower.includes('coin');
      if (activeCategory === 'nft') return lower.includes('nft') || lower.includes('display');
      if (activeCategory === 'cap') return lower.includes('cap');
      if (activeCategory === 'other') {
        return !lower.includes('coin') && !lower.includes('nft') && !lower.includes('display') && !lower.includes('cap');
      }
      return true;
    });

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
    return 'bg-muted text-muted-foreground border-border';
  };

  // Show object detail view
  if (selectedObject) {
    return (
      <ObjectDetail
        object={selectedObject}
        onBack={() => setSelectedObject(null)}
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

      {filteredObjects.length === 0 ? (
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
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 gap-2 px-1">
          {filteredObjects.map((obj, index) => {
            const objectId = obj.data?.objectId || obj.objectId || `obj-${index}`;
            const type = obj.data?.type || obj.type || '';
            const version = obj.data?.version || obj.version || '';

            return (
              <div
                key={objectId}
                className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-border transition-all cursor-pointer group"
                onClick={() => setSelectedObject(obj)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{getTypeIcon(type)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeColor(type)}`}>
                    {getTypeDisplay(type)}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono truncate mb-1">
                  {objectId.slice(0, 10)}...{objectId.slice(-6)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {getModuleName(type)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">v{version}</span>
                </div>
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
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeColor(type)}`}>
                      {getTypeDisplay(type)}
                    </span>
                    {getModuleName(type) && (
                      <span className="text-[10px] text-muted-foreground">
                        {getModuleName(type)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                    {objectId}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">version</div>
                    <div className="text-xs font-mono text-foreground">{version}</div>
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
