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

**React Native Compatibility & Source Extraction Fix (Oct 26, 2025)**

**Problem:** 
- Plugin failed in React Native with "Unable to get source code for function" error
- Nested functions (like those inside React components) had no source location info
- Initial fix using `@babel/generator` transformed code, stripping TypeScript types and comments
- Lost metadata like `// instructions=...` and type annotations like `: string`

**Root Cause:**
- React compiler and other transforms run before our plugin
- These transforms strip source location metadata from AST
- `path.getSource()` returns empty string when source locations are missing
- `@babel/generator` reconstructs code from AST but loses TypeScript syntax

**Solution:**
Implemented per-visitor source extraction strategies with fallback to original file content:

1. **FunctionExpression** (React Native nested functions):
   - Try `parentPath.getSource()` first
   - **Fallback**: Use `path.hub.getCode()` to get original source file
   - Extract exact function using line/column from `path.node.loc`
   - Preserves TypeScript types, comments, and all metadata

2. **ArrowFunctionExpression**:
   - Use `parentPath.parentPath.getSource()` for full variable declaration

3. **ObjectMethod & FunctionDeclaration**:
   - Use `path.getSource()` directly (works fine for these)

**Implementation:**
```typescript
// FunctionExpression fallback
const code = path.hub.getCode(); // Original source file
if (startLOC && endLOC && code) {
  const codeLines = code.split("\n");
  const extractedLines = codeLines.slice(startLOC.line - 1, endLOC.line);
  extractedLines[0] = extractedLines[0].slice(startLOC.column);
  extractedLines[extractedLines.length - 1] = 
    extractedLines[extractedLines.length - 1].slice(0, endLOC.column);
  fallbackSourceString = extractedLines.join("\n");
}
```

**Impact:**
- ✅ React Native nested functions now work
- ✅ TypeScript type annotations preserved (`: string`)
- ✅ Comment-based metadata preserved (`// instructions=...`)
- ✅ Original formatting maintained
- ✅ No code transformation
- ✅ Removed `@babel/generator` dependency
- ✅ Each visitor handles its own extraction logic

**Key Insight:**
Using `path.hub.getCode()` accesses the **original source file content** before any transforms, ensuring we get the exact TypeScript code as written by the developer.

### Dev Workflow & Project Reorganization (Oct 25, 2025)
**Problem:** 
- tsx-based dev workflow didn't support live debugging in integrated demo projects
- Root directory cluttered with example-specific config files
- Unclear separation between plugin code and examples

**Solution:** 
- Implemented tsup watch mode with onSuccess callback
- Reorganized examples into `examples/file/` subdirectory
- Moved example-specific configs to examples directory

**Changes:**
1. **New Directory Structure:**
   ```
   examples/file/
   ├── babel.config.js    (example-specific Babel config)
   ├── dev.js             (test runner script)
   ├── example.ts         (test functions)
   └── .env.example       (API key template)
   ```

2. **Removed from Root:**
   - `babel.config.js` (moved to examples/file/)
   - `.env.example` (moved to examples/file/)
   - Old example files

3. **Updated Configs:**
   - `tsup.config.ts`: Added `onSuccess: "node examples/file/dev.js"`
   - `tsconfig.json`: Exclude entire `examples/` directory
   - `package.json`: Single `dev` script using tsup watch
   - `biome.json`: Updated to lint only `src/`, `examples/file/`, and root configs

**Workflow:**
```bash
npm run dev
```
- tsup watches `src/` and rebuilds on changes
- After each build, automatically runs `examples/file/dev.js`
- Test output shows transformed code
- For React Native: RN uses `file:../..` dependency and picks up dist/ changes

**Benefits:**
- Cleaner root directory (only plugin code and configs)
- Clear separation of concerns
- Single command for development
- Live debugging in both simple examples and React Native
- Automatic test execution after rebuild

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
