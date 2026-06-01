import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url))

const envPaths = [
  process.env.DOTENV_CONFIG_PATH,
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(moduleDirectory, '../.env'),
].filter((envPath): envPath is string => Boolean(envPath))

for (const envPath of [...new Set(envPaths)]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
}
