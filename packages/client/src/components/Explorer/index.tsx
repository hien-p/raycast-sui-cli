import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileTree, type FileNode } from '@/components/ui/file-tree';
import { useAppStore } from '@/stores/useAppStore';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// Check if user is a member (has tier or community membership)
function useIsMember() {
  const { isCommunityMember, tierInfo, fetchTierInfo, fetchCommunityStatus } = useAppStore();

  // Fetch membership data on mount if not already loaded
  useEffect(() => {
    if (tierInfo === null) {
      fetchTierInfo();
    }
    if (!isCommunityMember) {
      fetchCommunityStatus();
    }
  }, [tierInfo, isCommunityMember, fetchTierInfo, fetchCommunityStatus]);

  return isCommunityMember || (tierInfo !== null && tierInfo.level > 0);
}

interface ExplorerProps {
  className?: string;
}

// Extended FileNode with address data
interface AddressFileNode extends FileNode {
  address?: string;
}

// Convert addresses to file tree
function addressesToFileTree(addresses: any[]): AddressFileNode[] {
  return addresses.map(addr => ({
    name: addr.alias || `${addr.address.slice(0, 8)}...`,
    type: 'file' as const,
    extension: addr.isActive ? 'tsx' : 'ts',
    badge: addr.isActive ? 'active' : undefined,
    icon: addr.isActive ? '◉' : '○',
    address: addr.address, // Store full address for switching
  }));
}

