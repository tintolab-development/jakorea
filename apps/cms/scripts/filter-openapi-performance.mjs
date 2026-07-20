/**
 * 실적 관리 API 연동용 OpenAPI 부분집합 생성
 * `openapi/backend.openapi.json` → `openapi/performance.openapi.json`
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'openapi/backend.openapi.json')
const outputPath = join(root, 'openapi/performance.openapi.json')

const PERFORMANCE_PATH_PREFIXES = [
  '/api/admin/performance-records',
  '/api/admin/performance/',
  '/api/admin/performance-closings',
  '/api/admin/performance-correction-requests',
]

function isPerformanceSubsetPath(path) {
  return PERFORMANCE_PATH_PREFIXES.some(prefix => path.startsWith(prefix))
}

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const filteredPaths = Object.fromEntries(
  Object.entries(spec.paths ?? {}).filter(([path]) => isPerformanceSubsetPath(path))
)

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: `${spec.info?.title ?? 'API'} — Performance subset`,
    description: 'Filtered for CMS performance (education-record) Orval codegen.',
  },
  paths: filteredPaths,
}

const bearer = subset.components?.securitySchemes?.bearerAuth
if (bearer && bearer.type === 'http' && 'name' in bearer) {
  const { name: _removed, ...rest } = bearer
  subset.components.securitySchemes.bearerAuth = rest
}

writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
console.log(`Wrote ${Object.keys(filteredPaths).length} paths → ${outputPath}`)
