import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LandingPage } from './components/LandingPage';
import { MainLayout } from './components/layouts/MainLayout';
import { CommandPalette } from './components/CommandPalette';
import { AddressList } from './components/AddressList';
import { EnvironmentList } from './components/EnvironmentList';
import { ObjectList } from './components/ObjectList';
import { GasList } from './components/GasList';
import { FaucetForm } from './components/FaucetForm';
import { CommunityDashboard } from './components/CommunityDashboard';
import FaultyTerminal from './components/backgrounds/FaultyTerminal';

export function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <>
      {/* Global background */}
      <div className="fixed inset-0 z-0">
        <FaultyTerminal
          tint="#4da2ff"
          brightness={isLanding ? 0.15 : 0.08}
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
          <Route path="/app" element={<MainLayout />}>
            <Route index element={<CommandPalette />} />
            <Route path="addresses" element={<AddressList />} />
            <Route path="environments" element={<EnvironmentList />} />
            <Route path="objects" element={<ObjectList />} />
            <Route path="objects/:objectId" element={<ObjectList />} />
            <Route path="gas" element={<GasList />} />
            <Route path="faucet" element={<FaucetForm />} />
            <Route path="community" element={<CommunityDashboard />} />
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
