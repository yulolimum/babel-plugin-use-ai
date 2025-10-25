import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "./prompt-builder";

export interface CacheEntry {
	signature: string;
	metadata: Metadata;
	generatedCode: string;
	timestamp: number;
}

export interface Cache {
	[key: string]: CacheEntry;
}

export class FunctionCache {
	private cachePath: string;
	private cache: Cache;

	constructor(cacheFilePath: string = ".ai-cache.json") {
		this.cachePath = path.resolve(process.cwd(), cacheFilePath);
		this.cache = this.loadCache();
	}

	private loadCache(): Cache {
		try {
			if (fs.existsSync(this.cachePath)) {
				const data = fs.readFileSync(this.cachePath, "utf-8");
				return JSON.parse(data);
			}
		} catch (_error) {}
		return {};
	}

	private saveCache(): void {
		try {
			fs.writeFileSync(
				this.cachePath,
				JSON.stringify(this.cache, null, 2),
				"utf-8",
			);
		} catch (_error) {}
	}

	private generateKey(signature: string, metadata: Metadata): string {
		const data = JSON.stringify({ signature, metadata });
		return crypto.createHash("sha256").update(data).digest("hex");
	}

	get(signature: string, metadata: Metadata): string | null {
		const key = this.generateKey(signature, metadata);
		const entry = this.cache[key];

		if (entry) {
			return entry.generatedCode;
		}

		return null;
	}

	set(signature: string, metadata: Metadata, generatedCode: string): void {
		const key = this.generateKey(signature, metadata);
		this.cache[key] = {
			signature,
			metadata,
			generatedCode,
			timestamp: Date.now(),
		};
		this.saveCache();
	}

	clear(): void {
		this.cache = {};
		this.saveCache();
	}

	size(): number {
		return Object.keys(this.cache).length;
	}
}
