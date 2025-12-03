import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';

export function ObjectList() {
  const {
    objects,
    addresses,
    isLoading,
    searchQuery,
    fetchObjects,
  } = useAppStore();

  const activeAddress = addresses.find((a) => a.isActive);

  useEffect(() => {
    if (activeAddress) {
      fetchObjects(activeAddress.address);
    }
  }, [activeAddress, fetchObjects]);

  const filteredObjects = objects.filter((obj) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const objectId = obj.data?.objectId || obj.objectId || '';
    const type = obj.data?.type || obj.type || '';
    return (
      objectId.toLowerCase().includes(query) ||
      type.toLowerCase().includes(query)
    );
  });

  const copyObjectId = (objectId: string) => {
    navigator.clipboard.writeText(objectId);
    toast.success('Object ID copied to clipboard');
  };

  const getTypeDisplay = (type: string) => {
    if (!type) return 'Unknown';
    // Extract just the struct name from full type path
    const parts = type.split('::');
    return parts[parts.length - 1] || type;
  };

  const getTypeIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('coin')) return '🪙';
    if (lower.includes('nft')) return '🖼️';
    if (lower.includes('package')) return '📦';
    if (lower.includes('cap')) return '🔑';
    return '📄';
  };

  if (!activeAddress) {
    return (
      <div className="px-3 py-8 text-center text-text-secondary">
        No active address selected
      </div>
    );
  }

  if (isLoading && objects.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-2 py-2">
      <div className="mb-3 px-3 py-2 bg-background-tertiary rounded-lg">
        <div className="text-xs text-text-secondary">
          Objects owned by
        </div>
        <div className="text-sm font-mono text-text-primary truncate">
          {activeAddress.alias || `${activeAddress.address.slice(0, 16)}...`}
        </div>
      </div>

      {filteredObjects.length === 0 ? (
        <div className="px-3 py-8 text-center text-text-secondary">
          No objects found
        </div>
      ) : (
        <div className="space-y-1">
          {filteredObjects.map((obj, index) => {
            const objectId = obj.data?.objectId || obj.objectId || `obj-${index}`;
            const type = obj.data?.type || obj.type || '';
            const version = obj.data?.version || obj.version || '';

            return (
              <div
                key={objectId}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-background-hover transition-colors cursor-pointer"
                onClick={() => copyObjectId(objectId)}
              >
                <div className="w-8 h-8 rounded-lg bg-background-tertiary flex items-center justify-center text-lg">
                  {getTypeIcon(type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">
                    {getTypeDisplay(type)}
                  </div>
                  <div className="text-xs text-text-secondary font-mono truncate">
                    {objectId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-tertiary">
                    v{version}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 px-3 text-xs text-text-tertiary text-center">
        {filteredObjects.length} object{filteredObjects.length !== 1 ? 's' : ''} • Click to copy ID
      </div>
    </div>
  );
}
