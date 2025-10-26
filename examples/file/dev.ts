import * as babel from '@babel/core'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({
  path: path.resolve(__dirname, '.env')
})

async function main() {
  const inputPath = path.join(__dirname, 'example.ts')
  const code = fs.readFileSync(inputPath, 'utf-8')

  // console.log('📄 Input code:')
  // console.log(code)
  // console.log('\n' + '='.repeat(60) + '\n')

  try {
    const result = await babel.transformFileAsync(inputPath, {
      configFile: path.join(__dirname, 'babel.config.js')
    })

    // console.log('\n' + '='.repeat(60))
    // console.log('✨ Generated code:')
    // console.log(result?.code || '')

    const outputPath = path.join(__dirname, 'dist', 'example.ts')
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true })
    fs.writeFileSync(outputPath, result?.code || '')
    console.log('\n✅ Output written to examples/file/dist/example.ts')
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
