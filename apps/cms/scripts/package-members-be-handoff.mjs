#!/usr/bin/env node
/**
 * Copy members API handoff markdown (+ optional OpenAPI) for offline BE delivery.
 *
 * Usage (from repo root or apps/cms):
 *   pnpm --filter cms package:members-be-handoff
 *   pnpm --filter cms package:members-be-handoff -- --full --openapi
 *   pnpm --filter cms package:members-be-handoff -- --out=/path/to/zip-root
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cmsRoot = path.resolve(__dirname, '..')
const docsDir = path.join(cmsRoot, 'docs/api/members')
const bundleTemplateDir = path.join(docsDir, 'be-handoff-bundle')

const args = process.argv.slice(2)
const full = args.includes('--full')
const withOpenApi = args.includes('--openapi') || full
const outArg = args.find(a => a.startsWith('--out='))
const date = new Date().toISOString().slice(0, 10)
const defaultOut = path.join(cmsRoot, 'dist', `members-be-handoff-${date}`)
const outDir = outArg ? path.resolve(outArg.slice('--out='.length)) : defaultOut

const coreFiles = [
  'members-api-backend-handoff-2026-07-23.md',
  'members-pre-register-handover-2026-07-28.md',
  'e2e-members-pre-register-handoff-2026-07-23.md',
]

const fullFiles = [
  'members-api-integration-2026-07-23.md',
  'members-api-backend-gaps-2026-07-23.md',
  'members-api-detail-missing-endpoints-handoff-2026-06-26.md',
]

const toCopy = [...coreFiles, ...(full ? fullFiles : [])]

if (!fs.existsSync(docsDir)) {
  console.error('Missing docs dir:', docsDir)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

for (const name of toCopy) {
  const src = path.join(docsDir, name)
  if (!fs.existsSync(src)) {
    console.error('Missing source:', src)
    process.exit(1)
  }
  fs.copyFileSync(src, path.join(outDir, name))
}

const readmeBe = path.join(bundleTemplateDir, 'README-BE.md')
if (!fs.existsSync(readmeBe)) {
  console.error('Missing template:', readmeBe)
  process.exit(1)
}
fs.copyFileSync(readmeBe, path.join(outDir, 'README.md'))

if (withOpenApi) {
  const oasSrc = path.join(cmsRoot, 'openapi/members.openapi.json')
  if (fs.existsSync(oasSrc)) {
    const oasDir = path.join(outDir, 'openapi')
    fs.mkdirSync(oasDir, { recursive: true })
    fs.copyFileSync(oasSrc, path.join(oasDir, 'members.openapi.json'))
  } else {
    console.warn('Warn: openapi/members.openapi.json not found — run filter:openapi:members if needed')
  }
}

const parent = path.dirname(outDir)
const base = path.basename(outDir)
console.log('')
console.log('Members BE handoff package ready:')
console.log(' ', outDir)
console.log('')
console.log('Files:', toCopy.join(', '), '+ README.md', withOpenApi ? '+ openapi/members.openapi.json' : '')
console.log('')
console.log('Zip example:')
console.log(`  cd "${parent}" && zip -r "${base}.zip" "${base}"`)
console.log('')
