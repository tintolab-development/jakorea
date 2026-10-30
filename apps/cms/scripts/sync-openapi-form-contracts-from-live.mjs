import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outputPath = join(root, 'openapi/backend.openapi.json')
const apiDocsBaseUrl = (
  process.env.BE_API_DOCS_URL ?? 'http://localhost:8080/v3/api-docs'
).replace(/\/$/, '')

const TARGET_PATHS = {
  'admin-cms': [
    '/api/admin/programs/{programId}/form-bindings',
    '/api/admin/programs/{programId}/form-bindings/{bindingId}',
  ],
  'member-portal': [
    '/api/portal/me/programs/{programId}/available-forms',
    '/api/portal/me/programs/{programId}/form-bindings/{bindingId}/render',
    '/api/portal/me/programs/{programId}/form-bindings/{bindingId}/responses',
  ],
}

function collectSchemaNames(value, names = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaNames(item, names)
    return names
  }
  if (value == null || typeof value !== 'object') return names
  for (const [key, child] of Object.entries(value)) {
    if (key === '$ref' && typeof child === 'string') {
      const prefix = '#/components/schemas/'
      if (child.startsWith(prefix)) names.add(child.slice(prefix.length))
      continue
    }
    collectSchemaNames(child, names)
  }
  return names
}

function copyReferencedSchemas(source, target, seed) {
  const pending = [...collectSchemaNames(seed)]
  const copied = new Set()
  while (pending.length > 0) {
    const schemaName = pending.pop()
    if (schemaName == null || copied.has(schemaName)) continue
    const schema = source.components?.schemas?.[schemaName]
    if (schema == null) {
      throw new Error(`Referenced schema is missing from live OpenAPI: ${schemaName}`)
    }
    target.components ??= {}
    target.components.schemas ??= {}
    target.components.schemas[schemaName] = schema
    copied.add(schemaName)
    for (const dependency of collectSchemaNames(schema)) {
      if (!copied.has(dependency)) pending.push(dependency)
    }
  }
  return copied
}

const target = JSON.parse(readFileSync(outputPath, 'utf8'))
const copiedSchemas = new Set()

for (const [group, paths] of Object.entries(TARGET_PATHS)) {
  const response = await fetch(`${apiDocsBaseUrl}/${group}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${group} OpenAPI: HTTP ${response.status}`)
  }
  const source = await response.json()
  for (const path of paths) {
    const pathItem = source.paths?.[path]
    if (pathItem == null) throw new Error(`Live OpenAPI path is missing: ${path}`)
    target.paths[path] = pathItem
    for (const schemaName of copyReferencedSchemas(source, target, pathItem)) {
      copiedSchemas.add(schemaName)
    }
  }
}

writeFileSync(outputPath, `${JSON.stringify(target, null, 2)}\n`)
console.log(
  `Synced ${Object.values(TARGET_PATHS).flat().length} form paths and ${copiedSchemas.size} schemas from ${apiDocsBaseUrl}`
)
