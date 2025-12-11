import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MembershipJoin } from '../MembershipJoin';
import { SetupInstructions } from '../SetupInstructions';
import { TIER_DROPLET, TIER_WAVE, TIER_TSUNAMI, TIER_OCEAN, TIER_METADATA } from '../TierBadge';
import { useAppStore } from '@/stores/useAppStore';
import { checkConnection } from '@/api/client';
import {
  Terminal,
  Wallet,
  Network,
  Zap,
  Shield,
  Github,
  Download,
  Users,
  ChevronRight,
  Apple,
  Box,
  MonitorSmartphone,
  Package,
  ExternalLink,
  Copy,
  CheckCircle2,
  Activity,
  Database,
  Eye,
  Droplets,
  Send,
  Sparkles,
  Star,
  ArrowRight,
} from 'lucide-react';

// Contract addresses for verification
const CONTRACT_INFO = {
  packageId: '0xffb8f17c91212d170cb0fee4128b8b44277bfd19af040590cfae08c1abd2bbd2',
  registryId: '0x7bf988f34c98d5b69d60264083c581d90fa97c51e902846bed491c0f6bf9b80b',
  network: 'testnet',
  explorerBase: 'https://suiscan.xyz/testnet',
};

// Beta features list with status
const BETA_FEATURES = [
  { id: 'address', icon: <Wallet className="w-5 h-5" />, title: 'Address Management', desc: 'Create, switch, view addresses with balances', status: 'stable' as const },
  { id: 'transfer', icon: <Send className="w-5 h-5" />, title: 'Transfer System', desc: 'Send SUI/tokens with gas estimation', status: 'stable' as const },
  { id: 'gas', icon: <Zap className="w-5 h-5" />, title: 'Gas Management', desc: 'Split & merge gas coins', status: 'stable' as const },
  { id: 'network', icon: <Network className="w-5 h-5" />, title: 'Network Switch', desc: 'Mainnet, Testnet, Devnet, Custom RPC', status: 'stable' as const },
  { id: 'faucet', icon: <Droplets className="w-5 h-5" />, title: 'Faucet Integration', desc: 'Official Sui + 7 external faucets', status: 'stable' as const },
  { id: 'community', icon: <Users className="w-5 h-5" />, title: 'Community & Tiers', desc: '4-tier progression system', status: 'stable' as const },
  { id: 'move', icon: <Package className="w-5 h-5" />, title: 'Move Development', desc: 'Build, test, publish, upgrade packages', status: 'beta' as const },
  { id: 'inspector', icon: <Eye className="w-5 h-5" />, title: 'Transaction Inspector', desc: 'Inspect bytecode, replay transactions', status: 'beta' as const },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const { communityStats, fetchCommunityStatus } = useAppStore();

  // Copy address to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(id);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Truncate address for display
  const truncateAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const checkServerConnection = async () => {
    try {
      const isConnected = await checkConnection();
      setServerConnected(isConnected);
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
    fetchCommunityStatus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEnter();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [serverConnected]);

  // Loading state
  if (serverConnected === null) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Checking server connection...</p>
        </div>
      </div>
    );
  }

  // Show setup instructions if server is not connected
  if (!serverConnected) {
    return (
      <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950">
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
        <div className="relative z-10 min-h-screen flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="w-full flex justify-center">
            <SetupInstructions onRetry={handleRetry} isRetrying={isRetrying} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-y-auto overflow-x-hidden bg-slate-950">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-rose-950/30 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
          <div className="max-w-5xl w-full text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              <span>v1.1.0 Beta — Now Available</span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>

            {/* Main Title */}
            <h1 className="text-5xl sm:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
                Sui CLI Web
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-white/70 max-w-2xl mx-auto mb-8">
              Raycast-inspired web interface for{' '}
              <span className="text-rose-400 font-semibold">Sui blockchain CLI</span>.
              <br />
              Local, secure, and supercharged.
            </p>

            {/* Platform badges */}
            <div className="flex items-center justify-center gap-4 mb-10 text-white/50">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <Apple className="w-4 h-4" />macOS
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <Box className="w-4 h-4" />Linux
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <MonitorSmartphone className="w-4 h-4" />Windows
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleEnter}
                aria-label="Launch Sui CLI Web application"
                className="group px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold text-lg shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-105 transition-all flex items-center gap-2"
              >
                <Terminal className="w-5 h-5" />
                Launch App
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="https://github.com/hien-p/raycast-sui-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white/5 border border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-rose-500/50 transition-all flex items-center gap-2"
              >
                <Github className="w-5 h-5" />
                View Source
              </a>
            </div>

            {/* Hint */}
            <p className="mt-6 text-white/40 text-sm">
              Press <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white/60">Enter</kbd> to launch
            </p>
          </div>
        </section>

        {/* Live Stats Section */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                value={communityStats.totalMembers || 0}
                label="Community Members"
                color="rose"
              />
              <StatCard
                icon={<Package className="w-6 h-6" />}
                value={8}
                label="Beta Features"
                color="pink"
              />
              <StatCard
                icon={<Database className="w-6 h-6" />}
                value={1}
                label="Verified Contract"
                color="fuchsia"
              />
              <StatCard
                icon={<Shield className="w-6 h-6" />}
                value="100%"
                label="Local & Secure"
                color="purple"
              />
            </div>
          </div>
        </section>

        {/* App Preview Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                See it in <span className="text-rose-400">Action</span>
              </h2>
              <p className="text-white/60 max-w-xl mx-auto">
                A beautiful, Raycast-inspired interface for all your Sui blockchain needs.
              </p>
            </div>

            {/* Main App Screenshot */}
            <div className="mb-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/30 to-pink-500/30 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                  <img
                    src="/images/landing/app_commands.png"
                    alt="Sui CLI Web - Command Palette"
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </div>
              <p className="text-center text-white/40 text-sm mt-4">Command Palette - Raycast-style access to all Sui CLI commands</p>
            </div>

            {/* Feature Screenshots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <PreviewCard
                image="/images/landing/addresses.png"
                title="Address Management"
                description="Create, switch, and label addresses with real-time balance"
              />
              <PreviewCard
                image="/images/landing/coins_management.png"
                title="Coin Management"
                description="View coins, merge/split gas, and transfer tokens"
              />
              <PreviewCard
                image="/images/landing/objects_management.png"
                title="Object Explorer"
                description="Browse NFTs, capabilities, and on-chain objects"
              />
              <PreviewCard
                image="/images/landing/move-studio.png"
                title="Move Studio"
                description="Build, test, and publish Move packages"
              />
              <PreviewCard
                image="/images/landing/package_workflows.png"
                title="Package Workflows"
                description="Visual build pipeline with progress tracking"
              />
              <PreviewCard
                image="/images/landing/package_deployted_profiles.png"
                title="Deployed Packages"
                description="Inspect modules and call deployed contracts"
              />
            </div>
          </div>
        </section>

        {/* Beta Features Section */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                What's in <span className="text-rose-400">Beta</span>
              </h2>
              <p className="text-white/60 max-w-xl mx-auto">
                All the features you need to interact with Sui blockchain, packaged in a beautiful interface.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BETA_FEATURES.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} />
              ))}
            </div>

            <div className="mt-8 text-center text-white/50 text-sm">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                6 Stable
                <span className="w-px h-4 bg-white/20" />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                2 Beta
              </span>
            </div>
          </div>
        </section>

        {/* Contract Verification Section */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-rose-500/20">
                  <Shield className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Smart Contract</h3>
                  <p className="text-white/50 text-sm">Verified on Sui Testnet</p>
                </div>
                <span className="ml-auto px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
                  ✓ VERIFIED
                </span>
              </div>

              <div className="space-y-4">
                {/* Package ID */}
                <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                  <div className="text-white/50 text-xs mb-2">Package ID</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-rose-300 text-sm font-mono truncate">
                      {CONTRACT_INFO.packageId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(CONTRACT_INFO.packageId, 'package')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      aria-label="Copy package ID"
                    >
                      {copiedAddress === 'package' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/50" />
                      )}
                    </button>
                    <a
                      href={`${CONTRACT_INFO.explorerBase}/object/${CONTRACT_INFO.packageId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      aria-label="View on explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-white/50 hover:text-rose-400" />
                    </a>
                  </div>
                </div>

                {/* Registry ID */}
                <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                  <div className="text-white/50 text-xs mb-2">Registry ID</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-rose-300 text-sm font-mono truncate">
                      {CONTRACT_INFO.registryId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(CONTRACT_INFO.registryId, 'registry')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      aria-label="Copy registry ID"
                    >
                      {copiedAddress === 'registry' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/50" />
                      )}
                    </button>
                    <a
                      href={`${CONTRACT_INFO.explorerBase}/object/${CONTRACT_INFO.registryId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      aria-label="View on explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-white/50 hover:text-rose-400" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Contract Functions */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-white/50 text-sm mb-3">Available Functions</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-rose-500/10 text-rose-300 text-xs rounded-lg border border-rose-500/20 font-mono">
                    join_community()
                  </span>
                  <span className="px-3 py-1.5 bg-rose-500/10 text-rose-300 text-xs rounded-lg border border-rose-500/20 font-mono">
                    is_member()
                  </span>
                  <span className="px-3 py-1.5 bg-rose-500/10 text-rose-300 text-xs rounded-lg border border-rose-500/20 font-mono">
                    get_total_members()
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community & Tiers Section */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Join the <span className="text-rose-400">Community</span>
              </h2>
              <p className="text-white/60 max-w-xl mx-auto">
                On-chain NFT membership with 4-tier progression. Earn badges as you grow.
              </p>
            </div>

            {/* Tier Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <TierCard tier={TIER_DROPLET} req="Join" />
              <TierCard tier={TIER_WAVE} req="25+ txn" />
              <TierCard tier={TIER_TSUNAMI} req="100+ txn" />
              <TierCard tier={TIER_OCEAN} req="500+ txn" />
            </div>

            {/* Community Stats */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <Users className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{communityStats.totalMembers}+</div>
                  <div className="text-white/50 text-sm">Members</div>
                </div>
                <div>
                  <Shield className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">NFT</div>
                  <div className="text-white/50 text-sm">Membership</div>
                </div>
                <div>
                  <Zap className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">~0.01</div>
                  <div className="text-white/50 text-sm">SUI (gas only)</div>
                </div>
                <div>
                  <Activity className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">Auto</div>
                  <div className="text-white/50 text-sm">Level-up</div>
                </div>
              </div>

              {/* Join Button */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <MembershipJoin compact={true} />
              </div>
            </div>
          </div>
        </section>

        {/* Installation Section */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Quick <span className="text-rose-400">Install</span>
              </h2>
              <p className="text-white/60">Get started in 3 simple steps</p>
            </div>

            <div className="space-y-4">
              <InstallStep
                step={1}
                title="Install Sui CLI"
                command="brew install sui"
                note="macOS / Linux"
              />
              <InstallStep
                step={2}
                title="Install Server"
                command="npm install -g sui-cli-web-server"
              />
              <InstallStep
                step={3}
                title="Launch"
                command="npx sui-cli-web-server"
              />
            </div>

            <div className="mt-8 text-center">
              <p className="text-white/50 text-sm flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" />
                100% local execution. Private keys never leave your machine.
              </p>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                <span className="text-rose-400">Roadmap</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <RoadmapCard status="wip" title="Transaction Builder" />
              <RoadmapCard status="done" title="Move Deploy UI" />
              <RoadmapCard status="planned" title="NFT Gallery" />
              <RoadmapCard status="research" title="DeFi Integration" />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-white/10" role="contentinfo">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-rose-400" />
                <span className="text-white font-semibold">sui-cli-web</span>
                <span className="text-white/50 text-sm">v1.1.0</span>
              </div>

              <nav className="flex items-center gap-6">
                <a
                  href="https://github.com/hien-p/raycast-sui-cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-rose-400 transition-colors flex items-center gap-1.5"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
                <a
                  href="https://www.npmjs.com/package/sui-cli-web-server"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-rose-400 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  NPM
                </a>
                <button
                  onClick={() => setShowMembershipModal(true)}
                  className="text-white/50 hover:text-rose-400 transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  Community
                </button>
              </nav>

              <div className="text-white/40 text-sm">
                MIT License | Built for Sui
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Membership Modal */}
      {showMembershipModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setShowMembershipModal(false)}
        >
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <MembershipJoin onClose={() => setShowMembershipModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Component: Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: 'rose' | 'pink' | 'fuchsia' | 'purple';
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  const colorClasses = {
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400',
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400',
    fuchsia: 'from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30 text-fuchsia-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm text-center hover:scale-105 transition-transform`}>
      <div className={`mx-auto mb-3 ${colorClasses[color].split(' ').pop()}`}>{icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-white/50 text-sm">{label}</div>
    </div>
  );
}

// Component: Feature Card
interface FeatureCardProps {
  feature: {
    id: string;
    icon: React.ReactNode;
    title: string;
    desc: string;
    status: 'stable' | 'beta';
  };
}

function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <div className="group p-5 rounded-xl bg-white/5 border border-white/10 hover:border-rose-500/50 hover:bg-white/10 transition-all">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
          {feature.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold">{feature.title}</h3>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                feature.status === 'stable'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {feature.status === 'stable' ? 'STABLE' : 'BETA'}
            </span>
          </div>
          <p className="text-white/50 text-sm">{feature.desc}</p>
        </div>
      </div>
    </div>
  );
}

// Component: Tier Card
interface TierCardProps {
  tier: number;
  req: string;
}

function TierCard({ tier, req }: TierCardProps) {
  const metadata = TIER_METADATA[tier as keyof typeof TIER_METADATA];

  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-rose-500/30 transition-all text-center group">
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{metadata.icon}</div>
      <div className="text-white font-semibold mb-1">{metadata.name}</div>
      <div className="text-white/50 text-sm">{req}</div>
    </div>
  );
}

// Component: Install Step
interface InstallStepProps {
  step: number;
  title: string;
  command: string;
  note?: string;
}

function InstallStep({ step, title, command, note }: InstallStepProps) {
  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
          {step}
        </div>
        <div className="flex-1">
          <div className="text-white font-medium mb-1">{title}</div>
          <code className="text-rose-300 text-sm font-mono bg-black/30 px-3 py-1.5 rounded-lg inline-block">
            $ {command}
          </code>
          {note && <span className="text-white/40 text-xs ml-2">{note}</span>}
        </div>
      </div>
    </div>
  );
}

// Component: Roadmap Card
interface RoadmapCardProps {
  status: 'wip' | 'done' | 'planned' | 'research';
  title: string;
}

function RoadmapCard({ status, title }: RoadmapCardProps) {
  const statusConfig = {
    wip: { label: 'WIP', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
    done: { label: 'DONE', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
    planned: { label: 'PLANNED', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
    research: { label: 'RESEARCH', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
  };

  const config = statusConfig[status];

  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-rose-500/30 transition-all">
      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border mb-3 ${config.color}`}>
        {config.label}
      </span>
      <div className="text-white font-medium">{title}</div>
    </div>
  );
}

// Component: Preview Card for screenshots
interface PreviewCardProps {
  image: string;
  title: string;
  description: string;
}

function PreviewCard({ image, title, description }: PreviewCardProps) {
  return (
    <div className="group rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-rose-500/30 transition-all">
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-white/50 text-sm">{description}</p>
      </div>
    </div>
  );
}
