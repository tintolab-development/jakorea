/**
 * 정산 관리 API 연동용 OpenAPI 부분집합 생성
 * `openapi/backend.openapi.json` → `openapi/settlement.openapi.json`
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'openapi/backend.openapi.json')
const outputPath = join(root, 'openapi/settlement.openapi.json')

const SETTLEMENT_PATH_PREFIXES = [
  '/api/admin/settlements',
  '/api/admin/account-payments',
  '/api/admin/settlement-configs',
]

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const filteredPaths = Object.fromEntries(
  Object.entries(spec.paths ?? {}).filter(([path]) =>
    SETTLEMENT_PATH_PREFIXES.some(prefix => path.startsWith(prefix))
  )
)

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: `${spec.info?.title ?? 'API'} — Settlement subset`,
    description: 'Filtered for CMS settlement management Orval codegen.',
  },
  paths: filteredPaths,
}

const bearer = subset.components?.securitySchemes?.bearerAuth
if (bearer && bearer.type === 'http' && 'name' in bearer) {
  const { name: _removed, ...rest } = bearer
  subset.components.securitySchemes.bearerAuth = rest
}

writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
const pathCount = Object.keys(filteredPaths).length
if (pathCount === 0) {
  throw new Error(`No paths matched SETTLEMENT_PATH_PREFIXES in ${inputPath}`)
}
console.log(`Wrote ${outputPath} (${pathCount} paths)`)
