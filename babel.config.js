import dotenv from 'dotenv'

dotenv.config()

export default {
  plugins: [
    [
      './src/plugin.ts',
      {
        apiKey: process.env.OPENROUTER_API_KEY,
        model: 'anthropic/claude-haiku-4.5',
        temperature: 0.7,
      },
    ],
  ],
  parserOpts: {
    sourceType: 'module',
    plugins: ['typescript'],
  },
}
