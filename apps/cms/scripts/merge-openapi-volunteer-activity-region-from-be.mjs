/**
 * JABACK `PATCH /api/admin/volunteer-applications/{applicationId}/activity-region`
 * 계약을 CMS `openapi/backend.openapi.json`에 병합한다.
 *
 * Usage:
 *   BE_OPENAPI=/path/to/JABACK/openapi/backend.openapi.json node scripts/merge-openapi-volunteer-activity-region-from-be.mjs
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
  console.warn(
    `BE OpenAPI not found (skip merge): ${candidateBePaths.join(' | ')}`
  )
  process.exit(0)
}

const PATH_KEY = '/api/admin/volunteer-applications/{applicationId}/activity-region'
const SCHEMA_KEYS = [
  'VolunteerActivityRegionUpdateRequest',
  'VolunteerActivityRegionUpdateResponse',
]

const be = JSON.parse(readFileSync(bePath, 'utf8'))
const fe = JSON.parse(readFileSync(feBackendPath, 'utf8'))

fe.paths = fe.paths ?? {}
fe.components = fe.components ?? {}
fe.components.schemas = fe.components.schemas ?? {}

let pathCount = 0
const bePathOp = be.paths?.[PATH_KEY]
if (!bePathOp) {
  console.warn(`BE missing path ${PATH_KEY}`)
} else {
  fe.paths[PATH_KEY] = bePathOp
  pathCount = 1
}

let merged = 0
for (const key of SCHEMA_KEYS) {
  const schema = be.components?.schemas?.[key]
  if (!schema) {
    console.warn(`BE missing schema ${key}`)
    continue
  }
  fe.components.schemas[key] = schema
  merged += 1
}

writeFileSync(feBackendPath, `${JSON.stringify(fe, null, 2)}\n`)
console.log(
  `Merged volunteer activity-region from BE (${bePath}) → FE backend.openapi.json (${merged} schemas + ${pathCount} paths)`
)
