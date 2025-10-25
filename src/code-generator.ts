import type { FunctionCache } from "./cache";
import type { Metadata } from "./prompt-builder";
import { syncHttpRequest } from "./sync-http";

export function generateFunctionBody(
	prompt: string,
	metadata: Metadata,
	apiKey: string,
	cache: FunctionCache,
	functionSignature: string,
): string {
	const cached = cache.get(functionSignature, metadata);
	if (cached) {
		return cached;
	}

	const model = metadata.model || "openai/gpt-4-turbo";
	const requestBody: Record<string, any> = {
		model,
		messages: [
			{
				role: "user",
				content: prompt,
			},
		],
		temperature: metadata.temperature ?? 0.7,
	};

	if (metadata.seed !== undefined) {
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
				"X-Title": "babel-plugin-use-ai",
			},
			body: JSON.stringify(requestBody),
		},
	);

	const data = JSON.parse(response);

	if (!data.choices?.[0]?.message?.content) {
		throw new Error(
			`Invalid response from OpenRouter API: ${JSON.stringify(data)}`,
		);
	}

	const generatedCode = data.choices[0].message.content.trim();
	cache.set(functionSignature, metadata, generatedCode);

	return generatedCode;
}
