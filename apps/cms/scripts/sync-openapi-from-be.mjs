/**
 * BE `JABACK/openapi/backend.openapi.json` → CMS `openapi/backend.openapi.json`
 *
 *   node scripts/sync-openapi-from-be.mjs
 *   BE_OPENAPI=/path/to/backend.openapi.json node scripts/sync-openapi-from-be.mjs
 */
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cmsRoot = join(__dirname, '..')
const feBackendPath = join(cmsRoot, 'openapi/backend.openapi.json')
const defaultBePath = resolve(cmsRoot, '../../../../backend/JABACK/openapi/backend.openapi.json')
const bePath = process.env.BE_OPENAPI ? resolve(process.env.BE_OPENAPI) : defaultBePath

if (!existsSync(bePath)) {
  console.error(`BE OpenAPI not found: ${bePath}`)
  process.exit(1)
}

copyFileSync(bePath, feBackendPath)
console.log(`Synced ${bePath} → ${feBackendPath}`)