// Navigation items as file tree with nested structure
function getNavTree(currentPath: string, isMember: boolean): FileNode[] {
  const navStructure = [
    {
      path: '/app',
      name: 'home',
      icon: '🏠',
      type: 'file' as const,
    },
    {
      path: '/app/addresses',
      name: 'addresses',
      icon: '👤',
      type: 'folder' as const,
      children: [
        { path: '/app/addresses', name: 'addr-list.tsx', icon: '📋' },
        { path: '/app/addresses?action=new', name: 'addr-create.tsx', icon: '➕' },
        { path: '/app/addresses?action=import', name: 'addr-import.tsx', icon: '📥' },
      ]
    },
    {
      path: '/app/objects',
      name: 'objects',
      icon: '📦',
      type: 'folder' as const,
      children: [
        { path: '/app/objects', name: 'obj-list.tsx', icon: '📋' },
        { path: '/app/objects?view=detail', name: 'obj-detail.tsx', icon: '🔎', disabled: true, badge: 'soon' },
        { path: '/app/dynamic-fields', name: 'dynamic-fields.tsx', icon: '🔗' },
      ]
    },
    {
      path: '/app/coins',
      name: 'coins',
      icon: '🪙',
      type: 'folder' as const,
      children: [
        { path: '/app/coins', name: 'coins-list.tsx', icon: '📋' },
        { path: '/app/coins/merge', name: 'coins-merge.tsx', icon: '🔀' },
        { path: '/app/coins/split', name: 'coins-split.tsx', icon: '✂️' },
        { path: '/app/coins/transfer', name: 'coins-transfer.tsx', icon: '➡️' },
      ]
    },
    {
      path: '/app/faucet',
      name: 'faucet',
      icon: '💧',
      type: 'file' as const,
    },
    {
      path: '/app/transfer',
      name: 'transfer',
      icon: '➡️',
      type: 'folder' as const,
      children: [
        { path: '/app/transfer?mode=external', name: 'external.tsx', icon: '📤' },
        { path: '/app/transfer?mode=internal', name: 'internal.tsx', icon: '🔄' },
        { path: '/app/transfer?mode=batch', name: 'batch.tsx', icon: '📦' },
      ]
    },
    {
      path: '/app/move',
      name: 'move',
      icon: '🚀',
      type: 'folder' as const,
      children: [
        { path: '/app/move', name: 'develop.tsx', icon: '💻' },
        { path: '/app/move?tab=deploy', name: 'deploy.tsx', icon: '📤' },
        { path: '/app/move?tab=upgrade', name: 'upgrade.tsx', icon: '⬆️' },
        { path: '/app/move?tab=interact', name: 'interact.tsx', icon: '📞' },
      ]
    },
    {
      path: '/app/devtools',
      name: 'devtools',
      icon: '🛠️',
      type: 'folder' as const,
      children: [
        { path: '/app/devtools', name: 'coverage.tsx', icon: '📊' },
        { path: '/app/devtools?tab=disassemble', name: 'disassemble.tsx', icon: '🔓' },
        { path: '/app/devtools?tab=summary', name: 'summary.tsx', icon: '📋' },
      ]
    },
    {
      path: '/app/keytool',
      name: 'keytool',
      icon: '🔑',
      type: 'folder' as const,
      children: [
        { path: '/app/keytool', name: 'keys.tsx', icon: '🔐' },
        { path: '/app/keytool?tab=generate', name: 'generate.tsx', icon: '✨' },
        { path: '/app/keytool?tab=sign', name: 'key-sign.tsx', icon: '✍️' },
        { path: '/app/keytool?tab=multisig', name: 'key-multisig.tsx', icon: '👥' },
        { path: '/app/keytool?tab=execute', name: 'execute.tsx', icon: '🚀' },
        { path: '/app/keytool?tab=decode', name: 'key-decode.tsx', icon: '🔍' },
      ]
    },
    {
      path: '/app/security',
      name: 'security',
      icon: '🔒',
      type: 'folder' as const,
      children: [
        { path: '/app/security', name: 'verify-source.tsx', icon: '🔎' },
        { path: '/app/security?tab=bytecode', name: 'verify-bytecode.tsx', icon: '📦' },
        { path: '/app/security?tab=decode', name: 'decode-tx.tsx', icon: '🔓' },
      ]
    },
    {
      path: '/app/inspector',
      name: 'inspector',
      icon: '🔍',
      type: 'folder' as const,
      children: [
        { path: '/app/inspector', name: 'inspect.tsx', icon: '👁️', disabled: !isMember, badge: 'member' },
        { path: '/app/inspector?tab=replay', name: 'replay.tsx', icon: '🔄', disabled: !isMember, badge: 'member' },
        { path: '/app/inspector?tab=execute', name: 'execute-tx.tsx', icon: '📤', disabled: !isMember, badge: 'member' },
        { path: '/app/inspector?tab=ptb', name: 'ptb.tsx', icon: '🧱', disabled: !isMember, badge: 'member' },
        { path: '/app/inspector?tab=gas', name: 'gas.tsx', icon: '⛽' },
        { path: '/app/inspector?tab=events', name: 'events.tsx', icon: '📡' },
      ]
    },
    {
      path: '/app/network',
      name: 'network',
      icon: '🌐',
      type: 'folder' as const,
      children: [
        { path: '/app/network', name: 'local-network.tsx', icon: '💻' },
        { path: '/app/network?tab=status', name: 'network-status.tsx', icon: '📊' },
      ]
    },
    {
      path: '/app/payments',
      name: 'payments',
      icon: '💰',
      type: 'folder' as const,
      children: [
        { path: '/app/payments', name: 'multi-pay.tsx', icon: '👥' },
        { path: '/app/payments?tab=history', name: 'pay-history.tsx', icon: '📜', disabled: true, badge: 'soon' },
      ]
    },
    {
      path: '/app/migrate',
      name: 'migrate.tsx',
      icon: '🔄',
      type: 'file' as const,
    },
    // Profile section - always visible, shows join prompt if not member
    {
      path: '/app/membership',
      name: 'profile',
      icon: '🎖️',
      type: 'folder' as const,
      children: [
        { path: '/app/membership', name: 'my-profile.tsx', icon: '👤' },
        { path: '/app/membership?tab=packages', name: 'packages.tsx', icon: '📦' },
        { path: '/app/membership?tab=achievements', name: 'achievements.tsx', icon: '🏆', disabled: true, badge: 'soon' },
      ]
    },
    {
      path: '/app/game-demo',
      name: 'game-demo.tsx',
      icon: '🎮',
      type: 'file' as const,
    },
  ];

  const mapItem = (item: any): FileNode => {
    const isActive = currentPath === item.path || currentPath.startsWith(item.path + '?');

    if (item.type === 'folder' && item.children) {
      return {
        name: item.name,
        type: 'folder' as const,
        children: item.children.map((child: any) => ({
          name: child.name,
          type: 'file' as const,
          icon: child.icon,
          extension: currentPath === child.path || currentPath.startsWith(child.path.split('?')[0]) ? 'tsx' : 'ts',
          badge: child.badge || (currentPath === child.path ? '●' : undefined),
          disabled: child.disabled,
        })),
      };
    }

    return {
      name: item.name,
      type: 'file' as const,
      icon: item.icon,
      extension: isActive ? 'tsx' : 'ts',
      badge: isActive ? '●' : undefined,
    };
  };

  return navStructure.map(mapItem);
}

