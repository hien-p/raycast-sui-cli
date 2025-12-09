import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Droplet, Waves, Wind, Anchor } from 'lucide-react';

// Tier configurations
const TIER_CONFIG = {
  droplet: {
    name: 'Droplet',
    title: 'Beginner',
    requirement: 'Join',
    icon: Droplet,
    colors: {
      primary: '#60a5fa',
      secondary: '#3b82f6',
      gradient: 'linear-gradient(145deg, #1e3a5f 0%, #1e40af 100%)',
      glow: 'rgba(96, 165, 250, 0.6)',
      sunpillar: ['hsl(210, 100%, 73%)', 'hsl(220, 100%, 69%)', 'hsl(200, 100%, 74%)'],
    },
  },
  wave: {
    name: 'Wave',
    title: 'Active',
    requirement: '25+ tx',
    icon: Waves,
    colors: {
      primary: '#a855f7',
      secondary: '#9333ea',
      gradient: 'linear-gradient(145deg, #4c1d95 0%, #7c3aed 100%)',
      glow: 'rgba(168, 85, 247, 0.6)',
      sunpillar: ['hsl(270, 100%, 73%)', 'hsl(280, 100%, 69%)', 'hsl(260, 100%, 74%)'],
    },
  },
  tsunami: {
    name: 'Tsunami',
    title: 'Power User',
    requirement: '100+ tx',
    icon: Wind,
    colors: {
      primary: '#f43f5e',
      secondary: '#e11d48',
      gradient: 'linear-gradient(145deg, #7f1d1d 0%, #be123c 100%)',
      glow: 'rgba(244, 63, 94, 0.6)',
      sunpillar: ['hsl(350, 100%, 73%)', 'hsl(340, 100%, 69%)', 'hsl(0, 100%, 74%)'],
    },
  },
  ocean: {
    name: 'Ocean',
    title: 'Legend',
    requirement: '500+ tx',
    icon: Anchor,
    colors: {
      primary: '#f59e0b',
      secondary: '#d97706',
      gradient: 'linear-gradient(145deg, #78350f 0%, #b45309 100%)',
      glow: 'rgba(245, 158, 11, 0.6)',
      sunpillar: ['hsl(40, 100%, 73%)', 'hsl(30, 100%, 69%)', 'hsl(45, 100%, 74%)'],
    },
  },
};

type TierType = keyof typeof TIER_CONFIG;

interface TierCardProps {
  tier: TierType;
  className?: string;
}

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

