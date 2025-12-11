import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { DEFAULT_COMMANDS } from '@/types';
import { AnimatedList } from '@/components/ui/animated-list';
import { useFeatureFlags, FeatureGates } from '@/hooks/useFeatureFlags';
import toast from 'react-hot-toast';

const VIEW_TO_ROUTE: Record<string, string> = {
  addresses: '/app/addresses',
  environments: '/app/environments',
  objects: '/app/objects',
  'dynamic-fields': '/app/dynamic-fields',
  gas: '/app/coins', // Redirected from gas to coins (all coin types)
  faucet: '/app/faucet',
  membership: '/app/membership',
  transfer: '/app/transfer',
  move: '/app/move',
  inspector: '/app/inspector',
  devtools: '/app/devtools',
  security: '/app/security',
  keytool: '/app/keytool',
  'game-demo': '/app/game-demo',
};

export function CommandPalette() {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const { isEnabled } = useFeatureFlags();
  const {
    searchQuery,
    selectedIndex,
    setSelectedIndex,
    addresses,
    environments,
    isCommunityMember,
    communityStats,
    fetchCommunityStatus,
    joinCommunity,
  } = useAppStore();

  const activeAddress = addresses.find((a) => a.isActive);
  const activeEnv = environments.find((e) => e.isActive);

  // Fetch community status on mount
  useEffect(() => {
    fetchCommunityStatus();
  }, [fetchCommunityStatus]);

  // Show join option if not member and community is configured
  const showJoinOption = !isCommunityMember && communityStats.isConfigured;

  // Get filtered commands (including feature flag filtering)
  const filteredCommands = useMemo(() => {
    let commands = DEFAULT_COMMANDS;

    // Filter by feature flags
    commands = commands.filter((cmd) => {
      // If no feature flag required, always show
      if (!cmd.featureFlag) return true;

      // Check if the feature flag is enabled
      const flagEnabled = isEnabled(cmd.featureFlag as keyof typeof FeatureGates);

      // If hideWhenFlagEnabled is true, show when flag is disabled
      if (cmd.hideWhenFlagEnabled) {
        return !flagEnabled;
      }

      // Otherwise, show when flag is enabled
      return flagEnabled;
    });

    // Only show membership profile if user is a member
    if (!isCommunityMember) {
      commands = commands.filter((cmd) => cmd.id !== 'membership');
    }

    if (!searchQuery) return commands;
    const query = searchQuery.toLowerCase();
    return commands.filter((cmd) =>
      cmd.title.toLowerCase().includes(query) ||
      cmd.subtitle?.toLowerCase().includes(query) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(query))
    );
  }, [searchQuery, isCommunityMember, isEnabled]);

  // +2 for status items, +1 for join community if showing
  const totalItems = filteredCommands.length + 2 + (showJoinOption ? 1 : 0);

  const handleJoinCommunity = async () => {
    if (isJoining) return;
    setIsJoining(true);
    try {
      const result = await joinCommunity();
      if (result.success) {
        toast.success('Welcome to the community!');
      } else {
        // Friendly error messages
        let msg = result.error || 'Join failed';
        if (msg.includes('Cannot connect') || msg.includes('fetch')) {
          msg = 'Server not running. Start the local server first.';
        } else if (msg.includes('gas') || msg.includes('Insufficient')) {
          msg = 'Not enough gas. Request tokens from Faucet first.';
        }
        toast.error(msg);
      }
    } finally {
      setIsJoining(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, totalItems - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Index 0: Join Community (if showing) or Environment
        // Index 1: Environment (if join showing) or Address
        // Index 2+: Commands
        if (showJoinOption) {
          if (selectedIndex === 0) {
            handleJoinCommunity();
          } else if (selectedIndex === 1) {
            navigate('/app/environments');
          } else if (selectedIndex === 2) {
            navigate('/app/addresses');
          } else {
            const cmdIndex = selectedIndex - 3;
            const cmd = filteredCommands[cmdIndex];
            if (cmd && VIEW_TO_ROUTE[cmd.action]) {
              navigate(VIEW_TO_ROUTE[cmd.action]);
            }
          }
        } else {
          if (selectedIndex === 0) {
            navigate('/app/environments');
          } else if (selectedIndex === 1) {
            navigate('/app/addresses');
          } else {
            const cmdIndex = selectedIndex - 2;
            const cmd = filteredCommands[cmdIndex];
            if (cmd && VIEW_TO_ROUTE[cmd.action]) {
              navigate(VIEW_TO_ROUTE[cmd.action]);
            }
          }
        }
      }
    },
    [selectedIndex, totalItems, filteredCommands, navigate, setSelectedIndex, showJoinOption]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCommandClick = (action: string, index: number) => {
    setSelectedIndex(index);
    if (VIEW_TO_ROUTE[action]) {
      navigate(VIEW_TO_ROUTE[action]);
    }
  };

  // Calculate indices based on whether join option is showing
  const envIndex = showJoinOption ? 1 : 0;
  const addrIndex = showJoinOption ? 2 : 1;
  const cmdOffset = showJoinOption ? 3 : 2;

  return (
    <div className="py-2">
      {/* Become a Member - Only show if not member */}
      {showJoinOption && (
        <>
          <div className="px-3 py-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Membership
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors ${
              selectedIndex === 0 ? 'bg-[#4da2ff]/20' : 'hover:bg-muted/50'
            }`}
            onClick={() => {
              setSelectedIndex(0);
              handleJoinCommunity();
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#4da2ff]/20 flex items-center justify-center">
              <span className="text-lg">🎖️</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">
                {isJoining ? 'Registering...' : 'Become a Member'}
              </div>
              <div className="text-xs text-muted-foreground">
                {communityStats.totalMembers} members · Tier system · Achievements
              </div>
            </div>
            <div className="px-2 py-0.5 bg-[#4da2ff] text-white text-xs rounded-md">
              Join
            </div>
          </motion.div>
        </>
      )}

      {/* Status Section */}
      <div className="px-3 py-1 mt-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Status
        </div>
      </div>

      {/* Active Environment */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.05 }}
        className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors ${
          selectedIndex === envIndex ? 'bg-primary/20' : 'hover:bg-muted/50'
        }`}
        onClick={() => {
          setSelectedIndex(envIndex);
          navigate('/app/environments');
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">
            Active: {activeEnv?.alias || 'Not set'}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {activeEnv?.rpc || 'No RPC configured'}
          </div>
        </div>
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </motion.div>

      {/* Active Address */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
        className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors ${
          selectedIndex === addrIndex ? 'bg-primary/20' : 'hover:bg-muted/50'
        }`}
        onClick={() => {
          setSelectedIndex(addrIndex);
          navigate('/app/addresses');
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">
            {activeAddress?.alias || 'No address'}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {activeAddress?.balance || '0'} SUI
          </div>
        </div>
      </motion.div>

      {/* Commands by Category */}
      {['Profile', 'Account', 'Assets', 'Actions', 'Development', 'Security', 'Learn'].map((category) => {
        const categoryCommands = filteredCommands.filter((cmd) => cmd.category === category);
        if (categoryCommands.length === 0) return null;

        return (
          <div key={category}>
            <div className="px-3 py-1 mt-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {category}
              </div>
            </div>
            <AnimatedList delay={0}>
              {categoryCommands.map((cmd) => {
                const cmdIndex = filteredCommands.indexOf(cmd) + cmdOffset;
                return (
                  <div
                    key={cmd.id}
                    className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors ${
                      selectedIndex === cmdIndex ? 'bg-primary/20' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleCommandClick(cmd.action, cmdIndex)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg">
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{cmd.title}</div>
                      {cmd.subtitle && (
                        <div className="text-xs text-muted-foreground">{cmd.subtitle}</div>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                );
              })}
            </AnimatedList>
          </div>
        );
      })}
    </div>
  );
}
