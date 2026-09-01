/**
 * OpenAPI path subset 공통 writer
 * — bearerAuth OpenAPI 3.1 drift (`name` 제거) 포함
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const adminRoot = join(__dirname, '../..')
export const backendOpenApiPath = join(adminRoot, 'openapi/backend.openapi.json')

/**
 * @param {{
 *   outputFileName: string
 *   subsetTitle: string
 *   description: string
 *   matchPath: (path: string) => boolean
 * }} options
 */
export function writeOpenApiSubset({
  outputFileName,
  subsetTitle,
  description,
  matchPath,
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

  writeFileSync(outputPath, `${JSON.stringify(subset, null, 2)}\n`)
  console.log(`Wrote ${outputPath} (${pathCount} paths)`)
}

/** @param {string[]} prefixes */
export function matchPathPrefixes(prefixes) {
  return path => prefixes.some(prefix => path.startsWith(prefix))
}
