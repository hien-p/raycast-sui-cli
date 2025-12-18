/**
 * Address management API
 * @module api/services/addresses
 */

import type { SuiAddress, GasCoin } from '@/types';
import { fetchApi } from '../core/request';

export async function getAddresses() {
  return fetchApi<SuiAddress[]>('/addresses');
}

export async function getActiveAddress() {
  return fetchApi<{ address: string }>('/addresses/active');
}

export async function switchAddress(address: string) {
  return fetchApi<void>('/addresses/switch', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
}

export async function createAddress(
  keyScheme?: 'ed25519' | 'secp256k1' | 'secp256r1',
  alias?: string
) {
  return fetchApi<{ address: string; phrase?: string }>('/addresses/create', {
    method: 'POST',
    body: JSON.stringify({ keyScheme, alias }),
  });
}

export async function removeAddress(address: string) {
  return fetchApi<void>('/addresses/remove', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
}

export async function getBalance(address: string) {
  return fetchApi<{ balance: string }>(`/addresses/${address}/balance`);
}

export async function getObjects(address: string) {
  return fetchApi<Record<string, unknown>[]>(`/addresses/${address}/objects`);
}

export async function getGasCoins(address: string) {
  return fetchApi<GasCoin[]>(`/addresses/${address}/gas`);
}

export async function getObjectsByType(address: string, typePattern: string) {
  return fetchApi<Record<string, unknown>[]>(
    `/addresses/${address}/objects/by-type?type=${encodeURIComponent(typePattern)}`
  );
}
