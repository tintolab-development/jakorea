import { cpSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const srcDir = join(root, 'src')
const distDir = join(root, 'dist')

function walkCopy(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walkCopy(full)
      continue
    }
    if (!entry.endsWith('.css')) continue
    const rel = relative(srcDir, full)
    const target = join(distDir, rel)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(full, target)
  }
}

walkCopy(srcDir)
