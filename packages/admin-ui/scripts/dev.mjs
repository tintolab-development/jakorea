import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { copyCssFiles, watchCssFiles } from '../../form-template-runtime/scripts/copy-css-lib.mjs'
import { acquireDevLock, releaseDevLock } from '../../form-template-runtime/scripts/dev-lock.mjs'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const srcDir = join(root, 'src')
const distDir = join(root, 'dist')
const lockPath = join(root, '.dev-watch.lock')

const ASSET_EXTS = ['.css', '.svg']
copyCssFiles(srcDir, distDir, { prune: true, extensions: ASSET_EXTS })

const held = acquireDevLock(lockPath)
if (!held) {
  console.log('[admin-ui] TS/CSS watch is already running; this process waits until interrupted.')
  await new Promise(resolve => {
    const stop = () => resolve(undefined)
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  })
  process.exit(0)
}

const cssWatcher = watchCssFiles(srcDir, distDir, { extensions: ASSET_EXTS })
const tsc = spawn('pnpm', ['exec', 'tsc', '-w', '-p', 'tsconfig.build.json'], {
  cwd: root,
  stdio: 'inherit',
})

let shuttingDown = false
function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  cssWatcher.close()
  if (!tsc.killed) tsc.kill(signal)
  releaseDevLock(lockPath, true)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

tsc.on('exit', code => {
  cssWatcher.close()
  releaseDevLock(lockPath, true)
  if (!shuttingDown) process.exit(code ?? 0)
})
