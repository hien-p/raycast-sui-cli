import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';

export function EnvironmentList() {
  const {
    environments,
    isLoading,
    searchQuery,
    fetchEnvironments,
    switchEnvironment,
    addEnvironment,
    removeEnvironment,
  } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlias, setNewAlias] = useState('');
  const [newRpc, setNewRpc] = useState('');

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const filteredEnvs = environments.filter((env) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      env.alias.toLowerCase().includes(query) ||
      env.rpc.toLowerCase().includes(query)
    );
  });

  const handleSwitch = async (alias: string) => {
    try {
      await switchEnvironment(alias);
      toast.success(`Switched to ${alias}`);
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleAdd = async () => {
    if (!newAlias || !newRpc) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await addEnvironment(newAlias, newRpc);
      toast.success(`Added environment: ${newAlias}`);
      setShowAddForm(false);
      setNewAlias('');
      setNewRpc('');
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleRemove = async (alias: string) => {
    if (!confirm(`Remove environment "${alias}"?`)) return;
    try {
      await removeEnvironment(alias);
      toast.success(`Removed environment: ${alias}`);
    } catch (error) {
      toast.error(String(error));
    }
  };

  const getNetworkIcon = (alias: string) => {
    const lower = alias.toLowerCase();
    if (lower.includes('mainnet')) return '🟢';
    if (lower.includes('testnet')) return '🟡';
    if (lower.includes('devnet')) return '🔵';
    if (lower.includes('local')) return '⚪';
    return '🌐';
  };

  if (isLoading && environments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-2 py-2">
      {/* Add new environment button/form */}
      {showAddForm ? (
        <div className="mb-4 p-3 bg-background-tertiary rounded-lg">
          <div className="text-sm font-medium text-text-primary mb-3">
            Add New Environment
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Alias
              </label>
              <input
                type="text"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="my-network"
                className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                RPC URL
              </label>
              <input
                type="text"
                value={newRpc}
                onChange={(e) => setNewRpc(e.target.value)}
                placeholder="https://fullnode.devnet.sui.io:443"
                className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 px-3 py-2 bg-accent text-white rounded text-sm font-medium hover:bg-accent-hover transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 bg-background-hover text-text-secondary rounded text-sm hover:bg-background-active transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-3 px-3 py-2 flex items-center gap-2 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Environment
        </button>
      )}

      {/* Environment list */}
      {filteredEnvs.length === 0 ? (
        <div className="px-3 py-8 text-center text-text-secondary">
          No environments found
        </div>
      ) : (
        <div className="space-y-1">
          {filteredEnvs.map((env) => (
            <div
              key={env.alias}
              className={clsx(
                'flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors',
                env.isActive ? 'bg-accent/10' : 'hover:bg-background-hover'
              )}
              onClick={() => !env.isActive && handleSwitch(env.alias)}
            >
              <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center text-lg">
                {getNetworkIcon(env.alias)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    {env.alias}
                  </span>
                  {env.isActive && (
                    <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-xs rounded">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-secondary truncate">
                  {env.rpc}
                </div>
              </div>
              {!env.isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(env.alias);
                  }}
                  className="p-2 hover:bg-error/20 rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-text-tertiary hover:text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
