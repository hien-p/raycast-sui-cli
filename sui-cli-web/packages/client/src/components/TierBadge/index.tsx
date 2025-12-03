import { clsx } from 'clsx';

// Tier constants (matching backend)
export const TIER_DROPLET = 0;
export const TIER_WAVE = 1;
export const TIER_TSUNAMI = 2;
export const TIER_OCEAN = 3;

// Tier metadata for display
export const TIER_METADATA = {
  [TIER_DROPLET]: {
    name: 'Droplet',
    icon: '💧',
    color: '#4DA2FF',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    glowClass: '',
  },
  [TIER_WAVE]: {
    name: 'Wave',
    icon: '🌊',
    color: '#00D4AA',
    bgClass: 'bg-teal-500/20',
    textClass: 'text-teal-400',
    borderClass: 'border-teal-500/30',
    glowClass: 'shadow-[0_0_10px_rgba(0,212,170,0.3)]',
  },
  [TIER_TSUNAMI]: {
    name: 'Tsunami',
    icon: '🌀',
    color: '#7B61FF',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    glowClass: 'shadow-[0_0_15px_rgba(123,97,255,0.4)]',
  },
  [TIER_OCEAN]: {
    name: 'Ocean',
    icon: '🌊',
    color: '#FFD700',
    bgClass: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/30',
    glowClass: 'shadow-[0_0_20px_rgba(255,215,0,0.5)]',
  },
} as const;

export interface TierInfo {
  level: number;
  name: string;
  icon: string;
  color: string;
  colorGradient: string;
  description: string;
  txCount: number;
  hasDeployedContract: boolean;
  progress: {
    current: number;
    required: number;
    percentage: number;
    nextTier: string | null;
  };
}

interface TierBadgeProps {
  tier: number;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showGlow?: boolean;
  className?: string;
}

export function TierBadge({
  tier,
  size = 'md',
  showName = true,
  showGlow = true,
  className,
}: TierBadgeProps) {
  const metadata = TIER_METADATA[tier as keyof typeof TIER_METADATA] || TIER_METADATA[TIER_DROPLET];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border font-medium transition-all',
        metadata.bgClass,
        metadata.textClass,
        metadata.borderClass,
        showGlow && metadata.glowClass,
        sizeClasses[size],
        className
      )}
    >
      <span className={iconSizes[size]}>{metadata.icon}</span>
      {showName && <span>{metadata.name}</span>}
    </span>
  );
}

interface TierProgressProps {
  tierInfo: TierInfo;
  showDetails?: boolean;
  className?: string;
}

export function TierProgress({ tierInfo, showDetails = true, className }: TierProgressProps) {
  const { progress, txCount, hasDeployedContract } = tierInfo;
  const metadata = TIER_METADATA[tierInfo.level as keyof typeof TIER_METADATA] || TIER_METADATA[TIER_DROPLET];

  // No progress if at max tier or no next tier
  if (!progress.nextTier) {
    return (
      <div className={clsx('text-center', className)}>
        <div className={clsx('text-sm font-medium', metadata.textClass)}>
          {metadata.icon} Maximum Tier Reached!
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {/* Progress bar */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={clsx(
            'absolute left-0 top-0 h-full rounded-full transition-all duration-500',
            tierInfo.level === TIER_DROPLET && 'bg-blue-500',
            tierInfo.level === TIER_WAVE && 'bg-teal-500',
            tierInfo.level === TIER_TSUNAMI && 'bg-purple-500',
            tierInfo.level === TIER_OCEAN && 'bg-gradient-to-r from-yellow-500 to-orange-500'
          )}
          style={{ width: `${Math.min(100, progress.percentage)}%` }}
        />
      </div>

      {/* Progress text */}
      {showDetails && (
        <div className="flex justify-between text-xs text-white/60">
          <span>
            {txCount} / {progress.required} transactions
          </span>
          <span className={metadata.textClass}>
            Next: {progress.nextTier}
          </span>
        </div>
      )}

      {/* Shortcut hint for Wave tier */}
      {tierInfo.level === TIER_WAVE && !hasDeployedContract && (
        <div className="text-xs text-white/40 text-center">
          Tip: Deploy a smart contract to instantly reach Tsunami!
        </div>
      )}
    </div>
  );
}

interface TierCardProps {
  tierInfo: TierInfo;
  className?: string;
}

export function TierCard({ tierInfo, className }: TierCardProps) {
  const metadata = TIER_METADATA[tierInfo.level as keyof typeof TIER_METADATA] || TIER_METADATA[TIER_DROPLET];

  return (
    <div
      className={clsx(
        'p-4 rounded-xl border backdrop-blur-sm transition-all',
        metadata.bgClass,
        metadata.borderClass,
        metadata.glowClass,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{metadata.icon}</span>
          <div>
            <div className={clsx('font-bold', metadata.textClass)}>{metadata.name}</div>
            <div className="text-xs text-white/60">{tierInfo.description}</div>
          </div>
        </div>
        <TierBadge tier={tierInfo.level} size="sm" showName={false} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="bg-black/20 rounded-lg p-2">
          <div className="text-white/50 text-xs">Transactions</div>
          <div className="font-mono font-bold">{tierInfo.txCount}</div>
        </div>
        <div className="bg-black/20 rounded-lg p-2">
          <div className="text-white/50 text-xs">Deployed</div>
          <div className="font-mono font-bold">{tierInfo.hasDeployedContract ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Progress */}
      <TierProgress tierInfo={tierInfo} />
    </div>
  );
}
