# Product Context

## Problem Statement
Modern web development has embraced "directives" like `'use client'` and `'use server'` in Next.js. This project asks: "If directives are the future, why not take it further?"

## Solution
A Babel plugin that uses a `'use ai'` directive to generate function implementations at compile time using AI.

## User Experience

### Developer Workflow
1. Write function signature with `'use ai'` directive
2. Run Babel build
3. AI generates implementation
4. Result is cached for future builds
5. Function is ready to use

### Example Usage
```typescript
function isPalindrome(str: string): boolean {
  'use ai' // temperature=0.3
  throw new Error('Not implemented')
}
```

After compilation:
```typescript
function isPalindrome(str: string): boolean {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}
```

## Value Proposition

### For Lazy Developers
- Write signatures, get implementations
- No need to implement simple utility functions
- Fast iteration on boilerplate code

### For Troll Projects
- Perfect commentary on modern web dev trends
- Actually works (surprisingly well)
- Great conversation starter

### For Learning
- Demonstrates Babel plugin development
- Shows AI SDK integration
- Example of compile-time code generation

## User Personas

### "The Troll"
- Wants to make a point about modern web development
- Appreciates ironic commentary
- Won't actually use this in production

### "The Lazy Developer"
- Hates writing boilerplate
- Willing to try experimental tools
- Might actually use this for simple utils

### "The Curious"
- Wants to see how it works
- Interested in Babel plugins
- Learning about AI code generation

## Key Differentiators
- Compile-time generation (not runtime)
- Smart caching (no repeated API calls)
- Per-function configuration
- Actually works for simple cases
- Tongue-in-cheek documentation
