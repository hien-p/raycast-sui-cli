import { useEffect } from 'react';
import { gsap } from 'gsap';
import { Droplet, Waves, Wind, Anchor } from 'lucide-react';

// Tier data
const TIERS = [
  {
    id: 'droplet',
    name: 'Droplet',
    requirement: 'Join',
    icon: Droplet,
    gradient: 'from-blue-500/30 to-cyan-500/30',
    borderColor: 'border-blue-400/50',
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-950/80',
  },
  {
    id: 'wave',
    name: 'Wave',
    requirement: '25+ tx',
    icon: Waves,
    gradient: 'from-purple-500/30 to-pink-500/30',
    borderColor: 'border-purple-400/50',
    iconColor: 'text-purple-400',
    bgColor: 'bg-purple-950/80',
  },
  {
    id: 'tsunami',
    name: 'Tsunami',
    requirement: '100+ tx',
    icon: Wind,
    gradient: 'from-rose-500/30 to-orange-500/30',
    borderColor: 'border-rose-400/50',
    iconColor: 'text-rose-400',
    bgColor: 'bg-rose-950/80',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    requirement: '500+ tx',
    icon: Anchor,
    gradient: 'from-amber-500/30 to-yellow-500/30',
    borderColor: 'border-amber-400/50',
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-950/80',
  },
];

interface TierBounceCardsProps {
  className?: string;
  containerWidth?: number;
  containerHeight?: number;
  animationDelay?: number;
  animationStagger?: number;
  enableHover?: boolean;
}

export default function TierBounceCards({
  className = '',
  containerWidth = 600,
  containerHeight = 300,
  animationDelay = 0.3,
  animationStagger = 0.08,
  enableHover = true,
}: TierBounceCardsProps) {
  const transformStyles = [
    'rotate(-12deg) translate(-180px, 10px)',
    'rotate(-4deg) translate(-60px, -5px)',
    'rotate(4deg) translate(60px, -5px)',
    'rotate(12deg) translate(180px, 10px)',
  ];

  useEffect(() => {
    gsap.fromTo(
      '.tier-bounce-card',
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        stagger: animationStagger,
        ease: 'elastic.out(1, 0.8)',
        delay: animationDelay,
      }
    );
  }, [animationDelay, animationStagger]);

  const getNoRotationTransform = (transformStr: string): string => {
    const hasRotate = /rotate\([\s\S]*?\)/.test(transformStr);
    if (hasRotate) {
      return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)');
    }
    return transformStr === 'none' ? 'rotate(0deg)' : `${transformStr} rotate(0deg)`;
  };

  const getPushedTransform = (baseTransform: string, offsetX: number): string => {
    const translateRegex = /translate\(([-0-9.]+)px,?\s*([-0-9.]+)?px?\)/;
    const match = baseTransform.match(translateRegex);
    if (match) {
      const currentX = parseFloat(match[1]);
      const currentY = match[2] ? parseFloat(match[2]) : 0;
      const newX = currentX + offsetX;
      return baseTransform.replace(translateRegex, `translate(${newX}px, ${currentY}px)`);
    }
    return baseTransform === 'none' ? `translate(${offsetX}px)` : `${baseTransform} translate(${offsetX}px)`;
  };

  const pushSiblings = (hoveredIdx: number) => {
    if (!enableHover) return;

    TIERS.forEach((_, i) => {
      const selector = `.tier-bounce-card-${i}`;
      gsap.killTweensOf(selector);

      const baseTransform = transformStyles[i] || 'none';

      if (i === hoveredIdx) {
        const noRotation = getNoRotationTransform(baseTransform);
        gsap.to(selector, {
          transform: noRotation,
          scale: 1.1,
          zIndex: 10,
          duration: 0.4,
          ease: 'back.out(1.4)',
          overwrite: 'auto',
        });
      } else {
        const offsetX = i < hoveredIdx ? -80 : 80;
        const pushedTransform = getPushedTransform(baseTransform, offsetX);
        const distance = Math.abs(hoveredIdx - i);
        const delay = distance * 0.03;

        gsap.to(selector, {
          transform: pushedTransform,
          scale: 0.95,
          opacity: 0.7,
          duration: 0.4,
          ease: 'back.out(1.4)',
          delay,
          overwrite: 'auto',
        });
      }
    });
  };

  const resetSiblings = () => {
    if (!enableHover) return;

    TIERS.forEach((_, i) => {
      const selector = `.tier-bounce-card-${i}`;
      gsap.killTweensOf(selector);

      const baseTransform = transformStyles[i] || 'none';
      gsap.to(selector, {
        transform: baseTransform,
        scale: 1,
        opacity: 1,
        zIndex: 1,
        duration: 0.4,
        ease: 'back.out(1.4)',
        overwrite: 'auto',
      });
    });
  };

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {TIERS.map((tier, idx) => {
        const Icon = tier.icon;
        return (
          <div
            key={tier.id}
            className={`tier-bounce-card tier-bounce-card-${idx} absolute w-[140px] h-[180px] rounded-2xl overflow-hidden cursor-pointer
              bg-gradient-to-br ${tier.gradient} ${tier.bgColor} border-2 ${tier.borderColor}
              backdrop-blur-sm shadow-xl transition-shadow hover:shadow-2xl`}
            style={{
              transform: transformStyles[idx] || 'none',
              zIndex: 1,
            }}
            onMouseEnter={() => pushSiblings(idx)}
            onMouseLeave={resetSiblings}
          >
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className={`p-3 rounded-xl bg-black/30 mb-3`}>
                <Icon className={`w-8 h-8 ${tier.iconColor}`} />
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full bg-black/40 ${tier.iconColor} border border-current/20`}>
                {tier.name}
              </span>
              <span className="mt-2 text-xs text-white/60 font-mono">
                {tier.requirement}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
