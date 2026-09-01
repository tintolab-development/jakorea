/**
 * 회원 관리 API 연동용 OpenAPI 부분집합 생성
 * `openapi/backend.openapi.json` → `openapi/members.openapi.json`
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'openapi/backend.openapi.json')
const outputPath = join(root, 'openapi/members.openapi.json')

const MEMBERS_PATH_PREFIXES = [
  '/api/admin/users',
  '/api/admin/members',
  '/api/admin/organizations/schools',
  '/api/admin/instructor-role-requests',
  '/api/admin/admin-accounts',
  '/api/admin/admin-approval-requests',
  '/api/admin/admin-permissions',
  '/api/admin/admin-roles',
  '/api/admin/roles',
  '/api/admin/admin-permission-change-logs',
]

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const filteredPaths = Object.fromEntries(
  Object.entries(spec.paths ?? {}).filter(([path]) =>
    MEMBERS_PATH_PREFIXES.some(prefix => path.startsWith(prefix))
  )
)

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: `${spec.info?.title ?? 'API'} — Members subset`,
    description: 'Filtered for CMS member management Orval codegen.',
  },
  paths: filteredPaths,
}

const bearer = subset.components?.securitySchemes?.bearerAuth
if (bearer && bearer.type === 'http' && 'name' in bearer) {
  const { name: _removed, ...rest } = bearer
  subset.components.securitySchemes.bearerAuth = rest
}

writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
console.log(`Wrote ${outputPath} (${Object.keys(filteredPaths).length} paths)`)
