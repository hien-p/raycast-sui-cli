import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';
import { addressMetadata, AddressMetadata } from '@/utils/addressMetadata';
import { useSmartPolling } from '@/utils/useSmartPolling';
import { detectNetwork, buildExplorerUrl, getDefaultExplorer, type NetworkType } from '@/lib/explorer';
import { Tooltip } from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { SuiAddress } from '@/types';

// Format balance with thousand separators
function formatBalance(balance: string | undefined): string {
  if (!balance) return '0';
  const num = parseFloat(balance);
  if (isNaN(num)) return '0';
  // Show 4 decimals for small numbers, 2 for larger
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Tier badge colors based on tier level
const TIER_STYLES: Record<number, { bg: string; text: string; glow?: string }> = {
  0: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  1: { bg: 'bg-teal-500/20', text: 'text-teal-400', glow: 'shadow-[0_0_8px_rgba(0,212,170,0.3)]' },
  2: { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'shadow-[0_0_10px_rgba(123,97,255,0.4)]' },
  3: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-[0_0_12px_rgba(255,215,0,0.5)]' },
};

// Memoized AddressCard component for optimal performance
interface AddressCardProps {
  addr: SuiAddress;
  tierStyle: typeof TIER_STYLES[number] | null;
  addrMetadata?: AddressMetadata;
  isEditing: boolean;
  editingField: 'label' | 'notes' | null;
  editValue: string;
  editInputRef: React.RefObject<HTMLInputElement>;
  currentNetwork: NetworkType;
  onSwitch: (address: string) => void;
  onDelete: (address: string, alias?: string) => void;
  onCopy: (address: string) => void;
  onViewObjects: (address: string) => void;
  onOpenExplorer: (address: string) => void;
  onContextMenu: (e: React.MouseEvent, address: string) => void;
  startEdit: (address: string, field: 'label' | 'notes', value: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  setEditValue: (value: string) => void;
}

const AddressCard = memo(({
  addr,
  tierStyle,
  addrMetadata,
  isEditing,
  editingField,
  editValue,
  editInputRef,
  currentNetwork,
  onSwitch,
  onDelete,
  onCopy,
  onViewObjects,
  onOpenExplorer,
  onContextMenu,
  startEdit,
  saveEdit,
  cancelEdit,
  setEditValue,
}: AddressCardProps) => {
  return (
    <div
      className={clsx(
        'transition-all duration-150 relative group',
        addr.isActive
          ? 'bg-white/5 border-l-2 border-l-[#4da2ff]'
          : 'border-l-2 border-l-transparent hover:bg-white/[0.02] hover:border-l-white/20'
      )}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, addr.address);
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
        onClick={() => !addr.isActive && !isEditing && onSwitch(addr.address)}
      >
        {/* Terminal selection indicator */}
        <span className={clsx(
          'text-xs font-bold w-3 flex-shrink-0 transition-opacity',
          addr.isActive ? 'text-[#4da2ff] opacity-100' : 'opacity-0'
        )}>
          &gt;
        </span>

        {/* Avatar with tier icon */}
        <span className={clsx(
          'text-base flex-shrink-0 w-5 text-center',
          addr.isActive && 'scale-110'
        )}>
          {addr.isCommunityMember && addr.tierIcon ? addr.tierIcon : '👤'}
        </span>

        {/* Address info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={clsx(
              'text-sm truncate transition-colors',
              addr.isActive ? 'text-white' : 'text-white/70'
            )}>
              {addr.alias || `${addr.address.slice(0, 8)}...${addr.address.slice(-6)}`}
            </span>
            {addr.isActive && (
              <span className="px-1.5 py-0.5 bg-[#4da2ff]/20 text-[#4da2ff] text-[10px] rounded border border-[#4da2ff]/30">
                ACTIVE
              </span>
            )}
            {addr.isCommunityMember && tierStyle && (
              <span className={clsx(
                'px-1.5 py-0.5 text-[10px] rounded flex items-center gap-1',
                tierStyle.bg,
                tierStyle.text
              )}>
                {addr.tierName}
              </span>
            )}
          </div>

          {/* Label with inline edit */}
          {isEditing && editingField === 'label' ? (
            <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={editInputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                onBlur={saveEdit}
                className="flex-1 px-2 py-0.5 bg-black/30 border border-[#4da2ff]/50 rounded text-xs text-white"
                placeholder="label..."
              />
            </div>
          ) : addrMetadata?.label ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                startEdit(addr.address, 'label', addrMetadata.label);
              }}
              className="text-[10px] text-white/40 hover:text-white/60 cursor-pointer mt-0.5"
            >
              #{addrMetadata.label}
            </div>
          ) : null}

          {/* Notes */}
          {isEditing && editingField === 'notes' ? (
            <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={editInputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                onBlur={saveEdit}
                className="flex-1 px-2 py-0.5 bg-black/30 border border-[#4da2ff]/50 rounded text-xs text-white"
                placeholder="notes..."
              />
            </div>
          ) : addrMetadata?.notes ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                startEdit(addr.address, 'notes', addrMetadata.notes);
              }}
              className="text-[10px] text-white/30 hover:text-white/50 cursor-pointer truncate"
            >
              // {addrMetadata.notes}
            </div>
          ) : null}

          <div className={clsx(
            'text-xs truncate mt-0.5',
            addr.isActive ? 'text-white/50' : 'text-white/30'
          )}>
            {addr.address}
          </div>
        </div>

        {/* Balance */}
        <div className="text-right flex-shrink-0">
          <div className={clsx(
            'text-sm',
            addr.isActive ? 'text-[#4da2ff]' : 'text-white/60'
          )}>
            {formatBalance(addr.balance)} <span className="text-white/40">SUI</span>
          </div>
        </div>

        {/* Actions - show on hover */}
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip content="objects" side="bottom">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewObjects(addr.address);
              }}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white/70 text-[10px]"
            >
              [obj]
            </button>
          </Tooltip>

          <Tooltip content="explorer" side="bottom">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenExplorer(addr.address);
              }}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white/70 text-[10px]"
            >
              [exp]
            </button>
          </Tooltip>

          <Tooltip content="copy" side="bottom">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(addr.address);
              }}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white/70 text-[10px]"
            >
              [cp]
            </button>
          </Tooltip>

          {!addr.isActive && (
            <Tooltip content="delete" side="bottom">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(addr.address, addr.alias);
                }}
                className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-red-400/60 hover:text-red-400 text-[10px]"
              >
                [rm]
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal memoization
  return (
    prevProps.addr.address === nextProps.addr.address &&
    prevProps.addr.isActive === nextProps.addr.isActive &&
    prevProps.addr.balance === nextProps.addr.balance &&
    prevProps.addr.alias === nextProps.addr.alias &&
    prevProps.addr.isCommunityMember === nextProps.addr.isCommunityMember &&
    prevProps.addr.tierLevel === nextProps.addr.tierLevel &&
    prevProps.addr.tierIcon === nextProps.addr.tierIcon &&
    prevProps.addr.tierName === nextProps.addr.tierName &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.editingField === nextProps.editingField &&
    prevProps.editValue === nextProps.editValue &&
    prevProps.addrMetadata?.label === nextProps.addrMetadata?.label &&
    prevProps.addrMetadata?.notes === nextProps.addrMetadata?.notes &&
    prevProps.currentNetwork === nextProps.currentNetwork
  );
});

