/**
 * BE handoff(JABACK)에서 기관 신청 알림 재발송 계약(공통·TT·Gemini)을
 * CMS `openapi/backend.openapi.json`에 병합한다. invent 없이 BE 정의만 반영.
 *
 * Usage:
 *   BE_OPENAPI=/path/to/JABACK/openapi/backend.openapi.json node scripts/merge-openapi-organization-notification-resend-from-be.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cmsRoot = join(__dirname, '..')
const feBackendPath = join(cmsRoot, 'openapi/backend.openapi.json')
const defaultBePath = resolve(cmsRoot, '../../../../backend/JABACK/openapi/backend.openapi.json')
const bePath = process.env.BE_OPENAPI ? resolve(process.env.BE_OPENAPI) : defaultBePath

if (!existsSync(bePath)) {
  console.warn(`BE OpenAPI not found (skip merge): ${bePath}`)
  process.exit(0)
}

const PATH_KEYS = [
  '/api/admin/organization-applications/{applicationId}/notifications/resend',
  '/api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/notifications/resend',
  '/api/admin/gemini/trainings/organization-applications/{applicationId}/notifications/resend',
  // list projection: resultNotificationSentAt · availableActions
  '/api/admin/gemini/trainings/recruitments/{programId}/organization-applications',
  '/api/admin/programs/{programId}/trained-teacher/organization-applications',
  '/api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}',
]

const SCHEMA_KEYS = [
  'OrganizationApplicationNotificationResendRequest',
  'OrganizationApplicationNotificationResendRequestTiming',
  'OrganizationApplicationListItemResponse',
  'OrganizationApplicationDetailResponse',
  'ApplicationDecisionResponse',
  'OrganizationApplicationSession',
  'OrganizationApplicationSessionResponse',
  'TrainedTeacherOrganizationApplicationResponse',
  'GeminiOrganizationApplicationItem',
  'GeminiOrganizationApplicationListResponse',
]

const be = JSON.parse(readFileSync(bePath, 'utf8'))
const fe = JSON.parse(readFileSync(feBackendPath, 'utf8'))

fe.paths = fe.paths ?? {}
let pathCount = 0
for (const key of PATH_KEYS) {
  const bePathOp = be.paths?.[key]
  if (!bePathOp) {
    console.warn(`BE missing path ${key}`)
    continue
  }
  // Merge methods: keep FE-only methods, overwrite overlapping with BE
  fe.paths[key] = { ...(fe.paths[key] ?? {}), ...bePathOp }
  pathCount += 1
}

fe.components = fe.components ?? {}
fe.components.schemas = fe.components.schemas ?? {}

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
  `Merged organization notification resend from BE (${bePath}) → FE backend.openapi.json (${merged} schemas + ${pathCount} paths)`
)
