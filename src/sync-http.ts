import { execSync } from "node:child_process";

export interface SyncHttpOptions {
	method: string;
	headers: Record<string, string>;
	body?: string;
}

export function syncHttpRequest(
	url: string,
	options: SyncHttpOptions,
): string {
	const { method, headers, body } = options;

	// Build curl command
	const headerArgs = Object.entries(headers)
		.map(([key, value]) => `-H "${key}: ${value}"`)
		.join(" ");

	const bodyArg = body ? `-d '${body.replace(/'/g, "'\\''")}'` : "";

	const curlCommand = `curl -s -X ${method} "${url}" ${headerArgs} ${bodyArg}`;

	try {
		const response = execSync(curlCommand, {
			encoding: "utf-8",
			maxBuffer: 10 * 1024 * 1024, // 10MB buffer
		});
		return response;
	} catch (error) {
		throw new Error(
			`Sync HTTP request failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
