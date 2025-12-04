import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { clsx } from 'clsx';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';
import { addressMetadata, AddressMetadata } from '@/utils/addressMetadata';
import { useSmartPolling } from '@/utils/useSmartPolling';
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
  onSwitch: (address: string) => void;
  onDelete: (address: string, alias?: string) => void;
  onCopy: (address: string) => void;
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
  onSwitch,
  onDelete,
  onCopy,
  onContextMenu,
  startEdit,
  saveEdit,
  cancelEdit,
  setEditValue,
}: AddressCardProps) => {
  return (
    <div
      className={clsx(
        'rounded-lg transition-all border-l-2 relative',
        addr.isActive
          ? 'bg-accent/10 border-accent'
          : 'hover:bg-background-hover border-transparent'
      )}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, addr.address);
      }}
    >
      <div
        className="flex items-center gap-3 px-3 py-3 cursor-pointer"
        onClick={() => !addr.isActive && !isEditing && onSwitch(addr.address)}
      >
        {/* Avatar with tier icon or default */}
        <div className={clsx(
          'w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0',
          addr.isCommunityMember && tierStyle
            ? `${tierStyle.bg} ${tierStyle.glow || ''}`
            : 'bg-background-tertiary'
        )}>
          {addr.isCommunityMember && addr.tierIcon ? addr.tierIcon : '👤'}
        </div>

        {/* Address info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-text-primary truncate">
              {addr.alias || `${addr.address.slice(0, 8)}...${addr.address.slice(-6)}`}
            </span>
            {addr.isActive && (
              <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-xs rounded font-medium">
                Active
              </span>
            )}
            {/* Community member badge with tier */}
            {addr.isCommunityMember && tierStyle && (
              <span className={clsx(
                'px-1.5 py-0.5 text-xs rounded font-medium flex items-center gap-1',
                tierStyle.bg,
                tierStyle.text,
                tierStyle.glow
              )}>
                {addr.tierIcon} {addr.tierName}
              </span>
            )}
          </div>

          {/* Label with inline edit */}
          {isEditing && editingField === 'label' ? (
            <div className="flex items-center gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
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
                className="flex-1 px-1.5 py-0.5 bg-background-primary border border-accent rounded text-xs text-text-primary"
                placeholder="Label..."
              />
            </div>
          ) : addrMetadata?.label ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                startEdit(addr.address, 'label', addrMetadata.label);
              }}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-accent cursor-pointer mb-1"
            >
              <span className="px-1.5 py-0.5 bg-accent/10 rounded">{addrMetadata.label}</span>
            </div>
          ) : null}

          {/* Notes with inline edit */}
          {isEditing && editingField === 'notes' ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                className="flex-1 px-1.5 py-0.5 bg-background-primary border border-accent rounded text-xs text-text-primary"
                placeholder="Notes..."
              />
            </div>
          ) : addrMetadata?.notes ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                startEdit(addr.address, 'notes', addrMetadata.notes);
              }}
              className="text-xs text-text-tertiary hover:text-accent cursor-pointer"
            >
              <span className="truncate">{addrMetadata.notes}</span>
            </div>
          ) : null}

          <div className="text-xs text-text-secondary font-mono truncate mt-1">
            {addr.address}
          </div>
        </div>

        {/* Balance */}
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-medium text-text-primary">
            {formatBalance(addr.balance)} SUI
          </div>
          {addr.isCommunityMember && (
            <div className="text-xs text-text-tertiary">
              Member
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Copy button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(addr.address);
            }}
            className="p-2 hover:bg-background-active rounded transition-colors"
            title="Copy address"
          >
            <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Delete button (disabled for active address) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!addr.isActive) {
                onDelete(addr.address, addr.alias);
              }
            }}
            disabled={addr.isActive}
            className={clsx(
              'p-2 rounded transition-colors',
              addr.isActive
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-red-500/10 text-red-400'
            )}
            title={addr.isActive ? 'Cannot delete active address' : 'Delete address'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
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
    prevProps.addrMetadata?.notes === nextProps.addrMetadata?.notes
  );
});

