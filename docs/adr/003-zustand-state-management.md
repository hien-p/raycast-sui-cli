# ADR-003: Zustand for State Management

## Status
Accepted

## Date
2024-01-20

## Context
The frontend needs global state management for:
- Connection status to local server
- Wallet addresses and active address
- Network environments
- Community membership status
- UI state (theme, loading, errors)

Requirements:
- Simple API without boilerplate
- TypeScript support
- React 18 compatibility
- Small bundle size

## Decision
Use Zustand with a single store (`useAppStore`) that can be incrementally split into slices as complexity grows.

```typescript
// Simple usage
const { addresses, switchAddress } = useAppStore();

// Slice pattern for scaling
import { create } from 'zustand';
import { createUISlice } from './slices/uiSlice';
import { createConnectionSlice } from './slices/connectionSlice';

export const useAppStore = create()((...args) => ({
  ...createUISlice(...args),
  ...createConnectionSlice(...args),
}));
```

## Rationale

### Why Zustand?
- **Minimal API**: No providers, actions, reducers
- **TypeScript**: Excellent type inference
- **Bundle size**: ~1.2KB (vs Redux ~7KB)
- **Flexibility**: Works with or without React
- **Slice pattern**: Scales to complex apps

### Alternatives Considered
1. **Redux Toolkit**: Too much boilerplate for our scale
2. **Jotai**: Good, but atom pattern less intuitive for this use case
3. **React Context**: Re-render issues, no devtools
4. **MobX**: Larger bundle, more complex mental model

## Consequences

### Positive
- Simple mental model: "store = state + actions"
- Easy testing (just import store)
- DevTools integration available
- Can use React.memo with selectors

### Negative
- Single store can grow large (mitigated by slices)
- Less structure than Redux (can be good or bad)

### Neutral
- Community smaller than Redux, but growing

## Implementation Notes

Current slices available in `stores/slices/`:
- `uiSlice`: Theme, loading, errors, view state
- `connectionSlice`: Server connection status
- `communitySlice`: Membership, tier info

## References
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Slices Pattern](https://docs.pmnd.rs/zustand/guides/slices-pattern)
