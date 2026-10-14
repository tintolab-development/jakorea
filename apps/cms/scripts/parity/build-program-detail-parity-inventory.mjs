/**
 * Phase A — program detail parity inventory: screen SSOT + static bypass scan.
 *
 * Usage (from apps/cms):
 *   node scripts/parity/build-program-detail-parity-inventory.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cmsRoot = join(__dirname, '..', '..')
const programRoot = join(cmsRoot, 'src/features/program')
const auditDir = join(cmsRoot, 'docs/audit')
const outJson = join(auditDir, 'program-detail-api-parity-inventory.json')

const BYPASS_PATTERNS = [
  { id: 'getGeneralRecruitOverlayRecord', pattern: 'getGeneralRecruitOverlayRecord\\(' },
  { id: 'preferOverlay_true', pattern: 'preferOverlay:\\s*true' },
  { id: 'registrationOverlay_bracket', pattern: 'registrationOverlay\\s*\\[' },
  { id: 'readOverlayForSave', pattern: 'read[A-Za-z]*OverlayForSave\\(' },
]

function rg(pattern, glob) {
  try {
    const out = execSync(
      `rg -l "${pattern}" ${programRoot} -g "${glob}" 2>/dev/null || true`,
      { encoding: 'utf8', cwd: cmsRoot }
    )
    return out
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(p => p.replace(`${cmsRoot}/`, ''))
  } catch {
    return []
  }
}

function loadScreenInventoryFromSource() {
  const tsPath = join(
    cmsRoot,
    'src/features/program/shared/parity/inventory-screens.ts'
  )
  const src = readFileSync(tsPath, 'utf8')
  const screens = []
  const blockRe = /screenId:\s*'([^']+)'[\s\S]*?variant:\s*'([^']+)'[\s\S]*?routeHint:\s*'([^']+)'[\s\S]*?remotePolicy:\s*'([^']+)'[\s\S]*?priority:\s*'(P\d)'/g
  let m
  while ((m = blockRe.exec(src)) !== null) {
    screens.push({
      screenId: m[1],
      variant: m[2],
      routeHint: m[3],
      remotePolicy: m[4],
      priority: m[5],
    })
  }
  return screens
}

const screens = loadScreenInventoryFromSource()
const bypassScan = BYPASS_PATTERNS.map(({ id, pattern }) => ({
  patternId: id,
  files: rg(pattern, '{detail-modal,registration}/**/*.{ts,tsx}'),
}))

mkdirSync(auditDir, { recursive: true })
const payload = {
  generatedAt: new Date().toISOString(),
  screenCount: screens.length,
  screens,
  bypassScan,
}
writeFileSync(outJson, `${JSON.stringify(payload, null, 2)}\n`)

const mdPath = join(auditDir, 'program-detail-api-parity-inventory.md')
const md = `# CMS 프로그램 상세 API↔노출 parity 인벤토리

자동 갱신: \`pnpm --filter cms parity:inventory\`  
SSOT screenId: [\`inventory-screens.ts\`](../src/features/program/shared/parity/inventory-screens.ts)

## 판정 기준

- **apiTruth**: GET → adapter \`Program\` (+ persisted \`registrationOverlay\`만, \`preferOverlay: false\`)
- **uiExposedStrict**: 공식 Read 체인, operational store reset 후
- **Gate**: remote 화면에서 strict diff = 0

## Screen catalog (${screens.length})

| screenId | variant | priority | remote | route |
| --- | --- | --- | --- | --- |
${screens.map(s => `| \`${s.screenId}\` | ${s.variant} | ${s.priority} | ${s.remotePolicy} | ${s.routeHint} |`).join('\n')}

## Static bypass scan (detail-modal / registration)

| pattern | hit count |
| --- | --- |
${bypassScan.map(b => `| \`${b.patternId}\` | ${b.files.length} |`).join('\n')}

상세 파일 목록: [\`program-detail-api-parity-inventory.json\`](./program-detail-api-parity-inventory.json)

**Last generated:** ${payload.generatedAt}
`
writeFileSync(mdPath, md)
console.log(`Wrote ${screens.length} screens → ${outJson}`)
console.log(`Wrote ${mdPath}`)
