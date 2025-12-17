import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MembershipJoin } from '../MembershipJoin';
import { SetupInstructions } from '../SetupInstructions';
import { useAppStore } from '@/stores/useAppStore';
import { useScrollReveal, useActiveSection, scrollToSection } from '@/hooks/useScrollReveal';
import { ScrollIndicator } from '@/components/ui/scroll-indicator';
import { TypingText } from '@/components/ui/typing-text';
import { GlitchText } from '@/components/ui/glitch-text';
import { HandWrittenTitle } from '@/components/ui/hand-writing-text';
import { ProgressDots } from '@/components/ui/progress-dots';
import { checkConnection } from '@/api/client';
import {
  Terminal,
  Wallet,
  Network,
  Zap,
  Shield,
  Github,
  Users,
  Package,
  ExternalLink,
  Copy,
  CheckCircle2,
  Droplets,
  Send,
  Eye,
  ArrowRight,
  Code2,
  Lock,
  Cpu,
} from 'lucide-react';
import { COMMUNITY_PACKAGE_ID, COMMUNITY_REGISTRY_ID, NETWORK } from '@/config/contracts';

// Contract addresses (imported from config)
const CONTRACT_INFO = {
  packageId: COMMUNITY_PACKAGE_ID,
  registryId: COMMUNITY_REGISTRY_ID,
  network: NETWORK,
  explorerBase: `https://suiscan.xyz/${NETWORK}`,
};

// Features data
const FEATURES = [
  { id: 'wallet', icon: Wallet, title: 'Wallet', desc: 'Manage addresses & balances', status: 'stable' as const },
  { id: 'transfer', icon: Send, title: 'Transfer', desc: 'Send SUI & tokens', status: 'stable' as const },
  { id: 'gas', icon: Zap, title: 'Gas', desc: 'Split & merge coins', status: 'stable' as const },
  { id: 'network', icon: Network, title: 'Network', desc: 'Switch RPC endpoints', status: 'stable' as const },
  { id: 'faucet', icon: Droplets, title: 'Faucet', desc: '8 integrated faucets', status: 'stable' as const },
  { id: 'community', icon: Users, title: 'Community', desc: '4-tier NFT system', status: 'stable' as const },
  { id: 'move', icon: Code2, title: 'Move Dev', desc: 'Build & publish', status: 'beta' as const },
  { id: 'inspector', icon: Eye, title: 'Inspector', desc: 'Replay transactions', status: 'beta' as const },
];

// Section IDs for navigation
const SECTIONS = ['hero', 'features', 'contract', 'community', 'cta'];
const SECTION_LABELS = ['Hero', 'Features', 'Contract', 'Community', 'Get Started'];

