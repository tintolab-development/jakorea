/**
 * OpenAPI path subset 공통 writer
 * — bearerAuth OpenAPI 3.1 drift (`name` 제거) 포함
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeOpenApiSchemaNode } from './normalize-openapi-schema-for-orval.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const adminRoot = join(__dirname, '../..')
export const backendOpenApiPath = join(adminRoot, 'openapi/backend.openapi.json')

function collectSchemaRefs(node, acc) {
  if (node == null || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const item of node) collectSchemaRefs(item, acc)
    return
  }
  if (typeof node.$ref === 'string') {
    const match = node.$ref.match(/^#\/components\/schemas\/([^/]+)$/)
    if (match) acc.add(match[1])
  }
  for (const value of Object.values(node)) collectSchemaRefs(value, acc)
}

function pruneUnusedComponentSchemas(spec) {
  const schemas = spec.components?.schemas
  if (!schemas || typeof schemas !== 'object') return
  const used = new Set()
  collectSchemaRefs(spec.paths, used)
  collectSchemaRefs(spec.components?.securitySchemes, used)
  let previousSize = -1
  while (used.size !== previousSize) {
    previousSize = used.size
    for (const name of [...used]) {
      collectSchemaRefs(schemas[name], used)
    }
  }
  spec.components.schemas = Object.fromEntries(
    Object.entries(schemas).filter(([name]) => used.has(name)),
  )
}

/**
 * @param {{
 *   outputFileName: string
 *   subsetTitle: string
 *   description: string
 *   matchPath: (path: string) => boolean
 *   pruneUnusedSchemas?: boolean
 *   afterFilter?: (subset: Record<string, unknown>) => void
 * }} options
 */
export function writeOpenApiSubset({
  outputFileName,
  subsetTitle,
  description,
  matchPath,
  pruneUnusedSchemas = false,
  afterFilter,
}) {
  const inputPath = backendOpenApiPath
  const outputPath = join(adminRoot, 'openapi', outputFileName)
  const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
  const filteredPaths = Object.fromEntries(
    Object.entries(spec.paths ?? {}).filter(([path]) => matchPath(path)),
  )

  const pathCount = Object.keys(filteredPaths).length
  if (pathCount === 0) {
    throw new Error(`No paths matched for ${outputFileName} in ${inputPath}`)
  }

  const subset = {
    ...spec,
    info: {
      ...spec.info,
      title: `${spec.info?.title ?? 'API'} — ${subsetTitle}`,
      description,
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
  afterFilter?.(subset)
  if (pruneUnusedSchemas) pruneUnusedComponentSchemas(subset)

  writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
  console.log(`Wrote ${outputPath} (${pathCount} paths)`)
}

/** @param {string[]} prefixes */
export function matchPathPrefixes(prefixes) {
  return path => prefixes.some(prefix => path.startsWith(prefix))
}
