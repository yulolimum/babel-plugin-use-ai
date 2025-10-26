export interface Metadata {
	temperature?: number;
	seed?: number;
	instructions?: string;
	model?: string;
}

export function buildPrompt(
	functionCode: string,
	metadata: Metadata = {},
): string {
	const basePrompt = `You are a code generation assistant. Generate a function body for the following function:

${functionCode}

Requirements:
- Implement the function according to its name (if it exists) and type signature
- The function name describes what it should do. If the function name is not provided, infer the purpose from the parameters, type, and/or instructions.
  - If you have no idea what the function is suppose to do, throw an error with the message "Babel Use-AI: Unable to infer function purpose".
- Must return the correct type (use 'return' statement for non-void functions)
- No side effects unless implied by the name
- Valid TypeScript/JavaScript
- No comments in the generated code
- No console.log or debugging statements

${metadata.instructions ? `Additional instructions: ${metadata.instructions}` : ""}

Generate ONLY the function body code (no outer braces, no function declaration).
DO NOT wrap your response in code blocks (no \`\`\`typescript, \`\`\`javascript, or \`\`\`).
Return raw code only.

Examples for different function types:

1. Function Declaration:
   function add(a, b) { ... }
   Body: return a + b;

2. Function Expression:
   const add = function(a, b) { ... }
   Body: return a + b;

3. Arrow Function:
   const add = (a, b) => { ... }
   Body: return a + b;

4. Object Method:
   { add(a, b) { ... } }
   Body: return a + b;

5. Void function (no return needed):
   function log(msg) { ... }
   Body: console.log(msg);

CRITICAL: All non-void functions MUST include 'return' statement.`;

	// console.info("Generated prompt:\n", basePrompt);

	return basePrompt;
}

export function extractMetadata(leadingComments: any[] | undefined): Metadata {
	if (!leadingComments || leadingComments.length === 0) {
		return {};
	}

	const lastComment = leadingComments[leadingComments.length - 1];
	const commentText = lastComment.value;

	const metadataMatch = commentText.match(/@ai\s+(.+)/);
	if (!metadataMatch) {
		return {};
	}

	const metadata: Metadata = {};
	const pairs = metadataMatch[1].split(",").map((s: string) => s.trim());

	for (const pair of pairs) {
		const [key, value] = pair.split("=").map((s: string) => s.trim());
		if (key === "temperature" || key === "seed") {
			metadata[key as keyof Metadata] = Number.isNaN(Number(value))
				? (value as any)
				: parseFloat(value);
		} else if (key === "instructions") {
			metadata.instructions = value.replace(/^["']|["']$/g, "");
		} else if (key === "model") {
			metadata.model = value;
		}
	}

	return metadata;
}