export function NewLandingPage() {
  const navigate = useNavigate();
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const { communityStats, fetchCommunityStatus } = useAppStore();
  const activeSection = useActiveSection(SECTIONS);

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

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(id);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
      <div className="relative w-full h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 font-mono">Initializing terminal...</p>
        </div>
      </div>
    );
  }

  // Setup screen if not connected
  if (!serverConnected) {
    return (
      <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden bg-slate-950">
        <div className="relative z-10 min-h-screen flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12">
          <SetupInstructions onRetry={handleRetry} isRetrying={isRetrying} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-slate-950">
      {/* Progress Dots Navigation */}
      <ProgressDots
        sections={SECTION_LABELS}
        currentSection={activeSection}
        onDotClick={(index) => scrollToSection(SECTIONS[index])}
      />

      {/* Hero Section */}
      <HeroSection onScrollClick={() => scrollToSection('features')} />

      {/* Features Section */}
      <FeaturesSection features={FEATURES} />

      {/* Contract Verification Section */}
      <ContractSection
        contractInfo={CONTRACT_INFO}
        copiedAddress={copiedAddress}
        onCopy={copyToClipboard}
      />

      {/* Community Section */}
      <CommunitySection stats={communityStats.totalMembers} />

      {/* CTA Section */}
      <CTASection onEnter={handleEnter} />

      {/* Footer */}
      <Footer onOpenMembership={() => setShowMembershipModal(true)} />

      {/* Membership Modal */}
      {showMembershipModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowMembershipModal(false)}
        >
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <MembershipJoin onClose={() => setShowMembershipModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ===== SECTIONS =====

function HeroSection({ onScrollClick }: { onScrollClick: () => void }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <section
      id="hero"
      ref={ref as React.RefObject<HTMLElement>}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20"
    >
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div
        className={`relative z-10 max-w-5xl w-full text-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Terminal Prompt */}
        <div className="mb-6 font-mono text-rose-400 text-sm">
          <TypingText text="$ sui-cli-web --init" speed={80} />
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold font-mono mb-6 leading-tight">
          <GlitchText intensity="low">
            <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
              YOUR LOCAL
            </span>
          </GlitchText>
          <br />
          <GlitchText intensity="medium">
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 bg-clip-text text-transparent">
              SUI CLI
            </span>
          </GlitchText>
          <br />
          <span className="text-white">SUPERCHARGED</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 font-mono">
          Terminal-first interface for Sui blockchain.
          <br />
          <span className="text-rose-400">100% local</span>. Zero cloud.{' '}
          <span className="text-rose-400">Zero risk</span>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => scrollToSection('cta')}
            className="group relative px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-mono font-semibold text-lg overflow-hidden hover:scale-105 transition-transform"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              LAUNCH APP
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <a
            href="https://github.com/hien-p/raycast-sui-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white/5 border border-rose-500/30 text-white rounded-lg font-mono font-semibold text-lg hover:bg-white/10 hover:border-rose-500/60 transition-all flex items-center gap-2"
          >
            <Github className="w-5 h-5" />
            SOURCE CODE
          </a>
        </div>

        {/* Scroll Indicator */}
        <ScrollIndicator onClick={onScrollClick} />

        {/* Hand Written Title - Build from First Mover */}
        <HandWrittenTitle
          title="Build from First Mover"
          subtitle="@harry_phan06"
          subtitleLink="https://x.com/harry_phan06"
        />
      </div>
    </section>
  );
}

function FeaturesSection({ features }: { features: typeof FEATURES }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <section
      id="features"
      ref={ref as React.RefObject<HTMLElement>}
      className="relative py-24 px-4"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="inline-block mb-4 px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
            <span className="font-mono text-rose-400 text-sm uppercase tracking-wider">
              8 Core Features
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold font-mono text-white mb-4">
            FULL <span className="text-rose-400">TERMINAL</span> CONTROL
          </h2>
          <p className="text-white/50 font-mono text-sm max-w-2xl mx-auto">
            Everything you need to interact with Sui blockchain, wrapped in a beautiful interface
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} isVisible={isVisible} />
          ))}
        </div>

        {/* Stats Bar */}
        <div
          className={`mt-12 flex items-center justify-center gap-8 transition-all duration-1000 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-emerald-400 text-sm">6 STABLE</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="font-mono text-rose-400 text-sm">2 BETA</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContractSection({
  contractInfo,
  copiedAddress,
  onCopy,
}: {
  contractInfo: typeof CONTRACT_INFO;
  copiedAddress: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  return (
    <section
      id="contract"
      ref={ref as React.RefObject<HTMLElement>}
      className="relative py-24 px-4"
    >
      <div className="max-w-4xl mx-auto">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <span className="font-mono text-emerald-400 text-sm uppercase tracking-wider">
                Verified on Testnet
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold font-mono text-white">
              SMART <span className="text-rose-400">CONTRACT</span>
            </h2>
          </div>

          {/* Contract Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-8 hover:border-rose-500/40 transition-all">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-8 h-8 text-rose-400" />
              <div>
                <h3 className="text-xl font-mono font-bold text-white">Community Registry</h3>
                <p className="text-white/50 font-mono text-sm">On-chain membership & tiers</p>
              </div>
            </div>

            {/* Package ID */}
            <AddressBlock
              label="PACKAGE_ID"
              address={contractInfo.packageId}
              id="package"
              copiedId={copiedAddress}
              onCopy={onCopy}
              explorerUrl={`${contractInfo.explorerBase}/object/${contractInfo.packageId}`}
            />

            {/* Registry ID */}
            <AddressBlock
              label="REGISTRY_ID"
              address={contractInfo.registryId}
              id="registry"
              copiedId={copiedAddress}
              onCopy={onCopy}
              explorerUrl={`${contractInfo.explorerBase}/object/${contractInfo.registryId}`}
              className="mt-4"
            />

            {/* Functions */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="text-white/50 font-mono text-xs mb-3 uppercase tracking-wider">
                Available Functions
              </div>
              <div className="flex flex-wrap gap-2">
                {['join_community()', 'is_member()', 'get_total_members()'].map((fn) => (
                  <code
                    key={fn}
                    className="px-3 py-1.5 bg-rose-500/10 text-rose-300 text-xs rounded-lg border border-rose-500/20 font-mono"
                  >
                    {fn}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunitySection({ stats }: { stats: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  return (
    <section
      id="community"
      ref={ref as React.RefObject<HTMLElement>}
      className="relative py-24 px-4"
    >
      <div className="max-w-6xl mx-auto">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold font-mono text-white mb-4">
              JOIN THE <span className="text-rose-400">COMMUNITY</span>
            </h2>
            <p className="text-white/50 font-mono text-sm">
              On-chain NFT membership with 4-tier progression system
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Users} value={`${stats}+`} label="Members" />
            <StatCard icon={Shield} value="NFT" label="Membership" />
            <StatCard icon={Zap} value="~0.01" label="SUI (Gas)" />
            <StatCard icon={Cpu} value="Auto" label="Level-up" />
          </div>

          {/* Join Button */}
          <div className="text-center">
            <MembershipJoin compact={true} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection({ onEnter }: { onEnter: () => void }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  return (
    <section
      id="cta"
      ref={ref as React.RefObject<HTMLElement>}
      className="relative py-32 px-4"
    >
      <div className="max-w-4xl mx-auto text-center">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Terminal Window Effect */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-12 hover:border-rose-500/50 transition-all">
            <div className="mb-8">
              <Terminal className="w-16 h-16 text-rose-400 mx-auto mb-6" />
              <h2 className="text-4xl sm:text-5xl font-bold font-mono text-white mb-4">
                READY TO <span className="text-rose-400">LAUNCH?</span>
              </h2>
              <p className="text-white/60 font-mono text-sm">
                Install in 3 commands. Launch in seconds.
              </p>
            </div>

            {/* Install Commands */}
            <div className="space-y-3 mb-8">
              <CommandLine step="1" command="brew install sui" />
              <CommandLine step="2" command="npm install -g sui-cli-web-server" />
              <CommandLine step="3" command="npx sui-cli-web-server" />
            </div>

            {/* Launch Button */}
            <button
              onClick={onEnter}
              className="group relative px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-mono font-bold text-xl overflow-hidden hover:scale-105 transition-transform"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Terminal className="w-6 h-6" />
                ENTER APPLICATION
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Security Note */}
            <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-sm font-mono">
              <Lock className="w-4 h-4" />
              <span>100% local execution. Keys never leave your machine.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ onOpenMembership }: { onOpenMembership: () => void }) {
  return (
    <footer className="py-8 px-4 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono">
            <Terminal className="w-5 h-5 text-rose-400" />
            <span className="text-white font-semibold">sui-cli-web</span>
            <span className="text-white/50 text-sm">v1.1.0</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-sm">
            <a
              href="https://github.com/hien-p/raycast-sui-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-rose-400 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/sui-cli-web-server"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-rose-400 transition-colors"
            >
              NPM
            </a>
            <button
              onClick={onOpenMembership}
              className="text-white/50 hover:text-rose-400 transition-colors"
            >
              Community
            </button>
          </div>

          <div className="text-white/40 text-sm font-mono">MIT License</div>
        </div>
      </div>
    </footer>
  );
}

// ===== COMPONENTS =====

function FeatureCard({
  feature,
  index,
  isVisible,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
  isVisible: boolean;
}) {
  const Icon = feature.icon;
  const delay = index * 100;

  return (
    <div
      className={`group p-6 bg-slate-900/60 backdrop-blur-sm border border-rose-500/20 rounded-xl hover:border-rose-500/50 hover:bg-slate-900/80 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-4">
        <div className="w-12 h-12 rounded-lg bg-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-rose-400" />
        </div>
      </div>

      <h3 className="text-lg font-mono font-bold text-white mb-2">{feature.title}</h3>
      <p className="text-white/50 font-mono text-sm mb-3">{feature.desc}</p>

      <span
        className={`inline-block px-2 py-1 text-xs font-mono font-semibold rounded ${
          feature.status === 'stable'
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}
      >
        {feature.status.toUpperCase()}
      </span>
    </div>
  );
}

function AddressBlock({
  label,
  address,
  id,
  copiedId,
  onCopy,
  explorerUrl,
  className = '',
}: {
  label: string;
  address: string;
  id: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  explorerUrl: string;
  className?: string;
}) {
  return (
    <div className={`p-4 bg-black/30 rounded-xl border border-rose-500/20 ${className}`}>
      <div className="text-white/40 font-mono text-xs mb-2 uppercase tracking-wider">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-rose-300 text-sm font-mono truncate">{address}</code>
        <button
          onClick={() => onCopy(address, id)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copiedId === id ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4 text-white/50" />
          )}
        </button>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="View on explorer"
        >
          <ExternalLink className="w-4 h-4 text-white/50 hover:text-rose-400" />
        </a>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="p-6 bg-slate-900/60 backdrop-blur-sm border border-rose-500/20 rounded-xl text-center hover:border-rose-500/40 transition-all">
      <Icon className="w-6 h-6 text-rose-400 mx-auto mb-3" />
      <div className="text-2xl font-mono font-bold text-white mb-1">{value}</div>
      <div className="text-white/50 font-mono text-sm">{label}</div>
    </div>
  );
}

function CommandLine({ step, command }: { step: string; command: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-black/40 border border-rose-500/20 rounded-lg text-left">
      <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-mono font-bold text-sm shrink-0">
        {step}
      </span>
      <code className="text-rose-300 font-mono text-sm">$ {command}</code>
    </div>
  );
}