export function AddressList() {
  const {
    addresses,
    isLoading,
    searchQuery,
    fetchAddresses,
    switchAddress,
    createAddress,
    removeAddress,
  } = useAppStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlias, setNewAlias] = useState('');
  const [keyScheme, setKeyScheme] = useState<'ed25519' | 'secp256k1' | 'secp256r1'>('ed25519');

  // Inline editing state
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'label' | 'notes' | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Export/Import state
  const [showExportImport, setShowExportImport] = useState(false);

  // Address metadata state
  const [metadata, setMetadata] = useState<Map<string, AddressMetadata>>(new Map());

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; address: string } | null>(null);

  // Debounced search query for performance
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [isSearching, setIsSearching] = useState(false);

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

  // Delete address
  const handleDelete = useCallback(async (address: string, alias?: string) => {
    const displayName = alias || `${address.slice(0, 8)}...${address.slice(-6)}`;
    if (!confirm(`Delete address "${displayName}"? This action cannot be undone.`)) {
      return;
    }
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
    }
  }, [removeAddress, metadata]);

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
    <div className="px-2 py-2">
      {/* Stats header with Export/Import */}
      {addresses.length > 0 && (
        <div className="mb-3 space-y-2">
          <div className="px-3 py-2 bg-background-tertiary/50 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">
                {sortedAddresses.length !== addresses.length
                  ? `${sortedAddresses.length} of ${addresses.length}`
                  : `${addresses.length}`} wallet{addresses.length !== 1 ? 's' : ''}
              </span>
              {isSearching && (
                <svg className="w-3 h-3 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-3">
              {memberCount > 0 && (
                <span
                  className="flex items-center gap-1 text-blue-400 cursor-help"
                  title={`${memberCount} wallet${memberCount !== 1 ? 's' : ''} joined Sui CLI Web community`}
                >
                  <span className="text-sm">🌊</span>
                  <span className="text-xs">{memberCount} community member{memberCount !== 1 ? 's' : ''}</span>
                </span>
              )}
              <button
                onClick={() => setShowExportImport(!showExportImport)}
                className="flex items-center gap-1 text-accent hover:text-accent-hover transition-colors"
                title="Export/Import metadata"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Export/Import panel */}
          {showExportImport && (
            <div className="px-3 py-2 bg-background-tertiary/30 rounded-lg space-y-2">
              <div className="text-xs font-medium text-text-primary mb-1">Backup & Restore</div>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Export JSON
                </button>
                <label className="flex-1 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Import JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[10px] text-text-tertiary">
                Backup labels, notes, and custom metadata for all addresses
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create new address button/form */}
      {showCreateForm ? (
        <div className="mb-4 p-4 bg-background-tertiary/50 border border-border/30 rounded-lg">
          <div className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
            <span className="text-lg">✨</span>
            Create New Wallet
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Wallet Name (optional)
              </label>
              <input
                type="text"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="e.g., my-trading-wallet"
                className="w-full px-3 py-2.5 bg-background-secondary/50 border border-border/50 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:border-accent/50 focus:bg-background-secondary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Key Scheme
              </label>
              <select
                value={keyScheme}
                onChange={(e) => setKeyScheme(e.target.value as 'ed25519' | 'secp256k1' | 'secp256r1')}
                className="w-full px-3 py-2.5 bg-background-secondary/50 border border-border/50 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent/50 focus:bg-background-secondary transition-colors cursor-pointer"
              >
                <option value="ed25519">Ed25519 (Recommended)</option>
                <option value="secp256k1">Secp256k1</option>
                <option value="secp256r1">Secp256r1</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2.5 bg-accent/90 hover:bg-accent text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-accent/20"
              >
                Create Wallet
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2.5 bg-background-secondary/50 hover:bg-background-secondary text-text-secondary rounded-lg text-sm font-medium transition-colors border border-border/30"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full mb-3 px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-accent hover:bg-accent/10 hover:border-accent/30 rounded-lg transition-all border border-border/30 bg-background-tertiary/30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Wallet
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
                onSwitch={handleSwitch}
                onDelete={handleDelete}
                onCopy={copyAddress}
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
          <div className="text-xs text-text-tertiary mb-2">Tier Legend:</div>
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
    </div>
  );
}
