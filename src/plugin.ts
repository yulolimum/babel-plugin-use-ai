import * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'
import { buildPrompt, extractMetadata } from './prompt-builder'
import { generateFunctionBody } from './code-generator'
import type { Metadata } from './prompt-builder'
import { FunctionCache } from './cache'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export interface PluginOptions {
  apiKey?: string
  model?: string
  temperature?: number
}

export default function babelPluginUseAi(
  _babelApi: any,
  options: PluginOptions = {}
) {
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error(
      'babel-plugin-use-ai: apiKey is required. Pass it via options or set OPENROUTER_API_KEY environment variable.'
    )
  }

  const pluginOptions = {
    apiKey,
    model: options.model || 'openai/gpt-4-turbo',
    temperature: options.temperature ?? 0.7,
  }

  // Initialize cache
  const cache = new FunctionCache()

  // Store pending async operations
  const pendingOperations: Promise<void>[] = []

  return {
    name: 'babel-plugin-use-ai',
    visitor: {
      FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
        const node = path.node
        const body = node.body
        
        if (!body || (body.body.length === 0 && (!body.directives || body.directives.length === 0))) {
          return
        }

        // Check for 'use ai' in directives array (Babel treats string literals at start of function as directives)
        let foundDirective = false
        if (body.directives) {
          for (const directive of body.directives) {
            if ((directive as any).value.value === 'use ai') {
              foundDirective = true
              break
            }
          }
        }

        if (!foundDirective) {
          return
        }

        const operation = handleUseAiFunction(
          path,
          pluginOptions as Required<PluginOptions>,
          cache
        )
        pendingOperations.push(operation)
      },
    },
    post() {
      // Wait for all async operations to complete before finishing
      return Promise.all(pendingOperations)
    },
  }
}

function isUseAiDirective(statement: t.Statement): boolean {
  if (!t.isExpressionStatement(statement)) {
    return false
  }

  const expr = statement.expression
  
  // Handle both StringLiteral and TSAsExpression wrapping a StringLiteral
  let stringLiteral: t.StringLiteral | null = null
  
  if (t.isStringLiteral(expr)) {
    stringLiteral = expr
  } else if (t.isTSAsExpression(expr) && t.isStringLiteral(expr.expression)) {
    stringLiteral = expr.expression
  }

  if (!stringLiteral) {
    return false
  }

  return stringLiteral.value === 'use ai'
}

function extractMetadataFromDirective(body: t.BlockStatement): Metadata {
  if (!body || !body.directives || body.directives.length === 0) {
    return {}
  }

  // Find the 'use ai' directive
  let useAiDirective: any = null
  for (const directive of body.directives) {
    if ((directive as any).value.value === 'use ai') {
      useAiDirective = directive
      break
    }
  }

  if (!useAiDirective) {
    return {}
  }

  // Look for trailing comment on the directive
  const trailingComments = useAiDirective.trailingComments
  if (!trailingComments || trailingComments.length === 0) {
    return {}
  }

  const comment = trailingComments[0]
  const commentText = comment.value.trim()

  // Parse key=value pairs (no @ai prefix needed)
  const metadata: Metadata = {}
  const pairs = commentText.split(',').map((s: string) => s.trim())

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

async function handleUseAiFunction(
  path: NodePath<t.FunctionDeclaration>,
  pluginOptions: Required<PluginOptions>,
  cache: FunctionCache
): Promise<void> {
  const node = path.node
  const metadata = extractMetadataFromDirective(node.body)

  // Get the actual function signature
  const signature = extractFunctionSignature(node)
  const params = signature.params.map(p => `${p.name}: ${p.type}`).join(', ')
  const functionCode = `function ${signature.name}(${params}): ${signature.returnType}`

  // Merge plugin options with inline metadata (inline takes precedence)
  const mergedMetadata: Metadata = {
    ...metadata,
    model: metadata.model || pluginOptions.model,
    temperature: metadata.temperature ?? pluginOptions.temperature,
  }

  const prompt = buildPrompt(functionCode, mergedMetadata)

  console.log(`🤖 Generating: ${node.id?.name}`)

  try {
    let generatedBody = await generateFunctionBody(
      prompt,
      mergedMetadata,
      pluginOptions.apiKey,
      cache,
      functionCode
    )
    
    // Clean up markdown code fences if present
    generatedBody = generatedBody.replace(/```(?:typescript|javascript|ts|js)?\n?/g, '').replace(/```\n?/g, '')

    const bodyAst = parseBodyToAst(generatedBody)
    node.body.body = bodyAst
    node.body.directives = [] // Remove directives
  } catch (error) {
    console.error(
      `❌ Failed to generate ${node.id?.name}:`,
      error instanceof Error ? error.message : String(error)
    )
    throw error
  }
}

function extractFunctionSignature(node: t.FunctionDeclaration) {
  const name = node.id?.name || 'anonymous'
  const params = node.params.map((param) => {
    let type = 'any'
    if (param.type === 'Identifier' && 'typeAnnotation' in param) {
      const typeAnnotation = (param as any).typeAnnotation
      if (typeAnnotation) {
        type = typeAnnotationToString(typeAnnotation.typeAnnotation)
      }
    }
    return {
      name: (param as any).name || 'param',
      type,
    }
  })

  let returnType = 'any'
  if (node.returnType && 'typeAnnotation' in node.returnType) {
    returnType = typeAnnotationToString((node.returnType as any).typeAnnotation)
  }

  return {
    name,
    params,
    returnType,
  }
}

function typeAnnotationToString(typeAnnotation: any): string {
  if (t.isIdentifier(typeAnnotation)) {
    return typeAnnotation.name
  }

  if (typeAnnotation.type === 'GenericTypeAnnotation' && typeAnnotation.id) {
    const base = typeAnnotation.id.name
    if (typeAnnotation.typeParameters) {
      const params = typeAnnotation.typeParameters.params
        .map((p: any) => typeAnnotationToString(p))
        .join(', ')
      return `${base}<${params}>`
    }
    return base
  }

  if (t.isArrayTypeAnnotation(typeAnnotation)) {
    const elementType = typeAnnotationToString(typeAnnotation.elementType)
    return `${elementType}[]`
  }

  if (t.isUnionTypeAnnotation(typeAnnotation)) {
    return typeAnnotation.types
      .map((t: any) => typeAnnotationToString(t))
      .join(' | ')
  }

  return 'any'
}

function parseBodyToAst(bodyString: string): t.Statement[] {
  const parser = require('@babel/parser')

  try {
    const ast = parser.parse(`(function() { ${bodyString} })`, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    const functionExpr = ast.program.body[0].expression
    const blockStatement = functionExpr.body

    return blockStatement.body
  } catch (error) {
    console.error(
      'Failed to parse generated body:',
      error instanceof Error ? error.message : String(error)
    )
    throw error
  }
}
