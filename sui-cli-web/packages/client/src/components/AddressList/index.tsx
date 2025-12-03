import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';

export function AddressList() {
  const {
    addresses,
    isLoading,
    searchQuery,
    fetchAddresses,
    switchAddress,
    createAddress,
  } = useAppStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlias, setNewAlias] = useState('');
  const [keyScheme, setKeyScheme] = useState<'ed25519' | 'secp256k1' | 'secp256r1'>('ed25519');

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const filteredAddresses = addresses.filter((addr) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      addr.address.toLowerCase().includes(query) ||
      addr.alias?.toLowerCase().includes(query)
    );
  });

  const handleSwitch = async (address: string) => {
    try {
      await switchAddress(address);
      toast.success('Address switched successfully');
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleCreate = async () => {
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
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  if (isLoading && addresses.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-2 py-2">
      {/* Create new address button/form */}
      {showCreateForm ? (
        <div className="mb-4 p-3 bg-background-tertiary rounded-lg">
          <div className="text-sm font-medium text-text-primary mb-3">
            Create New Address
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Alias (optional)
              </label>
              <input
                type="text"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="my-wallet"
                className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Key Scheme
              </label>
              <select
                value={keyScheme}
                onChange={(e) => setKeyScheme(e.target.value as any)}
                className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="ed25519">Ed25519</option>
                <option value="secp256k1">Secp256k1</option>
                <option value="secp256r1">Secp256r1</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-3 py-2 bg-accent text-white rounded text-sm font-medium hover:bg-accent-hover transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-2 bg-background-hover text-text-secondary rounded text-sm hover:bg-background-active transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full mb-3 px-3 py-2 flex items-center gap-2 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Address
        </button>
      )}

      {/* Address list */}
      {filteredAddresses.length === 0 ? (
        <div className="px-3 py-8 text-center text-text-secondary">
          No addresses found
        </div>
      ) : (
        <div className="space-y-1">
          {filteredAddresses.map((addr) => (
            <div
              key={addr.address}
              className={clsx(
                'flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors',
                addr.isActive ? 'bg-accent/10' : 'hover:bg-background-hover'
              )}
              onClick={() => !addr.isActive && handleSwitch(addr.address)}
            >
              <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center text-lg">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {addr.alias || `${addr.address.slice(0, 8)}...${addr.address.slice(-6)}`}
                  </span>
                  {addr.isActive && (
                    <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-xs rounded">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-secondary font-mono truncate">
                  {addr.address}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-text-primary">
                  {addr.balance || '0'} SUI
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyAddress(addr.address);
                }}
                className="p-2 hover:bg-background-active rounded transition-colors"
              >
                <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
