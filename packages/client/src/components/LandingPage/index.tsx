import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MembershipJoin } from '../MembershipJoin';
import { SetupInstructions } from '../SetupInstructions';
import { AnimatedGradient } from '@/components/ui/animated-gradient';
import { TierBadge, TIER_DROPLET, TIER_WAVE, TIER_TSUNAMI, TIER_OCEAN, TIER_METADATA } from '../TierBadge';
import { useAppStore } from '@/stores/useAppStore';
import {
  Terminal,
  Wallet,
  Network,
  Zap,
  Shield,
  Code2,
  Sparkles,
  Github,
  Download,
  Users,
  TrendingUp,
  ChevronRight,
  Apple,
  Box,
  MonitorSmartphone
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { communityStats } = useAppStore();

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
    <div className="relative w-full min-h-screen overflow-y-auto overflow-x-hidden">
      {/* Lighter overlay gradient for brighter appearance */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20">
          <div className="max-w-6xl w-full text-center space-y-8">
            {/* Logo with pulse animation */}
            <div className="inline-flex items-center justify-center gap-3 mb-6 animate-slide-up">
              <div className="relative">
                <div className="absolute inset-0 bg-[#4da2ff] blur-xl opacity-50 animate-pulse" />
                <svg
                  className="relative w-16 h-16 text-[#4da2ff]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-tight">
                Your <span className="bg-gradient-to-r from-[#4da2ff] via-[#5cb0ff] to-[#4da2ff] bg-clip-text text-transparent animate-gradient-x" style={{ backgroundSize: '200% auto' }}>Local Sui CLI</span>
                <br />
                <span className="text-white/90">Supercharged</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                A beautiful, Raycast-inspired web interface for the Sui blockchain CLI.
                <br />
                <span className="text-white/60 text-base sm:text-lg">Fast, secure, and works entirely on your machine.</span>
              </p>
            </div>

            {/* Cross-Platform Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
              <PlatformBadge icon={<Apple className="w-4 h-4" />} name="macOS" />
              <PlatformBadge icon={<Box className="w-4 h-4" />} name="Linux" />
              <PlatformBadge icon={<MonitorSmartphone className="w-4 h-4" />} name="Windows" />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-scale-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
              <button
                onClick={handleEnter}
                className="group relative px-8 py-4 bg-[#4da2ff] hover:bg-[#5cb0ff] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#4da2ff]/25 hover:shadow-xl hover:shadow-[#4da2ff]/30 hover:scale-105 overflow-hidden min-w-[200px]"
              >
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative flex items-center justify-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Launch CLI
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>

              <a
                href="https://github.com/hien-p/raycast-sui-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="group px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-200 border border-white/10 hover:border-[#4da2ff]/30 min-w-[200px] flex items-center justify-center gap-2"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>

            {/* Keyboard shortcut hint */}
            <p className="text-sm text-white/40 animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
              Press <kbd className="px-2 py-1 bg-white/10 rounded text-white/60 font-mono text-xs mx-1">Enter</kbd> to launch
            </p>
          </div>
        </section>

        {/* Enhanced Stats Section with Animation */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-transparent via-[#4da2ff]/[0.03] to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                value={communityStats.totalMembers.toLocaleString()}
                label="Community Members"
                color="blue"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                value="135+"
                label="Components"
                color="teal"
              />
              <StatCard
                icon={<Github className="w-6 h-6" />}
                value="Open Source"
                label="MIT License"
                color="purple"
              />
              <StatCard
                icon={<Shield className="w-6 h-6" />}
                value="100%"
                label="Local & Secure"
                color="green"
              />
            </div>
          </div>
        </section>

        {/* Demo Showcase Section - NEW */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4da2ff]/10 border border-[#4da2ff]/20 rounded-full text-sm text-[#4da2ff] font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                See It In Action
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Powerful Yet Simple
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                A command palette interface that makes complex blockchain operations feel effortless
              </p>
            </div>

            {/* Screenshot/Demo Placeholder with Glow Effect */}
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#4da2ff]/20 via-[#5cb0ff]/20 to-[#4da2ff]/20 rounded-3xl blur-3xl" />
              <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Mock Screenshot/Terminal */}
                <div className="aspect-video bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-8 flex flex-col justify-center items-center">
                  <div className="w-full max-w-2xl space-y-4">
                    {/* Mock Command Palette */}
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Terminal className="w-5 h-5 text-[#4da2ff]" />
                        <span className="text-white/60 text-sm">sui</span>
                        <span className="text-white/40">›</span>
                        <span className="text-white text-sm">client addresses</span>
                      </div>
                      <div className="space-y-2 pl-8">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-white/80 font-mono">0x915c...88ddb</span>
                          <span className="text-[#4da2ff]">elegant-epidote</span>
                          <span className="ml-auto text-white/60">38.54 SUI</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-white/20 rounded-full" />
                          <span className="text-white/80 font-mono">0x9b35...759ac</span>
                          <span className="text-white/60">modest-corundum</span>
                          <span className="ml-auto text-white/60">1.87 SUI</span>
                        </div>
                      </div>
                    </div>

                    {/* Feature Highlights */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/[0.03] backdrop-blur border border-white/5 rounded-lg p-4 text-center">
                        <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                        <p className="text-xs text-white/60">Instant Switching</p>
                      </div>
                      <div className="bg-white/[0.03] backdrop-blur border border-white/5 rounded-lg p-4 text-center">
                        <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <p className="text-xs text-white/60">100% Secure</p>
                      </div>
                      <div className="bg-white/[0.03] backdrop-blur border border-white/5 rounded-lg p-4 text-center">
                        <Sparkles className="w-6 h-6 text-[#4da2ff] mx-auto mb-2" />
                        <p className="text-xs text-white/60">Beautiful UI</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Professional-grade tools for managing your Sui blockchain operations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <FeatureBentoCard
                icon={<Wallet className="w-8 h-8" />}
                title="Multi-Address Management"
                description="Create, switch, and manage unlimited Sui addresses with ease. Import existing wallets or generate new ones."
                gradient="blue"
              />
              <FeatureBentoCard
                icon={<Network className="w-8 h-8" />}
                title="Network Switching"
                description="Seamlessly switch between Mainnet, Testnet, and Devnet. Custom RPC endpoints supported."
                gradient="teal"
              />
              <FeatureBentoCard
                icon={<Zap className="w-8 h-8" />}
                title="Gas Optimization"
                description="Split and merge gas coins intelligently. Visualize gas usage and optimize transaction costs."
                gradient="purple"
              />
              <FeatureBentoCard
                icon={<Code2 className="w-8 h-8" />}
                title="Smart Contract Tools"
                description="Deploy Move contracts, call functions, and interact with on-chain packages effortlessly."
                gradient="green"
                badge="Coming Soon"
              />
              <FeatureBentoCard
                icon={<Sparkles className="w-8 h-8" />}
                title="Community & Tiers"
                description="Join the community, earn tier badges, and showcase your on-chain activity with NFT cards."
                gradient="ocean"
              />
              <FeatureBentoCard
                icon={<Shield className="w-8 h-8" />}
                title="Privacy First"
                description="Your private keys never leave your machine. All operations run locally via your Sui CLI."
                gradient="blue"
              />
            </div>
          </div>
        </section>

        {/* Technology Stack - NEW */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-[#4da2ff]/[0.02] to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-400 font-medium mb-6">
                <Code2 className="w-4 h-4" />
                Built With Modern Stack
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Powered by Best-in-Class Tools
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Enterprise-grade technologies ensuring performance, security, and developer experience
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <TechStackCard name="React 18" icon="⚛️" color="cyan" />
              <TechStackCard name="TypeScript" icon="💙" color="blue" />
              <TechStackCard name="Fastify" icon="⚡" color="yellow" />
              <TechStackCard name="Sui Move" icon="🌊" color="teal" />
              <TechStackCard name="TailwindCSS" icon="🎨" color="sky" />
              <TechStackCard name="Vite" icon="⚡" color="purple" />
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">3-Tier</div>
                <div className="text-sm text-white/60">Browser → Server → CLI Architecture</div>
              </div>
              <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">&lt;100ms</div>
                <div className="text-sm text-white/60">Average API Response Time</div>
              </div>
              <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">100%</div>
                <div className="text-sm text-white/60">TypeScript Type Coverage</div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Onboarding Section - REDESIGNED for New Users */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-[#4da2ff]/[0.03] to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4da2ff]/10 to-teal-500/10 border border-[#4da2ff]/20 rounded-full text-sm text-[#4da2ff] font-medium mb-6 animate-pulse">
                <Users className="w-4 h-4" />
                Join {communityStats.totalMembers.toLocaleString()}+ Members
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Become Part of the Community
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Get your tier badge, unlock exclusive perks, and showcase your blockchain journey
              </p>
            </div>

            {/* What is Member? - NEW Section */}
            <div className="max-w-5xl mx-auto mb-16">
              <div className="relative group">
                {/* Glowing background effect */}
                <div className="absolute -inset-6 bg-gradient-to-r from-[#4da2ff]/20 via-purple-500/20 to-teal-500/20 rounded-3xl blur-3xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />

                <div className="relative bg-gradient-to-br from-white/[0.12] to-white/[0.04] backdrop-blur-xl border border-white/30 rounded-2xl p-8 sm:p-12 shadow-2xl">
                  {/* Header */}
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4da2ff] to-purple-500 rounded-2xl mb-4 shadow-lg shadow-[#4da2ff]/30 group-hover:scale-110 transition-transform">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                      What is Member?
                    </h3>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                      A gamified on-chain identity system that rewards your Sui blockchain activity
                    </p>
                  </div>

                  {/* Main explanation */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Left column - Purpose */}
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#4da2ff] to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-[#4da2ff]/20">
                            <span className="text-xl">🎯</span>
                          </div>
                          <h4 className="text-xl font-semibold text-white">The Purpose</h4>
                        </div>
                        <p className="text-white/80 leading-relaxed pl-13">
                          Track and showcase your journey on Sui blockchain. Your membership NFT evolves as you build,
                          creating a living record of your contributions to the ecosystem.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
                            <span className="text-xl">💎</span>
                          </div>
                          <h4 className="text-xl font-semibold text-white">How It Works</h4>
                        </div>
                        <p className="text-white/80 leading-relaxed pl-13">
                          Join once, get your Droplet tier. As you make transactions and deploy contracts,
                          you automatically level up: Wave → Tsunami → Ocean. No manual claims needed!
                        </p>
                      </div>
                    </div>

                    {/* Right column - Benefits */}
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <span className="text-xl">🎁</span>
                          </div>
                          <h4 className="text-xl font-semibold text-white">What You Get</h4>
                        </div>
                        <ul className="space-y-2 text-white/80 pl-13">
                          <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">✓</span>
                            <span>Evolving NFT tier badge (Droplet → Ocean)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">✓</span>
                            <span>On-chain reputation & activity tracking</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">✓</span>
                            <span>Priority features as you level up</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">✓</span>
                            <span>Governance voting (Tsunami+ tier)</span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20">
                            <span className="text-xl">🔐</span>
                          </div>
                          <h4 className="text-xl font-semibold text-white">Privacy First</h4>
                        </div>
                        <p className="text-white/80 leading-relaxed pl-13">
                          We only record your public address and join timestamp. All activity metrics are
                          pulled from public blockchain data. Zero tracking, fully transparent.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Benefits Highlight Banner */}
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4da2ff]/10 via-purple-500/10 to-teal-500/10 rounded-xl" />
                    <div className="relative border border-[#4da2ff]/30 rounded-xl p-6 backdrop-blur-sm">
                      <div className="text-center mb-4">
                        <h4 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                          Why Join Today?
                        </h4>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4 text-center">
                        <div className="group">
                          <div className="text-3xl font-bold bg-gradient-to-r from-[#4da2ff] to-blue-400 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform">
                            Free
                          </div>
                          <div className="text-sm text-white/70">
                            Only ~0.01 SUI gas fee
                          </div>
                        </div>
                        <div className="group">
                          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform">
                            Instant
                          </div>
                          <div className="text-sm text-white/70">
                            Badge in seconds
                          </div>
                        </div>
                        <div className="group">
                          <div className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform">
                            Permanent
                          </div>
                          <div className="text-sm text-white/70">
                            Stored on-chain forever
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Join - Step by Step */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#4da2ff]/10 via-teal-500/10 to-[#4da2ff]/10 rounded-3xl blur-2xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md border border-white/20 rounded-2xl p-8 sm:p-12">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                      How to Join
                    </h3>
                    <p className="text-white/70">Simple 3-step process to get started</p>
                  </div>

                  <div className="space-y-6 mb-8">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4 group animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
                      <div className="flex-shrink-0 w-10 h-10 bg-[#4da2ff] rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform shadow-lg shadow-[#4da2ff]/30">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-[#4da2ff] transition-colors">
                          Launch the CLI and Connect
                        </h4>
                        <p className="text-white/60 text-sm">
                          Make sure you have at least one Sui address created. Your address will be used to join the community.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4 group animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
                      <div className="flex-shrink-0 w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform shadow-lg shadow-teal-500/30">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-teal-400 transition-colors">
                          Join the Community Registry
                        </h4>
                        <p className="text-white/60 text-sm mb-2">
                          Click the button below to register your address on the community smart contract (testnet).
                        </p>
                        <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
                          <Zap className="w-4 h-4" />
                          <span>Small gas fee required (~0.01 SUI) - Use testnet faucet if needed</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4 group animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                          Get Your Tier Badge Instantly
                        </h4>
                        <p className="text-white/60 text-sm">
                          Once registered, you'll receive your <span className="text-[#4da2ff] font-medium">Droplet 💧</span> tier badge immediately. Level up by being active on-chain!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Join CTA */}
                  <div className="text-center animate-scale-in" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
                    <MembershipJoin compact={false} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tier Progression - What You Can Earn */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Tier Progression System
                </h3>
                <p className="text-white/60">Level up by being active on Sui blockchain</p>
              </div>

              <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4da2ff]/20 via-teal-500/20 to-purple-500/20 -translate-y-1/2 hidden lg:block" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
                  <TierShowcaseCard
                    tier={TIER_DROPLET}
                    requirement="✅ Just Join!"
                    description="Everyone starts here"
                    benefits={["Full CLI access", "Track stats", "Community member"]}
                  />
                  <TierShowcaseCard
                    tier={TIER_WAVE}
                    requirement="25+ Transactions"
                    description="Active user"
                    benefits={["Animated badge", "Priority support", "NFT card"]}
                  />
                  <TierShowcaseCard
                    tier={TIER_TSUNAMI}
                    requirement="100+ Transactions"
                    description="Power user"
                    benefits={["Custom themes", "Voting rights", "Featured"]}
                  />
                  <TierShowcaseCard
                    tier={TIER_OCEAN}
                    requirement="500+ Transactions"
                    description="Elite builder"
                    benefits={["All features", "Ambassador", "Revenue share"]}
                  />
                </div>
              </div>
            </div>

            {/* Benefits Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center group hover:bg-white/[0.05] hover:border-[#4da2ff]/30 transition-all hover:scale-105">
                <Shield className="w-10 h-10 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-semibold text-white mb-2">100% On-Chain</h4>
                <p className="text-sm text-white/60">
                  Your membership is stored on Sui blockchain. Fully transparent and verifiable.
                </p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center group hover:bg-white/[0.05] hover:border-[#4da2ff]/30 transition-all hover:scale-105">
                <Sparkles className="w-10 h-10 text-[#4da2ff] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-semibold text-white mb-2">Earn Perks</h4>
                <p className="text-sm text-white/60">
                  Unlock features, badges, and benefits as you level up through tiers.
                </p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center group hover:bg-white/[0.05] hover:border-[#4da2ff]/30 transition-all hover:scale-105">
                <Users className="w-10 h-10 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-semibold text-white mb-2">Growing Community</h4>
                <p className="text-sm text-white/60">
                  Join {communityStats.totalMembers.toLocaleString()}+ builders and grow together in the Sui ecosystem.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Installation Guide */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Quick Start
              </h2>
              <p className="text-lg text-white/60">
                Get up and running in under a minute
              </p>
            </div>

            <div className="space-y-6">
              <InstallStep
                number={1}
                title="Install Sui CLI"
                description="First, make sure you have the Sui CLI installed on your system"
                commands={[
                  { os: 'macOS', cmd: 'brew install sui' },
                  { os: 'Linux', cmd: 'cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui' },
                  { os: 'Windows', cmd: 'cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui' },
                ]}
              />
              <InstallStep
                number={2}
                title="Install Local Server"
                description="Install the local server that connects this UI to your Sui CLI"
                commands={[
                  { os: 'All Platforms', cmd: 'npm install -g sui-cli-web-server' },
                ]}
              />
              <InstallStep
                number={3}
                title="Launch"
                description="Start the server and open the web interface"
                commands={[
                  { os: 'All Platforms', cmd: 'npx sui-cli-web-server' },
                ]}
              />
            </div>

            <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-white/70">
                  <strong className="text-white">100% Secure:</strong> Your private keys stay on your machine.
                  The server runs locally and never sends sensitive data anywhere.
                  {' '}
                  <a href="https://github.com/hien-p/raycast-sui-cli" target="_blank" rel="noopener noreferrer" className="text-[#4da2ff] hover:underline">
                    View source code
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap/Coming Soon */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                What's Next
              </h2>
              <p className="text-lg text-white/60">
                We're just getting started. More features coming soon.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <RoadmapCard title="Transaction Builder" status="In Progress" />
              <RoadmapCard title="Move Deploy UI" status="Planned" />
              <RoadmapCard title="NFT Gallery" status="Planned" />
              <RoadmapCard title="DeFi Integration" status="Research" />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <svg className="w-8 h-8 text-[#4da2ff]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span className="font-bold text-white">Sui CLI Web</span>
                </div>
                <p className="text-sm text-white/50">
                  Beautiful web interface for Sui blockchain CLI
                </p>
              </div>

              {/* Product */}
              <div>
                <h3 className="font-semibold text-white mb-3 text-sm">Product</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li><a href="https://www.harriweb3.dev" target="_blank" rel="noopener noreferrer" className="hover:text-[#4da2ff] transition-colors">Live Demo</a></li>
                  <li><a href="https://github.com/hien-p/raycast-sui-cli" target="_blank" rel="noopener noreferrer" className="hover:text-[#4da2ff] transition-colors">Documentation</a></li>
                  <li><button onClick={() => setShowMembershipModal(true)} className="hover:text-[#4da2ff] transition-colors">Community</button></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="font-semibold text-white mb-3 text-sm">Resources</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li><a href="https://github.com/hien-p/raycast-sui-cli" target="_blank" rel="noopener noreferrer" className="hover:text-[#4da2ff] transition-colors">GitHub</a></li>
                  <li><a href="https://www.npmjs.com/package/sui-cli-web" target="_blank" rel="noopener noreferrer" className="hover:text-[#4da2ff] transition-colors">NPM Package</a></li>
                  <li><a href="https://sui.io" target="_blank" rel="noopener noreferrer" className="hover:text-[#4da2ff] transition-colors">Sui Network</a></li>
                </ul>
              </div>

              {/* Connect */}
              <div>
                <h3 className="font-semibold text-white mb-3 text-sm">Connect</h3>
                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com/hien-p/raycast-sui-cli"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="GitHub"
                  >
                    <Github className="w-5 h-5 text-white/80" />
                  </a>
                  <a
                    href="https://www.npmjs.com/package/sui-cli-web"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="NPM"
                  >
                    <Download className="w-5 h-5 text-white/80" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
              <div>
                <span className="text-[#4da2ff]">v1.1.0</span> · Built for the Sui ecosystem
              </div>
              <div>
                Open source under MIT License
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Membership Join Modal */}
      {showMembershipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl max-w-md w-full mx-4">
            <MembershipJoin onClose={() => setShowMembershipModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Component: Platform Badge
interface PlatformBadgeProps {
  icon: React.ReactNode;
  name: string;
}

function PlatformBadge({ icon, name }: PlatformBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 hover:bg-white/10 hover:border-[#4da2ff]/30 transition-all group">
      <div className="text-white/70 group-hover:text-[#4da2ff] transition-colors">{icon}</div>
      <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{name}</span>
    </div>
  );
}

// Component: Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: 'blue' | 'teal' | 'purple' | 'green';
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  const colors = {
    blue: 'text-blue-400',
    teal: 'text-teal-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
  };

  return (
    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:border-[#4da2ff]/20 transition-all group">
      <div className={`${colors[color]} mb-3 group-hover:scale-110 transition-transform`}>{icon}</div>
      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/60">{label}</div>
    </div>
  );
}

// Component: Feature Bento Card
interface FeatureBentoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: 'blue' | 'teal' | 'purple' | 'green' | 'ocean';
  badge?: string;
}

function FeatureBentoCard({ icon, title, description, gradient, badge }: FeatureBentoCardProps) {
  return (
    <AnimatedGradient variant={gradient} className="p-6 rounded-xl border border-white/10 hover:border-[#4da2ff]/30 transition-all hover:scale-[1.02] group">
      <div className="flex items-start justify-between mb-4">
        <div className="text-[#4da2ff] group-hover:scale-110 transition-transform">{icon}</div>
        {badge && (
          <span className="px-2 py-1 text-xs font-medium bg-[#4da2ff]/20 text-[#4da2ff] rounded-full border border-[#4da2ff]/30">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#4da2ff] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-white/60 leading-relaxed">{description}</p>
    </AnimatedGradient>
  );
}

// Component: Tech Stack Card
interface TechStackCardProps {
  name: string;
  icon: string;
  color: 'cyan' | 'blue' | 'yellow' | 'teal' | 'sky' | 'purple';
}

function TechStackCard({ name, icon, color }: TechStackCardProps) {
  const colors = {
    cyan: 'group-hover:border-cyan-500/30 group-hover:shadow-cyan-500/10',
    blue: 'group-hover:border-blue-500/30 group-hover:shadow-blue-500/10',
    yellow: 'group-hover:border-yellow-500/30 group-hover:shadow-yellow-500/10',
    teal: 'group-hover:border-teal-500/30 group-hover:shadow-teal-500/10',
    sky: 'group-hover:border-sky-500/30 group-hover:shadow-sky-500/10',
    purple: 'group-hover:border-purple-500/30 group-hover:shadow-purple-500/10',
  };

  return (
    <div className={`group relative bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-6 text-center transition-all hover:scale-105 hover:shadow-lg ${colors[color]}`}>
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{name}</div>
    </div>
  );
}

// Component: Tier Showcase Card
interface TierShowcaseCardProps {
  tier: number;
  requirement: string;
  description: string;
  benefits: string[];
}

function TierShowcaseCard({ tier, requirement, description, benefits }: TierShowcaseCardProps) {
  const metadata = TIER_METADATA[tier as keyof typeof TIER_METADATA];

  return (
    <div className={`p-6 rounded-xl border backdrop-blur-sm hover:scale-105 transition-all ${metadata.bgClass} ${metadata.borderClass} ${metadata.glowClass} group`}>
      <div className="text-center mb-4">
        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{metadata.icon}</div>
        <TierBadge tier={tier} size="md" showGlow={false} className="mx-auto mb-2" />
        <div className="text-xs text-white/50 mb-1">{description}</div>
      </div>
      <div className={`text-sm font-semibold ${metadata.textClass} mb-3 text-center`}>{requirement}</div>
      <ul className="space-y-2 text-xs text-white/70">
        {benefits.map((benefit, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-[#4da2ff] mt-0.5">✓</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component: Install Step
interface InstallStepProps {
  number: number;
  title: string;
  description: string;
  commands: Array<{ os: string; cmd: string }>;
}

function InstallStep({ number, title, description, commands }: InstallStepProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-[#4da2ff] text-white rounded-full flex items-center justify-center font-bold">
          {number}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-white/60">{description}</p>
          </div>
          <div className="space-y-2">
            {commands.map((cmd, i) => (
              <div key={i} className="space-y-1">
                <div className="text-xs font-medium text-white/50">{cmd.os}</div>
                <div className="relative group">
                  <pre className="bg-black/40 rounded-lg p-3 text-sm font-mono text-white overflow-x-auto border border-white/10">
                    {cmd.cmd}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(cmd.cmd)}
                    className="absolute top-2 right-2 p-2 rounded bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                    title="Copy to clipboard"
                  >
                    {copied === cmd.cmd ? (
                      <span className="text-xs text-green-400">✓</span>
                    ) : (
                      <span className="text-xs text-white/60">Copy</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component: Roadmap Card
interface RoadmapCardProps {
  title: string;
  status: string;
}

function RoadmapCard({ title, status }: RoadmapCardProps) {
  const statusColors = {
    'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Planned': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Research': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  } as const;

  return (
    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all">
      <h4 className="text-white font-medium mb-2">{title}</h4>
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${statusColors[status as keyof typeof statusColors]}`}>
        {status}
      </span>
    </div>
  );
}
