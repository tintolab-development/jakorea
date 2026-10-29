import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(scriptDir, '..')
const appArgs = process.argv.slice(2)

if (appArgs.length === 0) {
  console.error('usage: run-with-dev.mjs <command> [args...]')
  process.exit(1)
}

const watchers = [
  spawn(process.execPath, [join(scriptDir, 'dev.mjs')], {
    cwd: pkgRoot,
    stdio: 'inherit',
  }),
  spawn(process.execPath, [join(pkgRoot, '../admin-ui/scripts/dev.mjs')], {
    cwd: join(pkgRoot, '../admin-ui'),
    stdio: 'inherit',
  }),
]

const app = spawn(appArgs[0], appArgs.slice(1), {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true,
})

function stopChild(child, signal) {
  if (!child.killed) child.kill(signal)
}

function shutdown(signal) {
  stopChild(app, signal)
  for (const child of watchers) stopChild(child, signal)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

app.on('exit', code => {
  for (const child of watchers) stopChild(child, 'SIGTERM')
  process.exit(code ?? 0)
})
