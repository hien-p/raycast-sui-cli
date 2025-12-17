import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    id: 'suilearn-faucet',
    name: 'SuiLearn Faucet',
    description: 'Community faucet from India - simple & fast',
    networks: ['testnet'],
    type: 'web',
    url: 'https://faucet.suilearn.io/',
    dailyLimit: 'Limited',
    perRequestAmount: '1 SUI',
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
  const [searchParams] = useSearchParams();
  const [selectedNetwork, setSelectedNetwork] = useState<Network>('testnet');
  const [isRequesting, setIsRequesting] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; txDigest?: string } | null>(null);
  const [customAddress, setCustomAddress] = useState('');

  const activeAddress = addresses.find((a) => a.isActive);
  const activeEnv = environments.find((e) => e.isActive);

  // Support requesting for external addresses via query param (e.g., multi-sig addresses)
  const queryAddress = searchParams.get('address');

  // Initialize custom address from query param
  useEffect(() => {
    if (queryAddress && queryAddress !== activeAddress?.address) {
      setCustomAddress(queryAddress);
    }
  }, [queryAddress, activeAddress?.address]);

  // Target address: custom address (for multi-sig) or active address
  const targetAddress = customAddress || activeAddress?.address;
  const isExternalAddress = !!customAddress && customAddress !== activeAddress?.address;

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
    if (!targetAddress) {
      toast.error('No address specified');
      return;
    }

    setIsRequesting(true);
    setLastResult(null);
    try {
      // Pass target address for external/multi-sig addresses
      await requestFaucet(selectedNetwork, isExternalAddress ? targetAddress : undefined);
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
    if (targetAddress) {
      navigator.clipboard.writeText(targetAddress);
      toast.success('Address copied to clipboard');
    }
  };

  // Clear custom address to switch back to active address
  const clearCustomAddress = () => {
    setCustomAddress('');
  };

  if (!targetAddress && !activeAddress) {
    return (
      <div className="px-3 py-8 text-center text-muted-foreground">
        No address selected
      </div>
    );
  }

  return (
    <div className="px-3 py-3 space-y-3 font-mono">
      {/* Terminal-style header */}
      <div className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#4da2ff]">$</span>
            <span className="text-white/60">sui client faucet</span>
            {isExternalAddress && (
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded border border-purple-500/30">
                EXTERNAL
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isExternalAddress && (
              <button
                onClick={clearCustomAddress}
                className="text-white/40 hover:text-white/70 text-[10px]"
              >
                [clear]
              </button>
            )}
            <button
              onClick={copyAddress}
              className="text-white/40 hover:text-white/70 text-[10px]"
            >
              [copy]
            </button>
          </div>
        </div>
        <div className="mt-2 text-white/70 truncate">
          {isExternalAddress ? targetAddress : activeAddress?.alias || activeAddress?.address}
        </div>
        {!isExternalAddress && activeAddress && (
          <div className="text-[10px] text-white/40 mt-1">
            balance: <span className="text-[#4da2ff]">{activeAddress.balance || '0'} SUI</span>
          </div>
        )}
      </div>

      {/* Network mismatch warning - Terminal style */}
      {detectedNetwork && detectedNetwork !== selectedNetwork && (
        <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">!</span>
              <span className="text-yellow-400/80">env mismatch: {activeEnv?.alias} → {detectedNetwork}</span>
            </div>
            <button
              onClick={() => setSelectedNetwork(detectedNetwork)}
              className="text-[10px] text-yellow-400 hover:text-yellow-300"
            >
              [switch]
            </button>
          </div>
        </div>
      )}

      {/* Terminal-style network selection */}
      <div>
        <div className="flex items-center gap-2 px-1 mb-2">
          <span className="text-white/20 text-xs">──[</span>
          <span className="text-xs text-white/40 uppercase tracking-wider">network</span>
          <span className="text-white/20 text-xs">]</span>
          <span className="flex-1 border-t border-white/10 border-dashed" />
        </div>
        <div className="flex gap-2">
          {networks.map((network) => (
            <button
              key={network.id}
              onClick={() => setSelectedNetwork(network.id)}
              className={clsx(
                'flex-1 px-3 py-2 text-xs transition-all border',
                selectedNetwork === network.id
                  ? 'bg-[#4da2ff]/20 text-[#4da2ff] border-[#4da2ff]/30'
                  : 'bg-white/5 text-white/50 border-white/10 hover:text-white/70 hover:border-white/20'
              )}
            >
              <div className="text-lg mb-1">{network.icon}</div>
              <div>{network.name.toLowerCase()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Terminal-style request button */}
      {selectedNetwork !== 'localnet' && (
        <div className="px-3 py-3 bg-black/30 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
            <span>🚰</span>
            <span>sui official faucet</span>
            <span className="text-white/20">|</span>
            <span>1 SUI/req</span>
          </div>
          <button
            onClick={handleRequest}
            disabled={isRequesting || isLoading}
            className={clsx(
              'w-full py-2 text-xs transition-colors border',
              isRequesting || isLoading
                ? 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                : 'bg-[#4da2ff]/20 text-[#4da2ff] border-[#4da2ff]/30 hover:bg-[#4da2ff]/30'
            )}
          >
            {isRequesting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                requesting...
              </span>
            ) : (
              '$ request --faucet'
            )}
          </button>
        </div>
      )}

      {/* Localnet - Terminal style */}
      {selectedNetwork === 'localnet' && (
        <div className="px-3 py-3 bg-black/30 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
            <span>💻</span>
            <span>local faucet</span>
            <span className="text-white/20">|</span>
            <span>requires local node</span>
          </div>
          <button
            onClick={handleRequest}
            disabled={isRequesting || isLoading}
            className={clsx(
              'w-full py-2 text-xs transition-colors border',
              isRequesting || isLoading
                ? 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/15'
            )}
          >
            {isRequesting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                requesting...
              </span>
            ) : (
              '$ request --local'
            )}
          </button>
        </div>
      )}

      {/* Terminal-style result */}
      {lastResult && (
        <div
          className={clsx(
            'px-3 py-2 border rounded-lg text-xs',
            lastResult.success
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          )}
        >
          <div className={clsx('flex items-center gap-2', lastResult.success ? 'text-green-400' : 'text-red-400')}>
            <span>{lastResult.success ? '✓' : '✗'}</span>
            <span>{lastResult.message}</span>
          </div>
          {lastResult.txDigest && (
            <div className="text-white/30 mt-1 truncate">
              tx: {lastResult.txDigest}
            </div>
          )}
        </div>
      )}

      {/* Alternative faucets - Terminal style */}
      {availableSources.length > 0 && selectedNetwork !== 'localnet' && (
        <div>
          <div className="flex items-center gap-2 px-1 mb-2">
            <span className="text-white/20 text-xs">──[</span>
            <span className="text-xs text-white/40 uppercase tracking-wider">alternatives</span>
            <span className="text-white/20 text-xs">]</span>
            <span className="flex-1 border-t border-white/10 border-dashed" />
          </div>
          <div className="space-y-1">
            {availableSources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02] transition-colors cursor-pointer group border-l-2 border-l-transparent hover:border-l-white/20"
                onClick={() => source.url && openExternalFaucet(source.url)}
              >
                <span className="text-sm flex-shrink-0">
                  {source.type === 'web' ? '🌐' : source.type === 'discord' ? '💬' : '🔗'}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-white/70 group-hover:text-white transition-colors">
                    {source.name}
                  </span>
                </div>
                <span className="text-[10px] text-[#4da2ff]">{source.perRequestAmount}</span>
                <span className="text-[10px] text-white/30">{source.dailyLimit}</span>
                <span className="text-[10px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  [open]
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terminal-style tips */}
      <div className="px-3 py-2 border-t border-white/10 text-[10px] text-white/30">
        <div className="mb-1"># tips:</div>
        <div className="space-y-0.5 pl-2">
          <div>- rate limit: ~10 req/day (official)</div>
          <div>- discord: #devnet-faucet or #testnet-faucet</div>
          <div>- mainnet: no faucets available</div>
        </div>
      </div>
    </div>
  );
}
