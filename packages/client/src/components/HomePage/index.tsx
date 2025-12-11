import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion';
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

  // 3D Scroll refs
  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
  });

  // Start below (300px), scroll up brings text to center then up
  const yMotionValue = useTransform(scrollYProgress, [0, 1], [300, -300]);
  const opacityValue = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);
  const transform = useMotionTemplate`rotateX(20deg) translateY(${yMotionValue}px) translateZ(10px)`;

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
        <div className="fixed top-0 left-0 right-0 z-50 pt-2 sm:pt-4 pb-2 sm:pb-3 px-2 sm:px-4">
          <div className="max-w-5xl mx-auto">
            {/* Navbar container with glass effect */}
            <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-3 px-2 sm:px-6 py-2 sm:py-3 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl shadow-black/50">
              {/* Version badge - hidden on very small screens */}
              <div className="hidden xs:inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-rose-500/10 border border-rose-500/40 rounded-full text-[10px] sm:text-xs">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-rose-400 font-medium">v1.2</span>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => navigate('/setup')}
                  className="group px-2 sm:px-4 py-1.5 sm:py-2 bg-rose-500/30 hover:bg-rose-500/50 border border-rose-500/60 hover:border-rose-500 text-rose-300 hover:text-white font-bold rounded-lg transition-all text-xs sm:text-sm shadow-lg shadow-rose-500/20"
                >
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <Terminal className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">./install.sh</span>
                    <span className="sm:hidden">Install</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>

                <button
                  onClick={() => navigate('/app')}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white/90 hover:text-white font-bold rounded-lg transition-all border border-white/20 hover:border-white/40 text-xs sm:text-sm"
                >
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">launch --now</span>
                    <span className="sm:hidden">Launch</span>
                  </span>
                </button>

                <a
                  href="https://github.com/hien-p/raycast-sui-cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-all border border-white/20 hover:border-white/40 text-xs sm:text-sm"
                >
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <Github className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">src</span>
                  </span>
                </a>

                {/* Blog - Coming Soon */}
                <button
                  disabled
                  className="relative px-2 sm:px-4 py-1.5 sm:py-2 bg-white/5 text-white/40 rounded-lg border border-white/10 text-xs sm:text-sm cursor-not-allowed"
                  title="Coming soon"
                >
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <span className="hidden sm:inline">Blog</span>
                    <span className="sm:hidden text-[10px]">Blog</span>
                  </span>
                  <span className="absolute -top-1 -right-1 px-1 py-0.5 bg-amber-500/80 text-[8px] text-black font-bold rounded uppercase">
                    soon
                  </span>
                </button>
              </div>

              {/* Stats - hidden on mobile */}
              <div className="hidden lg:flex items-center gap-4 text-xs text-white/60">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  <span>{memberCount.toLocaleString()} members</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  <span>open source</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ 3D PERSPECTIVE HERO ============ */}
        <div
          ref={heroRef}
          className="relative z-10 h-[130vh] w-full"
        >
          {/* Scroll indicator at top */}
          <div className="absolute left-1/2 top-[15%] sm:top-[12%] -translate-x-1/2 text-center z-20">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/70 font-light">
                scroll down
              </span>
              <span className="text-[10px] sm:text-xs text-white/40">to explore</span>
              <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-white/50 to-transparent" />
            </div>
          </div>

          {/* 3D Text Container */}
          <div
            className="sticky top-0 h-screen flex items-center justify-center overflow-hidden"
            style={{
              transformStyle: "preserve-3d",
              perspective: "150px",
            }}
          >
            <motion.div
              style={{
                transformStyle: "preserve-3d",
                transform,
                opacity: opacityValue,
              }}
              className="relative w-full max-w-6xl px-4 sm:px-6 text-center"
            >
              {/* Main 3D Text */}
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black leading-[0.9] tracking-tighter">
                  <span className="block bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                    Your terminal.
                  </span>
                  <span className="block text-white/95 mt-1 sm:mt-2">
                    Your keys.
                  </span>
                  <span className="block bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 bg-clip-text text-transparent mt-1 sm:mt-2">
                    Your Sui.
                  </span>
                </h1>

                {/* Subtitle features - max brightness text */}
                <div className="mt-6 sm:mt-12 space-y-2 sm:space-y-4 font-bold">
                  <p className="text-xl sm:text-3xl md:text-4xl lg:text-5xl text-white">
                    Transfer SUI instantly
                  </p>
                  <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-white/95">
                    Deploy Move contracts
                  </p>
                  <p className="text-base sm:text-xl md:text-2xl lg:text-3xl text-white/85">
                    Manage gas & NFTs
                  </p>
                  <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white/75">
                    Switch networks seamlessly
                  </p>
                  <p className="hidden sm:block text-base md:text-lg lg:text-xl text-white/65">
                    Build & publish Move packages
                  </p>
                </div>

                {/* Tagline */}
                <p className="mt-8 sm:mt-14 text-xs sm:text-lg md:text-xl text-white/40 tracking-wider font-semibold">
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
        <section className="relative z-20 py-24 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 border border-green-500/30 rounded-full text-sm mb-4">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-green-400">verified on testnet</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Smart Contract
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4"
            >
              {/* Package ID */}
              <div className="space-y-2">
                <div className="text-xs text-white/40 uppercase tracking-wider">Package ID</div>
                <div className="flex items-center gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                  <code className="flex-1 text-rose-300 text-xs sm:text-sm truncate">
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
                <div className="text-xs text-white/40 uppercase tracking-wider">Registry ID</div>
                <div className="flex items-center gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
                  <code className="flex-1 text-rose-300 text-xs sm:text-sm truncate">
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
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Functions</div>
                <div className="flex flex-wrap gap-2">
                  {['join_community()', 'is_member()', 'get_total_members()'].map((fn) => (
                    <span key={fn} className="px-3 py-1.5 bg-rose-500/10 text-rose-300 text-xs rounded border border-rose-500/20">
                      {fn}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ TIERS SECTION with BounceCards ============ */}
        <section className="relative z-20 py-24 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <span className="text-rose-400 text-sm tracking-wider uppercase">Community</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">
                Tier System
              </h2>
              <p className="text-white/40 mt-2 text-sm">Level up by being active on Sui</p>
            </motion.div>

            {/* Holographic Tier Cards with 3D tilt */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <TierCardsGrid />
            </motion.div>

            {/* Join stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-4 px-6 py-4 bg-black/40 border border-rose-500/20 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-400">{memberCount.toLocaleString()}</div>
                  <div className="text-xs text-white/40">members</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">FREE</div>
                  <div className="text-xs text-white/40">~0.01 SUI gas</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">NFT</div>
                  <div className="text-xs text-white/40">on-chain</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ PROFILE CARD PREVIEW ============ */}
        <section className="relative z-20 py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-cyan-400 text-sm tracking-wider uppercase">Membership Preview</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">
                Your On-Chain Identity
              </h2>
              <p className="text-white/40 mt-2 text-sm">Join the community and get your unique profile card</p>
            </motion.div>

            {/* ProfileCard with demo data */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex justify-center"
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
        <section className="relative z-20 py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white">
                <span className="text-rose-500">$</span> ready?
              </h2>

              <button
                onClick={() => navigate('/setup')}
                className="group px-10 py-5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-all text-lg"
              >
                <span className="flex items-center gap-3">
                  <Terminal className="w-6 h-6" />
                  npm i sui-cli-web-server
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <p className="text-white/30 text-sm">
                works on macOS, Linux, Windows
              </p>
            </motion.div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="relative z-20 py-12 px-4 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
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
    </ReactLenis>
  );
}
