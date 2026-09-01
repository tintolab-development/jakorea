/**
 * 대시보드 1차 연동용 OpenAPI 부분집합 생성
 * `openapi/backend.openapi.json` → `openapi/dashboard.openapi.json`
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
    title: `${spec.info?.title ?? 'API'} — Dashboard subset`,
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

writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
console.log(`Wrote ${Object.keys(filteredPaths).length} paths → ${outputPath}`)
