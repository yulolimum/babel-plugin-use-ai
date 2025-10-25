module.exports = (api) => {
	api.cache(true);
	return {
		presets: ["babel-preset-expo"],
		plugins: [
			[
				"use-ai",
				{
					apiKey: process.env.OPENROUTER_API_KEY,
					model: "anthropic/claude-haiku-4.5",
					temperature: 0.7,
				},
			],
		],
	};
};
