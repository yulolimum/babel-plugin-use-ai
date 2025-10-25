# Technical Context

## Technology Stack

### Core Dependencies
- **@babel/core** (^7.23.0) - Babel compiler core
- **@babel/types** - AST node types
- **@babel/traverse** - AST traversal
- **@babel/parser** - JavaScript/TypeScript parser
- **@babel/generator** - Code generation from AST
- **ai** (^5.0.0) - Vercel AI SDK
- **@openrouter/ai-sdk-provider** (^1.2.0) - OpenRouter integration

### Dev Dependencies
- **TypeScript** (^5.9.3)
- **tsup** (^8.5.0) - Build tool
- **tsx** (^4.20.6) - TypeScript execution
- **dotenv** (^17.2.3) - Environment variables

## Development Setup

### Prerequisites
```bash
Node.js (latest LTS)
pnpm (package manager)
OpenRouter API key
```

### Installation
```bash
git clone git@github.com:yulolimum/babel-plugin-use-ai.git
cd babel-plugin-use-ai
pnpm install
```

### Environment Configuration
```env
OPENROUTER_API_KEY=your-key-here
```

### Available Scripts
- `pnpm build` - Build plugin (ESM + CJS)
- `pnpm dev` - Run example with hot reload
- `pnpm type-check` - TypeScript validation

## Build Configuration

### tsup.config.ts
```typescript
{
  entry: ['src/plugin.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['@babel/*'],
  splitting: false,
  treeshake: true,
}
```

### TypeScript Configuration
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Declaration files generated

## Package Configuration

### Exports
```json
{
  ".": {
    "types": "./dist/plugin.d.ts",
    "import": "./dist/plugin.js",
    "require": "./dist/plugin.cjs"
  }
}
```

### Peer Dependencies
- `@babel/core` ^7.23.0 (required by consumers)

### Files Included in Package
- `dist/` - Built files
- `README.md` - Documentation
- `LICENSE` - MIT license

## Babel Plugin API

### Plugin Structure
```typescript
export default function babelPluginUseAi(
  _babelApi: any,
  options: PluginOptions = {}
) {
  return {
    name: 'babel-plugin-use-ai',
    visitor: { /* ... */ },
    post() { /* ... */ }
  }
}
```

### Plugin Options
```typescript
interface PluginOptions {
  apiKey?: string        // OpenRouter API key
  model?: string         // Default AI model
  temperature?: number   // Default temperature
}
```

## AI Integration

### OpenRouter Configuration
- Provider: OpenRouter
- Default model: `openai/gpt-4-turbo`
- Fallback: `anthropic/claude-haiku-4.5`
- Temperature: 0.7 (default)

### Supported Models
- Any model available on OpenRouter
- Common choices:
  - `anthropic/claude-haiku-4.5` (fast, cheap)
  - `anthropic/claude-sonnet-4` (balanced)
  - `openai/gpt-4-turbo` (powerful)
  - `openai/gpt-3.5-turbo` (fast, cheap)

### Prompt Engineering
- Function signature as context
- Type information preserved
- Clear instructions for code-only output
- No comments in generated code
- No debugging statements

## File Structure

```
babel-plugin-use-ai/
├── src/
│   ├── plugin.ts           # Main plugin entry
│   ├── cache.ts            # Caching system
│   ├── code-generator.ts   # AI integration
│   └── prompt-builder.ts   # Prompt construction
├── example/
│   ├── example.ts          # Test functions
│   └── dev.ts              # Development runner
├── dist/                   # Build output
├── .ai/
│   └── memory/             # Memory bank
├── babel.config.js         # Babel configuration
├── tsconfig.json          # TypeScript config
├── tsup.config.ts         # Build config
└── package.json           # Package manifest
```

## Development Workflow

### Local Development
1. Make changes to `src/`
2. Run `pnpm build` to compile
3. Run `pnpm dev` to test with examples
4. Check `.ai-cache.json` for cache behavior

### Testing Changes
- Modify `example/example.ts`
- Delete `.ai-cache.json` to force regeneration
- Run `pnpm dev` to see results
- Check `example/dist/example.ts` for output

## Constraints & Limitations

### Technical Constraints
- Requires Babel 7.23.0+
- Node.js environment only
- Async operations (no sync mode)
- File-based caching only

### API Constraints
- Requires internet connection
- OpenRouter API rate limits apply
- API costs per generation
- Model availability varies

### Code Generation Constraints
- Function declarations only (no arrow functions)
- TypeScript/JavaScript only
- Simple to moderate complexity works best
- No guarantee of correctness
- No validation of generated code

## Performance Characteristics

### Build Time Impact
- First build: Slow (API calls)
- Subsequent builds: Fast (cache hits)
- Cache invalidation: Selective (signature-based)

### Bundle Size
- Plugin: ~7-10 KB (minified)
- No runtime dependencies
- Generated code inlined at compile time

## Security Considerations

### API Key Security
- Never commit `.env` file
- Use environment variables
- Rotate keys regularly
- Monitor API usage

### Generated Code Security
- No validation of AI output
- Potential for malicious code
- Review generated code
- Use in trusted environments only
