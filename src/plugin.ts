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

  const cache = new FunctionCache()
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
      return Promise.all(pendingOperations)
    },
  }
}

function isUseAiDirective(statement: t.Statement): boolean {
  if (!t.isExpressionStatement(statement)) {
    return false
  }

  const expr = statement.expression
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
  if (!body || !body.body || body.body.length === 0) {
    return {}
  }

  const firstStatement = body.body[0]
  if (!firstStatement || !firstStatement.leadingComments) {
    return {}
  }

  const metadata: Metadata = {}
  
  for (const comment of firstStatement.leadingComments) {
    const commentText = comment.value.trim()
    const match = commentText.match(/^\s*(\w+)\s*=\s*(.+)$/)
    
    if (!match) {
      continue
    }

    const [, key, rawValue] = match
    const value = rawValue.trim().replace(/^["']|["']$/g, '')

    if (key === 'temperature' || key === 'seed') {
      metadata[key as keyof Metadata] = isNaN(Number(value))
        ? (value as any)
        : parseFloat(value)
    } else if (key === 'instructions') {
      metadata.instructions = value
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
  
  const sourceCode = path.getSource()
  const signatureMatch = sourceCode.match(/^[^{]+/)
  const functionSignature = signatureMatch ? signatureMatch[0].trim() : sourceCode
  
  const mergedMetadata: Metadata = {
    ...metadata,
    model: metadata.model || pluginOptions.model,
    temperature: metadata.temperature ?? pluginOptions.temperature,
  }

  const prompt = buildPrompt(functionSignature, mergedMetadata)

  try {
    let generatedBody = await generateFunctionBody(
      prompt,
      mergedMetadata,
      pluginOptions.apiKey,
      cache,
      functionSignature
    )
    
    generatedBody = generatedBody.replace(/```(?:typescript|javascript|ts|js)?\n?/g, '').replace(/```\n?/g, '')

    const bodyAst = parseBodyToAst(generatedBody)
    node.body.body = bodyAst
    node.body.directives = []
  } catch (error) {
    throw error
  }
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
    throw error
  }
}
