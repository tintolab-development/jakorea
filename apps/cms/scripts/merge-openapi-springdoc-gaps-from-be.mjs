/**
 * Live `/v3/api-docs` 는 Springdoc inner-class 충돌로 path·스키마가 빠질 수 있다.
 * 로컬 JABACK `openapi/backend.openapi.json` 에서 **없는 것만** 보강한다.
 * 이미 live에 있는 path/스키마는 덮어쓰지 않는다.
 *
 * Usage:
 *   BE_OPENAPI=/path/to/backend.openapi.json node scripts/merge-openapi-springdoc-gaps-from-be.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cmsRoot = join(__dirname, '..')
const feBackendPath = join(cmsRoot, 'openapi/backend.openapi.json')
const candidateBePaths = [
  process.env.BE_OPENAPI ? resolve(process.env.BE_OPENAPI) : null,
  resolve(cmsRoot, '../../../backend/JABACK/openapi/backend.openapi.json'),
  resolve(cmsRoot, '../../../../backend/JABACK/openapi/backend.openapi.json'),
].filter(Boolean)

const bePath = candidateBePaths.find(path => existsSync(path))
if (!bePath) {
  console.warn(`BE OpenAPI not found (skip merge): ${candidateBePaths.join(' | ')}`)
  process.exit(0)
}

const GAP_PATH_PREFIXES = [
  '/api/admin/individual-settlement-applications',
  '/api/admin/files/downloads/raw',
  '/api/portal/files/downloads/raw',
  '/api/portal/public/files/downloads/raw',
]

const GAP_SCHEMA_NAMES = [
  'MemberPortalEducationScheduleGroupTime',
  'MemberPortalEducationScheduleAssignment',
  'MemberPortalEducationScheduleAssignmentSubmission',
  'MemberPortalEducationCurriculumSession',
  'MemberPortalAssignmentSubmissionRequest',
  'IndividualSettlementReviewListItem',
  'IndividualSettlementReviewDetail',
  'IndividualSettlementReviewDecision',
  'IndividualSettlementReviewRequest',
  'IndividualSettlementReviewItem',
  'IndividualSettlementReviewReceipt',
  'IndividualSettlementReviewRevision',
  'IndividualSettlementReviewFileRef',
  'PageResponseIndividualSettlementReviewListItem',
  'ApiResponseIndividualSettlementReviewDetail',
  'ApiResponseIndividualSettlementReviewDecision',
]

const SCHEMA_REF = /#\/components\/schemas\/([^/"']+)/g

const be = JSON.parse(readFileSync(bePath, 'utf8'))
const fe = JSON.parse(readFileSync(feBackendPath, 'utf8'))

fe.paths = fe.paths ?? {}
fe.components = fe.components ?? {}
fe.components.schemas = fe.components.schemas ?? {}

const bePaths = be.paths ?? {}
const beSchemas = be.components?.schemas ?? {}

function collectSchemaNames(node, acc = new Set()) {
  if (node == null || typeof node !== 'object') return acc
  const json = JSON.stringify(node)
  for (const match of json.matchAll(SCHEMA_REF)) {
    acc.add(match[1])
  }
  return acc
}

let pathCount = 0
let schemaCount = 0

for (const [pathKey, pathItem] of Object.entries(bePaths)) {
  if (fe.paths[pathKey]) continue
  if (!GAP_PATH_PREFIXES.some(prefix => pathKey.startsWith(prefix))) continue
  fe.paths[pathKey] = pathItem
  pathCount += 1
  collectSchemaNames(pathItem)
}

const pending = new Set(GAP_SCHEMA_NAMES)
for (const pathItem of Object.values(fe.paths)) {
  collectSchemaNames(pathItem, pending)
}
collectSchemaNames(fe.components.schemas, pending)

const queue = [...pending]
while (queue.length > 0) {
  const name = queue.pop()
  if (!name) continue
  if (fe.components.schemas[name]) continue
  const source = beSchemas[name]
  if (!source) continue
  fe.components.schemas[name] = source
  schemaCount += 1
  const nested = collectSchemaNames(source)
  for (const nestedName of nested) {
    if (!fe.components.schemas[nestedName] && beSchemas[nestedName]) {
      queue.push(nestedName)
    }
  }
}

writeFileSync(feBackendPath, `${JSON.stringify(fe, null, 2)}\n`)
console.log(
  `Merged Springdoc gaps from BE (${bePath}) → FE backend.openapi.json (${schemaCount} schemas + ${pathCount} paths)`
)
