/**
 * 프로그램 진행 현황(참여 봉사자·강사 등록 등) OpenAPI 부분집합
 * `openapi/backend.openapi.json` → `openapi/program-progress.openapi.json`
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const inputPath = join(root, 'openapi/backend.openapi.json')
const outputPath = join(root, 'openapi/program-progress.openapi.json')

const PROGRAM_PROGRESS_EXACT_PATHS = new Set([
  '/api/admin/programs/{programId}/participant-register-candidates',
  '/api/admin/programs/{programId}/volunteer-participants/register',
  '/api/admin/programs/{programId}/employee-volunteer-counts',
])

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const filteredPaths = Object.fromEntries(
  Object.entries(spec.paths ?? {}).filter(([path]) => PROGRAM_PROGRESS_EXACT_PATHS.has(path))
)

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: `${spec.info?.title ?? 'API'} — Program progress subset`,
    description: 'Filtered for CMS general program progress Orval codegen.',
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
