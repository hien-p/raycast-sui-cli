import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TierBadge, TIER_DROPLET, TIER_WAVE, TIER_TSUNAMI, TIER_OCEAN, TIER_METADATA } from '../TierBadge';
import { useScrollReveal, useActiveSection, scrollToSection } from '@/hooks/useScrollReveal';
import { useScrollProgress, useReducedMotion } from '@/hooks/useScrollProgress';
import { TypingText } from '@/components/ui/typing-text';
import { GlitchText } from '@/components/ui/glitch-text';
import { ScrollDownIndicator } from '@/components/ui/scroll-down-indicator';
import { SectionDots } from '@/components/ui/section-dots';
import { suiService } from '@/services/SuiService';
import {
  Terminal,
  Wallet,
  Network,
  Zap,
  Shield,
  Github,
  Users,
  ChevronRight,
  Package,
  Eye,
  Droplets,
  Send,
  ExternalLink,
  Copy,
  CheckCircle2,
  Database,
  ChevronDown,
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
  { id: 'address', icon: <Wallet className="w-5 h-5" />, title: 'Address Management', status: 'stable' as const },
  { id: 'transfer', icon: <Send className="w-5 h-5" />, title: 'Transfer System', status: 'stable' as const },
  { id: 'gas', icon: <Zap className="w-5 h-5" />, title: 'Gas Management', status: 'stable' as const },
  { id: 'network', icon: <Network className="w-5 h-5" />, title: 'Network Switch', status: 'stable' as const },
  { id: 'faucet', icon: <Droplets className="w-5 h-5" />, title: 'Faucet Integration', status: 'stable' as const },
  { id: 'community', icon: <Users className="w-5 h-5" />, title: 'Community & Tiers', status: 'stable' as const },
  { id: 'move', icon: <Package className="w-5 h-5" />, title: 'Move Development', status: 'beta' as const },
  { id: 'inspector', icon: <Eye className="w-5 h-5" />, title: 'Transaction Inspector', status: 'beta' as const },
];

