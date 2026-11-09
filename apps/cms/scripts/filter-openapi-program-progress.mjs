/**
 * 프로그램 진행 현황(참여 봉사자·강사 등록 등) OpenAPI 부분집합
 * `openapi/backend.openapi.json` → `openapi/program-progress.openapi.json`
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeOpenApiSchemaNode } from './lib/normalize-openapi-schema-for-orval.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'openapi/backend.openapi.json')
const outputPath = join(root, 'openapi/program-progress.openapi.json')

const PROGRAM_PROGRESS_EXACT_PATHS = new Set([
  '/api/admin/programs/{programId}/participant-register-candidates',
  '/api/admin/programs/{programId}/volunteer-participants/register',
  '/api/admin/programs/{programId}/employee-volunteer-counts',
  '/api/admin/programs/{programId}/participants/{participantId}/1365-registration-form',
  '/api/admin/programs/{programId}/ujat/1365-registration-form',
  '/api/portal/me/generated-files/jobs/{jobId}',
])

/** Live Springdoc operationId 가 get/replace 로 충돌하면 Orval이 get1/replace2 를 만든다. */
const STABLE_OPERATION_IDS = {
  '/api/admin/programs/{programId}/employee-volunteer-counts': {
    get: 'getEmployeeVolunteerCounts',
    put: 'replaceEmployeeVolunteerCounts',
  },
}

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
/** BE 스펙에 responses 없는 operation이 있으면 Orval 검증이 실패한다 — FE subset에서 stub. */
function ensureOperationResponses(operation) {
  if (operation == null || typeof operation !== 'object' || Array.isArray(operation)) {
    return operation
  }
  if (operation.responses != null) return operation
  return {
    ...operation,
    responses: {
      '200': {
        description:
          'Stubbed by filter-openapi-program-progress.mjs — BE OpenAPI operation lacked responses.',
      },
    },
  }
}

function applyStableOperationId(path, method, operation) {
  const nextId = STABLE_OPERATION_IDS[path]?.[method]
  if (!nextId || operation == null || typeof operation !== 'object') return operation
  return { ...operation, operationId: nextId }
}

const filteredPaths = Object.fromEntries(
  Object.entries(spec.paths ?? {})
    .filter(([path]) => PROGRAM_PROGRESS_EXACT_PATHS.has(path))
    .map(([path, methods]) => [
      path,
      Object.fromEntries(
        Object.entries(methods ?? {}).map(([method, operation]) => [
          method,
          applyStableOperationId(path, method, ensureOperationResponses(operation)),
        ])
      ),
    ])
)

const allSchemas = spec.components?.schemas ?? {}
const usedNames = collectSchemaNames(filteredPaths)
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

const filteredSchemas = Object.fromEntries(
  [...usedNames].sort().flatMap(name => {
    const schema = allSchemas[name]
    return schema ? [[name, schema]] : []
  })
)

/**
 * Orval client factory 이름은 OpenAPI `info.title`에서 파생된다.
 * BE title이 바뀌어도 FE import(`getJAKoreaCMSBackendAPIProgramProgressSubset`)를 깨지 않도록 subset title을 고정한다.
 */
const ORVAL_STABLE_TITLE = 'JA Korea CMS Backend API — Program progress subset'

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: ORVAL_STABLE_TITLE,
    description: 'Filtered for CMS general program progress Orval codegen.',
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
console.log(`Wrote ${outputPath} (${Object.keys(filteredPaths).length} paths)`)
