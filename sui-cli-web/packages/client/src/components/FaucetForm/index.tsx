import { useState } from 'react';
import { clsx } from 'clsx';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';

type Network = 'devnet' | 'testnet' | 'localnet';

const networks: { id: Network; name: string; icon: string; description: string }[] = [
  {
    id: 'devnet',
    name: 'Devnet',
    icon: '🔵',
    description: 'Development network for testing',
  },
  {
    id: 'testnet',
    name: 'Testnet',
    icon: '🟡',
    description: 'Public test network',
  },
  {
    id: 'localnet',
    name: 'Localnet',
    icon: '⚪',
    description: 'Local development network',
  },
];

export function FaucetForm() {
  const { addresses, isLoading, requestFaucet, environments } = useAppStore();
  const [selectedNetwork, setSelectedNetwork] = useState<Network>('devnet');
  const [isRequesting, setIsRequesting] = useState(false);

  const activeAddress = addresses.find((a) => a.isActive);
  const activeEnv = environments.find((e) => e.isActive);

  // Auto-detect network from active environment
  const detectNetwork = (): Network | null => {
    if (!activeEnv) return null;
    const alias = activeEnv.alias.toLowerCase();
    if (alias.includes('devnet')) return 'devnet';
    if (alias.includes('testnet')) return 'testnet';
    if (alias.includes('local')) return 'localnet';
    return null;
  };

  const detectedNetwork = detectNetwork();

  const handleRequest = async () => {
    if (!activeAddress) {
      toast.error('No active address');
      return;
    }

    setIsRequesting(true);
    try {
      await requestFaucet(selectedNetwork);
      toast.success(`Tokens requested from ${selectedNetwork} faucet!`);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsRequesting(false);
    }
  };

  if (!activeAddress) {
    return (
      <div className="px-3 py-8 text-center text-text-secondary">
        No active address selected
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* Active address display */}
      <div className="mb-4 p-3 bg-background-tertiary rounded-lg">
        <div className="text-xs text-text-secondary mb-1">Request tokens for</div>
        <div className="text-sm font-mono text-text-primary truncate">
          {activeAddress.alias || activeAddress.address}
        </div>
        <div className="text-xs text-text-tertiary mt-1">
          Current balance: {activeAddress.balance || '0'} SUI
        </div>
      </div>

      {/* Network detection hint */}
      {detectedNetwork && detectedNetwork !== selectedNetwork && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="text-sm text-warning">
            Your active environment is {activeEnv?.alias}. Consider selecting {detectedNetwork} faucet.
          </div>
        </div>
      )}

      {/* Network selection */}
      <div className="mb-4">
        <div className="text-sm font-medium text-text-primary mb-2">
          Select Network
        </div>
        <div className="space-y-2">
          {networks.map((network) => (
            <div
              key={network.id}
              onClick={() => setSelectedNetwork(network.id)}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                selectedNetwork === network.id
                  ? 'bg-accent/10 border border-accent/30'
                  : 'bg-background-tertiary hover:bg-background-hover border border-transparent'
              )}
            >
              <div className="w-10 h-10 rounded-full bg-background-primary flex items-center justify-center text-xl">
                {network.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">
                  {network.name}
                </div>
                <div className="text-xs text-text-secondary">
                  {network.description}
                </div>
              </div>
              <div
                className={clsx(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  selectedNetwork === network.id
                    ? 'bg-accent border-accent'
                    : 'border-border'
                )}
              >
                {selectedNetwork === network.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Request button */}
      <button
        onClick={handleRequest}
        disabled={isRequesting || isLoading}
        className={clsx(
          'w-full py-3 rounded-lg text-sm font-medium transition-colors',
          'flex items-center justify-center gap-2',
          isRequesting || isLoading
            ? 'bg-accent/50 cursor-not-allowed'
            : 'bg-accent hover:bg-accent-hover'
        )}
      >
        {isRequesting ? (
          <>
            <Spinner size="sm" className="text-white" />
            Requesting...
          </>
        ) : (
          <>
            🚰 Request Tokens
          </>
        )}
      </button>

      {/* Info */}
      <div className="mt-4 p-3 bg-background-tertiary rounded-lg">
        <div className="text-xs text-text-secondary">
          <p className="mb-2">
            <strong>Note:</strong> Faucet tokens are for testing purposes only and have no real value.
          </p>
          <ul className="list-disc list-inside space-y-1 text-text-tertiary">
            <li>Devnet and Testnet have rate limits</li>
            <li>Localnet requires a running local node</li>
            <li>Mainnet does not have a faucet</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
