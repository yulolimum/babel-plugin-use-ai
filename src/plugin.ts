import { createRequire } from "node:module";
import generate from "@babel/generator";
import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { FunctionCache } from "./cache";
import { generateFunctionBody } from "./code-generator";
import type { Metadata } from "./prompt-builder";
import { buildPrompt } from "./prompt-builder";

const require = createRequire(import.meta.url);

export interface PluginOptions {
	apiKey?: string;
	model?: string;
	temperature?: number;
}

export default function babelPluginUseAi(
	_babelApi: any,
	options: PluginOptions = {},
) {
	const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error(
			"babel-plugin-use-ai: apiKey is required. Pass it via options or set OPENROUTER_API_KEY environment variable.",
		);
	}

	const pluginOptions = {
		apiKey,
		model: options.model || "openai/gpt-4-turbo",
		temperature: options.temperature ?? 0.7,
	};

	const cache = new FunctionCache();

	return {
		name: "babel-plugin-use-ai",
		visitor: {
			FunctionExpression(path: NodePath<t.FunctionExpression>) {
				// console.info("FunctionExpression", path.node)
				const body = path.node.body;
				const parentPath = path.parentPath;
				const sourceString = parentPath?.getSource();

				let fallbackSourceString = "";

				const startLOC = path.node.loc?.start;
				const endLOC = path.node.loc?.end;

				const code = path.hub.getCode();

				if (startLOC && endLOC && code) {
					const codeLines = code.split("\n");
					const extractedLines = codeLines.slice(
						startLOC.line - 1,
						endLOC.line,
					);

					if (extractedLines.length > 0) {
						extractedLines[0] = extractedLines[0].slice(startLOC.column);
						extractedLines[extractedLines.length - 1] = extractedLines[
							extractedLines.length - 1
						].slice(0, endLOC.column);
						fallbackSourceString = extractedLines.join("\n");
					}
				}

				if (!body) return;
				if (!sourceString && !fallbackSourceString) return;
				if (!hasUseAiDirective(body)) return;

				const metadata = extractMetadataFromDirective(body);

				processUseAiDirective(
					{
						body,
						sourceString: sourceString || fallbackSourceString,
						metadata,
					},
					pluginOptions as Required<PluginOptions>,
					cache,
				);
			},
			ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
				// console.info("ArrowFunctionExpression", path.node)
				const body = path.node.body;
				const parentPath = path.parentPath.parentPath;
				const sourceString = parentPath?.getSource();

				if (!body) return;
				if (!t.isBlockStatement(body)) return;
				if (!sourceString) return;
				if (!hasUseAiDirective(body)) return;

				const metadata = extractMetadataFromDirective(body);

				processUseAiDirective(
					{ body, sourceString, metadata },
					pluginOptions as Required<PluginOptions>,
					cache,
				);
			},
			ObjectMethod(path: NodePath<t.ObjectMethod>) {
				// console.info("ObjectMethod", path.node)
				const body = path.node.body;
				const sourceString = path.getSource();

				if (!body) return;
				if (!sourceString) return;
				if (!hasUseAiDirective(body)) return;

				const metadata = extractMetadataFromDirective(body);

				processUseAiDirective(
					{ body, sourceString, metadata },
					pluginOptions as Required<PluginOptions>,
					cache,
				);
			},
			FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
				// console.info("FunctionDeclaration", path.node)
				const body = path.node.body;
				const sourceString = path.getSource();

				if (!body) return;
				if (!sourceString) return;
				if (!hasUseAiDirective(body)) return;

				const metadata = extractMetadataFromDirective(body);

				processUseAiDirective(
					{ body, sourceString, metadata },
					pluginOptions as Required<PluginOptions>,
					cache,
				);
			},
		},
	};
}

function hasUseAiDirective(body: t.BlockStatement): boolean {
	if (!body?.directives || body.directives.length === 0) return false;

	return body.directives.some(
		(directive) => (directive as any).value.value === "use ai",
	);
}

function extractMetadataFromDirective(body: t.BlockStatement): Metadata {
	if (!body || !body.body || body.body.length === 0) {
		return {};
	}

	const firstStatement = body.body[0];
	if (!firstStatement || !firstStatement.leadingComments) {
		return {};
	}

	const metadata: Metadata = {};

	for (const comment of firstStatement.leadingComments) {
		const commentText = comment.value.trim();
		const match = commentText.match(/^\s*(\w+)\s*=\s*(.+)$/);

		if (!match) {
			continue;
		}

		const [, key, rawValue] = match;
		const value = rawValue.trim().replace(/^["']|["']$/g, "");

		if (key === "temperature" || key === "seed") {
			metadata[key as keyof Metadata] = Number.isNaN(Number(value))
				? (value as any)
				: parseFloat(value);
		} else if (key === "instructions") {
			metadata.instructions = value;
		} else if (key === "model") {
			metadata.model = value;
		}
	}

	return metadata;
}

function processUseAiDirective(
	info: {
		body: t.BlockStatement;
		sourceString: string;
		metadata: Metadata;
	},
	pluginOptions: Required<PluginOptions>,
	cache: FunctionCache,
): void {
	const { body, sourceString, metadata } = info;

	const mergedMetadata: Metadata = {
		...metadata,
		model: metadata.model || pluginOptions.model,
		temperature: metadata.temperature ?? pluginOptions.temperature,
	};

	const prompt = buildPrompt(sourceString, mergedMetadata);
	let generatedBody = generateFunctionBody(
		prompt,
		mergedMetadata,
		pluginOptions.apiKey,
		cache,
		sourceString,
	);

	generatedBody = generatedBody
		.replace(/```(?:typescript|javascript|ts|js)?\n?/g, "")
		.replace(/```\n?/g, "");

	const bodyAst = parseBodyToAst(generatedBody);
	body.body = bodyAst;
	body.directives = [];
}

function parseBodyToAst(bodyString: string): t.Statement[] {
	const parser = require("@babel/parser");
	const ast = parser.parse(`(function() { ${bodyString} })`, {
		sourceType: "module",
		plugins: ["typescript"],
	});

	const functionExpr = ast.program.body[0].expression;
	const blockStatement = functionExpr.body;

	return blockStatement.body;
}