// Section IDs for navigation
const SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'contract', label: 'Contract' },
  { id: 'community', label: 'Community' },
  { id: 'cta', label: 'Get Started' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [heroTypingComplete, setHeroTypingComplete] = useState(false);
  const [memberCount, setMemberCount] = useState<number>(0);
  const scrollProgress = useScrollProgress();
  const activeSection = useActiveSection(SECTIONS.map(s => s.id));
  const prefersReducedMotion = useReducedMotion();

  // Fetch community stats directly from blockchain on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await suiService.getCommunityStats();
        setMemberCount(stats.totalMembers);
      } catch (error) {
        console.error('Failed to fetch community stats:', error);
      }
    };
    fetchStats();
  }, []);

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

  const handleScrollToFeatures = useCallback(() => {
    scrollToSection('features');
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-y-auto overflow-x-hidden font-mono">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 z-50 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 origin-left"
        style={{ scaleX: scrollProgress / 100 }}
        initial={{ scaleX: 0 }}
      />

      {/* Section Navigation Dots - Hidden on mobile */}
      <div className="hidden md:block">
        <SectionDots
          sections={SECTIONS}
          activeIndex={activeSection}
          onDotClick={scrollToSection}
        />
      </div>

      {/* Darker overlay for hacker aesthetic */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-black/20 to-black/60 pointer-events-none" />

      {/* Scanline effect */}
      <div className="fixed inset-0 z-[2] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.1) 2px, rgba(255,0,0,0.1) 4px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* ============ HERO SECTION ============ */}
        <section id="hero" className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative">
          <div className="max-w-4xl w-full text-center space-y-8">
            {/* Terminal-style header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 border border-rose-500/30 rounded-lg text-rose-400 text-sm"
            >
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span className="font-mono">v1.2.0</span>
              <span className="text-white/30">|</span>
              <span className="text-white/50">sui-cli-web</span>
            </motion.div>

            {/* Main Headline with Typing Effect */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
                {prefersReducedMotion ? (
                  <>
                    <span className="text-rose-500">$</span> sui-cli
                    <br />
                    <GlitchText className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                      supercharged
                    </GlitchText>
                  </>
                ) : (
                  <>
                    <span className="text-rose-500">$</span>{' '}
                    <TypingText
                      text="sui-cli"
                      speed={80}
                      delay={500}
                      onComplete={() => setHeroTypingComplete(true)}
                    />
                    <br />
                    <AnimatePresence>
                      {heroTypingComplete && (
                        <motion.span
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 bg-clip-text text-transparent"
                        >
                          <GlitchText>supercharged</GlitchText>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </h1>

              <motion.p
                className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: heroTypingComplete || prefersReducedMotion ? 1 : 0 }}
                transition={{ delay: 0.3 }}
              >
                Raycast-style interface for Sui blockchain.
                <br />
                <span className="text-rose-400/80">100% local. 100% secure.</span>
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: heroTypingComplete || prefersReducedMotion ? 1 : 0, y: heroTypingComplete || prefersReducedMotion ? 0 : 20 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={() => navigate('/setup')}
                className="group relative px-8 py-4 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 hover:border-rose-500 text-rose-400 font-bold rounded-lg transition-all duration-200 min-w-[200px] overflow-hidden"
              >
                <span className="relative flex items-center justify-center gap-2 font-mono">
                  <Terminal className="w-5 h-5" />
                  ./install.sh
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>

              <button
                onClick={() => navigate('/app')}
                className="group px-8 py-4 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold rounded-lg transition-all duration-200 border border-white/10 hover:border-white/20 min-w-[200px] font-mono"
              >
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  launch --now
                </span>
              </button>

              <a
                href="https://github.com/hien-p/raycast-sui-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-mono rounded-lg transition-all border border-white/10 hover:border-white/20"
              >
                <span className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  src
                </span>
              </a>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-6 text-sm font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: heroTypingComplete || prefersReducedMotion ? 1 : 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-2 text-white/50">
                <Users className="w-4 h-4 text-rose-400" />
                <span>{memberCount.toLocaleString()} members</span>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <Shield className="w-4 h-4 text-green-400" />
                <span>open source</span>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <Package className="w-4 h-4 text-purple-400" />
                <span>8 modules</span>
              </div>
            </motion.div>
          </div>

          {/* Scroll Down Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <ScrollDownIndicator onClick={handleScrollToFeatures} />
          </div>
        </section>

        {/* ============ FEATURES SECTION ============ */}
        <AnimatedSectionWrapper id="features" className="py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 border border-rose-500/30 rounded-lg text-sm mb-6"
              >
                <span className="text-rose-400 font-mono">cat</span>
                <span className="text-white/50">features.md</span>
              </motion.div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 font-mono">
                <span className="text-rose-500">#</span> What's{' '}
                <GlitchText className="text-rose-400">included</GlitchText>
              </h2>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {BETA_FEATURES.map((feature, index) => (
                <FeatureCard key={feature.id} feature={feature} index={index} />
              ))}
            </div>

            {/* Status Summary */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-black/40 border border-white/10 rounded-lg font-mono text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-green-400">6 stable</span>
                </span>
                <span className="text-white/20">|</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                  <span className="text-rose-400">2 beta</span>
                </span>
              </div>
            </motion.div>
          </div>
        </AnimatedSectionWrapper>

        {/* ============ CONTRACT SECTION ============ */}
        <AnimatedSectionWrapper id="contract" className="py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-rose-500/[0.02] to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 border border-green-500/30 rounded-lg text-sm mb-6"
              >
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-mono">verified</span>
              </motion.div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-mono">
                <span className="text-rose-500">#</span> Smart Contract
              </h2>
              <p className="text-white/50 font-mono text-sm">
                Sui {CONTRACT_INFO.network} • verify yourself
              </p>
            </div>

            {/* Contract Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4"
            >
              {/* Package ID */}
              <div className="space-y-2">
                <div className="text-xs text-white/40 font-mono uppercase tracking-wider">Package ID</div>
                <div className="flex items-center gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                  <code className="flex-1 text-rose-300 text-xs sm:text-sm font-mono truncate">
                    {CONTRACT_INFO.packageId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(CONTRACT_INFO.packageId, 'package')}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedAddress === 'package' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/40 hover:text-white/60" />
                    )}
                  </button>
                  <a
                    href={`${CONTRACT_INFO.explorerBase}/object/${CONTRACT_INFO.packageId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-white/40 hover:text-rose-400" />
                  </a>
                </div>
              </div>

              {/* Registry ID */}
              <div className="space-y-2">
                <div className="text-xs text-white/40 font-mono uppercase tracking-wider">Registry ID</div>
                <div className="flex items-center gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                  <code className="flex-1 text-rose-300 text-xs sm:text-sm font-mono truncate">
                    {CONTRACT_INFO.registryId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(CONTRACT_INFO.registryId, 'registry')}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedAddress === 'registry' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/40 hover:text-white/60" />
                    )}
                  </button>
                  <a
                    href={`${CONTRACT_INFO.explorerBase}/object/${CONTRACT_INFO.registryId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-white/40 hover:text-rose-400" />
                  </a>
                </div>
              </div>

              {/* Functions */}
              <div className="pt-4 border-t border-white/5">
                <div className="text-xs text-white/40 font-mono uppercase tracking-wider mb-3">Functions</div>
                <div className="flex flex-wrap gap-2">
                  {['join_community()', 'is_member()', 'get_total_members()'].map((fn) => (
                    <span key={fn} className="px-3 py-1.5 bg-rose-500/10 text-rose-300 text-xs rounded border border-rose-500/20 font-mono">
                      {fn}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatedSectionWrapper>

        {/* ============ COMMUNITY SECTION ============ */}
        <AnimatedSectionWrapper id="community" className="py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-mono">
                <span className="text-rose-500">#</span> Tier System
              </h2>
              <p className="text-white/50 font-mono text-sm">
                level up by being active on Sui
              </p>
            </div>

            {/* Tier Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <TierCard tier={TIER_DROPLET} requirement="Join" />
              <TierCard tier={TIER_WAVE} requirement="25+ tx" />
              <TierCard tier={TIER_TSUNAMI} requirement="100+ tx" />
              <TierCard tier={TIER_OCEAN} requirement="500+ tx" />
            </div>

            {/* Join Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <div className="inline-flex items-center gap-4 px-6 py-4 bg-black/40 border border-rose-500/20 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-400 font-mono">{memberCount.toLocaleString()}</div>
                  <div className="text-xs text-white/40 font-mono">members</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 font-mono">FREE</div>
                  <div className="text-xs text-white/40 font-mono">~0.01 SUI gas</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 font-mono">NFT</div>
                  <div className="text-xs text-white/40 font-mono">on-chain</div>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatedSectionWrapper>

        {/* ============ CTA SECTION ============ */}
        <AnimatedSectionWrapper id="cta" className="py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-rose-500/[0.03] to-transparent">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white font-mono">
                <span className="text-rose-500">$</span> ready?
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/setup')}
                  className="group px-10 py-5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-all text-lg font-mono"
                >
                  <span className="flex items-center gap-3">
                    <Terminal className="w-6 h-6" />
                    npm i sui-cli-web-server
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>

              <p className="text-white/40 font-mono text-sm">
                works on macOS, Linux, Windows
              </p>
            </motion.div>
          </div>
        </AnimatedSectionWrapper>

        {/* ============ FOOTER ============ */}
        <footer className="py-12 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-rose-400">v1.2.0</span>
                <span>•</span>
                <span>MIT License</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="https://github.com/hien-p/raycast-sui-cli" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">
                  GitHub
                </a>
                <a href="https://www.npmjs.com/package/sui-cli-web-server" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">
                  NPM
                </a>
                <button onClick={() => navigate('/app/membership')} className="hover:text-rose-400 transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ============ COMPONENTS ============

interface AnimatedSectionWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function AnimatedSectionWrapper({ id, children, className = '' }: AnimatedSectionWrapperProps) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <motion.section
      ref={ref as React.RefObject<HTMLElement>}
      id={id}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 40 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.section>
  );
}

interface FeatureCardProps {
  feature: {
    id: string;
    icon: React.ReactNode;
    title: string;
    status: 'stable' | 'beta';
  };
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group p-4 bg-black/40 border border-white/5 hover:border-rose-500/30 rounded-lg transition-all hover:bg-black/60"
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className={`p-2.5 rounded-lg ${feature.status === 'stable' ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'} group-hover:scale-110 transition-transform`}>
          {feature.icon}
        </div>
        <div>
          <h3 className="text-white/90 font-medium text-sm font-mono">{feature.title}</h3>
          <span className={`text-xs font-mono ${feature.status === 'stable' ? 'text-green-400/60' : 'text-rose-400/60'}`}>
            {feature.status}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface TierCardProps {
  tier: number;
  requirement: string;
}

function TierCard({ tier, requirement }: TierCardProps) {
  const metadata = TIER_METADATA[tier as keyof typeof TIER_METADATA];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`p-6 rounded-xl border backdrop-blur-sm hover:scale-105 transition-all ${metadata.bgClass} ${metadata.borderClass} group`}
    >
      <div className="text-center">
        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{metadata.icon}</div>
        <TierBadge tier={tier} size="sm" showGlow={false} className="mx-auto mb-2" />
        <div className={`text-xs font-mono ${metadata.textClass}`}>{requirement}</div>
      </div>
    </motion.div>
  );
}
