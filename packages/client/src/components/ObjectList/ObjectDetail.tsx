import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../shared/Spinner';
import * as api from '@/api/client';
import { useAppStore } from '@/stores/useAppStore';
import { detectNetwork, openInExplorer, EXPLORERS, type NetworkType } from '@/lib/explorer';
import { extractCoinType, isCoinType } from '@sui-cli-web/shared';
import { Link2 } from 'lucide-react';

type Tab = 'overview' | 'fields' | 'package' | 'transaction';

interface SuiObjectData {
  objectId?: string;
  type?: string;
  version?: string;
  digest?: string;
  previousTransaction?: string;
  owner?: Record<string, unknown> | string;
  content?: {
    fields?: Record<string, unknown>;
    hasPublicTransfer?: boolean;
  };
  storageRebate?: string;
  data?: SuiObjectData;
}

interface ObjectDetailProps {
  object: SuiObjectData;
  onBack: () => void;
  onCopy: (text: string, label: string) => void;
}

export function ObjectDetail({ object, onBack, onCopy }: ObjectDetailProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [packageSummary, setPackageSummary] = useState<Record<string, unknown> | null>(null);
  const [txBlock, setTxBlock] = useState<Record<string, unknown> | null>(null);
  const [isLoadingPackage, setIsLoadingPackage] = useState(false);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [selectedExplorer, setSelectedExplorer] = useState(0);

  const { environments } = useAppStore();
  const activeEnv = environments.find((e) => e.isActive);
  const currentNetwork: NetworkType = detectNetwork(activeEnv?.alias, activeEnv?.rpc);

  const data = object.data || object;
  const objectId = data.objectId || '';
  const type = data.type || '';
  const version = data.version || '';
  const digest = data.digest || '';
  const previousTransaction = data.previousTransaction || '';
  const owner = data.owner || {};
  const content = data.content || {};
  const fields = content.fields || {};
  const storageRebate = data.storageRebate || '0';
  const hasPublicTransfer = content.hasPublicTransfer ?? false;

  // Extract package ID from type
  const packageId = type.split('::')[0] || '';
  const structName = type.split('::')[2] || '';

  // Check if this is an UpgradeCap
  const isUpgradeCap = type.includes('::package::UpgradeCap');
  const linkedPackageId = isUpgradeCap ? (fields.package as string | null) : null;

  // Check if this is a Coin type
  const isCoin = isCoinType(type);
  const coinType = isCoin ? extractCoinType(type) : null;
  const coinBalance = isCoin ? (fields.balance as string | undefined) : null;

  // Check if object can have dynamic fields
  // Objects with 'id' field (UID) can have dynamic fields attached
  // Also include container types like Table, Bag, ObjectTable, etc.
  const canHaveDynamicFields = (() => {
    // Container types that store dynamic fields
    const containerTypes = ['Table', 'Bag', 'ObjectBag', 'ObjectTable', 'LinkedTable', 'VecSet', 'VecMap'];
    if (containerTypes.some(t => type.includes(`::${t.toLowerCase()}::`) || structName === t)) {
      return true;
    }
    // Objects with 'id' field (UID) - most custom Move objects
    if (fields.id) {
      return true;
    }
    // Game objects that typically have inventory/dynamic storage
    if (type.toLowerCase().includes('character') || type.toLowerCase().includes('inventory')) {
      return true;
    }
    return false;
  })();

  // Format coin balance
  const formatCoinBalance = (balance: string | undefined, decimals: number = 9) => {
    if (!balance) return '0';
    const balanceBigInt = BigInt(balance);
    const divisor = BigInt(10 ** decimals);
    const integerPart = balanceBigInt / divisor;
    const fractionalPart = balanceBigInt % divisor;
    let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    fractionalStr = fractionalStr.replace(/0+$/, '') || '0';
    if (fractionalStr.length < 4) fractionalStr = fractionalStr.padEnd(4, '0');
    return `${integerPart}.${fractionalStr}`;
  };

  // Coin action handlers
  const handleCoinTransfer = () => {
    if (coinType) {
      navigate(`/app/coins/transfer?coinId=${objectId}&type=${encodeURIComponent(coinType)}`);
    }
  };

  const handleCoinSplit = () => {
    if (coinType) {
      navigate(`/app/coins/split?coinId=${objectId}&type=${encodeURIComponent(coinType)}`);
    }
  };

  const handleCoinMerge = () => {
    if (coinType) {
      navigate(`/app/coins/merge?coinId=${objectId}&type=${encodeURIComponent(coinType)}`);
    }
  };

  // Load package summary when tab is selected
  useEffect(() => {
    if (activeTab === 'package' && linkedPackageId && !packageSummary) {
      setIsLoadingPackage(true);
      api.getPackageSummary(linkedPackageId)
        .then(setPackageSummary)
        .catch(console.error)
        .finally(() => setIsLoadingPackage(false));
    }
  }, [activeTab, linkedPackageId, packageSummary]);

  // Load transaction when tab is selected
  useEffect(() => {
    if (activeTab === 'transaction' && previousTransaction && !txBlock) {
      setIsLoadingTx(true);
      api.getTransactionBlock(previousTransaction)
        .then(setTxBlock)
        .catch(console.error)
        .finally(() => setIsLoadingTx(false));
    }
  }, [activeTab, previousTransaction, txBlock]);

  const getOwnerDisplay = () => {
    if (owner.AddressOwner) {
      return { type: 'Address', value: owner.AddressOwner };
    }
    if (owner.ObjectOwner) {
      return { type: 'Object', value: owner.ObjectOwner };
    }
    if (owner.Shared) {
      return { type: 'Shared', value: `Initial version: ${owner.Shared.initial_shared_version}` };
    }
    if (owner === 'Immutable') {
      return { type: 'Immutable', value: 'Cannot be modified' };
    }
    return { type: 'Unknown', value: JSON.stringify(owner) };
  };

  const ownerInfo = getOwnerDisplay();

  const handleOpenExplorer = (type: 'object' | 'tx' | 'address' | 'package', id: string) => {
    openInExplorer(currentNetwork, type, id, EXPLORERS[selectedExplorer].name);
  };

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'fields', label: 'Fields', show: Object.keys(fields).length > 0 },
    { id: 'package', label: 'Package', show: !!linkedPackageId },
    { id: 'transaction', label: 'Transaction', show: !!previousTransaction },
  ];

  return (
    <div className="px-2 py-2">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 mb-3">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {structName || 'Object Details'}
          </div>
          <div className="text-xs text-muted-foreground font-mono truncate">
            {objectId.slice(0, 20)}...{objectId.slice(-8)}
          </div>
        </div>
        <button
          onClick={() => onCopy(objectId, 'Object ID')}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          title="Copy Object ID"
        >
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-2 mb-3 border-b border-border pb-2">
        {tabs.filter(t => t.show).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-2">
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Coin Actions Panel - shown only for Coin objects */}
            {isCoin && coinType && (
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-muted-foreground">Coin Balance</div>
                  <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                    {coinType.split('::').pop() || 'COIN'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-foreground mb-4">
                  {formatCoinBalance(coinBalance)} {coinType.split('::').pop() || ''}
                </div>
                <div className="text-xs text-muted-foreground mb-3">Quick Actions</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleCoinTransfer}
                    className="flex flex-col items-center gap-1.5 p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="text-xs font-medium">Transfer</span>
                  </button>
                  <button
                    onClick={handleCoinSplit}
                    className="flex flex-col items-center gap-1.5 p-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="text-xs font-medium">Split</span>
                  </button>
                  <button
                    onClick={handleCoinMerge}
                    className="flex flex-col items-center gap-1.5 p-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a4 4 0 004-4V4M6 10a4 4 0 01-4-4V4m4 6v6a4 4 0 004 4h2" />
                    </svg>
                    <span className="text-xs font-medium">Merge</span>
                  </button>
                </div>
              </div>
            )}

            {/* Type */}
            <InfoRow
              label="Type"
              value={type}
              onCopy={() => onCopy(type, 'Type')}
              truncate
            />

            {/* Version & Digest */}
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Version" value={version} small />
              <InfoRow
                label="Digest"
                value={digest}
                onCopy={() => onCopy(digest, 'Digest')}
                truncate
                small
              />
            </div>

            {/* Owner */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Owner ({ownerInfo.type})</div>
              <div className="text-sm font-mono text-foreground break-all">
                {ownerInfo.value.length > 42
                  ? `${ownerInfo.value.slice(0, 20)}...${ownerInfo.value.slice(-8)}`
                  : ownerInfo.value
                }
              </div>
              {ownerInfo.type === 'Address' && (
                <button
                  onClick={() => onCopy(ownerInfo.value, 'Owner address')}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Copy address
                </button>
              )}
            </div>

            {/* Storage & Transfer */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Storage Rebate</div>
                <div className="text-sm font-mono text-foreground">
                  {(parseInt(storageRebate) / 1_000_000_000).toFixed(6)} SUI
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Public Transfer</div>
                <div className={`text-sm font-medium ${hasPublicTransfer ? 'text-success' : 'text-muted-foreground'}`}>
                  {hasPublicTransfer ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            {/* Explore Dynamic Fields - only show for objects with UID (id field) */}
            {canHaveDynamicFields && (
              <button
                onClick={() => navigate(`/app/dynamic-fields?objectId=${objectId}`)}
                className="w-full p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg hover:from-cyan-500/20 hover:to-purple-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-foreground group-hover:text-cyan-400 transition-colors">
                      Explore Dynamic Fields
                    </div>
                    <div className="text-xs text-muted-foreground">
                      View attached key-value data (Table, Bag, etc.)
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )}

            {/* Explorer Selector */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground">
                  Network: <span className="text-primary font-medium">{currentNetwork}</span>
                </div>
                <select
                  value={selectedExplorer}
                  onChange={(e) => setSelectedExplorer(Number(e.target.value))}
                  className="text-xs bg-secondary border-none rounded px-2 py-1 text-foreground"
                >
                  {EXPLORERS.map((exp, idx) => (
                    <option key={exp.name} value={idx}>
                      {exp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenExplorer('object', objectId)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Object
                </button>
                {packageId && (
                  <button
                    onClick={() => handleOpenExplorer('package', packageId)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Package
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="space-y-2">
            {Object.entries(fields).map(([key, value]) => (
              <FieldItem key={key} name={key} value={value} onCopy={onCopy} />
            ))}
          </div>
        )}

        {activeTab === 'package' && (
          <div>
            {isLoadingPackage ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : packageSummary ? (
              <PackageSummaryView summary={packageSummary} onCopy={onCopy} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Failed to load package summary
              </div>
            )}
          </div>
        )}

        {activeTab === 'transaction' && (
          <div>
            {isLoadingTx ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : txBlock ? (
              <TransactionView tx={txBlock as TransactionBlock} onCopy={onCopy} network={currentNetwork} onOpenExplorer={handleOpenExplorer} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Failed to load transaction
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components

function InfoRow({
  label,
  value,
  onCopy,
  truncate,
  small,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  truncate?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`p-3 bg-muted/30 rounded-lg ${small ? 'p-2' : ''}`}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div
        className={`font-mono text-foreground ${truncate ? 'truncate' : ''} ${
          small ? 'text-xs' : 'text-sm'
        }`}
      >
        {value}
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          className="mt-1 text-xs text-primary hover:underline"
        >
          Copy
        </button>
      )}
    </div>
  );
}

function FieldItem({
  name,
  value,
  onCopy,
}: {
  name: string;
  value: unknown;
  onCopy: (text: string, label: string) => void;
}) {
  const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  const isObject = typeof value === 'object';

  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-primary">{name}</span>
        <button
          onClick={() => onCopy(displayValue, name)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Copy
        </button>
      </div>
      {isObject ? (
        <pre className="text-xs font-mono text-foreground overflow-x-auto max-h-32 overflow-y-auto">
          {displayValue}
        </pre>
      ) : (
        <div className="text-sm font-mono text-foreground break-all">
          {displayValue}
        </div>
      )}
    </div>
  );
}

interface PackageModule {
  name: string;
  functions?: Record<string, { visibility?: string; parameters?: unknown[] }>;
  structs?: Record<string, { abilities?: string[] }>;
}

interface PackageSummary {
  packageId: string;
  modules?: PackageModule[];
}

function PackageSummaryView({
  summary,
  onCopy,
}: {
  summary: PackageSummary;
  onCopy: (text: string, label: string) => void;
}) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Package ID</div>
        <div className="text-sm font-mono text-foreground truncate">
          {summary.packageId}
        </div>
        <button
          onClick={() => onCopy(summary.packageId, 'Package ID')}
          className="mt-1 text-xs text-primary hover:underline"
        >
          Copy
        </button>
      </div>

      <div className="text-xs font-medium text-foreground mb-2">
        Modules ({summary.modules?.length || 0})
      </div>

      {summary.modules?.map((module) => (
        <div key={module.name} className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedModule(expandedModule === module.name ? null : module.name)}
            className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">{module.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {Object.keys(module.functions || {}).length} functions
              </span>
              <svg
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  expandedModule === module.name ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {expandedModule === module.name && (
            <div className="p-3 space-y-2">
              {/* Structs */}
              {module.structs && Object.keys(module.structs).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Structs</div>
                  {Object.entries(module.structs).map(([name, struct]) => (
                    <div key={name} className="text-xs font-mono text-foreground py-1">
                      <span className="text-primary">{name}</span>
                      <span className="text-muted-foreground ml-2">
                        [{struct.abilities?.join(', ')}]
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Functions */}
              {module.functions && Object.keys(module.functions).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1 mt-2">Functions</div>
                  {Object.entries(module.functions).map(([name, func]) => (
                    <div key={name} className="text-xs font-mono py-1 flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        func.visibility === 'Public'
                          ? 'bg-success/20 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {func.visibility === 'Public' ? 'pub' : 'priv'}
                      </span>
                      <span className="text-foreground">{name}</span>
                      <span className="text-muted-foreground">
                        ({func.parameters?.length || 0} params)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface TransactionBlock {
  digest?: string;
  effects?: {
    status?: { status?: string };
    gasUsed?: {
      computationCost?: string;
      storageCost?: string;
      storageRebate?: string;
    };
    executedEpoch?: string;
    created?: Array<{ reference?: { objectId?: string } }>;
  };
  transaction?: {
    data?: {
      transaction?: { kind?: string };
    };
  };
}

function TransactionView({
  tx,
  onCopy,
  network,
  onOpenExplorer,
}: {
  tx: TransactionBlock;
  onCopy: (text: string, label: string) => void;
  network: NetworkType;
  onOpenExplorer: (type: 'object' | 'tx' | 'address' | 'package', id: string) => void;
}) {
  const status = tx.effects?.status?.status || 'unknown';
  const gasUsed = tx.effects?.gasUsed || {};
  const txData = tx.transaction?.data?.transaction || {};

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
        <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-success' : 'bg-error'}`} />
        <span className="text-sm font-medium text-foreground capitalize">{status}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          Epoch {tx.effects?.executedEpoch}
        </span>
      </div>

      {/* Digest */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Transaction Digest</div>
        <div className="text-sm font-mono text-foreground truncate">{tx.digest}</div>
        <button
          onClick={() => onCopy(tx.digest, 'Tx Digest')}
          className="mt-1 text-xs text-primary hover:underline"
        >
          Copy
        </button>
      </div>

      {/* Transaction Kind */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Transaction Type</div>
        <div className="text-sm font-medium text-foreground">{txData.kind || 'Unknown'}</div>
      </div>

      {/* Gas Used */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-xs text-muted-foreground mb-2">Gas Used</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Computation: </span>
            <span className="font-mono text-foreground">
              {(parseInt(gasUsed.computationCost || '0') / 1_000_000_000).toFixed(6)} SUI
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Storage: </span>
            <span className="font-mono text-foreground">
              {(parseInt(gasUsed.storageCost || '0') / 1_000_000_000).toFixed(6)} SUI
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Rebate: </span>
            <span className="font-mono text-foreground">
              {(parseInt(gasUsed.storageRebate || '0') / 1_000_000_000).toFixed(6)} SUI
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total: </span>
            <span className="font-mono text-foreground">
              {(
                (parseInt(gasUsed.computationCost || '0') +
                  parseInt(gasUsed.storageCost || '0') -
                  parseInt(gasUsed.storageRebate || '0')) /
                1_000_000_000
              ).toFixed(6)} SUI
            </span>
          </div>
        </div>
      </div>

      {/* Created Objects */}
      {tx.effects?.created && tx.effects.created.length > 0 && (
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="text-xs text-muted-foreground mb-2">
            Created Objects ({tx.effects.created.length})
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {tx.effects.created.map((obj, i) => (
              <div key={i} className="text-xs font-mono text-foreground truncate">
                {obj.reference?.objectId}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View on Explorer */}
      <button
        onClick={() => tx.digest && onOpenExplorer('tx', tx.digest)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        View on Explorer ({network})
      </button>
    </div>
  );
}
