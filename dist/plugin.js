import '@babel/types';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';

// src/plugin.ts

// src/prompt-builder.ts
function buildPrompt(functionCode, metadata = {}) {
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

${metadata.instructions ? `Additional instructions: ${metadata.instructions}` : ""}

Generate ONLY the function body code (no outer braces, no function declaration).
Example:
for (let i = 0; i < arr.length; i++) {
  // code here
}
return result`;
  return basePrompt;
}
async function generateFunctionBody(prompt, metadata = {}, apiKey, cache, functionSignature) {
  if (cache && functionSignature) {
    const cached = cache.get(functionSignature, metadata);
    if (cached) {
      return cached;
    }
  }
  const key = apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OpenRouter API key is required");
  }
  const openrouter = createOpenRouter({ apiKey: key });
  const model = openrouter(metadata.model || "openai/gpt-4-turbo");
  const options = {
    temperature: metadata.temperature ?? 0.7
  };
  if (metadata.seed !== void 0) {
    options.seed = metadata.seed;
  }
  try {
    const { text } = await generateText({
      model,
      prompt,
      ...options
    });
    const generatedCode = text.trim();
    if (cache && functionSignature) {
      cache.set(functionSignature, metadata, generatedCode);
    }
    return generatedCode;
  } catch (error) {
    throw error;
  }
}
var FunctionCache = class {
  constructor(cacheFilePath = ".ai-cache.json") {
    this.cachePath = path.resolve(process.cwd(), cacheFilePath);
    this.cache = this.loadCache();
  }
  loadCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const data = fs.readFileSync(this.cachePath, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
    }
    return {};
  }
  saveCache() {
    try {
      fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2), "utf-8");
    } catch (error) {
    }
  }
  generateKey(signature, metadata) {
    const data = JSON.stringify({ signature, metadata });
    return crypto.createHash("sha256").update(data).digest("hex");
  }
  get(signature, metadata) {
    const key = this.generateKey(signature, metadata);
    const entry = this.cache[key];
    if (entry) {
      return entry.generatedCode;
    }
    return null;
  }
  set(signature, metadata, generatedCode) {
    const key = this.generateKey(signature, metadata);
    this.cache[key] = {
      signature,
      metadata,
      generatedCode,
      timestamp: Date.now()
    };
    this.saveCache();
  }
  clear() {
    this.cache = {};
    this.saveCache();
  }
  size() {
    return Object.keys(this.cache).length;
  }
};
var require2 = createRequire(import.meta.url);
function babelPluginUseAi(_babelApi, options = {}) {
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "babel-plugin-use-ai: apiKey is required. Pass it via options or set OPENROUTER_API_KEY environment variable."
    );
  }
  const pluginOptions = {
    apiKey,
    model: options.model || "openai/gpt-4-turbo",
    temperature: options.temperature ?? 0.7
  };
  const cache = new FunctionCache();
  const pendingOperations = [];
  return {
    name: "babel-plugin-use-ai",
    visitor: {
      FunctionDeclaration(path2) {
        const node = path2.node;
        const body = node.body;
        if (!body || body.body.length === 0 && (!body.directives || body.directives.length === 0)) {
          return;
        }
        let foundDirective = false;
        if (body.directives) {
          for (const directive of body.directives) {
            if (directive.value.value === "use ai") {
              foundDirective = true;
              break;
            }
          }
        }
        if (!foundDirective) {
          return;
        }
        const operation = handleUseAiFunction(
          path2,
          pluginOptions,
          cache
        );
        pendingOperations.push(operation);
      }
    },
    post() {
      return Promise.all(pendingOperations);
    }
  };
}
function extractMetadataFromDirective(body) {
  if (!body || !body.directives || body.directives.length === 0) {
    return {};
  }
  let useAiDirective = null;
  for (const directive of body.directives) {
    if (directive.value.value === "use ai") {
      useAiDirective = directive;
      break;
    }
  }
  if (!useAiDirective) {
    return {};
  }
  const trailingComments = useAiDirective.trailingComments;
  if (!trailingComments || trailingComments.length === 0) {
    return {};
  }
  const comment = trailingComments[0];
  const commentText = comment.value.trim();
  const metadata = {};
  const pairs = commentText.split(",").map((s) => s.trim());
  for (const pair of pairs) {
    const [key, value] = pair.split("=").map((s) => s.trim());
    if (key === "temperature" || key === "seed") {
      metadata[key] = isNaN(Number(value)) ? value : parseFloat(value);
    } else if (key === "instructions") {
      metadata.instructions = value.replace(/^["']|["']$/g, "");
    } else if (key === "model") {
      metadata.model = value;
    }
  }
  return metadata;
}
async function handleUseAiFunction(path2, pluginOptions, cache) {
  const node = path2.node;
  const metadata = extractMetadataFromDirective(node.body);
  const sourceCode = path2.getSource();
  const signatureMatch = sourceCode.match(/^[^{]+/);
  const functionSignature = signatureMatch ? signatureMatch[0].trim() : sourceCode;
  const mergedMetadata = {
    ...metadata,
    model: metadata.model || pluginOptions.model,
    temperature: metadata.temperature ?? pluginOptions.temperature
  };
  const prompt = buildPrompt(functionSignature, mergedMetadata);
  try {
    let generatedBody = await generateFunctionBody(
      prompt,
      mergedMetadata,
      pluginOptions.apiKey,
      cache,
      functionSignature
    );
    generatedBody = generatedBody.replace(/```(?:typescript|javascript|ts|js)?\n?/g, "").replace(/```\n?/g, "");
    const bodyAst = parseBodyToAst(generatedBody);
    node.body.body = bodyAst;
    node.body.directives = [];
  } catch (error) {
    throw error;
  }
}
function parseBodyToAst(bodyString) {
  const parser = require2("@babel/parser");
  try {
    const ast = parser.parse(`(function() { ${bodyString} })`, {
      sourceType: "module",
      plugins: ["typescript"]
    });
    const functionExpr = ast.program.body[0].expression;
    const blockStatement = functionExpr.body;
    return blockStatement.body;
  } catch (error) {
    throw error;
  }
}

export { babelPluginUseAi as default };
//# sourceMappingURL=plugin.js.map
//# sourceMappingURL=plugin.js.map