import { useState } from 'react';
import { getDynamicFields } from '@/api/client';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';

interface DynamicField {
  name: any;
  bcsName: string;
  type: string;
  objectType: string;
  objectId: string;
  version: string;
  digest: string;
}

export function DynamicFieldExplorer() {
  const [objectId, setObjectId] = useState('');
  const [fields, setFields] = useState<DynamicField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [queriedObjectId, setQueriedObjectId] = useState<string>('');
  const [expandedFields, setExpandedFields] = useState<Set<number>>(new Set());

  const handleQuery = async (cursor?: string) => {
    if (!objectId.trim() && !cursor) {
      toast.error('Please enter an object ID');
      return;
    }

    setIsLoading(true);
    try {
      const result = await getDynamicFields(
        cursor ? queriedObjectId : objectId,
        cursor,
        50
      );

      if (!cursor) {
        setFields(result.data);
        setQueriedObjectId(objectId);
      } else {
        setFields([...fields, ...result.data]);
      }

      setHasNextPage(result.hasNextPage);
      setNextCursor(result.nextCursor);

      if (result.data.length === 0 && !cursor) {
        toast.success('No dynamic fields found');
      } else if (!cursor) {
        toast.success(`Found ${result.data.length} field${result.data.length !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to query dynamic fields';
      toast.error(message);
      if (!cursor) {
        setFields([]);
        setHasNextPage(false);
        setNextCursor(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFields(newExpanded);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const formatFieldName = (name: any): string => {
    if (typeof name === 'string') return name;
    if (typeof name === 'object' && name !== null) {
      return JSON.stringify(name);
    }
    return String(name);
  };

  const getFieldIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('table')) return '📊';
    if (lower.includes('bag')) return '🎒';
    if (lower.includes('vec')) return '📋';
    if (lower.includes('map')) return '🗺️';
    return '🔗';
  };

  return (
    <div className="px-2 py-2">
      {/* Header */}
      <div className="mb-3 px-3 py-2 bg-muted/30 rounded-lg">
        <div className="text-sm font-medium text-foreground mb-1">Dynamic Field Explorer</div>
        <div className="text-xs text-muted-foreground">
          Query dynamic fields on objects
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-3 px-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={objectId}
              onChange={(e) => setObjectId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleQuery();
                }
              }}
              placeholder="Enter object ID (e.g., 0x1234...)"
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={() => handleQuery()}
            disabled={isLoading || !objectId.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Querying...' : 'Query'}
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading && fields.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : fields.length > 0 ? (
        <>
          {/* Object ID Header */}
          <div className="mb-2 px-3 py-2 bg-muted/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Object ID</div>
            <div
              className="text-sm font-mono text-foreground truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => copyToClipboard(queriedObjectId, 'Object ID')}
            >
              {queriedObjectId}
            </div>
          </div>

          {/* Fields List */}
          <div className="space-y-1">
            {fields.map((field, index) => {
              const isExpanded = expandedFields.has(index);
              const fieldName = formatFieldName(field.name);

              return (
                <div
                  key={`${field.objectId}-${index}`}
                  className="rounded-lg bg-muted/30 border border-border/50 overflow-hidden"
                >
                  {/* Field Header */}
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleExpanded(index)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-lg">
                      {getFieldIcon(field.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {fieldName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {field.objectId}
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-border/30">
                      {/* Object ID */}
                      <div className="pt-2">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Object ID
                        </div>
                        <div
                          className="text-xs font-mono text-foreground bg-muted/50 px-2 py-1.5 rounded cursor-pointer hover:bg-muted transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(field.objectId, 'Object ID');
                          }}
                        >
                          {field.objectId}
                        </div>
                      </div>

                      {/* Type */}
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Field Type
                        </div>
                        <div className="text-xs font-mono text-foreground bg-muted/50 px-2 py-1.5 rounded break-all">
                          {field.type}
                        </div>
                      </div>

                      {/* Object Type */}
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Object Type
                        </div>
                        <div className="text-xs font-mono text-foreground bg-muted/50 px-2 py-1.5 rounded break-all">
                          {field.objectType}
                        </div>
                      </div>

                      {/* Version & Digest */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                            Version
                          </div>
                          <div className="text-xs font-mono text-foreground bg-muted/50 px-2 py-1.5 rounded">
                            {field.version}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                            Digest
                          </div>
                          <div
                            className="text-xs font-mono text-foreground bg-muted/50 px-2 py-1.5 rounded truncate cursor-pointer hover:bg-muted transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(field.digest, 'Digest');
                            }}
                            title={field.digest}
                          >
                            {field.digest.slice(0, 10)}...
                          </div>
                        </div>
                      </div>

                      {/* BCS Name */}
                      {field.bcsName && (
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                            BCS Name
                          </div>
                          <div className="text-xs font-mono text-foreground bg-muted/50 px-2 py-1.5 rounded">
                            {field.bcsName}
                          </div>
                        </div>
                      )}

                      {/* Raw Name */}
                      {typeof field.name === 'object' && field.name !== null && (
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                            Raw Name Data
                          </div>
                          <div className="text-xs font-mono text-foreground bg-muted/50 px-2 py-1.5 rounded">
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(field.name, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="mt-3 px-2">
              <button
                onClick={() => handleQuery(nextCursor || undefined)}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-muted/50 hover:bg-muted text-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Loading more...
                  </span>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}

          {/* Footer Stats */}
          <div className="mt-3 px-3 py-2 bg-muted/20 rounded-lg flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {fields.length} field{fields.length !== 1 ? 's' : ''} loaded
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Click to expand details
            </span>
          </div>
        </>
      ) : queriedObjectId ? (
        <div className="px-3 py-8 text-center text-muted-foreground">
          <div className="text-4xl mb-2">📭</div>
          <div>No dynamic fields found</div>
          <div className="text-xs mt-1">This object may not have any dynamic fields</div>
        </div>
      ) : (
        <div className="px-3 py-8 text-center text-muted-foreground">
          <div className="text-4xl mb-2">🔍</div>
          <div>Enter an object ID to explore its dynamic fields</div>
          <div className="text-xs mt-1">Dynamic fields are key-value pairs stored on objects</div>
        </div>
      )}
    </div>
  );
}
