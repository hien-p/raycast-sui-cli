import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, lazy, Suspense } from 'react';
import { AppGuard } from './components/guards/AppGuard';
import { MembershipGuard } from './components/guards/MembershipGuard';
import { trackPageView } from './lib/analytics';

// Lazy load ALL route components for better initial load and code splitting
const HomePage = lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })));
const SetupPage = lazy(() => import('./components/SetupPage').then(m => ({ default: m.SetupPage })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));
const AddressList = lazy(() => import('./components/AddressList').then(m => ({ default: m.AddressList })));
const EnvironmentList = lazy(() => import('./components/EnvironmentList').then(m => ({ default: m.EnvironmentList })));
const ObjectList = lazy(() => import('./components/ObjectList').then(m => ({ default: m.ObjectList })));
// GasList removed - redirecting to CoinList instead
const FaucetForm = lazy(() => import('./components/FaucetForm').then(m => ({ default: m.FaucetForm })));
const MembershipProfile = lazy(() => import('./components/MembershipProfile').then(m => ({ default: m.MembershipProfile })));
const TransferSui = lazy(() => import('./components/TransferSui').then(m => ({ default: m.TransferSui })));
const MoveDeploy = lazy(() => import('./components/MoveDeploy').then(m => ({ default: m.MoveDeploy })));
const TransactionBuilder = lazy(() => import('./components/TransactionBuilder').then(m => ({ default: m.TransactionBuilder })));
const MembershipLookup = lazy(() => import('./components/MembershipLookup').then(m => ({ default: m.MembershipLookup })));
const DynamicFieldExplorer = lazy(() => import('./components/DynamicFieldExplorer').then(m => ({ default: m.DynamicFieldExplorer })));
const DevTools = lazy(() => import('./components/DevTools').then(m => ({ default: m.DevTools })));
const SecurityTools = lazy(() => import('./components/SecurityTools').then(m => ({ default: m.SecurityTools })));
const KeytoolManager = lazy(() => import('./components/KeytoolManager').then(m => ({ default: m.KeytoolManager })));
const CoinList = lazy(() => import('./components/CoinList').then(m => ({ default: m.CoinList })));
const CoinSplit = lazy(() => import('./components/CoinSplit').then(m => ({ default: m.CoinSplit })));
const CoinMerge = lazy(() => import('./components/CoinMerge').then(m => ({ default: m.CoinMerge })));
const CoinTransfer = lazy(() => import('./components/CoinTransfer').then(m => ({ default: m.CoinTransfer })));
const GameDemo = lazy(() => import('./components/GameDemo').then(m => ({ default: m.GameDemo })));

// Lazy load heavy background component
const FaultyTerminal = lazy(() => import('./components/backgrounds/FaultyTerminal'));

// Simple loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="w-6 h-6 border-2 border-sui-blue border-t-transparent rounded-full animate-spin" />
  </div>
);

export function App() {
  const location = useLocation();

  // Determine if we're in app routes
  const isAppRoute = location.pathname.startsWith('/app');
  const isMoveDevStudio = location.pathname === '/app/move';
  const isMembershipPage = location.pathname === '/membership';

  // Show animated background on all pages
  const showAnimatedBackground = true;

  // Track page views on route change
  useEffect(() => {
    const pageName = location.pathname === '/' ? 'Home Page' :
                     location.pathname === '/setup' ? 'Setup Page' :
                     location.pathname === '/app' ? 'Dashboard' :
                     location.pathname.includes('/app/') ? location.pathname.replace('/app/', '') : 'Unknown';
    trackPageView(pageName);
  }, [location.pathname]);

  return (
    <>
      {/* Dynamic background - only on landing page for performance */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {showAnimatedBackground ? (
          <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-[#0a1929] via-[#0d2137] to-[#0a1929]" />}>
            <FaultyTerminal
              tint={isMoveDevStudio ? "#22c55e" : (isAppRoute || isMembershipPage) ? "#4da2ff" : "#ff0000"}
              brightness={isMoveDevStudio ? 0.2 : (isAppRoute || isMembershipPage) ? 0.3 : 0.25}
              scale={isMoveDevStudio ? 0.5 : (isAppRoute || isMembershipPage) ? 1.0 : 1.9}
              gridMul={isMoveDevStudio ? [4, 2] : [2, 1]}
              digitSize={isMoveDevStudio ? 1.2 : 1.3}
              glitchAmount={isMoveDevStudio ? 0.8 : 0}
              flickerAmount={isMoveDevStudio ? 0.5 : 0}
              scanlineIntensity={isMoveDevStudio ? 0.3 : 0.5}
              curvature={isMoveDevStudio ? 0.1 : (isAppRoute || isMembershipPage) ? 1.5 : 0.4}
              mouseReact={isMoveDevStudio}
              mouseStrength={isMoveDevStudio ? 0.2 : 0}
              timeScale={0.5}
              noiseAmp={isMoveDevStudio ? 0 : (isAppRoute || isMembershipPage) ? 0.3 : 0.5}
              className="curved-panel"
              dpr={1} // Lower DPR for better performance
              style={{
                transformStyle: "preserve-3d",
                perspective: "2000px",
              }}
            />
          </Suspense>
        ) : (
          // Simple gradient for non-landing pages or low-power devices
          <div className="w-full h-full bg-gradient-to-br from-[#0a1929] via-[#0d2137] to-[#0a1929]" />
        )}

        {/* Subtle blur overlay for app routes and membership page - makes terminal stand out more */}
        {(isAppRoute || isMembershipPage) && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Marketing/Landing Page - No server check */}
            <Route path="/" element={<HomePage />} />

            {/* Setup Guide Page - Has server check, shows instructions */}
            <Route path="/setup" element={<SetupPage />} />

            {/* Public Membership Lookup - No server required, queries blockchain directly */}
            <Route path="/membership" element={<MembershipLookup />} />

            {/* App Routes - Protected by AppGuard */}
            <Route path="/app" element={<AppGuard />}>
              <Route index element={<CommandPalette />} />
              <Route path="addresses" element={<AddressList />} />
              <Route path="environments" element={<EnvironmentList />} />
              <Route path="objects" element={<ObjectList />} />
              <Route path="objects/:objectId" element={<ObjectList />} />
              <Route path="dynamic-fields" element={<DynamicFieldExplorer />} />
              <Route path="gas" element={<Navigate to="/app/coins" replace />} />
              <Route path="coins" element={<CoinList />} />
              <Route path="coins/split" element={<CoinSplit />} />
              <Route path="coins/merge" element={<CoinMerge />} />
              <Route path="coins/transfer" element={<CoinTransfer />} />
              <Route path="faucet" element={<FaucetForm />} />
              <Route path="membership" element={<MembershipProfile />} />
              <Route path="transfer" element={<TransferSui />} />
              <Route path="move" element={<MoveDeploy />} />
              <Route path="devtools" element={<DevTools />} />
              <Route path="security" element={<SecurityTools />} />
              <Route path="keytool" element={<KeytoolManager />} />
              <Route path="game-demo" element={<GameDemo />} />
              <Route
                path="inspector"
                element={
                  <MembershipGuard featureName="Transaction Inspector">
                    <TransactionBuilder />
                  </MembershipGuard>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#2a2a2a',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#34c759',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff453a',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
