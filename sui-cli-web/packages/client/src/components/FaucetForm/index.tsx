import { useState } from 'react';
import { clsx } from 'clsx';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';

type Network = 'devnet' | 'testnet' | 'localnet';

interface FaucetSource {
  id: string;
  name: string;
  description: string;
  networks: ('devnet' | 'testnet')[];
  type: 'api' | 'web' | 'discord';
  url?: string;
  dailyLimit?: string;
  perRequestAmount?: string;
}

const FAUCET_SOURCES: FaucetSource[] = [
  {
    id: 'fm-faucet',
    name: 'FM Faucet',
    description: 'Contact @rongmauhong (Telegram) or @222tee (X) - no captcha',
    networks: ['testnet'],
    type: 'web',
    url: 'https://fmfaucet.xyz',
    dailyLimit: '2 requests/day',
    perRequestAmount: '1 SUI',
  },
  {
    id: 'sui-web-faucet',
    name: 'Sui Web Faucet',
    description: 'Official web faucet by Mysten Labs',
    networks: ['devnet', 'testnet'],
    type: 'web',
    url: 'https://faucet.sui.io/',
    dailyLimit: 'Rate limited',
    perRequestAmount: '1 SUI',
  },
  {
    id: 'blockbolt-faucet',
    name: 'Blockbolt Faucet',
    description: 'Community faucet - no captcha',
    networks: ['devnet', 'testnet'],
    type: 'web',
    url: 'https://faucet.blockbolt.io/',
    dailyLimit: 'Limited',
    perRequestAmount: '1 SUI',
  },
  {
    id: 'n1stake-faucet',
    name: 'n1stake Faucet',
    description: 'Fast faucet - no registration',
    networks: ['testnet'],
    type: 'web',
    url: 'https://faucet.n1stake.com/',
    dailyLimit: '1 request/day',
    perRequestAmount: '0.5 SUI',
  },
  {
    id: 'stakely-faucet',
    name: 'Stakely Faucet',
    description: 'Requires captcha verification',
    networks: ['testnet'],
    type: 'web',
    url: 'https://stakely.io/faucet/sui-testnet-sui',
    dailyLimit: '1 request/day',
    perRequestAmount: '0.5 SUI',
  },
  {
    id: 'sui-discord',
    name: 'Sui Discord Faucet',
    description: 'Use #devnet-faucet or #testnet-faucet channel',
    networks: ['devnet', 'testnet'],
    type: 'discord',
    url: 'https://discord.gg/sui',
    dailyLimit: 'Varies',
    perRequestAmount: 'Varies',
  },
];

const networks: { id: Network; name: string; icon: string; description: string }[] = [
  {
    id: 'devnet',
    name: 'Devnet',
    icon: '🔵',
    description: 'Development network',
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
    description: 'Local node',
  },
];

