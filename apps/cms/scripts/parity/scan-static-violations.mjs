/**
 * Phase D — detail-modal / registration static bypass scan (CI gate).
 *
 * Usage: node scripts/parity/scan-static-violations.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cmsRoot = join(__dirname, '..', '..')
const programRoot = join(cmsRoot, 'src/features/program')
const auditDir = join(cmsRoot, 'docs/audit')
const outJson = join(auditDir, 'program-detail-parity-static-violations.json')

/** persist 경로에서 금지·주의 패턴 */
const RULES = [
  {
    id: 'getGeneralRecruitOverlayRecord_in_save_hooks',
    pattern: 'getGeneralRecruitOverlayRecord\\(',
    glob: '**/hooks/use-*save*.{ts,tsx}',
    severity: 'error',
  },
  {
    id: 'preferOverlay_true_in_detail_registration',
    pattern: 'preferOverlay:\\s*true',
    glob: '{detail-modal,registration}/**/*.{ts,tsx}',
    severity: 'warn',
  },
  {
    id: 'registrationOverlay_direct_index',
    pattern: 'registrationOverlay\\s*\\[',
    glob: '{detail-modal,registration}/**/*.{ts,tsx}',
    severity: 'warn',
  },
]

function rgFiles(pattern, glob) {
  try {
    const out = execSync(`rg -l "${pattern}" ${programRoot} -g "${glob}" 2>/dev/null || true`, {
      encoding: 'utf8',
      cwd: cmsRoot,
    })
    return out
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(p => p.replace(`${cmsRoot}/`, ''))
  } catch {
    return []
  }
}

const results = RULES.map(rule => ({
  ...rule,
  files: rgFiles(rule.pattern, rule.glob),
}))

const errorHits = results.filter(r => r.severity === 'error' && r.files.length > 0)

mkdirSync(auditDir, { recursive: true })
const payload = {
  generatedAt: new Date().toISOString(),
  errorCount: errorHits.reduce((n, r) => n + r.files.length, 0),
  rules: results,
}
writeFileSync(outJson, `${JSON.stringify(payload, null, 2)}\n`)

if (errorHits.length > 0) {
  console.error('Static parity violations (error severity):')
  for (const rule of errorHits) {
    console.error(`  ${rule.id}: ${rule.files.length} file(s)`)
    for (const f of rule.files.slice(0, 20)) console.error(`    - ${f}`)
  }
  process.exit(1)
}

console.log(`Static scan OK → ${outJson}`)
