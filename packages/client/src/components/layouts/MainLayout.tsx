import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Kbd } from '../shared/Kbd';
import { Spinner } from '../shared/Spinner';
import { SearchInput } from '../CommandPalette/SearchInput';
import { FloatingParticles } from '../ui/floating-particles';
import { useAppStore } from '@/stores/useAppStore';

const ROUTE_TITLES: Record<string, string> = {
  '/app': 'Sui CLI',
  '/app/addresses': 'Manage Addresses',
  '/app/environments': 'Switch Environment',
  '/app/objects': 'My Objects',
  '/app/gas': 'Gas Coins',
  '/app/faucet': 'Request Faucet',
  '/app/membership': 'My Profile',
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
    themeMode,
    setThemeMode,
    gridEnabled,
    setGridEnabled,
  } = useAppStore();

  const isHome = location.pathname === '/app';
  const title = ROUTE_TITLES[location.pathname] || 'Sui CLI';

  // Check connection and fetch initial data on mount
  useEffect(() => {
    const init = async () => {
      const connected = await checkServerConnection();
      if (connected) {
        // Fetch all data in parallel for faster loading
        await Promise.all([
          fetchStatus(),
          fetchAddresses(),
          fetchEnvironments(),
        ]);
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

  const isDark = themeMode === 'dark';

  // Determine max width based on current route
  // Wide layout fills more screen space, normal layout has max width
  const isWideLayout = ['/app/transfer', '/app/move', '/app/inspector'].includes(location.pathname);
  // Use percentage-based max-width for better zoom support
  // Increased default terminal size: sm:max-w-lg -> sm:max-w-xl, md:max-w-2xl -> md:max-w-3xl
  const maxWidthClass = isWideLayout
    ? 'max-w-[95vw] xl:max-w-[90vw] 2xl:max-w-[1800px]'
    : 'max-w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl';

  return (
    <div className="min-h-screen flex items-start justify-center pt-[3vh] sm:pt-[5vh] md:pt-[8vh] lg:pt-[10vh] px-2 sm:px-4">
      <div className={`w-full ${maxWidthClass} relative group curved-terminal-wrapper`}>
        {/* Animated gradient orbs - only in glass mode */}
        {!isDark && (
          <div className="absolute -inset-20 opacity-30">
            <div className="absolute top-0 -left-10 w-72 h-72 bg-[#4da2ff] rounded-full mix-blend-screen filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-10 w-72 h-72 bg-[#0ea5e9] rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#4da2ff] rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />
          </div>
        )}

        {/* Enhanced glow effect - only in glass mode */}
        {!isDark && (
          <>
            <div className="absolute -inset-1 bg-gradient-to-r from-[#4da2ff]/20 via-[#0ea5e9]/20 to-[#4da2ff]/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 rounded-2xl animate-shimmer" />
            <div className="absolute -inset-[2px] bg-gradient-to-r from-[#4da2ff]/30 via-[#0ea5e9]/30 to-[#4da2ff]/30 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
          </>
        )}

        <div className={`${isWideLayout ? 'curved-panel-wide' : 'curved-panel'} relative rounded-xl shadow-2xl overflow-hidden animate-scale-in ${
          isDark
            ? 'bg-[#121218]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.05)]'
            : 'bg-[#0c1a2d]/90 backdrop-blur-2xl border border-[#4da2ff]/20 shadow-[0_0_40px_rgba(77,162,255,0.15)]'
        }`}>
          {/* Glass mode overlays */}
          {!isDark && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#0ea5e9]/10 via-[#0284c7]/5 to-[#0369a1]/8 pointer-events-none z-[1]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(14,165,233,0.15),transparent_60%)] pointer-events-none z-[1]" />
              {gridEnabled && (
                <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.2)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-[2]" />
              )}
              <FloatingParticles />
            </>
          )}

          {/* Dark mode grid pattern */}
          {isDark && gridEnabled && (
            <div className="absolute inset-0 bg-[linear-gradient(rgba(77,162,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(77,162,255,0.06)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-[2]" />
          )}

          {/* Header with enhanced gradient and glow */}
          <div className={`relative border-b ${isDark ? 'border-white/[0.06] bg-[#15151b]' : 'border-[#4da2ff]/10 bg-[#0a1525]/80'}`}>
            {/* Top shine effect - only glass mode */}
            {!isDark && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0ea5e9]/50 to-transparent pointer-events-none" />}
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

            {/* Grid Toggle */}
            <button
              onClick={() => setGridEnabled(!gridEnabled)}
              className="p-1.5 hover:bg-secondary rounded-lg transition-all group"
              title={gridEnabled ? 'Hide grid pattern' : 'Show grid pattern'}
            >
              {gridEnabled ? (
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-[#4da2ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9h16M4 15h16M9 4v16M15 4v16" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                </svg>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setThemeMode(isDark ? 'glass' : 'dark')}
              className="p-1.5 hover:bg-secondary rounded-lg transition-all group"
              title={isDark ? 'Switch to Glass mode' : 'Switch to Dark mode'}
            >
              {isDark ? (
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-[#4da2ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {isLoading && <Spinner size="sm" />}
            {suiInstalled && suiVersion && (
              <span className="text-xs text-muted-foreground">v{suiVersion}</span>
            )}
            </div>
            {!isHome && (
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search..."
              />
            )}
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
        <div className="max-h-[85vh] sm:max-h-[82vh] md:max-h-[78vh] lg:max-h-[75vh] overflow-y-auto">
          {isServerConnected === false ? (
            // User wants to run backend manually, so we show the app even if not connected
            // The app will show errors if API calls fail, which is expected
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                  mass: 0.8
                }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
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
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                  mass: 0.8
                }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer with enhanced effects */}
        <div className={`relative flex items-center justify-between px-3 sm:px-4 py-2 border-t ${isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-[#1e3a5f]/40 bg-[#0a1929]/60'}`}>
          {/* Bottom shine effect - only glass mode */}
          {!isDark && <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#0ea5e9]/50 to-transparent pointer-events-none" />}
          <div className="hidden sm:flex items-center gap-4">
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
          {/* Mobile: simplified footer */}
          <div className="flex sm:hidden items-center gap-2 text-xs text-muted-foreground">
            <span>Tap to select</span>
          </div>
          <div className="text-xs text-muted-foreground">Sui CLI Web</div>
        </div>
        </div>
      </div>
    </div>
  );
}
