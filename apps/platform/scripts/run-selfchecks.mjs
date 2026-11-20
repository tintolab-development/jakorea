/**
 * Execute the existing Platform selfchecks one by one.
 * Windows cmd.exe cannot launch the former ~12KB chained npm "test" command.
 * Each check is still run with the same Node flags; failures stop the suite.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tests = JSON.parse(readFileSync(resolve(root, 'scripts/selfcheck-files.json'), 'utf8'))

if (!Array.isArray(tests) || tests.length === 0 || new Set(tests).size !== tests.length) {
  throw new Error('Selfcheck manifest is empty, duplicated or invalid')
}

for (const [index, test] of tests.entries()) {
  if (typeof test !== 'string' || !test.startsWith('src/') || !test.endsWith('.selfcheck.ts') || !/^[a-zA-Z0-9_./-]+$/.test(test) || test.includes('..')) {
    throw new Error('Unexpected selfcheck path at index ' + index)
  }
  if (!existsSync(resolve(root, test))) {
    throw new Error('Missing selfcheck file: ' + test)
  }
}

for (const [index, test] of tests.entries()) {
  console.log('SELFCHECK_START|' + (index + 1) + '/' + tests.length + '|' + test)
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--experimental-transform-types', '--import', './scripts/register-selfcheck-alias.mjs', test],
    { cwd: root, stdio: 'inherit', shell: false },
  )
  if (result.error || result.status !== 0) {
    console.error('SELFCHECK_FAIL|' + (index + 1) + '/' + tests.length + '|' + test)
    if (result.error) console.error(result.error)
    process.exit(result.status || 1)
  }
}
console.log('PLATFORM_SELFCHECK_ALL_PASS|' + tests.length)
