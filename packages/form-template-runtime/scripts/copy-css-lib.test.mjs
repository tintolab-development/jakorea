import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { copyCssFiles } from './copy-css-lib.mjs'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const root = join(tmpdir(), `form-template-runtime-css-${process.pid}`)
const srcDir = join(root, 'src')
const distDir = join(root, 'dist')

try {
  rmSync(root, { recursive: true, force: true })
  mkdirSync(join(srcDir, 'detail-info-form'), { recursive: true })
  writeFileSync(join(srcDir, 'detail-info-form', 'detail-info-form.css'), '.a{color:red}')
  writeFileSync(join(srcDir, 'orphan.css'), '.gone{display:none}')

  const first = copyCssFiles(srcDir, distDir, { prune: true })
  assert(first.copied.includes('detail-info-form/detail-info-form.css'), 'copies nested css')
  assert(first.copied.includes('orphan.css'), 'copies root css')
  assert(
    readFileSync(join(distDir, 'detail-info-form', 'detail-info-form.css'), 'utf8') ===
      '.a{color:red}',
    'copied content matches'
  )

  const second = copyCssFiles(srcDir, distDir, { prune: true })
  assert(second.copied.length === 0, 'skips unchanged files')
  assert(second.skipped.includes('detail-info-form/detail-info-form.css'), 'records skipped copy')

  writeFileSync(join(srcDir, 'detail-info-form', 'detail-info-form.css'), '.a{color:blue}')
  mkdirSync(join(srcDir, 'host'), { recursive: true })
  writeFileSync(join(srcDir, 'host', 'new.css'), '.n{opacity:1}')
  rmSync(join(srcDir, 'orphan.css'))

  const third = copyCssFiles(srcDir, distDir, { prune: true })
  assert(third.copied.includes('detail-info-form/detail-info-form.css'), 'updates edited css')
  assert(third.copied.includes('host/new.css'), 'copies added css')
  assert(third.pruned.includes('orphan.css'), 'prunes deleted css')
  assert(
    readFileSync(join(distDir, 'detail-info-form', 'detail-info-form.css'), 'utf8') ===
      '.a{color:blue}',
    'edit reaches dist'
  )

  let orphanGone = false
  try {
    readFileSync(join(distDir, 'orphan.css'))
  } catch {
    orphanGone = true
  }
  assert(orphanGone, 'deleted src css is removed from dist')

  console.log('copy-css-lib.test.mjs ok')
} finally {
  rmSync(root, { recursive: true, force: true })
}
