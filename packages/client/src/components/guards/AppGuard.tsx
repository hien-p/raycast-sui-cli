import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function AppGuard() {
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        const isConnected = response.ok;
        setServerConnected(isConnected);

        if (!isConnected && !hasChecked) {
          toast.error('⚠️ Server not running. Please start the server first.', {
            duration: 4000,
            position: 'top-center',
          });
        }
      } catch (error) {
        setServerConnected(false);
        if (!hasChecked) {
          toast.error('⚠️ Server not running. Please start the server first.', {
            duration: 4000,
            position: 'top-center',
          });
        }
      } finally {
        setHasChecked(true);
      }
    };

    checkServerConnection();
  }, [hasChecked]);

  // Show loading state while checking
  if (serverConnected === null) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
          <p className="text-white/60">Connecting to server...</p>
        </div>
      </div>
    );
  }

  // Redirect to setup if not connected
  if (!serverConnected) {
    return <Navigate to="/setup" replace />;
  }

  // Render app if connected
  return <MainLayout />;
}
