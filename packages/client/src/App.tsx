import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { SetupPage } from './components/SetupPage';
import { AppGuard } from './components/guards/AppGuard';
import { CommandPalette } from './components/CommandPalette';
import { AddressList } from './components/AddressList';
import { EnvironmentList } from './components/EnvironmentList';
import { ObjectList } from './components/ObjectList';
import { GasList } from './components/GasList';
import { FaucetForm } from './components/FaucetForm';
import { MembershipProfile } from './components/MembershipProfile';
import { TransferSui } from './components/TransferSui';
import { MoveDeploy } from './components/MoveDeploy';
import { TransactionBuilder } from './components/TransactionBuilder';
import { MembershipGuard } from './components/guards/MembershipGuard';
import FaultyTerminal from './components/backgrounds/FaultyTerminal';
import { trackPageView } from './lib/analytics';

export function App() {
  const location = useLocation();

  // Determine if we're in app routes
  const isAppRoute = location.pathname.startsWith('/app');
  const isMoveDevStudio = location.pathname === '/app/move';

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
      {/* Dynamic background based on route */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <FaultyTerminal
          tint={isMoveDevStudio ? "#22c55e" : isAppRoute ? "#4da2ff" : "#ff0000"}
          brightness={isMoveDevStudio ? 0.3 : isAppRoute ? 0.5 : 0.8}
          scale={isMoveDevStudio ? 0.5 : isAppRoute ? 1.2 : 1.9}
          gridMul={isMoveDevStudio ? [4, 2] : [2, 1]}
          digitSize={isMoveDevStudio ? 1.2 : 1.3}
          glitchAmount={isMoveDevStudio ? 0.8 : 0}
          flickerAmount={isMoveDevStudio ? 0.5 : 0}
          scanlineIntensity={isMoveDevStudio ? 0.3 : 0.5}
          curvature={isMoveDevStudio ? 0.1 : isAppRoute ? 1.5 : 0.4}
          mouseReact={isMoveDevStudio}
          mouseStrength={isMoveDevStudio ? 0.2 : 0}
          timeScale={0.5}
          noiseAmp={isMoveDevStudio ? 0 : isAppRoute ? 0.5 : 0.7}
          className="curved-panel"
          style={{
            transformStyle: "preserve-3d",
            perspective: "2000px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Routes>
          {/* Marketing/Landing Page - No server check */}
          <Route path="/" element={<HomePage />} />

          {/* Setup Guide Page - Has server check, shows instructions */}
          <Route path="/setup" element={<SetupPage />} />

          {/* App Routes - Protected by AppGuard */}
          <Route path="/app" element={<AppGuard />}>
            <Route index element={<CommandPalette />} />
            <Route path="addresses" element={<AddressList />} />
            <Route path="environments" element={<EnvironmentList />} />
            <Route path="objects" element={<ObjectList />} />
            <Route path="objects/:objectId" element={<ObjectList />} />
            <Route path="gas" element={<GasList />} />
            <Route path="faucet" element={<FaucetForm />} />
            <Route path="membership" element={<MembershipProfile />} />
            <Route path="transfer" element={<TransferSui />} />
            <Route path="move" element={<MoveDeploy />} />
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
