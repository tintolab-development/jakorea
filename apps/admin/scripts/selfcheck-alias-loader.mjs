import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const srcRoot =
  process.env.SELFCHECK_SRC_ROOT?.trim() ||
  resolvePath(dirname(fileURLToPath(import.meta.url)), '../src')

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2)
    const withExt = rel.endsWith('.ts') || rel.endsWith('.tsx') || rel.endsWith('.js') ? rel : `${rel}.ts`
    const target = pathToFileURL(resolvePath(srcRoot, withExt)).href
    return nextResolve(target, context)
  }
  return nextResolve(specifier, context)
}
