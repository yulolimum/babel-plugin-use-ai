# System Patterns

## Architecture Overview

```
User Code (with 'use ai')
    ↓
Babel Parser
    ↓
Plugin Visitor (FunctionDeclaration)
    ↓
Directive Detection
    ↓
Cache Check → [Cache Hit] → Use Cached Code
    ↓ [Cache Miss]
OpenRouter API
    ↓
Code Generation
    ↓
Cache Storage
    ↓
AST Replacement
    ↓
Generated Code
```

## Core Components

### 1. Plugin Entry (`src/plugin.ts`)
- Babel plugin factory
- Visitor pattern for AST traversal
- Async operation management
- Configuration handling

### 2. Cache System (`src/cache.ts`)
- File-based caching (`.ai-cache.json`)
- SHA-256 hash keys (signature + metadata)
- Automatic persistence
- Cache invalidation on signature/metadata changes

### 3. Code Generator (`src/code-generator.ts`)
- OpenRouter API integration
- Vercel AI SDK usage
- Cache-aware generation
- Error handling

### 4. Prompt Builder (`src/prompt-builder.ts`)
- Prompt construction from function signature
- Metadata extraction from comments
- Instruction formatting

## Key Design Patterns

### Visitor Pattern
Each function type has its own visitor with custom source extraction:

```typescript
visitor: {
  FunctionExpression(path) {
    // Nested functions (React Native case)
    // Fallback to path.hub.getCode() for original source
  },
  ArrowFunctionExpression(path) {
    // Variable-assigned arrow functions
    // Use parentPath.parentPath.getSource()
  },
  ObjectMethod(path) {
    // Object methods
    // Use path.getSource()
  },
  FunctionDeclaration(path) {
    // Top-level function declarations
    // Use path.getSource()
  }
}
```

### Async Operation Queue
```typescript
const pendingOperations: Promise<void>[] = []
// ... collect operations
post() {
  return Promise.all(pendingOperations)
}
```

### Source Code Extraction

**Per-Visitor Strategies:**

1. **FunctionExpression** (React Native nested functions):
```typescript
const sourceString = parentPath?.getSource();
let fallbackSourceString = "";

// Fallback: Extract from original file using line/column
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

2. **ArrowFunctionExpression**:
```typescript
const sourceString = parentPath.parentPath?.getSource();
```

3. **ObjectMethod & FunctionDeclaration**:
```typescript
const sourceString = path.getSource();
```

**Key Benefits:**
- Uses actual source instead of reconstructing from AST
- Preserves exact TypeScript types and comments
- `path.hub.getCode()` accesses original file before transforms
- Works even when source locations are stripped by other plugins
- No dependency on `@babel/generator`

### Cache Key Generation
```typescript
private generateKey(signature: string, metadata: Metadata): string {
  const data = JSON.stringify({ signature, metadata })
  return crypto.createHash('sha256').update(data).digest('hex')
}
```

## Critical Implementation Details

### Directive Detection
- Babel treats string literals at function start as directives
- Stored in `node.body.directives` array
- Metadata extracted from trailing comments

### Metadata Parsing
```typescript
'use ai'
// temperature=0.5
// model=anthropic/claude-sonnet-4
// seed=42
// instructions=Custom instructions here
```
- Each metadata option on separate comment line
- Parsed from `leadingComments` of first statement after directive
- Regex pattern: `/^\s*(\w+)\s*=\s*(.+)$/`
- Inline metadata overrides plugin defaults
- Supports: temperature, model, seed, instructions
- Instructions can reference scope variables (e.g., React state setters)

### AST Manipulation
1. Parse generated code string to AST
2. Extract function body statements
3. Replace original body with generated statements
4. Remove directives to prevent re-processing

### Error Handling
- Silent failures in cache operations
- Thrown errors in code generation
- Babel will report compilation errors

## Build System

### tsup Configuration
- Single entry point: `src/plugin.ts`
- Dual format: ESM + CJS
- TypeScript declarations
- External Babel dependencies (peer deps)
- Tree-shaking enabled

### Output Structure
```
dist/
  plugin.js       # ESM
  plugin.cjs      # CommonJS
  plugin.d.ts     # TypeScript types
  plugin.d.cts    # CommonJS types
  *.map           # Source maps
```

## Performance Considerations

### Caching Strategy
- Cache hit = instant (no API call)
- Cache miss = API call + storage
- Cache persists across builds
- **Cache file should be committed** (enables team sharing)
- Invalidates on signature/metadata change
- Team members benefit from shared cache

### Async Handling
- All AI generation is async
- Operations queued during traversal
- Resolved in `post()` hook
- Babel waits for completion

## Security Considerations

### API Key Management
- Environment variable preferred
- Plugin option as fallback
- Never committed to repo
- Required for operation

### Generated Code
- No validation of AI output
- Assumes AI generates valid code
- Parser will catch syntax errors
- Runtime errors possible
