import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import type { Metadata } from './prompt-builder'
import type { FunctionCache } from './cache'

export async function generateFunctionBody(
  prompt: string,
  metadata: Metadata = {},
  apiKey?: string,
  cache?: FunctionCache,
  functionSignature?: string
): Promise<string> {
  // Check cache first if available
  if (cache && functionSignature) {
    const cached = cache.get(functionSignature, metadata)
    if (cached) {
      return cached
    }
  }

  const key = apiKey || process.env.OPENROUTER_API_KEY
  if (!key) {
    throw new Error('OpenRouter API key is required')
  }

  const openrouter = createOpenRouter({ apiKey: key })
  const model = openrouter(metadata.model || 'openai/gpt-4-turbo')

  const options: Record<string, any> = {
    temperature: metadata.temperature ?? 0.7,
  }

  if (metadata.seed !== undefined) {
    options.seed = metadata.seed
  }

  try {
    const { text } = await generateText({
      model,
      prompt,
      ...options,
    })

    const generatedCode = text.trim()
    
    // Cache the result if cache is available
    if (cache && functionSignature) {
      cache.set(functionSignature, metadata, generatedCode)
    }

    return generatedCode
  } catch (error) {
    console.error('Failed to generate function body:', error instanceof Error ? error.message : String(error))
    throw error
  }
}
