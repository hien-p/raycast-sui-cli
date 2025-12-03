import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommunityJoin } from '../CommunityJoin';
import { SetupInstructions } from '../SetupInstructions';
import { api } from '../../api/client';

export function LandingPage() {
  const navigate = useNavigate();
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

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

  const handleRetry = async () => {
    setIsRetrying(true);
    await checkServerConnection();
    setIsRetrying(false);
  };

  const handleEnter = () => {
    if (serverConnected) {
      navigate('/app');
    } else {
      handleRetry();
    }
  };

  useEffect(() => {
    checkServerConnection();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEnter();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [serverConnected]);

  // Show loading state while checking connection
  if (serverConnected === null) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#4da2ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Checking server connection...</p>
        </div>
      </div>
    );
  }

  // Show setup instructions if server is not connected
  if (!serverConnected) {
    return (
      <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden">
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
        <div className="relative z-10 min-h-screen flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-3xl w-full bg-background/90 backdrop-blur-sm rounded-xl border border-border shadow-2xl">
            <SetupInstructions onRetry={handleRetry} isRetrying={isRetrying} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden">
      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Content - Changed to allow scrolling */}
      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12 gap-6 sm:gap-8">
        {/* Logo / Title */}
        <div className="text-center animate-fade-in mt-8 sm:mt-12">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 animate-slide-up">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-[#4da2ff] animate-pulse"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-white to-[#4da2ff] bg-clip-text text-transparent">
              Sui CLI
            </h1>
          </div>
          <p className="text-base sm:text-lg text-white/70 max-w-md mx-auto px-4 animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
            A modern command palette interface for the Sui blockchain CLI
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 max-w-3xl w-full">
          <FeatureCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="Manage Addresses"
            description="Create, switch, and manage your Sui addresses"
            delay={0.2}
          />
          <FeatureCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            }
            title="Switch Networks"
            description="Easily switch between devnet, testnet, and mainnet"
            delay={0.3}
          />
          <FeatureCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Request Faucet"
            description="Get test tokens for development"
            delay={0.4}
          />
        </div>

        {/* CTA Button */}
        <button
          onClick={handleEnter}
          className="group relative px-8 py-4 bg-[#4da2ff] hover:bg-[#5cb0ff] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#4da2ff]/25 hover:shadow-xl hover:shadow-[#4da2ff]/30 hover:scale-105 animate-scale-in overflow-hidden"
          style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="relative flex items-center gap-2">
            Launch CLI
            <svg
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>

        {/* Keyboard shortcut hint */}
        <p className="text-sm text-white/40 animate-fade-in" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
          Press <kbd className="px-2 py-0.5 bg-white/10 rounded text-white/60 font-mono text-xs">Enter</kbd> to continue
        </p>

        {/* Community Stats */}
        <div className="max-w-md w-full animate-slide-up" style={{ animationDelay: '0.7s', opacity: 0, animationFillMode: 'forwards' }}>
          <CommunityJoin compact />
        </div>

        {/* Version & Roadmap */}
        <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 max-w-md w-full hover:bg-white/[0.07] hover:border-[#4da2ff]/20 transition-all duration-300 animate-slide-up mb-8 sm:mb-12" style={{ animationDelay: '0.8s', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#4da2ff]">v1.0.2 Beta</span>
            <span className="text-xs text-white/40">Early Access</span>
          </div>
          <p className="text-xs text-white/50 mb-2">
            Current features are just the beginning. More coming soon:
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white/60 hover:text-white/80 transition-all cursor-default">Move Deploy</span>
            <span className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white/60 hover:text-white/80 transition-all cursor-default">Transaction Builder</span>
            <span className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white/60 hover:text-white/80 transition-all cursor-default">NFT Gallery</span>
            <span className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white/60 hover:text-white/80 transition-all cursor-default">DeFi Integration</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 animate-fade-in" style={{ animationDelay: '0.9s', opacity: 0, animationFillMode: 'forwards' }}>
          <p className="text-xs text-white/30">
            Built for the Sui ecosystem
          </p>
        </div>
      </div>

      {/* Community Join Modal */}
      {showCommunityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl max-w-md w-full mx-4">
            <CommunityJoin onClose={() => setShowCommunityModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <div
      className="group p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 hover:border-[#4da2ff]/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#4da2ff]/10 animate-scale-in"
      style={{ animationDelay: `${delay}s`, opacity: 0, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="text-[#4da2ff] group-hover:scale-110 transition-transform duration-300">{icon}</div>
        <h3 className="font-medium text-white group-hover:text-[#4da2ff] transition-colors">{title}</h3>
      </div>
      <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">{description}</p>
    </div>
  );
}