export function FaucetForm() {
  const { addresses, isLoading, requestFaucet, environments } = useAppStore();
  const [selectedNetwork, setSelectedNetwork] = useState<Network>('testnet');
  const [isRequesting, setIsRequesting] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; txDigest?: string } | null>(null);

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

  // Filter faucet sources for selected network
  const availableSources = FAUCET_SOURCES.filter(
    (source) => selectedNetwork !== 'localnet' && source.networks.includes(selectedNetwork as 'devnet' | 'testnet')
  );

  const handleRequest = async () => {
    if (!activeAddress) {
      toast.error('No active address');
      return;
    }

    setIsRequesting(true);
    setLastResult(null);
    try {
      await requestFaucet(selectedNetwork);
      const result = {
        success: true,
        message: `Tokens requested from ${selectedNetwork} faucet!`,
      };
      setLastResult(result);
      toast.success(result.message);
    } catch (error) {
      // Clean up error message - remove "Error:" prefix if present
      let errorMessage = error instanceof Error ? error.message : String(error);
      errorMessage = errorMessage.replace(/^Error:\s*/i, '');

      const result = {
        success: false,
        message: errorMessage,
      };
      setLastResult(result);
      toast.error(errorMessage);
    } finally {
      setIsRequesting(false);
    }
  };

  const openExternalFaucet = (url: string) => {
    // Use noopener,noreferrer to prevent tabnapping attacks
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyAddress = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress.address);
      toast.success('Address copied to clipboard');
    }
  };

  if (!activeAddress) {
    return (
      <div className="px-3 py-8 text-center text-muted-foreground">
        No active address selected
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Active address display */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Request tokens for</span>
          <button
            onClick={copyAddress}
            className="text-xs text-primary hover:underline"
          >
            Copy
          </button>
        </div>
        <div className="text-sm font-mono text-foreground truncate">
          {activeAddress.alias ? (
            <span>
              <span className="text-primary">{activeAddress.alias}</span>
              <span className="text-muted-foreground ml-2">
                ({activeAddress.address.slice(0, 8)}...{activeAddress.address.slice(-6)})
              </span>
            </span>
          ) : (
            activeAddress.address
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Current balance: <span className="text-foreground font-medium">{activeAddress.balance || '0'} SUI</span>
        </div>
      </div>

      {/* Network detection hint */}
      {detectedNetwork && detectedNetwork !== selectedNetwork && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2">
          <span className="text-warning text-lg">⚠️</span>
          <div className="flex-1">
            <div className="text-sm text-warning">
              Environment mismatch
            </div>
            <div className="text-xs text-warning/80">
              Active: {activeEnv?.alias}. Consider {detectedNetwork} faucet.
            </div>
          </div>
          <button
            onClick={() => setSelectedNetwork(detectedNetwork)}
            className="text-xs px-2 py-1 bg-warning/20 text-warning rounded hover:bg-warning/30 transition-colors"
          >
            Switch
          </button>
        </div>
      )}

      {/* Network selection */}
      <div>
        <div className="text-sm font-medium text-foreground mb-2">Select Network</div>
        <div className="grid grid-cols-3 gap-2">
          {networks.map((network) => (
            <button
              key={network.id}
              onClick={() => setSelectedNetwork(network.id)}
              className={clsx(
                'p-3 rounded-lg border transition-all text-center',
                selectedNetwork === network.id
                  ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/30'
                  : 'bg-muted/20 border-border hover:bg-muted/40'
              )}
            >
              <div className="text-2xl mb-1">{network.icon}</div>
              <div className="text-sm font-medium text-foreground">{network.name}</div>
              <div className="text-[10px] text-muted-foreground">{network.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Request button - Official Faucet */}
      {selectedNetwork !== 'localnet' && (
        <div className="p-3 bg-muted/20 rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl">🚰</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">Sui Official Faucet</div>
              <div className="text-xs text-muted-foreground">1 SUI per request • 10 requests/day</div>
            </div>
          </div>
          <button
            onClick={handleRequest}
            disabled={isRequesting || isLoading}
            className={clsx(
              'w-full py-2.5 rounded-lg text-sm font-medium transition-colors',
              'flex items-center justify-center gap-2',
              isRequesting || isLoading
                ? 'bg-primary/50 cursor-not-allowed text-primary-foreground/70'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            )}
          >
            {isRequesting ? (
              <>
                <Spinner size="sm" />
                Requesting...
              </>
            ) : (
              'Request Tokens'
            )}
          </button>
        </div>
      )}

      {/* Localnet info */}
      {selectedNetwork === 'localnet' && (
        <div className="p-3 bg-muted/20 rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-xl">💻</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">Local Faucet</div>
              <div className="text-xs text-muted-foreground">Requires local Sui node running</div>
            </div>
          </div>
          <button
            onClick={handleRequest}
            disabled={isRequesting || isLoading}
            className={clsx(
              'w-full py-2.5 rounded-lg text-sm font-medium transition-colors',
              'flex items-center justify-center gap-2',
              isRequesting || isLoading
                ? 'bg-primary/50 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            )}
          >
            {isRequesting ? (
              <>
                <Spinner size="sm" />
                Requesting...
              </>
            ) : (
              'Request from Local Faucet'
            )}
          </button>
        </div>
      )}

      {/* Last result */}
      {lastResult && (
        <div
          className={clsx(
            'p-3 rounded-lg border',
            lastResult.success
              ? 'bg-success/10 border-success/30'
              : 'bg-error/10 border-error/30'
          )}
        >
          <div className={clsx('text-sm', lastResult.success ? 'text-success' : 'text-error')}>
            {lastResult.success ? '✓' : '✗'} {lastResult.message}
          </div>
          {lastResult.txDigest && (
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              TX: {lastResult.txDigest}
            </div>
          )}
        </div>
      )}

      {/* Alternative faucet sources */}
      {availableSources.length > 0 && selectedNetwork !== 'localnet' && (
        <div>
          <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <span>Alternative Faucets</span>
            <span className="text-xs text-muted-foreground font-normal">(External)</span>
          </div>
          <div className="space-y-2">
            {availableSources.map((source) => (
                <div
                  key={source.id}
                  className="p-3 bg-muted/20 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">
                      {source.type === 'web' ? '🌐' : source.type === 'discord' ? '💬' : '🔗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{source.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {source.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-primary font-medium">
                        {source.perRequestAmount}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {source.dailyLimit}
                      </div>
                    </div>
                    <button
                      onClick={() => source.url && openExternalFaucet(source.url)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
        <div className="font-medium text-foreground mb-1">💡 Tips</div>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Official faucet has rate limits (~10/day) - try alternatives if blocked</li>
          <li>Rate limited? Wait a few minutes or use web/Discord faucets</li>
          <li>Discord faucet (#devnet-faucet or #testnet-faucet) for larger amounts</li>
          <li>Mainnet has no faucets - purchase SUI on exchanges</li>
        </ul>
      </div>
    </div>
  );
}
