import { useMemo } from 'react';
import { CommandItem } from './CommandItem';
import { Kbd } from '../shared/Kbd';
import { useAppStore, type View } from '@/stores/useAppStore';
import type { Command } from '@/types';
import { DEFAULT_COMMANDS, CATEGORIES } from '@/types';

interface CommandGroup {
  category: string;
  commands: Command[];
}

export function CommandList() {
  const {
    searchQuery,
    selectedIndex,
    setView,
    environments,
    addresses,
  } = useAppStore();

  // Get active environment and address for display
  const activeEnv = environments.find((e) => e.isActive);
  const activeAddress = addresses.find((a) => a.isActive);

  // Build command list with dynamic items
  const allCommands = useMemo(() => {
    const commands: Command[] = [...DEFAULT_COMMANDS];

    // Add active environment info as a command
    if (activeEnv) {
      commands.push({
        id: 'active-env',
        title: `Active: ${activeEnv.alias}`,
        subtitle: activeEnv.rpc,
        icon: '🌐',
        category: 'Status',
        action: 'environments',
      });
    }

    // Add active address info
    if (activeAddress) {
      const shortAddr = `${activeAddress.address.slice(0, 8)}...${activeAddress.address.slice(-6)}`;
      commands.push({
        id: 'active-address',
        title: activeAddress.alias || shortAddr,
        subtitle: `${activeAddress.balance || '0'} SUI`,
        icon: '👤',
        category: 'Status',
        action: 'addresses',
      });
    }

    return commands;
  }, [activeEnv, activeAddress]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!searchQuery) return allCommands;

    const query = searchQuery.toLowerCase();
    return allCommands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(query);
      const matchSubtitle = cmd.subtitle?.toLowerCase().includes(query);
      const matchKeywords = cmd.keywords?.some((k) =>
        k.toLowerCase().includes(query)
      );
      return matchTitle || matchSubtitle || matchKeywords;
    });
  }, [allCommands, searchQuery]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: CommandGroup[] = [];
    const categoryOrder = ['Status', ...Object.values(CATEGORIES)];

    for (const category of categoryOrder) {
      const cmds = filteredCommands.filter((c) => c.category === category);
      if (cmds.length > 0) {
        groups.push({ category, commands: cmds });
      }
    }

    return groups;
  }, [filteredCommands]);

  const handleSelect = (action: string) => {
    setView(action as View);
  };

  let currentIndex = 0;

  return (
    <div className="px-2 py-2 overflow-y-auto max-h-[400px]">
      {groupedCommands.length === 0 ? (
        <div className="px-3 py-8 text-center text-text-secondary">
          No commands found
        </div>
      ) : (
        groupedCommands.map((group) => (
          <div key={group.category} className="mb-2">
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {group.category}
            </div>
            {group.commands.map((cmd) => {
              const index = currentIndex++;
              return (
                <CommandItem
                  key={cmd.id}
                  icon={cmd.icon}
                  title={cmd.title}
                  subtitle={cmd.subtitle}
                  isSelected={selectedIndex === index}
                  onClick={() => handleSelect(cmd.action)}
                  accessory={
                    selectedIndex === index && (
                      <div className="flex items-center gap-1">
                        <Kbd>↵</Kbd>
                      </div>
                    )
                  }
                />
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
