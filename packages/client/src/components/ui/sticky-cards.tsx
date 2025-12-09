import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Terminal, Send, Zap, Network, Droplets, Users, Package, Eye } from "lucide-react";

// Mock feature cards data
const FEATURE_CARDS = [
  {
    id: 'wallet',
    title: 'Wallet Management',
    description: 'Create, switch, and manage multiple addresses with real-time balance tracking',
    icon: Terminal,
    gradient: 'from-rose-500/20 to-pink-500/20',
    borderColor: 'border-rose-500/30',
  },
  {
    id: 'transfer',
    title: 'Instant Transfers',
    description: 'Send SUI and tokens with automatic gas estimation and transaction preview',
    icon: Send,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'gas',
    title: 'Gas Management',
    description: 'Split and merge gas coins efficiently for optimal transaction handling',
    icon: Zap,
    gradient: 'from-yellow-500/20 to-orange-500/20',
    borderColor: 'border-yellow-500/30',
  },
  {
    id: 'network',
    title: 'Network Switch',
    description: 'Seamlessly switch between mainnet, testnet, devnet, and custom RPCs',
    icon: Network,
    gradient: 'from-purple-500/20 to-violet-500/20',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'faucet',
    title: 'Faucet Integration',
    description: '8 integrated faucets for testnet and devnet token requests',
    icon: Droplets,
    gradient: 'from-cyan-500/20 to-teal-500/20',
    borderColor: 'border-cyan-500/30',
  },
  {
    id: 'move',
    title: 'Move Development',
    description: 'Build, test, and publish Move packages directly from your browser',
    icon: Package,
    gradient: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/30',
  },
];

interface StickyCardProps {
  card: typeof FEATURE_CARDS[0];
  index: number;
}

function StickyCard({ card, index }: StickyCardProps) {
  const vertMargin = 10;
  const container = useRef(null);
  const [maxScrollY, setMaxScrollY] = useState(Infinity);

  const filter = useMotionValue(0);
  const negateFilter = useTransform(filter, (value) => -value);

  const { scrollY } = useScroll({
    target: container,
  });

  const scale = useTransform(scrollY, [maxScrollY - 500, maxScrollY + 200], [0.85, 1]);

  const isInView = useInView(container, {
    margin: `0px 0px -${100 - vertMargin}% 0px`,
    once: true,
  });

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (currentScrollY) => {
      // Scale UP from 0.85 to 1 as card comes into view
      const scrollStart = maxScrollY - 500;
      const scrollEnd = maxScrollY + 200;
      let animationValue = 0.85;

      if (currentScrollY >= scrollStart && currentScrollY <= scrollEnd) {
        const progress = (currentScrollY - scrollStart) / (scrollEnd - scrollStart);
        animationValue = 0.85 + (progress * 0.15); // 0.85 -> 1.0
      } else if (currentScrollY > scrollEnd) {
        animationValue = 1;
      }

      scale.set(animationValue);
      // Reduce filter effect since we're scaling up now
      filter.set((1 - animationValue) * 10);
    });
    return () => unsubscribe();
  }, [maxScrollY, scrollY, scale, filter]);

  useEffect(() => {
    if (isInView) {
      setMaxScrollY(scrollY.get());
    }
  }, [isInView, scrollY]);

  const Icon = card.icon;

  return (
    <motion.div
      ref={container}
      className={`sticky w-full max-w-4xl overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br ${card.gradient} border ${card.borderColor} backdrop-blur-sm`}
      style={{
        scale: scale,
        rotate: filter,
        height: `${100 - 2 * vertMargin}vh`,
        top: `${vertMargin}vh`,
      }}
    >
      <motion.div
        style={{ rotate: negateFilter }}
        className="h-full w-full p-4 sm:p-8 md:p-12 flex flex-col justify-center"
      >
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-4 sm:mb-6 inline-flex p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
            <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-white/80" />
          </div>

          {/* Title */}
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4">
            {card.title}
          </h3>

          {/* Description */}
          <p className="text-sm sm:text-lg md:text-xl text-white/60 max-w-lg mx-auto px-2">
            {card.description}
          </p>

          {/* Mock UI Preview */}
          <div className="mt-4 sm:mt-8 p-3 sm:p-6 rounded-lg sm:rounded-xl bg-black/30 border border-white/10">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-rose-500" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
              <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-white/40 font-mono">sui-cli-web</span>
            </div>
            <div className="space-y-1 sm:space-y-2 text-left font-mono text-xs sm:text-sm">
              <div className="text-white/40">$ sui client {card.id}</div>
              <div className="text-green-400">✓ Done</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function StickyCardsSection() {
  return (
    <section className="relative flex w-full flex-col items-center gap-[8vh] sm:gap-[10vh] px-2 sm:px-4 pt-0 pb-[20vh] sm:pb-[30vh] -mt-[15vh] sm:-mt-[20vh]">
      {/* Section header */}
      <div className="text-center mb-4 sm:mb-8">
        <span className="text-rose-400 text-xs sm:text-sm tracking-wider uppercase">Features in Action</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-1 sm:mt-2">
          See what you can do
        </h2>
      </div>

      {FEATURE_CARDS.map((card, idx) => (
        <StickyCard key={card.id} card={card} index={idx} />
      ))}
    </section>
  );
}
