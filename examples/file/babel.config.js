export default {
	plugins: [
		"@babel/plugin-transform-typescript",
		[
			"../../dist/plugin.js",
			{
				apiKey: process.env.OPENROUTER_API_KEY,
				model: "anthropic/claude-haiku-4.5",
				temperature: 0.7,
			},
		],
	],
};
