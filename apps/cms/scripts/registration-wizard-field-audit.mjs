/**
 * 등록 위저드 — 카탈로그 lazy·multiple CmsSelect onOpenChange 연동 점검 (CI optional).
 *
 * Usage: node scripts/registration-wizard-field-audit.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cmsRoot = join(__dirname, '..')
const templateRoot = join(cmsRoot, 'src/features/template/ui/form-set')
const auditDir = join(cmsRoot, 'docs/audit')
const outJson = join(auditDir, 'registration-wizard-field-audit.json')

const SCAN_DIRS = [
  join(templateRoot, 'registration-form'),
  join(templateRoot, 'recruit-form/institution'),
  join(templateRoot, 'application-form/institution'),
]

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, acc)
    else if (/\.(tsx|ts)$/.test(name)) acc.push(full)
  }
  return acc
}

const files = SCAN_DIRS.flatMap(d => walk(d))
const registrationFormFiles = walk(join(templateRoot, 'registration-form'))

const violations = []

for (const file of registrationFormFiles) {
  const rel = file.replace(`${cmsRoot}/`, '')
  const text = readFileSync(file, 'utf8')
  if (!text.includes('mode="multiple"') && !text.includes("mode='multiple'")) continue
  if (!text.includes('CmsSelect')) continue
  const usesLazyCatalog =
    text.includes('useRegistrationCatalogReady') ||
    text.includes('useSponsorSelectOptions') ||
    text.includes('useDetailedProgramSelectOptions') ||
    text.includes('useProgramWagePaymentItemOptionsState')
  if (!usesLazyCatalog) continue

  const hasOnOpenChange =
    text.includes('onOpenChange') || text.includes('RegistrationCatalogSelect')
  if (!hasOnOpenChange) {
    violations.push({
      id: 'multiple_cms_select_missing_onOpenChange',
      file: rel,
      severity: 'error',
    })
  }
}

const catalogCalls = []
for (const file of files) {
  const rel = file.replace(`${cmsRoot}/`, '')
  const text = readFileSync(file, 'utf8')
  if (!text.includes('useSponsorSelectOptions') && !text.includes('useDetailedProgramSelectOptions')) {
    continue
  }
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    if (
      /useSponsorSelectOptions\s*\(\s*false\s*\)/.test(line) ||
      /useDetailedProgramSelectOptions\s*\(\s*false\s*\)/.test(line)
    ) {
      catalogCalls.push({ file: rel, line: i + 1, text: line.trim() })
    }
  })
}

const overlayKvWarnings = []
for (const file of files) {
  const rel = file.replace(`${cmsRoot}/`, '')
  const count = (readFileSync(file, 'utf8').match(/useProgramRegistrationOverlayKv/g) ?? []).length
  if (count >= 3) {
    overlayKvWarnings.push({ file: rel, useProgramRegistrationOverlayKv: count })
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  multipleSelectViolations: violations,
  catalogHardDisabled: catalogCalls,
  overlayKvDensity: overlayKvWarnings,
}

mkdirSync(auditDir, { recursive: true })
writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`)

if (violations.length > 0) {
  console.error(`registration-wizard-field-audit: ${violations.length} error(s)`)
  for (const v of violations) {
    console.error(`  - ${v.file}`)
  }
  process.exit(1)
}

console.log('registration-wizard-field-audit: OK')
console.log(`  overlay Kv density warnings: ${overlayKvWarnings.length}`)
console.log(`  report: ${outJson}`)
