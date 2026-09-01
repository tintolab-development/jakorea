#!/usr/bin/env node
/**
 * Copy members API handoff markdown (+ optional OpenAPI) for offline BE delivery.
 *
 * Package = [회원 상세 이력·정산 필수 묶음] 7 docs + README
 * See apps/cms/docs/api/members/README.md §「회원 상세 이력·정산 — 백엔드 전달 필수 묶음」
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
const membersDocsDir = path.join(cmsRoot, 'docs/api/members')
const apiDocsDir = path.join(cmsRoot, 'docs/api')

const args = process.argv.slice(2)
const withOpenApi = args.includes('--openapi')
const outArg = args.find(a => a.startsWith('--out='))
const date = new Date().toISOString().slice(0, 10)
const defaultOut = path.join(cmsRoot, 'dist', `members-be-handoff-${date}`)
const outDir = outArg ? path.resolve(outArg.slice('--out='.length)) : defaultOut

/** @type {{ srcDir: string; name: string; destSubdir?: string }[]} */
const bundleFiles = [
  {
    srcDir: membersDocsDir,
    name: 'member-program-history-ui-api-parity-backend-handoff-2026-08-25.md',
  },
  {
    srcDir: membersDocsDir,
    name: 'instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md',
  },
  {
    srcDir: membersDocsDir,
    name: 'school-organization-program-enrollment-history-backend-handoff-2026-08-25.md',
  },
  {
    srcDir: membersDocsDir,
    name: 'admin-member-managed-program-history-backend-handoff-2026-08-25.md',
  },
  {
    srcDir: apiDocsDir,
    name: 'cms-table-bulk-download-api-backend-handoff.md',
  },
  {
    srcDir: apiDocsDir,
    name: 'settlement-payment-order-detail-ui-fields-backend-handoff.md',
  },
  {
    srcDir: apiDocsDir,
    name: 'cms-table-bulk-delete-api-backend-handoff.md',
  },
]

if (!fs.existsSync(membersDocsDir)) {
  console.error('Missing docs dir:', membersDocsDir)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const copiedNames = []
for (const { srcDir, name, destSubdir } of bundleFiles) {
  const src = path.join(srcDir, name)
  if (!fs.existsSync(src)) {
    console.error('Missing source:', src)
    process.exit(1)
  }
  const destPath = destSubdir
    ? path.join(outDir, destSubdir, name)
    : path.join(outDir, name)
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.copyFileSync(src, destPath)
  copiedNames.push(destSubdir ? `${destSubdir}/${name}` : name)
}

const readmeSrc = path.join(membersDocsDir, 'README.md')
if (!fs.existsSync(readmeSrc)) {
  console.error('Missing README:', readmeSrc)
  process.exit(1)
}
fs.copyFileSync(readmeSrc, path.join(outDir, 'README.md'))

if (withOpenApi) {
  const oasMembers = path.join(cmsRoot, 'openapi/members.openapi.json')
  const oasBackend = path.join(cmsRoot, 'openapi/backend.openapi.json')
  const oasDir = path.join(outDir, 'openapi')
  fs.mkdirSync(oasDir, { recursive: true })

  if (fs.existsSync(oasMembers)) {
    fs.copyFileSync(oasMembers, path.join(oasDir, 'members.openapi.json'))
  } else {
    console.warn('Warn: openapi/members.openapi.json not found — run filter:openapi:members if needed')
  }

  if (fs.existsSync(oasBackend)) {
    fs.copyFileSync(oasBackend, path.join(oasDir, 'backend.openapi.json'))
  } else {
    console.warn('Warn: openapi/backend.openapi.json not found — settlements subset may be missing')
  }
}

const parent = path.dirname(outDir)
const base = path.basename(outDir)
console.log('')
console.log('Members BE handoff package ready (회원 상세 이력·정산 필수 묶음):')
console.log(' ', outDir)
console.log('')
console.log('Files:', copiedNames.join(', '), '+ README.md', withOpenApi ? '+ openapi/*.json' : '')
console.log('')
console.log('Zip example:')
console.log(`  cd "${parent}" && zip -r "${base}.zip" "${base}"`)
console.log('')
