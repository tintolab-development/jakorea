#!/usr/bin/env node
/**
 * Copy members API handoff markdown (+ optional OpenAPI) for offline BE delivery.
 *
 * Usage (from repo root or apps/cms):
 *   pnpm --filter cms package:members-be-handoff
 *   pnpm --filter cms package:members-be-handoff -- --openapi
 *   pnpm --filter cms package:members-be-handoff -- --out=/path/to/zip-root
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cmsRoot = path.resolve(__dirname, '..')
const docsDir = path.join(cmsRoot, 'docs/api/members')

const args = process.argv.slice(2)
const withOpenApi = args.includes('--openapi')
const outArg = args.find(a => a.startsWith('--out='))
const date = new Date().toISOString().slice(0, 10)
const defaultOut = path.join(cmsRoot, 'dist', `members-be-handoff-${date}`)
const outDir = outArg ? path.resolve(outArg.slice('--out='.length)) : defaultOut

const coreFiles = [
  'members-pre-register-terms-required-policy-backend-request-2026-08-11.md',
  'member-consent-filled-document-backend-handoff-2026-08-25.md',
]

const toCopy = [...coreFiles]

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

const readmeSrc = path.join(docsDir, 'README.md')
if (!fs.existsSync(readmeSrc)) {
  console.error('Missing README:', readmeSrc)
  process.exit(1)
}
fs.copyFileSync(readmeSrc, path.join(outDir, 'README.md'))

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
