import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../src')

function resolveAlias(specifier) {
  const rest = specifier.slice(2)
  const base = join(srcRoot, rest)
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return pathToFileURL(candidate).href
  }
  return pathToFileURL(`${base}.ts`).href
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    return { shortCircuit: true, url: resolveAlias(specifier) }
  }
  return nextResolve(specifier, context)
}
