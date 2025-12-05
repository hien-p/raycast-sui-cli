# Parameter Input Helper Feature

## Overview

A comprehensive feature to automatically help users fill in function parameters when calling Move smart contract functions. The system queries user's owned objects, suggests appropriate values based on parameter types, and provides type-specific input helpers.

## User Stories

1. **As a developer**, I want to see a dropdown of my owned objects when a function parameter requires an object type, so I don't have to manually look up object IDs.

2. **As a developer**, I want the system to auto-fill parameters when I only have one valid object of the required type, saving me time.

3. **As a developer**, I want type-specific input helpers (string converter for `vector<u8>`, number validation for `u64`) to ensure I enter values in the correct format.

4. **As a developer**, I want to see object metadata (type, version, fields) when hovering over suggestions, so I can make informed selections.

5. **As a developer**, I want clear feedback when I don't own any objects of the required type, with guidance on how to obtain them.

## Technical Requirements

### Parameter Type Categories

| Category | Pattern | Example | UI Behavior |
|----------|---------|---------|-------------|
| `reference_mut` | `&mut T` | `&mut UserProfile` | Show owned objects dropdown |
| `reference` | `&T` | `&Clock` | Show owned + shared objects |
| `owned` | `T` (struct) | `Ticket` | Show owned objects dropdown |
| `primitive_number` | `u8, u16, u32, u64, u128, u256` | `u64` | Number input with validation |
| `primitive_bool` | `bool` | `bool` | Toggle/radio buttons |
| `primitive_address` | `address` | `address` | Address input with selector |
| `vector_u8` | `vector<u8>` | `vector<u8>` | String converter tool |
| `vector_other` | `vector<T>` | `vector<address>` | Multi-value input |
| `type_param` | Generic `T` | `T: store` | Type selector first |

### Backend Components

#### 1. ParameterHelperService

**Location:** `packages/server/src/services/ParameterHelperService.ts`

```typescript
interface ParsedType {
  category: 'reference_mut' | 'reference' | 'owned' | 'primitive' | 'vector' | 'type_param';
  baseType: string;
  genericParams?: string[];
  isMutable: boolean;
  isReference: boolean;
}

interface ParameterSuggestion {
  type: 'object' | 'value' | 'address';
  label: string;
  value: string;
  metadata?: {
    objectId?: string;
    type?: string;
    version?: string;
    fields?: Record<string, unknown>;
  };
}

interface AnalyzedParameter {
  name: string;
  type: string;
  parsedType: ParsedType;
  category: string;
  suggestions: ParameterSuggestion[];
  autoFilled?: { value: string; reason: string };
  examples: string[];
  validation?: { pattern: string; message: string };
}
```

**Methods:**
- `analyzeParameters(packageId, module, functionName, userAddress)` - Main entry point
- `parseTypeString(typeStr)` - Parse Move type string into structured format
- `getObjectSuggestions(address, typePattern)` - Query and filter user's objects
- `matchObjectToType(object, parsedType)` - Check if object matches parameter type

#### 2. API Endpoints

**POST /inspector/analyze-parameters**
```typescript
Request: {
  packageId: string;
  module: string;
  functionName: string;
  userAddress: string;
}

Response: {
  success: boolean;
  data: {
    parameters: AnalyzedParameter[];
    function: {
      name: string;
      visibility: string;
    };
  };
}
```

**GET /addresses/:address/objects/by-type**
```typescript
Query: {
  type: string;  // Type pattern to match (e.g., "UserProfile", "0x2::coin::Coin")
}

Response: {
  success: boolean;
  data: SuiObject[];
}
```

**GET /objects/:objectId/metadata**
```typescript
Response: {
  success: boolean;
  data: {
    objectId: string;
    type: string;
    version: string;
    digest: string;
    owner: string;
    content?: Record<string, unknown>;
    display?: {
      name?: string;
      description?: string;
      imageUrl?: string;
    };
  };
}
```

### Frontend Components

#### 1. ParameterInputField

**Location:** `packages/client/src/components/ParameterInputField/index.tsx`

**Props:**
```typescript
interface ParameterInputFieldProps {
  parameter: AnalyzedParameter;
  value: string;
  onChange: (value: string) => void;
  onRefreshSuggestions?: () => void;
  isLoading?: boolean;
  error?: string;
}
```

**Features:**
- Type badge showing parameter category
- Smart input based on type (text, number, dropdown, toggle)
- Suggestions dropdown with search/filter
- Auto-fill button when single valid option
- Clear/reset button

#### 2. ObjectSuggestionDropdown

**Location:** `packages/client/src/components/ParameterInputField/ObjectSuggestionDropdown.tsx`

