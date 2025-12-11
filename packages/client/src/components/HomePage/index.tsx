import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionTemplate, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import ReactLenis from 'lenis/react';
import { TierBadge, TIER_DROPLET, TIER_METADATA } from '../TierBadge';
import { StructuredData } from '../SEO/StructuredData';
import { StickyCardsSection } from '@/components/ui/sticky-cards';
import { FeaturesGrid } from './FeaturesGrid';
import { suiService } from '@/services/SuiService';
import TierCardsGrid from '@/components/ui/tier-card';
import ProfileCard from '@/components/ui/profile-card';
import { Droplet } from 'lucide-react';
import {
  Terminal,
  Zap,
  Shield,
  Github,
  Users,
  ChevronRight,
  Package,
  ExternalLink,
  Copy,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';
import { COMMUNITY_PACKAGE_ID, COMMUNITY_REGISTRY_ID, NETWORK } from '@/config/contracts';

// Contract addresses for verification (imported from config)
const CONTRACT_INFO = {
  packageId: COMMUNITY_PACKAGE_ID,
  registryId: COMMUNITY_REGISTRY_ID,
  network: NETWORK,
  explorerBase: `https://suiscan.xyz/${NETWORK}`,
};

export function HomePage() {
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const prefersReducedMotion = useReducedMotion();

  // 3D Scroll refs
  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
  });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reduced motion for mobile or user preference
  const shouldReduceMotion = prefersReducedMotion || isMobile;

  // Start below (300px), scroll up brings text to center then up
  // Reduce animation range on mobile for better performance
  const yMotionValue = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [150, -150] : [300, -300]
  );
  const opacityValue = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);
  const transform = useMotionTemplate`rotateX(${shouldReduceMotion ? '10deg' : '20deg'}) translateY(${yMotionValue}px) translateZ(${shouldReduceMotion ? '5px' : '10px'})`;

  // Fetch community stats
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

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(id);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <ReactLenis root>
      <StructuredData type="homepage" />

      <div className="relative w-full min-h-screen font-mono">
        {/* ============ TOP NAV BAR (CTA) ============ */}
        <div className="fixed top-0 left-0 right-0 z-50 pt-3 sm:pt-4 pb-3 sm:pb-3 px-3 sm:px-4">
          <div className="max-w-5xl mx-auto">
            {/* Navbar container with glass effect */}
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-3 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl shadow-black/50">
              {/* Left: Version badge */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-1.5 bg-rose-500/10 border border-rose-500/40 rounded-full text-xs">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-rose-400 font-medium">v1.2</span>
                </div>
                {/* Stats - visible on tablet+ */}
                <div className="hidden md:flex items-center gap-3 text-xs text-white/60 border-l border-white/10 pl-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-400" />
                    <span>{memberCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-green-400" />
                    <span>OSS</span>
                  </div>
                </div>
              </div>

              {/* Center/Right: Desktop CTA Buttons - hidden on mobile */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigate('/setup')}
                  className="group px-4 py-2.5 bg-rose-500/30 hover:bg-rose-500/50 active:bg-rose-500/60 border border-rose-500/60 hover:border-rose-500 text-rose-300 hover:text-white font-bold rounded-lg transition-all text-sm shadow-lg shadow-rose-500/20 min-h-[44px]"
                >
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    <span>./install.sh</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>

                <button
                  onClick={() => navigate('/app')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/90 hover:text-white font-bold rounded-lg transition-all border border-white/20 hover:border-white/40 text-sm min-h-[44px]"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    <span>launch --now</span>
                  </span>
                </button>

                <a
                  href="https://github.com/hien-p/raycast-sui-cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/80 hover:text-white rounded-lg transition-all border border-white/20 hover:border-white/40 text-sm min-h-[44px] flex items-center gap-1.5"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>

                {/* Blog - Coming Soon */}
                <button
                  disabled
                  className="relative px-4 py-2.5 bg-white/5 text-white/40 rounded-lg border border-white/10 text-sm cursor-not-allowed min-h-[44px]"
                  title="Coming soon"
                >
                  <span>Blog</span>
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-500/80 text-[9px] text-black font-bold rounded uppercase">
                    soon
                  </span>
                </button>
              </div>

              {/* Right: Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-3 hover:bg-white/10 active:bg-white/20 rounded-lg transition-all text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden mt-2 p-3 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl"
              >
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      navigate('/setup');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3.5 bg-rose-500/30 hover:bg-rose-500/50 active:bg-rose-500/60 border border-rose-500/60 text-rose-300 font-bold rounded-lg transition-all min-h-[44px]"
                  >
                    <span className="flex items-center gap-2">
                      <Terminal className="w-5 h-5" />
                      <span>Install CLI</span>
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/app');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold rounded-lg transition-all border border-white/20 min-h-[44px]"
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      <span>Launch App</span>
                    </span>
                  </button>

                  <a
                    href="https://github.com/hien-p/raycast-sui-cli"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left px-4 py-3.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg transition-all border border-white/20 min-h-[44px] flex items-center gap-2"
                  >
                    <Github className="w-5 h-5" />
                    <span>View on GitHub</span>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </a>

                  {/* Mobile Stats */}
                  <div className="flex items-center justify-around pt-2 mt-2 border-t border-white/10 text-xs text-white/60">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-rose-400" />
                      <span>{memberCount.toLocaleString()} members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span>Open Source</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ============ 3D PERSPECTIVE HERO ============ */}
        <div
          ref={heroRef}
          className="relative z-10 h-[110vh] sm:h-[130vh] w-full"
        >
          {/* Scroll indicator at top */}
          <div className="absolute left-1/2 top-[18%] sm:top-[15%] md:top-[12%] -translate-x-1/2 text-center z-20">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/70 font-light">
                scroll down
              </span>
              <span className="text-[10px] sm:text-xs text-white/40">to explore</span>
              <div className="w-px h-6 sm:h-8 md:h-12 bg-gradient-to-b from-white/50 to-transparent" />
            </div>
          </div>

          {/* 3D Text Container */}
          <div
            className="sticky top-0 h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6"
            style={{
              transformStyle: shouldReduceMotion ? "flat" : "preserve-3d",
              perspective: shouldReduceMotion ? "none" : "150px",
            }}
          >
            <motion.div
              style={{
                transformStyle: shouldReduceMotion ? "flat" : "preserve-3d",
                transform: shouldReduceMotion ? undefined : transform,
                opacity: opacityValue,
              }}
              className="relative w-full max-w-6xl text-center"
            >
              {/* Main 3D Text */}
              <div className="space-y-2 sm:space-y-1">
                <h1 className="text-[2.75rem] leading-[0.95] sm:text-5xl md:text-6xl lg:text-8xl font-black sm:leading-[0.9] tracking-tighter">
                  <span className="block bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                    Your terminal.
                  </span>
                  <span className="block text-white/95 mt-2 sm:mt-1 md:mt-2">
                    Your keys.
                  </span>
                  <span className="block bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 bg-clip-text text-transparent mt-2 sm:mt-1 md:mt-2">
                    Your Sui.
                  </span>
                </h1>

                {/* Subtitle features - max brightness text with better mobile scaling */}
                <div className="mt-8 sm:mt-10 md:mt-12 space-y-2 sm:space-y-3 md:space-y-4 font-bold">
                  <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white leading-tight">
                    Transfer SUI instantly
                  </p>
                  <p className="text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-white/95 leading-tight">
                    Deploy Move contracts
                  </p>
                  <p className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-white/85 leading-tight">
                    Manage gas & NFTs
                  </p>
                  <p className="text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/75 leading-tight">
                    Switch networks seamlessly
                  </p>
                  <p className="hidden sm:block text-sm md:text-base lg:text-lg xl:text-xl text-white/65 leading-tight">
                    Build & publish Move packages
                  </p>
                </div>

                {/* Tagline - better mobile readability */}
                <p className="mt-8 sm:mt-12 md:mt-14 text-[11px] sm:text-base md:text-lg lg:text-xl text-white/40 tracking-wider font-semibold px-4">
                  100% local • Zero cloud • Max security
                </p>
              </div>

              {/* Bottom gradient fade */}
              <div className="pointer-events-none absolute -bottom-32 left-0 h-[50vh] w-full bg-gradient-to-b from-transparent via-black/50 to-black" />
            </motion.div>
          </div>
        </div>

        {/* ============ STICKY CARDS SECTION ============ */}
        <StickyCardsSection />

        {/* ============ FEATURES GRID (Bento Style) ============ */}
        <FeaturesGrid />

        {/* ============ CONTRACT SECTION ============ */}
        <section className="relative z-20 py-16 sm:py-20 md:py-24 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 border border-green-500/30 rounded-full text-sm mb-4">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-green-400">verified on testnet</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Smart Contract
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 space-y-4"
            >
              {/* Package ID */}
              <div className="space-y-2">
                <div className="text-xs text-white/40 uppercase tracking-wider">Package ID</div>
                <div className="flex items-start sm:items-center gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                  <code className="flex-1 text-rose-300 text-xs sm:text-sm break-all sm:truncate font-mono leading-relaxed">
                    {CONTRACT_INFO.packageId}
                  </code>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyToClipboard(CONTRACT_INFO.packageId, 'package')}
                      className="p-2.5 sm:p-2 hover:bg-white/10 active:bg-white/20 rounded transition-colors min-h-[44px] sm:min-h-0"
                      aria-label="Copy package ID"
                    >
                      {copiedAddress === 'package' ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-4 sm:h-4 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 sm:w-4 sm:h-4 text-white/40 hover:text-white/60" />
                      )}
                    </button>
                    <a
                      href={`${CONTRACT_INFO.explorerBase}/object/${CONTRACT_INFO.packageId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 sm:p-2 hover:bg-white/10 active:bg-white/20 rounded transition-colors min-h-[44px] sm:min-h-0"
                      aria-label="View on explorer"
                    >
                      <ExternalLink className="w-5 h-5 sm:w-4 sm:h-4 text-white/40 hover:text-rose-400" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Registry ID */}
              <div className="space-y-2">
                <div className="text-xs text-white/40 uppercase tracking-wider">Registry ID</div>
                <div className="flex items-start sm:items-center gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                  <code className="flex-1 text-rose-300 text-xs sm:text-sm break-all sm:truncate font-mono leading-relaxed">
                    {CONTRACT_INFO.registryId}
                  </code>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyToClipboard(CONTRACT_INFO.registryId, 'registry')}
                      className="p-2.5 sm:p-2 hover:bg-white/10 active:bg-white/20 rounded transition-colors min-h-[44px] sm:min-h-0"
                      aria-label="Copy registry ID"
                    >
                      {copiedAddress === 'registry' ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-4 sm:h-4 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 sm:w-4 sm:h-4 text-white/40 hover:text-white/60" />
                      )}
                    </button>
                    <a
                      href={`${CONTRACT_INFO.explorerBase}/object/${CONTRACT_INFO.registryId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 sm:p-2 hover:bg-white/10 active:bg-white/20 rounded transition-colors min-h-[44px] sm:min-h-0"
                      aria-label="View on explorer"
                    >
                      <ExternalLink className="w-5 h-5 sm:w-4 sm:h-4 text-white/40 hover:text-rose-400" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Functions */}
              <div className="pt-4 border-t border-white/5">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Functions</div>
                <div className="flex flex-wrap gap-2">
                  {['join_community()', 'is_member()', 'get_total_members()'].map((fn) => (
                    <span key={fn} className="px-3 py-2 sm:py-1.5 bg-rose-500/10 text-rose-300 text-xs rounded border border-rose-500/20 font-mono">
                      {fn}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ TIERS SECTION with BounceCards ============ */}
        <section className="relative z-20 py-16 sm:py-20 md:py-24 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <span className="text-rose-400 text-xs sm:text-sm tracking-wider uppercase">Community</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-2">
                Tier System
              </h2>
              <p className="text-white/40 mt-2 text-xs sm:text-sm px-4">Level up by being active on Sui</p>
            </motion.div>

            {/* Holographic Tier Cards with 3D tilt - Performance optimized for mobile */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0.3 : 0.6 }}
              className="mb-8 sm:mb-12"
            >
              <TierCardsGrid />
            </motion.div>

            {/* Join stats - Better mobile stacking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 bg-black/40 border border-rose-500/20 rounded-xl w-full max-w-md sm:max-w-none sm:w-auto">
                <div className="text-center w-full sm:w-auto">
                  <div className="text-xl sm:text-2xl font-bold text-rose-400">{memberCount.toLocaleString()}</div>
                  <div className="text-xs text-white/40">members</div>
                </div>
                <div className="hidden sm:block w-px h-10 bg-white/10" />
                <div className="w-full sm:hidden h-px bg-white/10" />
                <div className="text-center w-full sm:w-auto">
                  <div className="text-xl sm:text-2xl font-bold text-green-400">FREE</div>
                  <div className="text-xs text-white/40">~0.01 SUI gas</div>
                </div>
                <div className="hidden sm:block w-px h-10 bg-white/10" />
                <div className="w-full sm:hidden h-px bg-white/10" />
                <div className="text-center w-full sm:w-auto">
                  <div className="text-xl sm:text-2xl font-bold text-purple-400">NFT</div>
                  <div className="text-xs text-white/40">on-chain</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ PROFILE CARD PREVIEW ============ */}
        <section className="relative z-20 py-16 sm:py-20 md:py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <span className="text-cyan-400 text-xs sm:text-sm tracking-wider uppercase">Membership Preview</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-2">
                Your On-Chain Identity
              </h2>
              <p className="text-white/40 mt-2 text-xs sm:text-sm px-4">Join the community and get your unique profile card</p>
            </motion.div>

            {/* ProfileCard with demo data - Disable 3D on mobile for performance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0.3 : 0.5 }}
              className="flex justify-center px-4"
            >
              <ProfileCard
                avatarUrl="/sui-logo.svg"
                name="Sui Builder"
                title="Community Member"
                handle="suibuilder"
                status="Active on Testnet"
                contactText="Join Now"
                onContactClick={() => navigate('/app/membership')}
                innerGradient="linear-gradient(145deg, #1a365d8c 0%, #4da2ff44 100%)"
                behindGlowColor="rgba(77, 162, 255, 0.4)"
                enableTilt={!isMobile}
                tierBadge={
                  <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full mt-3">
                    <Droplet className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-medium text-blue-400">Droplet</span>
                  </div>
                }
              />
            </motion.div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="relative z-20 py-16 sm:py-20 md:py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0.3 : 0.5 }}
              className="space-y-6 sm:space-y-8"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white px-4">
                <span className="text-rose-500">$</span> ready?
              </h2>

              <button
                onClick={() => navigate('/setup')}
                className="group w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-bold rounded-lg transition-all text-base sm:text-lg shadow-lg shadow-rose-500/20 min-h-[56px]"
              >
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <Terminal className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  <span className="truncate text-sm sm:text-base">npm i sui-cli-web-server</span>
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <p className="text-white/30 text-xs sm:text-sm px-4">
                works on macOS, Linux, Windows
              </p>
            </motion.div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="relative z-20 py-8 sm:py-12 px-4 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-xs sm:text-sm text-white/40">
              <div className="flex items-center gap-2 text-center">
                <span className="text-rose-400 font-medium">v1.2.0</span>
                <span className="hidden sm:inline">•</span>
                <span>MIT License</span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <a
                  href="https://github.com/hien-p/raycast-sui-cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-400 active:text-rose-500 transition-colors py-2 px-3 sm:p-0 min-h-[44px] sm:min-h-0 flex items-center"
                >
                  GitHub
                </a>
                <a
                  href="https://www.npmjs.com/package/sui-cli-web-server"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-400 active:text-rose-500 transition-colors py-2 px-3 sm:p-0 min-h-[44px] sm:min-h-0 flex items-center"
                >
                  NPM
                </a>
                <button
                  onClick={() => navigate('/app/membership')}
                  className="hover:text-rose-400 active:text-rose-500 transition-colors py-2 px-3 sm:p-0 min-h-[44px] sm:min-h-0 flex items-center"
                >
                  Join
                </button>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center mt-6 text-xs text-white/30">
              <p>Built with React, TypeScript, and Sui SDK</p>
            </div>
          </div>
        </footer>
      </div>
    </ReactLenis>
  );
}
