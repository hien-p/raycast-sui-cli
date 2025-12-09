# Microsoft Clarity Integration Plan

## Overview
Integrate Microsoft Clarity analytics for user behavior tracking, heatmaps, and session recordings.

**Project ID:** `uilx4655e6`
**Documentation:** https://learn.microsoft.com/en-us/clarity/

## User Stories
1. As a product owner, I want to see heatmaps of user interactions
2. As a product owner, I want to watch session recordings to understand user behavior
3. As a developer, I want to track custom events for key user actions
4. As a product owner, I want to identify users for better analytics segmentation

## Technical Requirements

### Dependencies
- `@microsoft/clarity` - Official Microsoft Clarity SDK

### Implementation Approach
1. Install official SDK (preferred over react-microsoft-clarity for better TypeScript support)
2. Initialize in production only (not in dev mode)
3. Add custom event tracking for key actions
4. Implement user identification when address is active

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/client/package.json` | Modify | Add @microsoft/clarity dependency |
| `packages/client/src/lib/clarity.ts` | Create | Clarity wrapper with helper functions |
| `packages/client/src/main.tsx` | Modify | Initialize Clarity on app start |
| `packages/client/src/components/guards/AppGuard.tsx` | Modify | Identify user when address loaded |

### Key Events to Track
- `server_connected` - When local server connects
- `address_switched` - When user switches address
- `environment_switched` - When user changes network
- `faucet_requested` - When faucet is used
- `transfer_completed` - When SUI transfer succeeds
- `package_published` - When Move package is published
- `function_called` - When contract function is executed

### Environment Variables
No env vars needed - Project ID will be hardcoded (it's public anyway)

## Implementation Steps

1. Install dependency
2. Create clarity wrapper module
3. Initialize in main.tsx (production only)
4. Add event tracking to key actions
5. Add user identification

## Verification Steps
1. Build production bundle
2. Deploy to Vercel
3. Check Network tab for requests to clarity.ms
4. Verify data appears in Clarity dashboard

## Security Considerations
- Clarity only tracks on production (not dev)
- No PII is sent - only wallet addresses (public data)
- Clarity respects Do Not Track browser settings
