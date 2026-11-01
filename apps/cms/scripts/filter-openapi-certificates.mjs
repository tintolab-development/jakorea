/**
 * 인증서 고유번호·다운로드 이력 API 연동용 OpenAPI 부분집합
 * `openapi/backend.openapi.json` → `openapi/certificates.openapi.json`
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeOpenApiSchemaNode } from './lib/normalize-openapi-schema-for-orval.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'openapi/backend.openapi.json')
const outputPath = join(root, 'openapi/certificates.openapi.json')

const CERTIFICATE_PATHS = [
  '/api/admin/certificates/issues/serial',
  '/api/admin/certificates/issues/{issueId}/download-logs',
]

/** BE 회귀 시 filter가 조용히 빠지지 않도록 최소 스키마 존재 검사 */
const REQUIRED_SCHEMA_NAMES = [
  'CertificateDownloadLogResponse',
  'CertificateDownloadLogRequest',
  'CertificateSerialAllocateRequest',
]

/**
 * Orval client factory 이름은 OpenAPI `info.title`에서 파생된다.
 * BE title이 바뀌어도 FE import(`getJAKoreaCMSBackendAPICertificatesSubset`)를 깨지 않도록 subset title을 고정한다.
 */
const ORVAL_STABLE_TITLE = 'JA Korea CMS Backend API — Certificates subset'

function collectSchemaNames(node, names = new Set()) {
  if (node == null || typeof node !== 'object') return names
  if (Array.isArray(node)) {
    for (const item of node) collectSchemaNames(item, names)
    return names
  }
  const ref = node.$ref
  if (typeof ref === 'string') {
    const match = ref.match(/^#\/components\/schemas\/(.+)$/)
    if (match) names.add(match[1])
  }
  for (const value of Object.values(node)) collectSchemaNames(value, names)
  return names
}

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const filteredPaths = Object.fromEntries(
  Object.entries(spec.paths ?? {}).filter(([path]) => CERTIFICATE_PATHS.includes(path))
)

const missingPaths = CERTIFICATE_PATHS.filter(path => filteredPaths[path] == null)
if (missingPaths.length > 0) {
  throw new Error(
    `OpenAPI snapshot missing ${missingPaths.join(', ')}. Run fetch:openapi after backend spec sync.`
  )
}

const allSchemas = spec.components?.schemas ?? {}
for (const name of REQUIRED_SCHEMA_NAMES) {
  if (allSchemas[name] == null) {
    throw new Error(`OpenAPI snapshot missing schema ${name}`)
  }
}

const usedNames = collectSchemaNames(filteredPaths)
for (const name of REQUIRED_SCHEMA_NAMES) usedNames.add(name)
const queue = [...usedNames]
while (queue.length > 0) {
  const name = queue.pop()
  const schema = allSchemas[name]
  if (!schema) continue
  for (const nested of collectSchemaNames(schema)) {
    if (!usedNames.has(nested)) {
      usedNames.add(nested)
      queue.push(nested)
    }
  }
}

const missingUsed = [...usedNames].filter(name => allSchemas[name] == null)
if (missingUsed.length > 0) {
  throw new Error(
    `OpenAPI snapshot missing schema refs used by certificates paths: ${missingUsed.join(', ')}`
  )
}

const filteredSchemas = Object.fromEntries(
  [...usedNames].sort().map(name => [name, allSchemas[name]])
)

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: ORVAL_STABLE_TITLE,
    description: 'Filtered for CMS certificate serial allocate and download-log Orval codegen.',
  },
  paths: filteredPaths,
  components: {
    schemas: filteredSchemas,
    securitySchemes: spec.components?.securitySchemes,
  },
}

const bearer = subset.components?.securitySchemes?.bearerAuth
if (bearer && bearer.type === 'http' && 'name' in bearer) {
  const { name: _removed, ...rest } = bearer
  subset.components.securitySchemes.bearerAuth = rest
}

normalizeOpenApiSchemaNode(subset)

writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
console.log(
  `Wrote ${outputPath} (${Object.keys(filteredPaths).length} paths, ${Object.keys(filteredSchemas).length} schemas)`
)
