import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  watch,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'

function walkByExt(dir, ext, acc = []) {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walkByExt(full, ext, acc)
      continue
    }
    if (entry.endsWith(ext)) acc.push(full)
  }
  return acc
}

function filesEqual(a, b) {
  if (!existsSync(a) || !existsSync(b)) return false
  const left = readFileSync(a)
  const right = readFileSync(b)
  if (left.length !== right.length) return false
  return left.equals(right)
}

/**
 * src 트리의 CSS를 dist에 동일 상대경로로 복사한다.
 * prune=true 이면 src에 없는 dist CSS를 삭제한다.
 */
export function copyCssFiles(srcDir, distDir, options = {}) {
  const prune = options.prune === true
  const extensions = options.extensions ?? ['.css']
  const copied = []
  const skipped = []
  const pruned = []

  function matchesExt(name) {
    return extensions.some(ext => name.endsWith(ext))
  }

  function walkCopy(dir) {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        walkCopy(full)
        continue
      }
      if (!matchesExt(entry)) continue
      const rel = relative(srcDir, full)
      const target = join(distDir, rel)
      if (filesEqual(full, target)) {
        skipped.push(rel)
        continue
      }
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, readFileSync(full))
      copied.push(rel)
    }
  }

  walkCopy(srcDir)

  if (prune) {
    for (const ext of extensions) {
      for (const distFile of walkByExt(distDir, ext)) {
        const rel = relative(distDir, distFile)
        const srcFile = join(srcDir, rel)
        if (!existsSync(srcFile)) {
          rmSync(distFile)
          pruned.push(rel)
        }
      }
    }
  }

  return { copied, skipped, pruned }
}

export function watchCssFiles(srcDir, distDir, options = {}) {
  const debounceMs = options.debounceMs ?? 50
  const extensions = options.extensions ?? ['.css']
  const timers = new Map()

  const watcher = watch(srcDir, { recursive: true }, (_event, filename) => {
    if (!filename) return
    const name = String(filename)
    if (!extensions.some(ext => name.endsWith(ext))) return
    const rel = name
    const prev = timers.get(rel)
    if (prev) clearTimeout(prev)
    timers.set(
      rel,
      setTimeout(() => {
        timers.delete(rel)
        copyCssFiles(srcDir, distDir, { prune: true, extensions })
      }, debounceMs)
    )
  })

  return {
    close() {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
      watcher.close()
    },
  }
}
