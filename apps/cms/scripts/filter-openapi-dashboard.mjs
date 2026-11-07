/**
 * 대시보드 1차 연동용 OpenAPI 부분집합 생성
 * `openapi/backend.openapi.json` → `openapi/dashboard.openapi.json`
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeOpenApiSchemaNode } from './lib/normalize-openapi-schema-for-orval.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'openapi/backend.openapi.json')
const outputPath = join(root, 'openapi/dashboard.openapi.json')

const DASHBOARD_PATH_PREFIXES = ['/api/admin/dashboard']
const DASHBOARD_EXACT_PATHS = new Set([
  // legacy public me paths (kept for older backend snapshots)
  '/api/me/dashboard-preferences',
  '/api/me/dashboard-shortcut-badges',
  // current admin-scoped me paths
  '/api/admin/me/dashboard-preferences',
  '/api/admin/me/dashboard-shortcut-badges',
  '/api/admin/notifications',
  '/api/admin/notifications/read-all',
  '/api/admin/notifications/unread-count',
  '/api/admin/individual-applications/{applicationId}',
  '/api/admin/individual-applications/document-results/bulk',
  '/api/admin/individual-applications/{applicationId}/notifications/resend',
  '/api/admin/individual-applications/{applicationId}/privacy/unmask',
  '/api/admin/individual-applications/{applicationId}/document-evaluations/{managerSlot}',
  '/api/admin/volunteer-applications/{applicationId}/document-evaluations/{managerSlot}',
  '/api/admin/volunteer-applications/{applicationId}',
  '/api/admin/volunteer-applications/{applicationId}/activity-region',
  '/api/admin/organization-applications/{applicationId}',
  '/api/admin/organization-applications/{applicationId}/notifications/resend',
  '/api/admin/instructor-applications/{applicationId}',
  '/api/admin/programs/{programId}/organization-applications',
  '/api/admin/programs/{programId}/instructor-applications',
  '/api/admin/programs/{programId}/individual-applications',
  '/api/admin/programs/{programId}/volunteer-applications',
  '/api/admin/programs/{programId}/trained-teacher/organization-applications',
  '/api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}',
  '/api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/give-up',
  '/api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/cancel-approval',
  '/api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/remove-from-progress',
  '/api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/notifications/resend',
  '/api/admin/gemini/trainings/organization-applications/{applicationId}/notifications/resend',
  '/api/admin/gemini/trainings/recruitments/{programId}/organization-applications',
  '/api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/temporary-schedule',
  '/api/admin/programs/{programId}/ujat/organization-schedule-assignments',
  '/api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/schedule-change-request',
  '/api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/education-classes',
  '/api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/education-class-remappings',
  '/api/admin/individual-settlement-applications',
  '/api/admin/individual-settlement-applications/{settlementApplicationId}',
  '/api/admin/individual-settlement-applications/{settlementApplicationId}/approve',
  '/api/admin/individual-settlement-applications/{settlementApplicationId}/reject',
  '/api/admin/programs/{programId}/assignment-submissions',
  // UJAT Typed detail is the canonical replacement for typed registration.overlay writes.
  '/api/admin/programs/{programId}/ujat/typed-detail',
])

function isDashboardSubsetPath(path) {
  if (DASHBOARD_EXACT_PATHS.has(path)) return true
  if (DASHBOARD_PATH_PREFIXES.some(prefix => path.startsWith(prefix))) return true
  if (path.startsWith('/api/me/dashboard-shortcut-badges/')) return true
  if (path.startsWith('/api/admin/me/dashboard-shortcut-badges/')) return true
  if (path.startsWith('/api/admin/notifications/')) return true
  return false
}

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const filteredPaths = Object.fromEntries(
  Object.entries(spec.paths ?? {}).filter(([path]) => isDashboardSubsetPath(path))
)

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: 'JA Korea CMS Backend API — Dashboard subset',
    description: 'Filtered for CMS dashboard Orval codegen (1st pilot).',
  },
  paths: filteredPaths,
}

// OpenAPI 3.1: http bearer scheme must not include `name` (backend spec drift)
const bearer = subset.components?.securitySchemes?.bearerAuth
if (bearer && bearer.type === 'http' && 'name' in bearer) {
  const { name: _removed, ...rest } = bearer
  subset.components.securitySchemes.bearerAuth = rest
}

normalizeOpenApiSchemaNode(subset)

writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
console.log(`Wrote ${Object.keys(filteredPaths).length} paths → ${outputPath}`)