**Features:**
- List owned objects matching type
- Search within suggestions
- Object preview on hover
- "No matching objects" state with help link
- Refresh button

#### 3. ObjectMetadataPopover

**Location:** `packages/client/src/components/ParameterInputField/ObjectMetadataPopover.tsx`

**Features:**
- Show on hover/focus
- Display: type, version, owner (truncated), key fields
- Copy object ID button
- Link to explorer

#### 4. VectorU8Converter

**Location:** `packages/client/src/components/ParameterInputField/VectorU8Converter.tsx`

**Features:**
- String ↔ Hex ↔ Bytes conversion
- Encode button
- Copy result
- Preview encoded value

#### 5. NumberInput

**Location:** `packages/client/src/components/ParameterInputField/NumberInput.tsx`

**Features:**
- Type-specific min/max validation
- Format with commas for readability
- Support scientific notation for large numbers
- Quick presets (1 SUI = 1000000000, etc.)

### State Management

**Zustand Store Extension:**
```typescript
interface ParameterHelperSlice {
  // State
  analyzedParameters: Map<string, AnalyzedParameter[]>;
  objectSuggestions: Map<string, SuiObject[]>;
  objectMetadata: Map<string, ObjectMetadata>;
  isAnalyzing: boolean;

  // Actions
  analyzeParameters: (packageId, module, func, address) => Promise<void>;
  fetchObjectsByType: (address, type) => Promise<SuiObject[]>;
  fetchObjectMetadata: (objectId) => Promise<ObjectMetadata>;
  clearParameterCache: () => void;
}
```

## File Changes

### New Files

| Path | Description |
|------|-------------|
| `packages/server/src/services/ParameterHelperService.ts` | Backend service for parameter analysis |
| `packages/client/src/components/ParameterInputField/index.tsx` | Main parameter input component |
| `packages/client/src/components/ParameterInputField/ObjectSuggestionDropdown.tsx` | Object suggestions UI |
| `packages/client/src/components/ParameterInputField/ObjectMetadataPopover.tsx` | Object preview popover |
| `packages/client/src/components/ParameterInputField/VectorU8Converter.tsx` | String to bytes converter |
| `packages/client/src/components/ParameterInputField/NumberInput.tsx` | Number type input |
| `packages/client/src/components/ParameterInputField/types.ts` | TypeScript interfaces |

### Modified Files

| Path | Changes |
|------|---------|
| `packages/server/src/routes/inspector.ts` | Add analyze-parameters endpoint |
| `packages/server/src/routes/address.ts` | Add objects-by-type endpoint |
| `packages/server/src/services/index.ts` | Export ParameterHelperService |
| `packages/client/src/api/client.ts` | Add new API methods |
| `packages/client/src/components/MoveDeploy/index.tsx` | Integrate ParameterInputField |
| `packages/client/src/stores/useAppStore.ts` | Add parameter helper state |

## Implementation Phases

### Phase 1: Backend Foundation
1. Create ParameterHelperService with type parsing
2. Implement object filtering by type
3. Add API endpoints

### Phase 2: Frontend Components
1. Create ParameterInputField component
2. Build ObjectSuggestionDropdown
3. Create type-specific helpers (VectorU8Converter, NumberInput)

### Phase 3: Integration
1. Connect to MoveDeploy component
2. Update Zustand store
3. Wire up API calls

### Phase 4: Polish
1. Add loading states and animations
2. Handle edge cases
3. Improve error messages

## Verification Steps

1. **Type Parsing Test**: Parse various Move type strings correctly
   - `&mut 0x2::coin::Coin<0x2::sui::SUI>` → reference_mut, Coin type
   - `vector<u8>` → vector, u8 base type
   - `u64` → primitive_number

2. **Object Filtering Test**: Query returns correct objects
   - Filter by exact type match
   - Filter by partial type pattern
   - Handle no matches gracefully

3. **UI Integration Test**: Components work in MoveDeploy
   - Select function → parameters analyzed
   - Suggestions appear for object types
   - Auto-fill works when single option
   - Manual input accepted and validated

4. **Edge Case Tests**:
   - Function with no parameters
   - Function with generic type parameters
   - User has no owned objects
   - Network error during fetch

## Success Criteria

- [ ] Parameters are automatically analyzed when function is selected
- [ ] Object suggestions appear for reference/owned parameters
- [ ] Auto-fill works when user has exactly one matching object
- [ ] String → vector<u8> converter works correctly
- [ ] Number inputs validate min/max based on type
- [ ] Object metadata shows on hover
- [ ] Clear error messages when no matching objects
- [ ] Loading states during analysis
- [ ] Works with existing function call flow
