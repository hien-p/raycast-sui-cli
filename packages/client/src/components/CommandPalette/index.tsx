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
    <div className="py-2" role="listbox" id="command-list" aria-label="Command palette">
      {/* Tagline - Built for First Movers */}
      <div className="px-4 py-3 mb-2 text-center" aria-hidden="true">
        <p className="text-xs sm:text-sm font-mono text-white/40 tracking-wide">
          Built for <span className="text-[#4da2ff]">First Movers</span> in Sui
        </p>
      </div>

      {/* Become a Member - Terminal Style */}
      {showJoinOption && (
        <>
          <div className="px-3 py-1.5 flex items-center gap-2">
            <span className="text-white/20 text-xs font-mono select-none">{'──['}</span>
            <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
              Membership
            </span>
            <span className="text-white/20 text-xs font-mono select-none">{']'}</span>
            <span className="flex-1 border-t border-white/10 border-dashed" />
          </div>
          <motion.div
            role="option"
            aria-selected={selectedIndex === 0}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`flex items-center gap-2 px-3 py-2 mx-1 cursor-pointer transition-all duration-150 font-mono ${
              selectedIndex === 0
                ? 'bg-white/5 border-l-2 border-l-[#4da2ff]'
                : 'border-l-2 border-l-transparent hover:bg-white/[0.02] hover:border-l-white/20'
            }`}
            onClick={() => {
              setSelectedIndex(0);
              handleJoinCommunity();
            }}
          >
            <span className={`text-xs font-bold w-3 flex-shrink-0 transition-opacity ${
              selectedIndex === 0 ? 'text-[#4da2ff] opacity-100' : 'opacity-0'
            }`}>
              &gt;
            </span>

            <span className={`text-base flex-shrink-0 w-5 text-center transition-transform ${
              selectedIndex === 0 ? 'scale-110' : ''
            }`}>
              🎖️
            </span>

            <div className="flex-1 min-w-0">
              <div className={`text-sm truncate transition-colors ${
                selectedIndex === 0 ? 'text-white' : 'text-white/70'
              }`}>
                {isJoining ? 'Registering...' : 'Become a Member'}
              </div>
              <div className={`text-xs truncate ${
                selectedIndex === 0 ? 'text-white/50' : 'text-white/30'
              }`}>
                {communityStats.totalMembers} members · Tier system · Achievements
              </div>
            </div>

            <span className="px-2 py-0.5 bg-[#4da2ff]/20 text-[#4da2ff] text-[10px] font-mono rounded border border-[#4da2ff]/30">
              JOIN
            </span>
          </motion.div>
        </>
      )}

      {/* Status Section - Terminal Style */}
      <div className="px-3 py-1.5 mt-2 flex items-center gap-2">
        <span className="text-white/20 text-xs font-mono select-none">{'──['}</span>
        <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
          Status
        </span>
        <span className="text-white/20 text-xs font-mono select-none">{']'}</span>
        <span className="flex-1 border-t border-white/10 border-dashed" />
      </div>

      {/* Active Environment - Terminal Style */}
      <motion.div
        role="option"
        aria-selected={selectedIndex === envIndex}
        aria-label={`Environment: ${activeEnv?.alias || 'Not set'}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.05 }}
        className={`flex items-center gap-2 px-3 py-2 mx-1 cursor-pointer transition-all duration-150 font-mono ${
          selectedIndex === envIndex
            ? 'bg-white/5 border-l-2 border-l-[#4da2ff]'
            : 'border-l-2 border-l-transparent hover:bg-white/[0.02] hover:border-l-white/20'
        }`}
        onClick={() => {
          setSelectedIndex(envIndex);
          navigate('/app/environments');
        }}
      >
        <span className={`text-xs font-bold w-3 flex-shrink-0 transition-opacity ${
          selectedIndex === envIndex ? 'text-[#4da2ff] opacity-100' : 'opacity-0'
        }`}>
          &gt;
        </span>

        <span className={`text-base flex-shrink-0 w-5 text-center transition-transform ${
          selectedIndex === envIndex ? 'scale-110' : ''
        }`}>
          🌐
        </span>

        <div className="flex-1 min-w-0">
          <div className={`text-sm truncate transition-colors ${
            selectedIndex === envIndex ? 'text-white' : 'text-white/70'
          }`}>
            {activeEnv?.alias || 'Not set'}
          </div>
          <div className={`text-xs truncate ${
            selectedIndex === envIndex ? 'text-white/50' : 'text-white/30'
          }`}>
            {activeEnv?.rpc || 'No RPC configured'}
          </div>
        </div>

        {selectedIndex === envIndex && (
          <kbd className="flex-shrink-0 px-1.5 py-0.5 text-[10px] bg-white/5 text-white/40 rounded border border-white/10">
            enter
          </kbd>
        )}
      </motion.div>

      {/* Active Address - Terminal Style */}
      <motion.div
        role="option"
        aria-selected={selectedIndex === addrIndex}
        aria-label={`Address: ${activeAddress?.alias || 'No address'}, Balance: ${activeAddress?.balance || '0'} SUI`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
        className={`flex items-center gap-2 px-3 py-2 mx-1 cursor-pointer transition-all duration-150 font-mono ${
          selectedIndex === addrIndex
            ? 'bg-white/5 border-l-2 border-l-[#4da2ff]'
            : 'border-l-2 border-l-transparent hover:bg-white/[0.02] hover:border-l-white/20'
        }`}
        onClick={() => {
          setSelectedIndex(addrIndex);
          navigate('/app/addresses');
        }}
      >
        <span className={`text-xs font-bold w-3 flex-shrink-0 transition-opacity ${
          selectedIndex === addrIndex ? 'text-[#4da2ff] opacity-100' : 'opacity-0'
        }`}>
          &gt;
        </span>

        <span className={`text-base flex-shrink-0 w-5 text-center transition-transform ${
          selectedIndex === addrIndex ? 'scale-110' : ''
        }`}>
          👤
        </span>

        <div className="flex-1 min-w-0">
          <div className={`text-sm truncate transition-colors ${
            selectedIndex === addrIndex ? 'text-white' : 'text-white/70'
          }`}>
            {activeAddress?.alias || 'No address'}
          </div>
          <div className={`text-xs truncate ${
            selectedIndex === addrIndex ? 'text-[#4da2ff]' : 'text-white/30'
          }`}>
            {activeAddress?.balance || '0'} SUI
          </div>
        </div>

        {selectedIndex === addrIndex && (
          <kbd className="flex-shrink-0 px-1.5 py-0.5 text-[10px] bg-white/5 text-white/40 rounded border border-white/10">
            enter
          </kbd>
        )}
      </motion.div>

      {/* Commands by Category - Terminal Style */}
      {['Profile', 'Account', 'Assets', 'Actions', 'Development', 'Security', 'Learn'].map((category) => {
        const categoryCommands = filteredCommands.filter((cmd) => cmd.category === category);
        if (categoryCommands.length === 0) return null;

        return (
          <div key={category}>
            <div className="px-3 py-1.5 mt-3 flex items-center gap-2">
              <span className="text-white/20 text-xs font-mono select-none">{'──['}</span>
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
                {category}
              </span>
              <span className="text-white/20 text-xs font-mono select-none">{']'}</span>
              <span className="flex-1 border-t border-white/10 border-dashed" />
            </div>
            <AnimatedList delay={0}>
              {categoryCommands.map((cmd) => {
                const cmdIndex = filteredCommands.indexOf(cmd) + cmdOffset;
                const isSelected = selectedIndex === cmdIndex;
                return (
                  <div
                    key={cmd.id}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={`${cmd.title}${cmd.subtitle ? `: ${cmd.subtitle}` : ''}`}
                    className={`flex items-center gap-2 px-3 py-2 mx-1 cursor-pointer transition-all duration-150 font-mono ${
                      isSelected
                        ? 'bg-white/5 border-l-2 border-l-[#4da2ff]'
                        : 'border-l-2 border-l-transparent hover:bg-white/[0.02] hover:border-l-white/20'
                    }`}
                    onClick={() => handleCommandClick(cmd.action, cmdIndex)}
                  >
                    {/* Terminal selection indicator */}
                    <span className={`text-xs font-bold w-3 flex-shrink-0 transition-opacity ${
                      isSelected ? 'text-[#4da2ff] opacity-100' : 'opacity-0'
                    }`}>
                      &gt;
                    </span>

                    <span className={`text-base flex-shrink-0 w-5 text-center transition-transform ${
                      isSelected ? 'scale-110' : ''
                    }`}>
                      {cmd.icon}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate transition-colors ${
                        isSelected ? 'text-white' : 'text-white/70'
                      }`}>
                        {cmd.title}
                      </div>
                      {cmd.subtitle && (
                        <div className={`text-xs truncate ${
                          isSelected ? 'text-white/50' : 'text-white/30'
                        }`}>
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Keyboard hint on selection */}
                    {isSelected && (
                      <kbd className="flex-shrink-0 px-1.5 py-0.5 text-[10px] bg-white/5 text-white/40 rounded border border-white/10">
                        enter
                      </kbd>
                    )}
                  </div>
                );
              })}
            </AnimatedList>
          </div>
        );
      })}

      {/* Terminal-style footer with system info */}
      <div className="mt-4 px-3 py-2 border-t border-white/10 font-mono">
        <div className="flex items-center justify-between text-[10px] text-white/30">
          <div className="flex items-center gap-3">
            {/* Network indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                activeEnv ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
              <span>{activeEnv?.alias || 'offline'}</span>
            </div>

            {/* Command count */}
            <span className="text-white/20">|</span>
            <span>{filteredCommands.length} commands</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Keyboard shortcuts hint */}
            <div className="flex items-center gap-1.5">
              <kbd className="px-1 py-0.5 bg-white/5 rounded text-[9px]">esc</kbd>
              <span>close</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1 py-0.5 bg-white/5 rounded text-[9px]">K</kbd>
              <span>search</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
