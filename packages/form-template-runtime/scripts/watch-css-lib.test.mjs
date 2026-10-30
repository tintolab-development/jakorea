import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { setTimeout as delay } from 'node:timers/promises'
import { copyCssFiles, watchCssFiles } from './copy-css-lib.mjs'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const root = join(tmpdir(), `form-template-runtime-css-watch-${process.pid}`)
const srcDir = join(root, 'src')
const distDir = join(root, 'dist')

rmSync(root, { recursive: true, force: true })
mkdirSync(join(srcDir, 'detail-info-form'), { recursive: true })
writeFileSync(join(srcDir, 'detail-info-form', 'a.css'), '.a{color:red}')
copyCssFiles(srcDir, distDir, { prune: true })

const watcher = watchCssFiles(srcDir, distDir, { debounceMs: 20 })
try {
  writeFileSync(join(srcDir, 'detail-info-form', 'a.css'), '.a{color:blue}')
  writeFileSync(join(srcDir, 'detail-info-form', 'b.css'), '.b{opacity:1}')
  await delay(200)
  assert(
    readFileSync(join(distDir, 'detail-info-form', 'a.css'), 'utf8') === '.a{color:blue}',
    'watch copies edits'
  )
  assert(
    readFileSync(join(distDir, 'detail-info-form', 'b.css'), 'utf8') === '.b{opacity:1}',
    'watch copies adds'
  )

  rmSync(join(srcDir, 'detail-info-form', 'b.css'))
  await delay(200)
  let gone = false
  try {
    readFileSync(join(distDir, 'detail-info-form', 'b.css'))
  } catch {
    gone = true
  }
  assert(gone, 'watch prunes deletes')
  console.log('watch-css-lib.test.mjs ok')
} finally {
  watcher.close()
  rmSync(root, { recursive: true, force: true })
}