export function Explorer({ className }: ExplorerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { addresses, switchAddress } = useAppStore();
  const [activeTab, setActiveTab] = useState<'nav' | 'addresses'>('nav');
  const [switching, setSwitching] = useState<string | null>(null);
  const isMember = useIsMember();

  const activeAddress = addresses.find(a => a.isActive);

  // Build file tree based on active tab
  const fileTreeData = useMemo(() => {
    switch (activeTab) {
      case 'addresses':
        return addressesToFileTree(addresses);
      case 'nav':
      default:
        return getNavTree(location.pathname, isMember);
    }
  }, [activeTab, addresses, location.pathname, isMember]);

  const handleFileClick = async (node: FileNode) => {
    // Handle addresses tab - switch address
    if (activeTab === 'addresses') {
      const addrNode = node as AddressFileNode;
      if (addrNode.address && addrNode.badge !== 'active') {
        setSwitching(addrNode.address);
        try {
          await switchAddress(addrNode.address);
          toast.success(`Switched to ${node.name}`);
        } catch (error) {
          toast.error('Failed to switch address');
        } finally {
          setSwitching(null);
        }
      }
      return;
    }

    // Handle nav tab
    if (activeTab === 'nav') {
      // Main navigation items
      const navItems: Record<string, string> = {
        'home': '/app',
        'faucet': '/app/faucet',
      };

      // Child items with their paths
      const childNavItems: Record<string, string> = {
        // Addresses
        'addr-list.tsx': '/app/addresses',
        'addr-create.tsx': '/app/addresses?action=new',
        'addr-import.tsx': '/app/addresses?action=import',
        // Objects
        'obj-list.tsx': '/app/objects',
        'obj-detail.tsx': '/app/objects?view=detail',
        'dynamic-fields.tsx': '/app/dynamic-fields',
        // Coins
        'coins-list.tsx': '/app/coins',
        'coins-merge.tsx': '/app/coins/merge',
        'coins-split.tsx': '/app/coins/split',
        'coins-transfer.tsx': '/app/coins/transfer',
        // Transfer
        'external.tsx': '/app/transfer?mode=external',
        'internal.tsx': '/app/transfer?mode=internal',
        'batch.tsx': '/app/transfer?mode=batch',
        // Move
        'develop.tsx': '/app/move',
        'deploy.tsx': '/app/move?tab=deploy',
        'upgrade.tsx': '/app/move?tab=upgrade',
        'interact.tsx': '/app/move?tab=interact',
        // Dev Tools
        'coverage.tsx': '/app/devtools',
        'disassemble.tsx': '/app/devtools?tab=disassemble',
        'summary.tsx': '/app/devtools?tab=summary',
        // Keytool
        'keys.tsx': '/app/keytool',
        'generate.tsx': '/app/keytool?tab=generate',
        'key-sign.tsx': '/app/keytool?tab=sign',
        'key-multisig.tsx': '/app/keytool?tab=multisig',
        'execute.tsx': '/app/keytool?tab=execute',
        'key-decode.tsx': '/app/keytool?tab=decode',
        // Security
        'verify-source.tsx': '/app/security',
        'verify-bytecode.tsx': '/app/security?tab=bytecode',
        'decode-tx.tsx': '/app/security?tab=decode',
        // Inspector (member only for some tabs)
        'inspect.tsx': '/app/inspector',
        'replay.tsx': '/app/inspector?tab=replay',
        'execute-tx.tsx': '/app/inspector?tab=execute',
        'ptb.tsx': '/app/inspector?tab=ptb',
        'gas.tsx': '/app/inspector?tab=gas',
        'events.tsx': '/app/inspector?tab=events',
        // Network
        'local-network.tsx': '/app/network',
        'network-status.tsx': '/app/network?tab=status',
        // Payments
        'multi-pay.tsx': '/app/payments',
        'pay-history.tsx': '/app/payments?tab=history',
        // Migrate
        'migrate.tsx': '/app/migrate',
        // Profile
        'my-profile.tsx': '/app/membership',
        'packages.tsx': '/app/membership?tab=packages',
        'achievements.tsx': '/app/membership?tab=achievements',
        // Game Demo
        'game-demo.tsx': '/app/game-demo',
      };

      // Check main nav first
      let path = navItems[node.name];

      // Check child items
      if (!path) {
        path = childNavItems[node.name];
      }

      // Fallback for folder clicks - navigate to main section
      if (!path && node.type !== 'folder') {
        const folderPaths: Record<string, string> = {
          'addresses': '/app/addresses',
          'objects': '/app/objects',
          'coins': '/app/coins',
          'transfer': '/app/transfer',
          'move': '/app/move',
          'devtools': '/app/devtools',
          'keytool': '/app/keytool',
          'security': '/app/security',
          'inspector': '/app/inspector',
          'network': '/app/network',
          'payments': '/app/payments',
          'migrate': '/app/migrate',
          'profile': '/app/membership',
          'game-demo': '/app/game-demo',
        };
        path = folderPaths[node.name];
      }

      if (path) navigate(path);
    }
  };

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {/* Tab selector */}
      <div role="tablist" aria-label="Explorer tabs" className="flex gap-1.5 px-1">
        {[
          { id: 'nav', label: 'nav', icon: '📂', ariaLabel: 'Navigation' },
          { id: 'addresses', label: 'addr', icon: '👤', ariaLabel: 'Addresses' },
        ].map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              'flex-1 px-3 py-2 text-sm font-mono transition-all border rounded',
              'focus:outline-none focus:ring-2 focus:ring-[#4da2ff]/50',
              activeTab === tab.id
                ? 'bg-[#4da2ff]/20 text-[#4da2ff] border-[#4da2ff]/30'
                : 'bg-[#1e1e2e]/80 text-white/50 border-white/10 hover:text-white/70 hover:bg-[#1e1e2e]'
            )}
          >
            <span className="mr-1.5" aria-hidden="true">{tab.icon}</span>
            <span className="sr-only">{tab.ariaLabel}</span>
            <span aria-hidden="true">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* File tree */}
      <FileTree
        data={fileTreeData}
        title={activeTab === 'nav' ? 'navigation' : 'wallets'}
        onFileClick={handleFileClick}
        className="flex-1"
      />

      {/* Status bar */}
      <div className="px-4 py-2 bg-[#1e1e2e]/80 border border-white/10 rounded text-xs font-mono text-white/40">
        <div className="flex items-center justify-between">
          <span>
            {activeTab === 'addresses' && `${addresses.length} wallets`}
            {activeTab === 'nav' && location.pathname}
          </span>
          {activeAddress && (
            <span className="text-[#4da2ff]">
              {activeAddress.alias || activeAddress.address.slice(0, 6)}...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
