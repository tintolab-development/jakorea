#!/usr/bin/env node
/**
 * Copy CMS 회원 관리 DB seed handoff for offline BE delivery.
 *
 * Usage:
 *   pnpm --filter cms package:member-management-seed-handoff
 *   pnpm --filter cms package:member-management-seed-handoff -- --openapi
 *   pnpm --filter cms package:member-management-seed-handoff -- --out=/path/to/zip-root
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cmsRoot = path.resolve(__dirname, '..')
const membersDocsDir = path.join(cmsRoot, 'docs/api/members')

const args = process.argv.slice(2)
const withOpenApi = args.includes('--openapi')
const outArg = args.find(a => a.startsWith('--out='))
const date = new Date().toISOString().slice(0, 10)
const defaultOut = path.join(cmsRoot, 'dist', `member-management-seed-handoff-${date}`)
const outDir = outArg ? path.resolve(outArg.slice('--out='.length)) : defaultOut

/** @type {string[]} */
const seedDocFiles = [
  'member-management-backend-seed-handoff-2026-08-28.md',
  'member-permission-management-backend-seed-handoff-2026-08-28.md',
  'member-management-seed-v1.spec.json',
  'member-detail-history-seed-v1.spec.json',
  'member-permission-management-seed-v1.spec.json',
  'member-management-notion-parity-2026-08-28.md',
]

if (!fs.existsSync(membersDocsDir)) {
  console.error('Missing docs dir:', membersDocsDir)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

for (const name of seedDocFiles) {
  const src = path.join(membersDocsDir, name)
  if (!fs.existsSync(src)) {
    console.error('Missing source:', src)
    process.exit(1)
  }
  fs.copyFileSync(src, path.join(outDir, name))
}

const feCatalogSrc = path.join(cmsRoot, 'src/data/mock/member-management-seed-catalog.ts')
const feHistoryCatalogSrc = path.join(cmsRoot, 'src/data/mock/member-detail-history-seed-catalog.ts')
const feCatalogDestDir = path.join(outDir, 'fe-mock')
fs.mkdirSync(feCatalogDestDir, { recursive: true })
if (fs.existsSync(feCatalogSrc)) {
  fs.copyFileSync(feCatalogSrc, path.join(feCatalogDestDir, 'member-management-seed-catalog.ts'))
} else {
  console.warn('Warn: member-management-seed-catalog.ts not found')
}
if (fs.existsSync(feHistoryCatalogSrc)) {
  fs.copyFileSync(feHistoryCatalogSrc, path.join(feCatalogDestDir, 'member-detail-history-seed-catalog.ts'))
} else {
  console.warn('Warn: member-detail-history-seed-catalog.ts not found')
}

if (withOpenApi) {
  const oasMembers = path.join(cmsRoot, 'openapi/members.openapi.json')
  const oasDir = path.join(outDir, 'openapi')
  fs.mkdirSync(oasDir, { recursive: true })
  if (fs.existsSync(oasMembers)) {
    fs.copyFileSync(oasMembers, path.join(oasDir, 'members.openapi.json'))
  } else {
    console.warn('Warn: openapi/members.openapi.json not found')
  }
}

const readme = `# CMS 회원 관리 DB seed — BE 전달 패키지

**Cursor 프롬프트:** \`member-management-backend-seed-handoff-2026-08-28.md\` 전체를 JABACK Cursor에 붙여넣기.

| 파일 | 용도 |
|------|------|
| member-management-backend-seed-handoff-2026-08-28.md | **메인 Cursor prompt** — 전체 회원관리 seed |
| member-permission-management-backend-seed-handoff-2026-08-28.md | 권한승인·설정 상세 handoff |
| member-management-seed-v1.spec.json | 기계 readable seed SSOT |
| member-permission-management-seed-v1.spec.json | 권한승인 subset (172xxx) |
| fe-mock/member-management-seed-catalog.ts | FE mock ↔ numeric id |
| member-management-notion-parity-2026-08-28.md | Notion 기획 검증 리포트 |

Generated: ${date}
`
fs.writeFileSync(path.join(outDir, 'README.md'), readme, 'utf8')

const parent = path.dirname(outDir)
const base = path.basename(outDir)
console.log('')
console.log('Member management seed handoff package ready:')
console.log(' ', outDir)
console.log('')
console.log('Files:', seedDocFiles.join(', '), '+ fe-mock/*.ts + README.md', withOpenApi ? '+ openapi/members.openapi.json' : '')
console.log('')
console.log('Zip example:')
console.log(`  cd "${parent}" && zip -r "${base}.zip" "${base}"`)
console.log('')
