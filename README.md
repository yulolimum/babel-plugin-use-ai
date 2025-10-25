# babel-plugin-use-ai

> ⚠️ **WARNING**: This is a terrible idea and you absolutely should not use this in production. Or anywhere, really. Also this was vibe-coded so nothing probably works anyways..

A Babel plugin that lets AI write your functions for you. Because why write code yourself when you can let a language model hallucinate implementations based on function declarations marked as "use ai"?

## Why This Exists

Next.js says "directives are the future" with their `'use client'` and `'use workflow'` nonsense. Sure... If directives are the future, then why not take it to its logical conclusion?

This is a project demonstrating that you can, in fact, use AI to generate function implementations at compile time via directives. Should you? Absolutely not. Will it work? Sometimes. Is it cursed? Extremely.

Think of it as a commentary on the state of modern development. Or don't think about it at all. That's probably safer.

## Installation

Install directly from GitHub (because this definitely shouldn't be on npm):

```bash
npm install git@github.com:yulolimum/babel-plugin-use-ai.git
```

You'll also need `@babel/core`:

```bash
npm install --save-dev @babel/core
```

## Setup

1. Get an [OpenRouter](https://openrouter.ai/) API key
2. Create a `.env` file, or add to your existing one:

```env
OPENROUTER_API_KEY=your-key-here
```

3. Configure Babel:

```javascript
// babel.config.js
export default {
  plugins: [
    ['use-ai', {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: 'anthropic/claude-haiku-4.5',
      temperature: 0.7,
    }]
  ]
}
```

## Usage

Write a function signature with `'use ai'`:

```typescript
function isPalindrome(str: string): boolean {
  'use ai'
  throw new Error('Not implemented')
}
```

Run Babel. The AI will generate the implementation. It might even be correct.

### Per-Function Options

Override defaults with inline comments:

```typescript
function shuffleArray<T>(arr: T[]): T[] {
  'use ai'
  // temperature=0.5
  // model=anthropic/claude-sonnet-4
  // seed=42
  // instructions=Use the Fisher-Yates shuffle algorithm
  throw new Error('Not implemented')
}
```

Available options:
- `temperature` - Controls randomness (0.0 to 1.0)
- `model` - Override the default AI model
- `seed` - For reproducible outputs
- `instructions` - Additional context for the AI

## How It Works

1. Babel finds functions with `'use ai'`
2. Sends the signature to OpenRouter
3. AI generates code
4. Code gets cached (so you don't burn through your API credits)
5. Babel replaces your function body

## Caching

Results are cached in `.ai-cache.json`. This file **should be committed** to your repo so your team can share the generated implementations without hitting the API repeatedly.

The cache automatically invalidates when function signatures or metadata change.

## Should You Use This?

No.

## But What If I Really Want To?

Still no.

## Okay But Hypothetically...

Fine. It actually works pretty well for simple utility functions. The caching means you're not constantly hitting the API. And it's kind of fun to watch AI write your code.

Just don't blame me when it generates `rm -rf /` or something.

## License

MIT - Use at your own risk. Seriously.
