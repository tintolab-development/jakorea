/**
 * 인증서 고유번호·다운로드 이력 API 연동용 OpenAPI 부분집합
 * `openapi/backend.openapi.json` → `openapi/certificates.openapi.json`
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'openapi/backend.openapi.json')
const outputPath = join(root, 'openapi/certificates.openapi.json')

const CERTIFICATE_PATHS = [
  '/api/admin/certificates/issues/serial',
  '/api/admin/certificates/issues/{issueId}/download-logs',
]

const SCHEMA_NAMES = [
  'CertificateSerialAllocateRequest',
  'CertificateSerialAllocateResponse',
  'CertificateDownloadLogRequest',
  'CertificateDownloadLogResponse',
]

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

const schemas = spec.components?.schemas ?? {}
const filteredSchemas = Object.fromEntries(
  SCHEMA_NAMES.map(name => {
    if (schemas[name] == null) {
      throw new Error(`OpenAPI snapshot missing schema ${name}`)
    }
    return [name, schemas[name]]
  })
)

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: `${spec.info?.title ?? 'API'} — Certificates subset`,
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

writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
console.log(`Wrote ${outputPath} (${Object.keys(filteredPaths).length} paths)`)