export function AddressList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    addresses,
    environments,
    isLoading,
    searchQuery,
    fetchAddresses,
    switchAddress,
    createAddress,
    removeAddress,
  } = useAppStore();

  // Get current network from active environment
  const activeEnv = environments.find((e) => e.isActive);
  const currentNetwork: NetworkType = detectNetwork(activeEnv?.alias, activeEnv?.rpc);

  // URL params for action
  const actionParam = searchParams.get('action');
  const [showCreateForm, setShowCreateForm] = useState(() => actionParam === 'new');
  const [newAlias, setNewAlias] = useState('');
  const [keyScheme, setKeyScheme] = useState<'ed25519' | 'secp256k1' | 'secp256r1'>('ed25519');

  // Inline editing state
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'label' | 'notes' | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Export/Import state
  const [showExportImport, setShowExportImport] = useState(() => actionParam === 'import');

  // Sync state when URL changes (e.g., from FileTree navigation)
  useEffect(() => {
    if (actionParam === 'new' && !showCreateForm) {
      setShowCreateForm(true);
    } else if (actionParam === 'import' && !showExportImport) {
      setShowExportImport(true);
    }
  }, [actionParam]);

  // Address metadata state
  const [metadata, setMetadata] = useState<Map<string, AddressMetadata>>(new Map());

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; address: string } | null>(null);

  // Debounced search query for performance
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [isSearching, setIsSearching] = useState(false);

  // Delete confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{ address: string; alias?: string } | null>(null);

  // Initial load
  useEffect(() => {
    fetchAddresses();
    // Load metadata for all addresses
    const allMetadata = addressMetadata.getAll();
    const metaMap = new Map<string, AddressMetadata>();
    allMetadata.forEach((m) => metaMap.set(m.address, m));
    setMetadata(metaMap);
  }, [fetchAddresses]);

  // Smart polling with adaptive intervals
  useSmartPolling({
    onPoll: fetchAddresses,
    initialInterval: 15000, // 15s when tab is visible
    maxInterval: 60000, // 60s when tab is hidden
    enabled: addresses.length > 0, // Only poll if we have addresses
  });

  // Debounce search query (300ms delay)
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingAddress && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingAddress, editingField]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Memoize filtered and sorted addresses with debounced search
  const sortedAddresses = useMemo(() => {
    const filtered = addresses.filter((addr) => {
      if (!debouncedSearchQuery) return true;
      const query = debouncedSearchQuery.toLowerCase();
      const addrMeta = metadata.get(addr.address);
      return (
        addr.address.toLowerCase().includes(query) ||
        addr.alias?.toLowerCase().includes(query) ||
        addrMeta?.label?.toLowerCase().includes(query) ||
        addrMeta?.notes?.toLowerCase().includes(query)
      );
    });

    // Sort: active first, then members, then by balance
    return [...filtered].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      if (a.isCommunityMember !== b.isCommunityMember) return a.isCommunityMember ? -1 : 1;
      const balA = parseFloat(a.balance || '0');
      const balB = parseFloat(b.balance || '0');
      return balB - balA;
    });
  }, [addresses, debouncedSearchQuery, metadata]);

  // Memoize handlers to prevent re-renders
  const handleSwitch = useCallback(async (address: string) => {
    try {
      await switchAddress(address);
      toast.success('Address switched successfully');
    } catch (error) {
      toast.error(String(error));
    }
  }, [switchAddress]);

  const handleCreate = useCallback(async () => {
    try {
      const result = await createAddress(keyScheme, newAlias || undefined);
      toast.success(`Created address: ${result.address.slice(0, 10)}...`);
      if (result.phrase) {
        toast.success('Recovery phrase copied to clipboard');
        navigator.clipboard.writeText(result.phrase);
      }
      setShowCreateForm(false);
      setNewAlias('');
    } catch (error) {
      toast.error(String(error));
    }
  }, [createAddress, keyScheme, newAlias]);

  const copyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  }, []);

  // View objects for an address - switch to it first then navigate
  const handleViewObjects = useCallback(async (address: string) => {
    try {
      // Switch to the address first if not active
      const targetAddr = addresses.find(a => a.address === address);
      if (targetAddr && !targetAddr.isActive) {
        await switchAddress(address);
      }
      // Navigate to objects page
      navigate('/app/objects');
    } catch (error) {
      toast.error(String(error));
    }
  }, [addresses, switchAddress, navigate]);

  // Open address in explorer
  const handleOpenExplorer = useCallback((address: string) => {
    const explorer = getDefaultExplorer();
    const url = buildExplorerUrl(explorer, currentNetwork, 'address', address);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [currentNetwork]);

  // Request delete confirmation (opens dialog)
  const handleDelete = useCallback((address: string, alias?: string) => {
    setDeleteConfirm({ address, alias });
  }, []);

  // Confirm delete (actual deletion)
  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    const { address } = deleteConfirm;
    try {
      await removeAddress(address);
      // Also remove metadata
      addressMetadata.delete(address);
      const newMeta = new Map(metadata);
      newMeta.delete(address);
      setMetadata(newMeta);
      toast.success('Address deleted successfully');
    } catch (error) {
      toast.error(String(error));
    } finally {
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, removeAddress, metadata]);

  // Start editing
  const startEdit = useCallback((address: string, field: 'label' | 'notes', currentValue: string) => {
    setEditingAddress(address);
    setEditingField(field);
    setEditValue(currentValue || '');
  }, []);

  // Save edit
  const saveEdit = useCallback(() => {
    if (!editingAddress || !editingField) return;

    const updates: Partial<AddressMetadata> = {};
    if (editingField === 'label') {
      updates.label = editValue.trim();
    } else if (editingField === 'notes') {
      updates.notes = editValue.trim();
    }

    addressMetadata.set(editingAddress, updates);

    // Update local state
    const newMeta = new Map(metadata);
    const existing = newMeta.get(editingAddress) || { address: editingAddress };
    newMeta.set(editingAddress, { ...existing, ...updates });
    setMetadata(newMeta);

    setEditingAddress(null);
    setEditingField(null);
    setEditValue('');
    toast.success('Saved');
  }, [editingAddress, editingField, editValue, metadata]);

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingAddress(null);
    setEditingField(null);
    setEditValue('');
  }, []);

  // Export metadata
  const handleExport = useCallback(() => {
    const json = addressMetadata.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sui-wallet-metadata-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Metadata exported');
  }, []);

  // Import metadata
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const result = addressMetadata.importFromJSON(json);
        if (result.success) {
          toast.success(`Imported ${result.imported} address(es)`);
          // Reload metadata
          const allMetadata = addressMetadata.getAll();
          const metaMap = new Map<string, AddressMetadata>();
          allMetadata.forEach((m) => metaMap.set(m.address, m));
          setMetadata(metaMap);
          setShowExportImport(false);
        } else {
          toast.error(result.error || 'Import failed');
        }
      } catch (error) {
        toast.error('Invalid file format');
      }
    };
    reader.readAsText(file);
  }, []);

  // Count community members
  const memberCount = addresses.filter(a => a.isCommunityMember).length;

  if (isLoading && addresses.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-2 py-2 font-mono">
      {/* Terminal-style header */}
      {addresses.length > 0 && (
        <div className="mb-3 space-y-2">
          {/* ASCII header */}
          <div className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[#4da2ff]">$</span>
                <span className="text-white/60">sui client addresses</span>
                <span className="text-white/30">|</span>
                <span className="text-white/50">
                  {sortedAddresses.length !== addresses.length
                    ? `${sortedAddresses.length}/${addresses.length}`
                    : `${addresses.length}`} found
                </span>
                {isSearching && (
                  <span className="text-yellow-400 animate-pulse">...</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {memberCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[#4da2ff]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4da2ff] animate-pulse" />
                    <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                  </span>
                )}
                <button
                  onClick={() => setShowExportImport(!showExportImport)}
                  className="px-2 py-0.5 text-white/40 hover:text-white/70 hover:bg-white/5 rounded transition-colors"
                  title="Export/Import metadata"
                >
                  [backup]
                </button>
              </div>
            </div>
          </div>

          {/* Export/Import panel - Terminal style */}
          {showExportImport && (
            <div className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg space-y-2">
              <div className="text-xs text-white/40 uppercase tracking-wider">backup &amp; restore</div>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded text-xs transition-colors border border-white/10"
                >
                  $ export --json
                </button>
                <label className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded text-xs transition-colors border border-white/10 cursor-pointer text-center">
                  $ import --json
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[10px] text-white/30">
                # backup labels, notes, and metadata
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create new address - Terminal style */}
      {showCreateForm ? (
        <div className="mb-4 p-3 bg-black/40 border border-white/10 rounded-lg">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="text-[#4da2ff]">&gt;</span>
            sui keytool generate
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">
                --alias
              </label>
              <input
                type="text"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="my-wallet"
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4da2ff]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">
                --scheme
              </label>
              <select
                value={keyScheme}
                onChange={(e) => setKeyScheme(e.target.value as 'ed25519' | 'secp256k1' | 'secp256r1')}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-[#4da2ff]/50 transition-colors cursor-pointer"
              >
                <option value="ed25519">ed25519 (recommended)</option>
                <option value="secp256k1">secp256k1</option>
                <option value="secp256r1">secp256r1</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                className="flex-1 px-3 py-2 bg-[#4da2ff]/20 hover:bg-[#4da2ff]/30 text-[#4da2ff] rounded text-xs transition-colors border border-[#4da2ff]/30"
              >
                [execute]
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/50 rounded text-xs transition-colors border border-white/10"
              >
                [cancel]
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full mb-3 px-3 py-2 flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white/70 hover:bg-white/5 rounded transition-all border border-dashed border-white/20 hover:border-white/30"
        >
          <span className="text-[#4da2ff]">+</span>
          new address
        </button>
      )}

      {/* Address list */}
      {sortedAddresses.length === 0 ? (
        <div className="px-3 py-8 text-center text-text-secondary">
          No addresses found
        </div>
      ) : (
        <div className="space-y-1">
          {sortedAddresses.map((addr) => {
            const tierStyle = addr.tierLevel !== undefined ? TIER_STYLES[addr.tierLevel] : null;
            const addrMetadata = metadata.get(addr.address);
            const isEditing = editingAddress === addr.address;

            return (
              <AddressCard
                key={addr.address}
                addr={addr}
                tierStyle={tierStyle}
                addrMetadata={addrMetadata}
                isEditing={isEditing}
                editingField={editingField}
                editValue={editValue}
                editInputRef={editInputRef}
                currentNetwork={currentNetwork}
                onSwitch={handleSwitch}
                onDelete={handleDelete}
                onCopy={copyAddress}
                onViewObjects={handleViewObjects}
                onOpenExplorer={handleOpenExplorer}
                onContextMenu={(e, address) => {
                  setContextMenu({ x: e.clientX, y: e.clientY, address });
                }}
                startEdit={startEdit}
                saveEdit={saveEdit}
                cancelEdit={cancelEdit}
                setEditValue={setEditValue}
              />
            );
          })}
        </div>
      )}

      {/* Legend */}
      {memberCount > 0 && (
        <div className="mt-4 px-3 py-2 border-t border-border/50">
          <div className="text-xs text-muted-foreground mb-2">Tier Legend:</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 rounded">
              💧 Droplet
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-teal-500/10 text-teal-400 rounded">
              🌊 Wave
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 rounded">
              🌀 Tsunami
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded">
              🌊 Ocean
            </span>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const addr = sortedAddresses.find((a) => a.address === contextMenu.address);
              const meta = metadata.get(contextMenu.address);
              startEdit(contextMenu.address, 'label', meta?.label || '');
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent/10 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {metadata.get(contextMenu.address)?.label ? 'Edit Label' : 'Add Label'}
          </button>
          <button
            onClick={() => {
              const meta = metadata.get(contextMenu.address);
              startEdit(contextMenu.address, 'notes', meta?.notes || '');
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent/10 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {metadata.get(contextMenu.address)?.notes ? 'Edit Notes' : 'Add Notes'}
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Address"
        message={`Are you sure you want to delete "${deleteConfirm?.alias || (deleteConfirm?.address ? `${deleteConfirm.address.slice(0, 8)}...${deleteConfirm.address.slice(-6)}` : '')}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
