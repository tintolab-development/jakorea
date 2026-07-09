/**
 * Forms-Surveys API 연동용 OpenAPI 부분집합 생성
 * `openapi/backend.openapi.json` → `openapi/forms-surveys.openapi.json`
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'openapi/backend.openapi.json')
const outputPath = join(root, 'openapi/forms-surveys.openapi.json')

const FORMS_SURVEYS_PATH_PREFIXES = [
  '/api/admin/form-templates',
  '/api/admin/form-template-versions',
  '/api/admin/form-responses',
  '/api/admin/form-submission-files',
  '/api/admin/form-auto-fill-keys',
]

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const filteredPaths = Object.fromEntries(
  Object.entries(spec.paths ?? {}).filter(
    ([path]) =>
      FORMS_SURVEYS_PATH_PREFIXES.some(prefix => path.startsWith(prefix)) ||
      path.includes('/form-bindings')
  )
)

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: `${spec.info?.title ?? 'API'} — Forms-Surveys subset`,
    description: 'Filtered for CMS form template / survey Orval codegen.',
  },
  paths: filteredPaths,
}

const bearer = subset.components?.securitySchemes?.bearerAuth
if (bearer && bearer.type === 'http' && 'name' in bearer) {
  const { name: _removed, ...rest } = bearer
  subset.components.securitySchemes.bearerAuth = rest
}

writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
console.log(`Wrote ${outputPath} (${Object.keys(filteredPaths).length} paths)`)
