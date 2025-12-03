import { useEffect, useRef, useCallback, useMemo } from 'react';
import { SearchInput } from './SearchInput';
import { CommandList } from './CommandList';
import { Kbd } from '../shared/Kbd';
import { Spinner } from '../shared/Spinner';
import { useAppStore, type View } from '@/stores/useAppStore';
import { AddressList } from '../AddressList';
import { EnvironmentList } from '../EnvironmentList';
import { ObjectList } from '../ObjectList';
import { GasList } from '../GasList';
import { FaucetForm } from '../FaucetForm';
import { SetupInstructions } from '../SetupInstructions';
import { DEFAULT_COMMANDS } from '@/types';

export function CommandPalette() {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    view,
    setView,
    searchQuery,
    setSearchQuery,
    selectedIndex,
    setSelectedIndex,
    isLoading,
    error,
    setError,
    suiInstalled,
    suiVersion,
    isServerConnected,
    isCheckingConnection,
    fetchStatus,
    fetchAddresses,
    fetchEnvironments,
    checkServerConnection,
  } = useAppStore();

  // Check connection and fetch initial data on mount
  useEffect(() => {
    const init = async () => {
      const connected = await checkServerConnection();
      if (connected) {
        await fetchStatus();
        await fetchAddresses();
        await fetchEnvironments();
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus input on mount and view change
  useEffect(() => {
    inputRef.current?.focus();
  }, [view]);

  // Get filtered items count for keyboard navigation
  const filteredCount = useMemo(() => {
    if (view !== 'commands') return 0;
    if (!searchQuery) return DEFAULT_COMMANDS.length + 2; // +2 for status items
    return DEFAULT_COMMANDS.filter((cmd) => {
      const query = searchQuery.toLowerCase();
      return (
        cmd.title.toLowerCase().includes(query) ||
        cmd.subtitle?.toLowerCase().includes(query) ||
        cmd.keywords?.some((k) => k.toLowerCase().includes(query))
      );
    }).length;
  }, [searchQuery, view]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Global shortcuts
      if (e.key === 'Escape') {
        if (view !== 'commands') {
          setView('commands');
          e.preventDefault();
        }
        return;
      }

      // Navigation in command list
      if (view === 'commands') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(Math.min(selectedIndex + 1, filteredCount - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(Math.max(selectedIndex - 1, 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          // Execute selected command
          const commands = DEFAULT_COMMANDS;
          const filtered = searchQuery
            ? commands.filter((cmd) => {
                const query = searchQuery.toLowerCase();
                return (
                  cmd.title.toLowerCase().includes(query) ||
                  cmd.subtitle?.toLowerCase().includes(query) ||
                  cmd.keywords?.some((k) => k.toLowerCase().includes(query))
                );
              })
            : commands;

          if (filtered[selectedIndex]) {
            setView(filtered[selectedIndex].action as View);
          }
        }
      }
    },
    [view, selectedIndex, filteredCount, searchQuery, setView, setSelectedIndex]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const getViewTitle = () => {
    switch (view) {
      case 'addresses':
        return 'Manage Addresses';
      case 'environments':
        return 'Switch Environment';
      case 'objects':
        return 'My Objects';
      case 'gas':
        return 'Gas Coins';
      case 'faucet':
        return 'Request Faucet';
      default:
        return 'Sui CLI';
    }
  };

  const handleRetryConnection = async () => {
    const connected = await checkServerConnection();
    if (connected) {
      await fetchStatus();
      await fetchAddresses();
      await fetchEnvironments();
    }
  };

  const renderContent = () => {
    // Show setup instructions when not connected
    if (isServerConnected === false) {
      return (
        <SetupInstructions
          onRetry={handleRetryConnection}
          isRetrying={isCheckingConnection}
        />
      );
    }

    // Show loading state while checking connection
    if (isServerConnected === null) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-sm text-text-secondary mt-3">Connecting to local server...</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'addresses':
        return <AddressList />;
      case 'environments':
        return <EnvironmentList />;
      case 'objects':
        return <ObjectList />;
      case 'gas':
        return <GasList />;
      case 'faucet':
        return <FaucetForm />;
      default:
        return <CommandList />;
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-[15vh] px-4">
      <div className="w-full max-w-2xl bg-background-secondary rounded-xl shadow-modal border border-border overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="border-b border-border">
          <div className="flex items-center gap-2 px-4 py-2">
            {view !== 'commands' && (
              <button
                onClick={() => setView('commands')}
                className="p-1 hover:bg-background-hover rounded transition-colors"
              >
                <svg
                  className="w-4 h-4 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <span className="text-sm font-medium text-text-primary">
              {getViewTitle()}
            </span>
            <div className="flex-1" />
            {isLoading && <Spinner size="sm" />}
            {suiInstalled && suiVersion && (
              <span className="text-xs text-text-tertiary">v{suiVersion}</span>
            )}
          </div>
          <SearchInput
            ref={inputRef}
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              view === 'commands'
                ? 'Search commands...'
                : `Search ${view}...`
            }
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-error/10 border-b border-error/20">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Sui not installed warning - only show if explicitly false, not null (loading) */}
        {suiInstalled === false && (
          <div className="px-4 py-3 bg-warning/10 border-b border-warning/20">
            <p className="text-sm text-warning">
              Sui CLI is not installed. Please install it to use this app.
            </p>
          </div>
        )}

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">{renderContent()}</div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background-tertiary">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs text-text-tertiary">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-tertiary">
              <Kbd>↵</Kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-tertiary">
              <Kbd>esc</Kbd>
              <span>Back</span>
            </div>
          </div>
          <div className="text-xs text-text-tertiary">Sui CLI Web</div>
        </div>
      </div>
    </div>
  );
}
