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
])

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
  Object.entries(spec.paths ?? {}).filter(([path]) => PROGRAM_PROGRESS_EXACT_PATHS.has(path))
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

const subset = {
  ...spec,
  info: {
    ...spec.info,
    title: `${spec.info?.title ?? 'API'} — Program progress subset`,
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
