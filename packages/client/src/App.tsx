import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { MainLayout } from './components/layouts/MainLayout';
import { CommandPalette } from './components/CommandPalette';
import { AddressList } from './components/AddressList';
import { EnvironmentList } from './components/EnvironmentList';
import { ObjectList } from './components/ObjectList';
import { GasList } from './components/GasList';
import { FaucetForm } from './components/FaucetForm';
import { MembershipProfile } from './components/MembershipProfile';
import { TransferSui } from './components/TransferSui';
import FaultyTerminal from './components/backgrounds/FaultyTerminal';
import { trackPageView } from './lib/analytics';

export function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);

  // Track page views on route change
  useEffect(() => {
    const pageName = location.pathname === '/' ? 'Landing Page' :
                     location.pathname === '/app' ? 'Dashboard' :
                     location.pathname.includes('/app/') ? location.pathname.replace('/app/', '') : 'Unknown';
    trackPageView(pageName);
  }, [location.pathname]);

  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        setServerConnected(response.ok);
      } catch (error) {
        setServerConnected(false);
      }
    };

    checkServerConnection();
    const interval = setInterval(checkServerConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Global background */}
      <div className="fixed inset-0 z-0">
        <FaultyTerminal
          tint="#4da2ff"
          brightness={isLanding ? 0.5 : 0.08}
          scale={1.2}
          glitchAmount={0.5}
          flickerAmount={0.3}
          scanlineIntensity={0.2}
          curvature={0.1}
          mouseReact={true}
          mouseStrength={0.3}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/app"
            element={serverConnected ? <MainLayout /> : <Navigate to="/" replace />}
          >
            <Route index element={<CommandPalette />} />
            <Route path="addresses" element={<AddressList />} />
            <Route path="environments" element={<EnvironmentList />} />
            <Route path="objects" element={<ObjectList />} />
            <Route path="objects/:objectId" element={<ObjectList />} />
            <Route path="gas" element={<GasList />} />
            <Route path="faucet" element={<FaucetForm />} />
            <Route path="membership" element={<MembershipProfile />} />
            <Route path="transfer" element={<TransferSui />} />
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
