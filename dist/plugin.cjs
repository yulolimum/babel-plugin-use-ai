'use strict';

var module$1 = require('module');
require('@babel/types');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var crypto__default = /*#__PURE__*/_interopDefault(crypto);
var fs__default = /*#__PURE__*/_interopDefault(fs);
var path__default = /*#__PURE__*/_interopDefault(path);

// src/plugin.ts
var FunctionCache = class {
  constructor(cacheFilePath = ".ai-cache.json") {
    this.cachePath = path__default.default.resolve(process.cwd(), cacheFilePath);
    this.cache = this.loadCache();
  }
  loadCache() {
    try {
      if (fs__default.default.existsSync(this.cachePath)) {
        const data = fs__default.default.readFileSync(this.cachePath, "utf-8");
        return JSON.parse(data);
      }
    } catch (_error) {
    }
    return {};
  }
  saveCache() {
    try {
      fs__default.default.writeFileSync(
        this.cachePath,
        JSON.stringify(this.cache, null, 2),
        "utf-8"
      );
    } catch (_error) {
    }
  }
  generateKey(signature, metadata) {
    const data = JSON.stringify({ signature, metadata });
    return crypto__default.default.createHash("sha256").update(data).digest("hex");
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
function syncHttpRequest(url, options) {
  const { method, headers, body } = options;
  const headerArgs = Object.entries(headers).map(([key, value]) => `-H "${key}: ${value}"`).join(" ");
  const bodyArg = body ? `-d '${body.replace(/'/g, "'\\''")}'` : "";
  const curlCommand = `curl -s -X ${method} "${url}" ${headerArgs} ${bodyArg}`;
  try {
    const response = child_process.execSync(curlCommand, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024
      // 10MB buffer
    });
    return response;
  } catch (error) {
    throw new Error(
      `Sync HTTP request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// src/code-generator.ts
function generateFunctionBody(prompt, metadata, apiKey, cache, functionSignature) {
  const cached = cache.get(functionSignature, metadata);
  if (cached) {
    return cached;
  }
  const model = metadata.model || "openai/gpt-4-turbo";
  const requestBody = {
    model,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: metadata.temperature ?? 0.7
  };
  if (metadata.seed !== void 0) {
    requestBody.seed = metadata.seed;
  }
  const response = syncHttpRequest(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/yulolimum/babel-plugin-use-ai",
        "X-Title": "babel-plugin-use-ai"
      },
      body: JSON.stringify(requestBody)
    }
  );
  const data = JSON.parse(response);
  if (!data.choices?.[0]?.message?.content) {
    throw new Error(
      `Invalid response from OpenRouter API: ${JSON.stringify(data)}`
    );
  }
  const generatedCode = data.choices[0].message.content.trim();
  cache.set(functionSignature, metadata, generatedCode);
  return generatedCode;
}

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

// src/plugin.ts
var require2 = module$1.createRequire((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('plugin.cjs', document.baseURI).href)));
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
        handleUseAiFunction(
          path2,
          pluginOptions,
          cache
        );
      }
    }
  };
}
function extractMetadataFromDirective(body) {
  if (!body || !body.body || body.body.length === 0) {
    return {};
  }
  const firstStatement = body.body[0];
  if (!firstStatement || !firstStatement.leadingComments) {
    return {};
  }
  const metadata = {};
  for (const comment of firstStatement.leadingComments) {
    const commentText = comment.value.trim();
    const match = commentText.match(/^\s*(\w+)\s*=\s*(.+)$/);
    if (!match) {
      continue;
    }
    const [, key, rawValue] = match;
    const value = rawValue.trim().replace(/^["']|["']$/g, "");
    if (key === "temperature" || key === "seed") {
      metadata[key] = Number.isNaN(Number(value)) ? value : parseFloat(value);
    } else if (key === "instructions") {
      metadata.instructions = value;
    } else if (key === "model") {
      metadata.model = value;
    }
  }
  return metadata;
}
function handleUseAiFunction(path2, pluginOptions, cache) {
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
  let generatedBody = generateFunctionBody(
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
}
function parseBodyToAst(bodyString) {
  const parser = require2("@babel/parser");
  const ast = parser.parse(`(function() { ${bodyString} })`, {
    sourceType: "module",
    plugins: ["typescript"]
  });
  const functionExpr = ast.program.body[0].expression;
  const blockStatement = functionExpr.body;
  return blockStatement.body;
}

module.exports = babelPluginUseAi;
//# sourceMappingURL=plugin.cjs.map
//# sourceMappingURL=plugin.cjs.map