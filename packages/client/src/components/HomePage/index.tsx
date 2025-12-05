import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MembershipJoin } from '../MembershipJoin';
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
  MonitorSmartphone,
  ArrowRight
} from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const { communityStats } = useAppStore();

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
                <div className="absolute inset-0 bg-rose-500 blur-xl opacity-50 animate-pulse" />
                <svg
                  className="relative w-16 h-16 text-rose-500"
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
                Your <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 bg-clip-text text-transparent animate-gradient-x" style={{ backgroundSize: '200% auto' }}>Local Sui CLI</span>
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
                onClick={() => navigate('/setup')}
                className="group relative px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 hover:scale-105 overflow-hidden min-w-[200px]"
              >
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  Get Started
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>

              <button
                onClick={() => navigate('/app')}
                className="group px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-200 border border-white/10 hover:border-rose-500/30 min-w-[200px] flex items-center justify-center gap-2"
              >
                <Terminal className="w-5 h-5" />
                Launch CLI
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              <a
                href="https://github.com/hien-p/raycast-sui-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="group px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-200 border border-white/10 hover:border-rose-500/30 min-w-[200px] flex items-center justify-center gap-2"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>

            {/* Keyboard shortcut hint */}
            <p className="text-sm text-white/40 animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
              Press <kbd className="px-2 py-1 bg-white/10 rounded text-white/60 font-mono text-xs mx-1">⌘K</kbd> in the app to launch command palette
            </p>
          </div>
        </section>

        {/* Enhanced Stats Section with Animation */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-transparent via-rose-500/[0.03] to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                value={communityStats.totalMembers.toLocaleString()}
                label="Community Members"
                color="rose"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                value="135+"
                label="Components"
                color="pink"
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

        {/* Demo Showcase Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full text-sm text-rose-400 font-medium mb-6">
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
              <div className="absolute -inset-4 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-rose-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Mock Screenshot/Terminal */}
                <div className="aspect-video bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-8 flex flex-col justify-center items-center">
                  <div className="w-full max-w-2xl space-y-4">
                    {/* Mock Command Palette */}
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Terminal className="w-5 h-5 text-rose-500" />
                        <span className="text-white/60 text-sm">sui</span>
                        <span className="text-white/40">›</span>
                        <span className="text-white text-sm">client transfer --to 0x123... --amount 10</span>
                      </div>
                      <div className="space-y-2 pl-8">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-white/80 font-mono">Transfer Successful</span>
                          <span className="text-rose-400 ml-auto">Digest: 5A2...9xP</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-white/20 rounded-full" />
                          <span className="text-white/60">Gas Used:</span>
                          <span className="text-white/80">0.002 SUI</span>
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
                        <Sparkles className="w-6 h-6 text-rose-500 mx-auto mb-2" />
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
                gradient="rose"
              />
              <FeatureBentoCard
                icon={<Network className="w-8 h-8" />}
                title="Network Switching"
                description="Seamlessly switch between Mainnet, Testnet, and Devnet. Custom RPC endpoints supported."
                gradient="pink"
              />
              <FeatureBentoCard
                icon={<Zap className="w-8 h-8" />}
                title="Gas Optimization"
                description="Split and merge gas coins intelligently. Visualize gas usage and optimize transaction costs."
                gradient="purple"
              />
              <FeatureBentoCard
                icon={<ArrowRight className="w-8 h-8" />}
                title="Secure Transfers"
                description="Send SUI and tokens with confidence. Built-in gas estimation and address validation."
                gradient="green"
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
                gradient="rose"
              />
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-rose-500/[0.02] to-transparent">
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

        {/* Community Onboarding Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-rose-500/[0.03] to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-full text-sm text-rose-400 font-medium mb-6 animate-pulse">
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

            {/* What is Member? Section */}
            <div className="max-w-5xl mx-auto mb-16">
              <div className="relative group">
                {/* Glowing background effect */}
                <div className="absolute -inset-6 bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />

                <div className="relative bg-gradient-to-br from-white/[0.12] to-white/[0.04] backdrop-blur-xl border border-white/30 rounded-2xl p-8 sm:p-12 shadow-2xl">
                  {/* Header */}
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-500 rounded-2xl mb-4 shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
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
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-rose-500/20">
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
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-pink-500/10 rounded-xl" />
                    <div className="relative border border-rose-500/30 rounded-xl p-6 backdrop-blur-sm">
                      <div className="text-center mb-4">
                        <h4 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                          Why Join Today?
                        </h4>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4 text-center">
                        <div className="group">
                          <div className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-400 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform">
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
                          <div className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform">
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

            {/* Tier Progression - What You Can Earn */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Tier Progression System
                </h3>
                <p className="text-white/60">Level up by being active on Sui blockchain</p>
              </div>

              <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-purple-500/20 -translate-y-1/2 hidden lg:block" />
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
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center group hover:bg-white/[0.05] hover:border-rose-500/30 transition-all hover:scale-105">
                <Shield className="w-10 h-10 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-semibold text-white mb-2">100% On-Chain</h4>
                <p className="text-sm text-white/60">
                  Your membership is stored on Sui blockchain. Fully transparent and verifiable.
                </p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center group hover:bg-white/[0.05] hover:border-rose-500/30 transition-all hover:scale-105">
                <Sparkles className="w-10 h-10 text-rose-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-semibold text-white mb-2">Earn Perks</h4>
                <p className="text-sm text-white/60">
                  Unlock features, badges, and benefits as you level up through tiers.
                </p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center group hover:bg-white/[0.05] hover:border-rose-500/30 transition-all hover:scale-105">
                <Users className="w-10 h-10 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-semibold text-white mb-2">Growing Community</h4>
                <p className="text-sm text-white/60">
                  Join {communityStats.totalMembers.toLocaleString()}+ builders and grow together in the Sui ecosystem.
                </p>
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
                  <svg className="w-8 h-8 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
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
                  <li><a href="https://www.harriweb3.dev" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">Live Demo</a></li>
                  <li><a href="https://github.com/hien-p/raycast-sui-cli" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">Documentation</a></li>
                  <li><button onClick={() => setShowMembershipModal(true)} className="hover:text-rose-400 transition-colors">Community</button></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="font-semibold text-white mb-3 text-sm">Resources</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li><a href="https://github.com/hien-p/raycast-sui-cli" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">GitHub</a></li>
                  <li><a href="https://www.npmjs.com/package/sui-cli-web-server" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">NPM Package</a></li>
                  <li><a href="https://sui.io" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">Sui Network</a></li>
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
                    href="https://www.npmjs.com/package/sui-cli-web-server"
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
                <span className="text-rose-400">v1.1.0</span> · Built for the Sui ecosystem
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
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 hover:bg-white/10 hover:border-rose-500/30 transition-all group">
      <div className="text-white/70 group-hover:text-rose-400 transition-colors">{icon}</div>
      <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{name}</span>
    </div>
  );
}

// Component: Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: 'rose' | 'pink' | 'purple' | 'green';
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  const colors = {
    rose: 'text-rose-400',
    pink: 'text-pink-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
  };

  return (
    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:border-rose-500/20 transition-all group">
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
  gradient: 'rose' | 'pink' | 'purple' | 'green' | 'ocean';
  badge?: string;
}

function FeatureBentoCard({ icon, title, description, gradient, badge }: FeatureBentoCardProps) {
  return (
    <AnimatedGradient variant={gradient} className="p-6 rounded-xl border border-white/10 hover:border-rose-500/30 transition-all hover:scale-[1.02] group">
      <div className="flex items-start justify-between mb-4">
        <div className="text-rose-500 group-hover:scale-110 transition-transform">{icon}</div>
        {badge && (
          <span className="px-2 py-1 text-xs font-medium bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-rose-400 transition-colors">
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
            <span className="text-rose-400 mt-0.5">✓</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
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
    'In Progress': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
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
