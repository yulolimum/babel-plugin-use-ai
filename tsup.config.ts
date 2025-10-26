import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/plugin.ts"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	sourcemap: true,
	external: [
		"@babel/core",
		"@babel/types",
		"@babel/traverse",
		"@babel/parser",
		"@babel/generator",
	],
	splitting: false,
	treeshake: true,
	outDir: "dist",
});
