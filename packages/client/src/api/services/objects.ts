/**
 * Object queries API
 * @module api/services/objects
 */

import { fetchApi } from '../core/request';

export async function getObject(objectId: string) {
  return fetchApi<Record<string, unknown>>(`/objects/${objectId}`);
}

export async function getTransactionBlock(digest: string) {
  return fetchApi<Record<string, unknown>>(`/tx/${digest}`);
}

export async function getDynamicFields(objectId: string, cursor?: string, limit?: number) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<{
    objectId: string;
    data: any[];
    nextCursor: string | null;
    hasNextPage: boolean;
  }>(`/dynamic-fields/${objectId}${query}`);
}

export async function getObjectMetadata(objectId: string) {
  return fetchApi<Record<string, unknown>>(`/inspector/object/${objectId}/metadata`);
}
