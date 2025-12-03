import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';

export function GasList() {
  const {
    gasCoins,
    addresses,
    isLoading,
    searchQuery,
    fetchGasCoins,
    splitCoin,
    mergeCoins,
  } = useAppStore();

  const [selectedCoins, setSelectedCoins] = useState<string[]>([]);
  const [showSplitForm, setShowSplitForm] = useState(false);
  const [splitCoinId, setSplitCoinId] = useState('');
  const [splitAmounts, setSplitAmounts] = useState('');

  const activeAddress = addresses.find((a) => a.isActive);

  useEffect(() => {
    if (activeAddress) {
      fetchGasCoins(activeAddress.address);
    }
  }, [activeAddress, fetchGasCoins]);

  const filteredCoins = gasCoins.filter((coin) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return coin.coinObjectId.toLowerCase().includes(query);
  });

  const formatBalance = (balance: string) => {
    const num = parseInt(balance) / 1_000_000_000;
    return num.toFixed(4);
  };

  const toggleCoinSelection = (coinId: string) => {
    setSelectedCoins((prev) =>
      prev.includes(coinId)
        ? prev.filter((id) => id !== coinId)
        : [...prev, coinId]
    );
  };

  const handleMerge = async () => {
    if (selectedCoins.length < 2) {
      toast.error('Select at least 2 coins to merge');
      return;
    }
    try {
      const [primary, ...toMerge] = selectedCoins;
      await mergeCoins(primary, toMerge);
      toast.success('Coins merged successfully');
      setSelectedCoins([]);
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleSplit = async () => {
    if (!splitCoinId || !splitAmounts) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      const amounts = splitAmounts.split(',').map((a) => a.trim());
      await splitCoin(splitCoinId, amounts);
      toast.success('Coin split successfully');
      setShowSplitForm(false);
      setSplitCoinId('');
      setSplitAmounts('');
    } catch (error) {
      toast.error(String(error));
    }
  };

  const copyCoinId = (coinId: string) => {
    navigator.clipboard.writeText(coinId);
    toast.success('Coin ID copied to clipboard');
  };

  if (!activeAddress) {
    return (
      <div className="px-3 py-8 text-center text-text-secondary">
        No active address selected
      </div>
    );
  }

  if (isLoading && gasCoins.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const totalBalance = gasCoins.reduce(
    (acc, coin) => acc + parseInt(coin.balance),
    0
  );

  return (
    <div className="px-2 py-2">
      {/* Total balance */}
      <div className="mb-3 px-3 py-3 bg-background-tertiary rounded-lg">
        <div className="text-xs text-text-secondary mb-1">Total Gas Balance</div>
        <div className="text-2xl font-semibold text-text-primary">
          {formatBalance(String(totalBalance))} SUI
        </div>
        <div className="text-xs text-text-tertiary mt-1">
          {gasCoins.length} coin{gasCoins.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-3 px-1">
        {selectedCoins.length >= 2 && (
          <button
            onClick={handleMerge}
            className="flex-1 px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Merge {selectedCoins.length} Coins
          </button>
        )}
        {showSplitForm ? (
          <div className="flex-1 p-3 bg-background-tertiary rounded-lg">
            <div className="space-y-2">
              <select
                value={splitCoinId}
                onChange={(e) => setSplitCoinId(e.target.value)}
                className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">Select coin to split</option>
                {gasCoins.map((coin) => (
                  <option key={coin.coinObjectId} value={coin.coinObjectId}>
                    {coin.coinObjectId.slice(0, 16)}... ({formatBalance(coin.balance)} SUI)
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={splitAmounts}
                onChange={(e) => setSplitAmounts(e.target.value)}
                placeholder="Amounts in MIST (comma separated)"
                className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSplit}
                  className="flex-1 px-3 py-2 bg-accent text-white rounded text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  Split
                </button>
                <button
                  onClick={() => setShowSplitForm(false)}
                  className="px-3 py-2 bg-background-hover text-text-secondary rounded text-sm hover:bg-background-active transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSplitForm(true)}
            className="px-3 py-2 text-sm text-text-secondary hover:bg-background-hover rounded-lg transition-colors"
          >
            Split Coin
          </button>
        )}
      </div>

      {/* Coin list */}
      {filteredCoins.length === 0 ? (
        <div className="px-3 py-8 text-center text-text-secondary">
          No gas coins found
        </div>
      ) : (
        <div className="space-y-1">
          {filteredCoins.map((coin) => (
            <div
              key={coin.coinObjectId}
              className={clsx(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors cursor-pointer',
                selectedCoins.includes(coin.coinObjectId)
                  ? 'bg-accent/10'
                  : 'hover:bg-background-hover'
              )}
              onClick={() => toggleCoinSelection(coin.coinObjectId)}
            >
              <div
                className={clsx(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                  selectedCoins.includes(coin.coinObjectId)
                    ? 'bg-accent border-accent'
                    : 'border-border'
                )}
              >
                {selectedCoins.includes(coin.coinObjectId) && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center text-lg">
                ⛽
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono text-text-primary truncate">
                  {coin.coinObjectId.slice(0, 16)}...{coin.coinObjectId.slice(-8)}
                </div>
                <div className="text-xs text-text-secondary">
                  v{coin.version}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-text-primary">
                  {formatBalance(coin.balance)} SUI
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyCoinId(coin.coinObjectId);
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

      <div className="mt-3 px-3 text-xs text-text-tertiary text-center">
        Select coins to merge • Click checkbox to select
      </div>
    </div>
  );
}
