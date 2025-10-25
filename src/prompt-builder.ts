export interface Metadata {
  temperature?: number
  seed?: number
  instructions?: string
  model?: string
}

export function buildPrompt(
  functionCode: string,
  metadata: Metadata = {}
): string {
  const basePrompt = `You are a code generation assistant. Generate a function body for the following function:

${functionCode}

Requirements:
- Implement the function according to its name and type signature
- The function name describes what it should do
- Must return the correct type
- No side effects unless implied by the name
- Valid TypeScript/JavaScript
- No comments in the generated code
- No console.log or debugging statements

${metadata.instructions ? `Additional instructions: ${metadata.instructions}` : ''}

Generate ONLY the function body code (no outer braces, no function declaration).
Example:
for (let i = 0; i < arr.length; i++) {
  // code here
}
return result`

  return basePrompt
}

export function extractMetadata(leadingComments: any[] | undefined): Metadata {
  if (!leadingComments || leadingComments.length === 0) {
    return {}
  }

  const lastComment = leadingComments[leadingComments.length - 1]
  const commentText = lastComment.value

  const metadataMatch = commentText.match(/@ai\s+(.+)/)
  if (!metadataMatch) {
    return {}
  }

  const metadata: Metadata = {}
  const pairs = metadataMatch[1].split(',').map((s: string) => s.trim())

  for (const pair of pairs) {
    const [key, value] = pair.split('=').map((s: string) => s.trim())
    if (key === 'temperature' || key === 'seed') {
      metadata[key as keyof Metadata] = isNaN(Number(value))
        ? (value as any)
        : parseFloat(value)
    } else if (key === 'instructions') {
      metadata.instructions = value.replace(/^["']|["']$/g, '')
    } else if (key === 'model') {
      metadata.model = value
    }
  }

  return metadata
}
