# Active Context

## Current State

The plugin is **feature-complete and production-ready** (for a troll project). All core functionality works as intended.

## Recent Changes

### Metadata Format Expansion (Oct 24, 2025)
**Problem:** Inline metadata format (`'use ai' // temperature=0.5, model=...`) was cramped and hard to read with multiple options.

**Solution:** Changed to separate comment lines for each metadata option.

**Impact:**
- Cleaner, more readable metadata
- Easier to add/remove individual options
- Better support for long instructions
- Each option on its own line

**Before:**
```typescript
'use ai' // temperature=0.5, model=openai/gpt-4-turbo, seed=42
```

**After:**
```typescript
'use ai'
// temperature=0.5
// model=openai/gpt-4-turbo
// seed=42
// instructions=Custom instructions here
```

**Implementation:**
- Modified `extractMetadataFromDirective()` to read `leadingComments` from first statement after directive
- Per-line parsing with regex: `/^\s*(\w+)\s*=\s*(.+)$/`
- Supports: `temperature`, `model`, `seed`, `instructions`

**React Example:**
Demonstrated using instructions to reference scope variables (state setters) without passing them as arguments:
```typescript
function handleFormSubmit(event: React.FormEvent<HTMLFormElement>): void {
  'use ai'
  // temperature=0.3
  // instructions=This function is inside a React component with state setters: setIsLoading, setError, and setSuccess...
  throw new Error('Not implemented')
}
```

### Major Refactor: Source Code Extraction (Oct 24, 2025)
**Problem:** Type extraction from AST was complex and buggy, resulting in cache entries with `any` types instead of actual TypeScript types.

**Solution:** Replaced AST type extraction with direct source code extraction using `path.getSource()`.

**Impact:**
- Deleted ~80 lines of complex code
- Fixed type preservation bug
- Simplified caching mechanism
- Reduced bundle size (8.46 KB → 7.07 KB)
- More reliable cache keys

**Before:**
```typescript
// Complex AST parsing
function extractFunctionSignature(node) {
  // 40+ lines of type extraction logic
}
function typeAnnotationToString(typeAnnotation) {
  // 40+ lines of type reconstruction
}
```

**After:**
```typescript
// Simple source extraction
const sourceCode = path.getSource()
const signatureMatch = sourceCode.match(/^[^{]+/)
const functionSignature = signatureMatch ? signatureMatch[0].trim() : sourceCode
```

### Code Cleanup (Oct 24, 2025)
- Removed all console.log statements
- Removed all debugging output
- Removed non-essential comments
- Plugin now runs silently

### Package Naming (Oct 24, 2025)
- Renamed from `use-ai` to `babel-plugin-use-ai`
- Follows Babel plugin naming conventions
- Users reference as `'use-ai'` in config (Babel strips prefix)

### Build System (Oct 24, 2025)
- Configured tsup for dual ESM/CJS builds
- Simplified to single entry point
- Removed unnecessary exports
- Added prepublishOnly script

## Current Focus

**Documentation and Polish**
- README is tongue-in-cheek and warns against production use
- Memory bank created for future development
- GitHub installation instructions (not publishing to npm)

## Next Steps

None planned - project is complete for its intended purpose.

## Known Issues

None currently. The plugin works as designed.

## Important Patterns & Preferences

### Code Style
- No console logs or debugging statements
- Minimal comments (code should be self-documenting)
- Named function declarations over arrow functions
- No parameter destructuring in function signatures
- Destructure at top of function body with nullish coalescing

### Caching Strategy
- Use actual source code for cache keys
- SHA-256 hash of signature + metadata
- File-based persistence in `.ai-cache.json`
- **Cache should be committed to repo** (team sharing)
- Silent failures in cache operations

### Error Handling
- Throw errors in code generation
- Silent failures in cache I/O
- Let Babel handle compilation errors

### Build Configuration
- Single entry point: `src/plugin.ts`
- External Babel dependencies (peer deps)
- Tree-shaking enabled
- Sourcemaps included

## Project Insights

### What Works Well
- Caching is very effective (instant on cache hits)
- Source code extraction is simple and reliable
- AI generates surprisingly good code for simple functions
- Tongue-in-cheek documentation resonates with developers

### What Could Be Better
- No validation of AI-generated code
- Limited to function declarations (no arrow functions)
- Requires internet connection
- API costs can add up

### Lessons Learned
- Simple solutions > complex AST manipulation
- Direct source access is more reliable than reconstruction
- Caching is essential for AI-powered tools
- Humor in documentation makes projects more approachable
