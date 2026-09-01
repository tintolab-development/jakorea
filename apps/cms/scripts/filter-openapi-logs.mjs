/**
 * 로그 관리 API 연동용 OpenAPI 부분집합 생성
 * `openapi/backend.openapi.json` → `openapi/logs.openapi.json`
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'openapi/backend.openapi.json')
const outputPath = join(root, 'openapi/logs.openapi.json')

const LOGS_PATH_PREFIXES = ['/api/admin/logs']

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const filteredPaths = Object.fromEntries(
  Object.entries(spec.paths ?? {}).filter(([path]) =>
    LOGS_PATH_PREFIXES.some(prefix => path.startsWith(prefix))
  )
)

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: `${spec.info?.title ?? 'API'} — Logs subset`,
    description: 'Filtered for CMS logs management Orval codegen.',
  },
  paths: filteredPaths,
}

const bearer = subset.components?.securitySchemes?.bearerAuth
if (bearer && bearer.type === 'http' && 'name' in bearer) {
  const { name: _removed, ...rest } = bearer
  subset.components.securitySchemes.bearerAuth = rest
}

// Springdoc 일부 query param이 schema/content 없이 내려와 Orval 검증이 실패한다.
for (const operations of Object.values(subset.paths ?? {})) {
  for (const operation of Object.values(operations ?? {})) {
    if (!operation || typeof operation !== 'object' || !Array.isArray(operation.parameters)) continue
    for (const parameter of operation.parameters) {
      if (!parameter || typeof parameter !== 'object') continue
      if ('schema' in parameter || 'content' in parameter) continue
      parameter.schema = { type: 'string' }
    }
  }
}

writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
const pathCount = Object.keys(filteredPaths).length
if (pathCount === 0) {
  throw new Error(`No paths matched LOGS_PATH_PREFIXES in ${inputPath}`)
}
console.log(`Wrote ${outputPath} (${pathCount} paths)`)
