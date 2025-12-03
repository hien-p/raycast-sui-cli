import { invoke } from '@tauri-apps/api/core';
import { CommandOutput } from '../types';

const IS_TAURI = !!(window as any).__TAURI__;
const API_BASE = 'http://localhost:3001/api';

export const apiClient = {
    executeSuiCommand: async (args: string[]): Promise<CommandOutput> => {
        if (IS_TAURI) {
            return invoke('execute_sui_command', { args });
        } else {
            const response = await fetch(`${API_BASE}/sui`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ args }),
            });
            return response.json();
        }
    },

    getActiveAddress: async (): Promise<string> => {
        if (IS_TAURI) {
            return invoke('get_active_address');
        } else {
            const response = await fetch(`${API_BASE}/active-address`);
            return response.text();
        }
    },

    walrus: {
        list: async (): Promise<CommandOutput> => {
            if (IS_TAURI) {
                return invoke('list_blobs');
            } else {
                const response = await fetch(`${API_BASE}/walrus/list`, { method: 'POST' });
                return response.json();
            }
        },
        store: async (path: string, epochs?: number): Promise<CommandOutput> => {
            if (IS_TAURI) {
                return invoke('upload_blob', { path, epochs });
            } else {
                const response = await fetch(`${API_BASE}/walrus/store`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path, epochs }),
                });
                return response.json();
            }
        },
        read: async (blobId: string, outputPath?: string): Promise<CommandOutput> => {
            if (IS_TAURI) {
                return invoke('download_blob', { blobId, outputPath });
            } else {
                const response = await fetch(`${API_BASE}/walrus/read`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blobId, outputPath }),
                });
                return response.json();
            }
        }
    }
};