const TierCardComponent: React.FC<TierCardProps> = ({ tier, className = '' }) => {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<number | null>(null);
  const leaveRafRef = useRef<number | null>(null);

  const tiltEngine = useMemo(() => {
    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);
      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties: Record<string, string> = {
        '--tc-pointer-x': `${percentX}%`,
        '--tc-pointer-y': `${percentY}%`,
        '--tc-background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--tc-background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--tc-pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--tc-pointer-from-top': `${percentY / 100}`,
        '--tc-pointer-from-left': `${percentX / 100}`,
        '--tc-rotate-x': `${round(-(centerX / 4))}deg`,
        '--tc-rotate-y': `${round(centerY / 3)}deg`,
      };

      for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v);
    };

    const step = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      setVarsFromXY(currentX, currentY);
      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x: number, y: number) { currentX = x; currentY = y; setVarsFromXY(currentX, currentY); },
      setTarget(x: number, y: number) { targetX = x; targetY = y; start(); },
      toCenter() { const shell = shellRef.current; if (shell) this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2); },
      beginInitial(durationMs: number) { initialUntil = performance.now() + durationMs; start(); },
      getCurrent() { return { x: currentX, y: currentY, tx: targetX, ty: targetY }; },
      cancel() { if (rafId) cancelAnimationFrame(rafId); rafId = null; running = false; lastTs = 0; },
    };
  }, []);

  const getOffsets = (evt: PointerEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  };

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    const { x, y } = getOffsets(event, shell);
    tiltEngine.setTarget(x, y);
  }, [tiltEngine]);

  const handlePointerEnter = useCallback((event: PointerEvent) => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    shell.classList.add('active');
    shell.classList.add('entering');
    if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
    enterTimerRef.current = window.setTimeout(() => shell.classList.remove('entering'), 180);
    const { x, y } = getOffsets(event, shell);
    tiltEngine.setTarget(x, y);
  }, [tiltEngine]);

  const handlePointerLeave = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    tiltEngine.toCenter();
    const checkSettle = () => {
      const { x, y, tx, ty } = tiltEngine.getCurrent();
      if (Math.hypot(tx - x, ty - y) < 0.6) { shell.classList.remove('active'); leaveRafRef.current = null; }
      else { leaveRafRef.current = requestAnimationFrame(checkSettle); }
    };
    if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
    leaveRafRef.current = requestAnimationFrame(checkSettle);
  }, [tiltEngine]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;

    shell.addEventListener('pointerenter', handlePointerEnter as EventListener);
    shell.addEventListener('pointermove', handlePointerMove as EventListener);
    shell.addEventListener('pointerleave', handlePointerLeave as EventListener);

    const initialX = (shell.clientWidth || 0) - 50;
    const initialY = 40;
    tiltEngine.setImmediate(initialX, initialY);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(1000);

    return () => {
      shell.removeEventListener('pointerenter', handlePointerEnter as EventListener);
      shell.removeEventListener('pointermove', handlePointerMove as EventListener);
      shell.removeEventListener('pointerleave', handlePointerLeave as EventListener);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
    };
  }, [tiltEngine, handlePointerMove, handlePointerEnter, handlePointerLeave]);

  const cardStyle = useMemo(() => ({
    '--tc-gradient': config.colors.gradient,
    '--tc-glow': config.colors.glow,
    '--tc-primary': config.colors.primary,
    '--tc-sunpillar-1': config.colors.sunpillar[0],
    '--tc-sunpillar-2': config.colors.sunpillar[1],
    '--tc-sunpillar-3': config.colors.sunpillar[2],
  } as React.CSSProperties), [config]);

  return (
    <div
      ref={wrapRef}
      className={`tier-card-wrapper ${className}`}
      style={cardStyle}
    >
      {/* Behind glow */}
      <div className="tier-card-glow" />

      <div ref={shellRef} className="tier-card-shell">
        <div className="tier-card">
          <div className="tier-card-inside" />
          <div className="tier-card-shine" />
          <div className="tier-card-glare" />

          {/* Content */}
          <div className="tier-card-content">
            <div className="tier-card-icon">
              <Icon className="w-10 h-10" style={{ color: config.colors.primary }} />
            </div>
            <div className="tier-card-badge" style={{
              backgroundColor: `${config.colors.primary}20`,
              borderColor: `${config.colors.primary}40`,
              color: config.colors.primary
            }}>
              {config.name}
            </div>
            <div className="tier-card-req">{config.requirement}</div>
          </div>
        </div>
      </div>

      <style>{`
        .tier-card-wrapper {
          --tc-pointer-x: 50%;
          --tc-pointer-y: 50%;
          --tc-pointer-from-center: 0;
          --tc-pointer-from-top: 0.5;
          --tc-pointer-from-left: 0.5;
          --tc-rotate-x: 0deg;
          --tc-rotate-y: 0deg;
          --tc-background-x: 50%;
          --tc-background-y: 50%;
          perspective: 600px;
          position: relative;
          touch-action: none;
        }

        .tier-card-glow {
          position: absolute;
          inset: -20px;
          z-index: 0;
          pointer-events: none;
          background: radial-gradient(
            circle at var(--tc-pointer-x) var(--tc-pointer-y),
            var(--tc-glow) 0%,
            transparent 60%
          );
          filter: blur(40px);
          opacity: 0;
          transition: opacity 300ms ease;
        }

        .tier-card-wrapper:hover .tier-card-glow,
        .tier-card-shell.active + .tier-card-glow,
        .tier-card-wrapper:hover .tier-card-glow {
          opacity: 0.8;
        }

        .tier-card-shell {
          position: relative;
          z-index: 1;
        }

        .tier-card {
          width: 180px;
          height: 240px;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          box-shadow:
            rgba(0, 0, 0, 0.5) calc((var(--tc-pointer-from-left) * 8px) - 2px)
            calc((var(--tc-pointer-from-top) * 16px) - 4px) 20px -5px;
          transition: transform 0.8s ease;
          transform: translateZ(0) rotateX(0deg) rotateY(0deg);
          backface-visibility: hidden;
        }

        .tier-card:hover,
        .tier-card-shell.active .tier-card {
          transition: none;
          transform: translateZ(0) rotateX(var(--tc-rotate-y)) rotateY(var(--tc-rotate-x));
        }

        .tier-card-shell.entering .tier-card {
          transition: transform 180ms ease-out;
        }

        .tier-card-inside {
          position: absolute;
          inset: 0;
          background: var(--tc-gradient);
          border-radius: 20px;
        }

        .tier-card-shine {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          transition: filter 0.5s ease;
          filter: brightness(0.7) contrast(1.2) saturate(0.4) opacity(0.6);
          animation: tc-holo 12s linear infinite;
          mix-blend-mode: color-dodge;
          background-image:
            repeating-linear-gradient(
              0deg,
              var(--tc-sunpillar-1) 5%,
              var(--tc-sunpillar-2) 15%,
              var(--tc-sunpillar-3) 25%,
              var(--tc-sunpillar-1) 35%
            ),
            repeating-linear-gradient(
              -45deg,
              #0e152e 0%,
              hsl(180, 10%, 60%) 3.8%,
              hsl(180, 29%, 66%) 4.5%,
              hsl(180, 10%, 60%) 5.2%,
              #0e152e 10%
            );
          background-position:
            0 var(--tc-background-y),
            var(--tc-background-x) var(--tc-background-y);
          background-size: 400% 400%, 250% 250%;
          background-blend-mode: color, hard-light;
        }

        .tier-card:hover .tier-card-shine,
        .tier-card-shell.active .tier-card-shine {
          filter: brightness(0.9) contrast(1.4) saturate(0.6);
          animation-play-state: paused;
        }

        .tier-card-glare {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background-image: radial-gradient(
            farthest-corner circle at var(--tc-pointer-x) var(--tc-pointer-y),
            hsl(248, 25%, 80%) 10%,
            hsla(207, 40%, 30%, 0.6) 80%
          );
          mix-blend-mode: overlay;
          filter: brightness(0.7) contrast(1.1);
          pointer-events: none;
        }

        .tier-card-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          z-index: 5;
          pointer-events: none;
          transform: translate3d(
            calc(var(--tc-pointer-from-left) * -4px + 2px),
            calc(var(--tc-pointer-from-top) * -4px + 2px),
            1px
          );
        }

        .tier-card-icon {
          padding: 18px;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(12px);
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .tier-card-badge {
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          border: 1px solid;
          backdrop-filter: blur(10px);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .tier-card-req {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          font-family: monospace;
          font-weight: 600;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
          background: rgba(0, 0, 0, 0.4);
          padding: 4px 12px;
          border-radius: 8px;
        }

        @keyframes tc-holo {
          0% { background-position: 0 var(--tc-background-y), 0 0; }
          100% { background-position: 0 var(--tc-background-y), 100% 100%; }
        }

        @media (max-width: 768px) {
          .tier-card {
            width: 150px;
            height: 200px;
          }
          .tier-card-icon {
            padding: 12px;
          }
          .tier-card-icon svg {
            width: 32px;
            height: 32px;
          }
          .tier-card-badge {
            font-size: 11px;
            padding: 4px 12px;
          }
        }
      `}</style>
    </div>
  );
};

// Export individual card
export const TierCard = React.memo(TierCardComponent);

// Export grid of all tier cards
export default function TierCardsGrid({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 justify-items-center ${className}`}>
      <TierCard tier="droplet" />
      <TierCard tier="wave" />
      <TierCard tier="tsunami" />
      <TierCard tier="ocean" />
    </div>
  );
}
