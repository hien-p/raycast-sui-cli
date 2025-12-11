/**
 * Dynamic Fields Demo - Simplified
 * Shows how to attach/detach data to objects on Sui
 * Flow: Create Container → Add Items → See Dynamic Fields → Remove Items
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { Copy, Check, ExternalLink, Plus, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import { Spinner } from '../shared/Spinner';
import { useAppStore } from '@/stores/useAppStore';
import { getApiBaseUrl } from '@/api/client';

// Game package ID for filtering
const GAME_PACKAGE_ID = '0xd5a27c2bc7870cde3e3104bf9946ad93eccec5b3ab517b29c7d3bc732003f4b5';

// LocalStorage key for caching container ID per address
const STORAGE_KEY_PREFIX = 'game_demo_container_';

interface Item {
  objectId: string;
  name: string;
}

interface DynamicField {
  name: { type: string; value: string };
  objectType: string;
  objectId: string;
  type?: string;
  version?: number;
  digest?: string;
}

export function GameDemo() {
  const navigate = useNavigate();
  const { addresses } = useAppStore();
  const activeAddress = addresses.find((a) => a.isActive);

  // Simplified state
  const [containerId, setContainerId] = useState<string | null>(null);
  const [containerName, setContainerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copy helper
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);
      toast.success('Copied!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  // Load cached container and fetch data on address change
  useEffect(() => {
    if (activeAddress?.address) {
      const cached = localStorage.getItem(STORAGE_KEY_PREFIX + activeAddress.address);
      if (cached) {
        setContainerId(cached);
      } else {
        setContainerId(null);
        // Try to find existing container
        fetchExistingContainer();
      }
      fetchItems();
    }
  }, [activeAddress?.address]);

  // Save container to localStorage
  useEffect(() => {
    if (activeAddress?.address && containerId) {
      localStorage.setItem(STORAGE_KEY_PREFIX + activeAddress.address, containerId);
    }
  }, [containerId, activeAddress?.address]);

  // Fetch dynamic fields when container changes
  useEffect(() => {
    if (containerId) {
      fetchDynamicFields();
    } else {
      setDynamicFields([]);
    }
  }, [containerId]);

  // Find existing container (character) for this address
  const fetchExistingContainer = async () => {
    if (!activeAddress?.address) return;
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/addresses/${activeAddress.address}/objects`);
      const data = await res.json();
      if (data.success && data.data) {
        const container = data.data.find((obj: any) => {
          const type = obj.data?.type || obj.type || '';
          return type.includes(GAME_PACKAGE_ID) && type.includes('::character::Character');
        });
        if (container) {
          setContainerId(container.data?.objectId || container.objectId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch container:', error);
    }
  };

  // Fetch items in wallet
  const fetchItems = async () => {
    if (!activeAddress?.address) return;
    setIsLoadingItems(true);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/addresses/${activeAddress.address}/objects`);
      const data = await res.json();
      if (data.success && data.data) {
        const gameItems: Item[] = data.data
          .filter((obj: any) => {
            const type = obj.data?.type || obj.type || '';
            // Check for game items - case insensitive
            return type.includes(GAME_PACKAGE_ID) && type.toLowerCase().includes('::item::item');
          })
          .map((obj: any) => ({
            objectId: obj.data?.objectId || obj.objectId,
            name: obj.data?.content?.fields?.name || obj.content?.fields?.name || 'Item',
          }));
        console.log('[GameDemo] Fetched items:', gameItems.length);
        setItems(gameItems);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Fetch dynamic fields on container
  const fetchDynamicFields = async () => {
    if (!containerId) return;
    try {
      const apiBase = getApiBaseUrl();
      // Correct API endpoint: /api/dynamic-fields/:objectId
      const res = await fetch(`${apiBase}/dynamic-fields/${containerId}`);
      const json = await res.json();
      console.log('[GameDemo] Dynamic fields response:', json);
      // API returns { success, data: { data: [...fields...] } }
      if (json.success && json.data?.data) {
        setDynamicFields(json.data.data);
      } else {
        setDynamicFields([]);
      }
    } catch (error) {
      console.error('Failed to fetch dynamic fields:', error);
      setDynamicFields([]);
    }
  };

  // Create new container
  const handleCreate = async () => {
    if (!containerName.trim()) {
      toast.error('Enter a name');
      return;
    }
    setIsLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/game/character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: containerName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data.characterId) {
        toast.success('Container created!');
        setContainerId(data.data.characterId);
        setContainerName('');
      } else {
        toast.error(data.error || 'Failed to create');
      }
    } catch {
      toast.error('Failed to create container');
    } finally {
      setIsLoading(false);
    }
  };

  // Add item as dynamic field
  const handleAdd = async (itemId: string) => {
    if (!containerId) {
      toast.error('Create a container first!');
      return;
    }
    setAddingId(itemId);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/game/inventory/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: containerId, itemId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Added as dynamic field!');
        fetchItems();
        fetchDynamicFields();
      } else {
        toast.error(data.error || 'Failed to add');
      }
    } catch {
      toast.error('Failed to add item');
    } finally {
      setAddingId(null);
    }
  };

  // Remove dynamic field
  const handleRemove = async (itemId: string) => {
    if (!containerId) return;
    setRemovingId(itemId);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/game/inventory/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: containerId, itemId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Removed from container!');
        fetchItems();
        fetchDynamicFields();
      } else {
        toast.error(data.error || 'Failed to remove');
      }
    } catch {
      toast.error('Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="px-2 py-2 max-w-2xl mx-auto">
      {/* Terminal-style Header */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <span className="text-lg">🔗</span>
        <h1 className="text-lg font-bold text-cyan-400 font-mono">$ dynamic-fields-demo</h1>
      </div>

      {/* Description */}
      <div className="mb-4 px-2">
        <p className="text-xs text-cyan-500/70 font-mono">
          Attach items to a Container object as dynamic fields
        </p>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-2">
        {/* Left: Container */}
        <div className="p-3 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold">1</span>
            <span className="text-[10px] text-cyan-500/70 font-mono uppercase tracking-wider">CONTAINER</span>
          </div>

          {containerId ? (
            <div className="p-3 bg-black/50 border border-cyan-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📦</span>
                  <div>
                    <div className="text-xs font-mono text-cyan-400">Ready</div>
                    <button
                      onClick={() => copyToClipboard(containerId)}
                      className="text-[10px] text-cyan-500/50 font-mono hover:text-cyan-400 flex items-center gap-1"
                    >
                      {copiedId === containerId ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                      {containerId.slice(0, 10)}...
                    </button>
                  </div>
                </div>
                <a
                  href={`https://suiscan.xyz/testnet/object/${containerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-cyan-500/20 rounded"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-500/50" />
                </a>
              </div>
              <div className="mt-2 pt-2 border-t border-cyan-500/20">
                <div className="text-[10px] text-cyan-500/50 font-mono">
                  FIELDS: <span className="text-cyan-400">{dynamicFields.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
                placeholder="Container name..."
                className="flex-1 px-3 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-400 placeholder:text-cyan-500/40 focus:outline-none focus:border-cyan-500"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg text-xs font-mono hover:bg-cyan-500/30 disabled:opacity-50"
              >
                {isLoading ? <Spinner /> : 'Create'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Items */}
        <div className="p-3 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold">2</span>
              <span className="text-[10px] text-cyan-500/70 font-mono uppercase tracking-wider">YOUR_ITEMS</span>
              {items.length > 0 && (
                <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px] font-mono">
                  {items.length}
                </span>
              )}
            </div>
            <button
              onClick={fetchItems}
              className="p-1.5 hover:bg-cyan-500/20 rounded"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3 text-cyan-500/50" />
            </button>
          </div>

          {isLoadingItems ? (
            <div className="text-center py-6">
              <Spinner />
              <div className="text-xs text-cyan-500/50 font-mono mt-2">Loading...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-6 text-xs text-cyan-500/50 font-mono">
              No items in wallet
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
              {items.slice(0, 50).map((item) => (
                <div
                  key={item.objectId}
                  className="p-2 bg-black/50 border border-cyan-500/10 rounded flex items-center justify-between group hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>📦</span>
                    <span className="text-xs font-mono text-cyan-400">{item.name}</span>
                  </div>
                  <button
                    onClick={() => handleAdd(item.objectId)}
                    disabled={!containerId || addingId === item.objectId}
                    className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded text-[10px] font-mono hover:bg-cyan-500/30 disabled:opacity-30 flex items-center gap-1"
                    title="Attach to Container"
                  >
                    {addingId === item.objectId ? <Spinner /> : (
                      <>Attach <ArrowRight className="w-3 h-3" /></>
                    )}
                  </button>
                </div>
              ))}
              {items.length > 50 && (
                <div className="text-center text-[10px] text-cyan-500/40 font-mono py-1">
                  Showing 50 of {items.length}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Fields Section */}
      <div className="p-3 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg space-y-3 mx-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold">3</span>
            <span className="text-[10px] text-cyan-500/70 font-mono uppercase tracking-wider">DYNAMIC_FIELDS</span>
            {dynamicFields.length > 0 && (
              <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px] font-mono">
                {dynamicFields.length}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={fetchDynamicFields}
              disabled={!containerId}
              className="p-1.5 hover:bg-cyan-500/20 rounded"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3 text-cyan-500/50" />
            </button>
            {containerId && (
              <button
                onClick={() => navigate(`/app/dynamic-fields?objectId=${containerId}`)}
                className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded text-[10px] font-mono hover:bg-cyan-500/30"
              >
                Explorer →
              </button>
            )}
          </div>
        </div>

        {!containerId ? (
          <div className="text-center py-6 text-xs text-cyan-500/50 font-mono">
            Create a container first (Step 1)
          </div>
        ) : dynamicFields.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-2">📭</div>
            <div className="text-xs text-cyan-500/50 font-mono">
              Empty. Attach items from Step 2.
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {dynamicFields.map((field, idx) => {
              // API returns: { name: { type, value }, objectType, objectId }
              const keyId = field.name?.value || '';
              const objectType = field.objectType || '';
              // Extract type name (e.g., "item::Item" from full path)
              const typeName = objectType.split('::').slice(-2).join('::') || 'DynamicField';
              const isIdKey = field.name?.type?.includes('ID');

              return (
                <div
                  key={idx}
                  className="p-2 bg-black/50 border border-cyan-500/10 rounded flex items-center justify-between group hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>🔗</span>
                    <div>
                      <div className="text-xs font-mono text-cyan-400">{typeName}</div>
                      <div className="text-[9px] text-cyan-500/40 font-mono">
                        key: {keyId.slice(0, 16)}...
                      </div>
                    </div>
                  </div>
                  {isIdKey && (
                    <button
                      onClick={() => handleRemove(keyId)}
                      disabled={removingId === keyId}
                      className="px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded text-[10px] font-mono hover:bg-red-500/30 disabled:opacity-50 flex items-center gap-1"
                      title="Detach"
                    >
                      {removingId === keyId ? <Spinner /> : (
                        <><Trash2 className="w-3 h-3" /> Detach</>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Code Snippet */}
      <div className="p-3 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg mx-2">
        <span className="text-[10px] text-cyan-500/70 font-mono uppercase tracking-wider">MOVE_CODE</span>
        <div className="font-mono text-[10px] space-y-1 mt-2">
          <div className="text-cyan-400">
            <span className="text-cyan-500/40">// Attach: </span>
            dynamic_field::add(&mut obj.id, key, value);
          </div>
          <div className="text-red-400">
            <span className="text-cyan-500/40">// Detach: </span>
            dynamic_field::remove(&mut obj.id, key);
          </div>
        </div>
      </div>
    </div>
  );
}
