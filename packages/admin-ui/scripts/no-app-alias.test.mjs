import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const srcRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../src')
const forbidden = /from ['"]@\/|from ['"]@jakorea\/cms|apps\/cms|apps\/admin/

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full, acc)
      continue
    }
    if (/\.(ts|tsx|css|mjs|js)$/.test(entry)) acc.push(full)
  }
  return acc
}

for (const file of walk(srcRoot)) {
  const text = readFileSync(file, 'utf8')
  if (forbidden.test(text)) {
    throw new Error(`app alias import in ${file}`)
  }
}

console.log('admin-ui no-app-alias.test.mjs ok')
