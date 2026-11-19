/**
 * Node-only resolver for Platform's existing Vite/TypeScript "@/..." alias.
 * Used exclusively by selfcheck child processes (not by production bundles).
 */
import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = join(appRoot, 'src')

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith('@/')) return nextResolve(specifier, context)
    const relative = specifier.slice(2)
    const requested = resolve(srcRoot, relative)
    if (!(requested === srcRoot || requested.startsWith(srcRoot + sep))) {
      throw new Error('Unsafe Platform alias path: ' + specifier)
    }

    const candidates = [
      requested,
      requested + '.ts',
      requested + '.js',
      join(requested, 'index.ts'),
      join(requested, 'index.js'),
    ]
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return nextResolve(pathToFileURL(candidate).href, context)
      }
    }
    return nextResolve(specifier, context)
  },
})
