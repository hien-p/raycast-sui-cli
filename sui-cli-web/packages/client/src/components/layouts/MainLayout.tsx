import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Kbd } from '../shared/Kbd';
import { Spinner } from '../shared/Spinner';
import { SearchInput } from '../CommandPalette/SearchInput';
import { useAppStore } from '@/stores/useAppStore';

const ROUTE_TITLES: Record<string, string> = {
  '/app': 'Sui CLI',
  '/app/addresses': 'Manage Addresses',
  '/app/environments': 'Switch Environment',
  '/app/objects': 'My Objects',
  '/app/gas': 'Gas Coins',
  '/app/faucet': 'Request Faucet',
};

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    searchQuery,
    setSearchQuery,
    isLoading,
    error,
    setError,
    suiInstalled,
    suiVersion,
    isServerConnected,
    fetchStatus,
    fetchAddresses,
    fetchEnvironments,
    checkServerConnection,
  } = useAppStore();

  const isHome = location.pathname === '/app';
  const title = ROUTE_TITLES[location.pathname] || 'Sui CLI';

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
  }, [checkServerConnection, fetchStatus, fetchAddresses, fetchEnvironments]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isHome) {
        navigate('/app');
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isHome, navigate]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const handleBack = () => {
    if (location.pathname.startsWith('/app/objects/')) {
      navigate('/app/objects');
    } else {
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-[15vh] px-4">
      <div className="w-full max-w-2xl bg-background-secondary rounded-xl shadow-modal border border-border overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="border-b border-border">
          <div className="flex items-center gap-2 px-4 py-2">
            {!isHome && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                <svg
                  className="w-4 h-4 text-muted-foreground"
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
            <span className="text-sm font-medium text-foreground">{title}</span>
            <div className="flex-1" />
            {isLoading && <Spinner size="sm" />}
            {suiInstalled && suiVersion && (
              <span className="text-xs text-muted-foreground">v{suiVersion}</span>
            )}
          </div>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={isHome ? 'Search commands...' : `Search...`}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-error/10 border-b border-error/20">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Sui not installed warning */}
        {suiInstalled === false && (
          <div className="px-4 py-3 bg-warning/10 border-b border-warning/20">
            <p className="text-sm text-warning">
              Sui CLI is not installed. Please install it to use this app.
            </p>
          </div>
        )}

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isServerConnected === false ? (
            // User wants to run backend manually, so we show the app even if not connected
            // The app will show errors if API calls fail, which is expected
            <Outlet />
          ) : isServerConnected === null ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="text-sm text-muted-foreground mt-3">
                  Connecting to local server...
                </p>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Kbd>↵</Kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Kbd>esc</Kbd>
              <span>Back</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Sui CLI Web</div>
        </div>
      </div>
    </div>
  );
}
