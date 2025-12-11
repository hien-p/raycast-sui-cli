// Configuration for Sui Smart Contracts
// Values can be overridden via environment variables

// Community Registry Contract
// Default values are for testnet deployment
export const COMMUNITY_REGISTRY_ID = import.meta.env.VITE_COMMUNITY_REGISTRY_ID || '0x7bf988f34c98d5b69d60264083c581d90fa97c51e902846bed491c0f6bf9b80b';
export const COMMUNITY_PACKAGE_ID = import.meta.env.VITE_COMMUNITY_PACKAGE_ID || '0xffb8f17c91212d170cb0fee4128b8b44277bfd19af040590cfae08c1abd2bbd2';
export const NETWORK = import.meta.env.VITE_SUI_NETWORK || 'testnet';
export const RPC_URL = import.meta.env.VITE_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
