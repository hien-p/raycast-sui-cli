import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { COMMUNITY_REGISTRY_ID, NETWORK, RPC_URL } from '../config/contracts';

export interface CommunityStats {
    totalMembers: number;
    isConfigured: boolean;
}

class SuiService {
    private client: SuiClient;

    constructor() {
        this.client = new SuiClient({
            url: RPC_URL || getFullnodeUrl(NETWORK),
        });
    }

    /**
     * Get community statistics directly from the blockchain
     */
    async getCommunityStats(): Promise<CommunityStats> {
        try {
            const object = await this.client.getObject({
                id: COMMUNITY_REGISTRY_ID,
                options: {
                    showContent: true,
                },
            });

            if (
                object.data?.content?.dataType === 'moveObject' &&
                'fields' in object.data.content
            ) {
                const fields = object.data.content.fields as any;
                return {
                    totalMembers: parseInt(fields.total_members || '0', 10),
                    isConfigured: true,
                };
            }

            return {
                totalMembers: 0,
                isConfigured: false,
            };
        } catch (error) {
            console.error('[SuiService] Failed to fetch community stats:', error);
            // If object not found or network error, return default
            return {
                totalMembers: 0,
                isConfigured: false,
            };
        }
    }
    /**
     * Check if an address is a community member
     */
    async checkMembership(address: string): Promise<boolean> {
        try {
            // 1. Get Registry Object to find members table ID
            const registryObj = await this.client.getObject({
                id: COMMUNITY_REGISTRY_ID,
                options: { showContent: true },
            });

            if (
                !registryObj.data?.content ||
                registryObj.data.content.dataType !== 'moveObject'
            ) {
                return false;
            }

            const fields = registryObj.data.content.fields as any;
            const membersTableId = fields.members?.fields?.id?.id;

            if (!membersTableId) {
                return false;
            }

            // 2. Check if address exists in the table
            const dynamicField = await this.client.getDynamicFieldObject({
                parentId: membersTableId,
                name: {
                    type: 'address',
                    value: address,
                },
            });

            return !!dynamicField.data;
        } catch (error) {
            // If dynamic field not found, it throws an error (or returns null depending on version, but usually throws)
            // We treat any error here as "not a member" or "failed to check"
            return false;
        }
    }
}

export const suiService = new SuiService();
