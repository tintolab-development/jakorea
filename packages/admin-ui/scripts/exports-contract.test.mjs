import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const tokens = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8')
const cmsVite = readFileSync(join(root, '../../apps/cms/vite.config.ts'), 'utf8')
const adminVite = readFileSync(join(root, '../../apps/admin/vite.config.ts'), 'utf8')

assert(pkg.name === '@jakorea/admin-ui', 'package name')
assert(pkg.exports['.'].import === './dist/index.js', 'root JS export')
assert(pkg.exports['./theme'].import === './dist/theme/index.js', 'theme subpath')
assert(pkg.exports['./styles'].import === './dist/styles/admin-ui.css', 'styles subpath')
assert(pkg.exports['./styles'].types === './styles.d.ts', 'styles types shim')
assert(pkg.exports['./button'].import === './dist/button/index.js', 'button subpath')
assert(pkg.exports['./field'].import === './dist/field/index.js', 'field subpath')
assert(pkg.exports['./input'].import === './dist/input/index.js', 'input subpath')
assert(pkg.exports['./select'].import === './dist/select/index.js', 'select subpath')
assert(pkg.exports['./modal'].import === './dist/modal/index.js', 'modal subpath')
assert(pkg.exports['./tabs'].import === './dist/tabs/index.js', 'tabs subpath')
assert(pkg.exports['./table'].import === './dist/table/index.js', 'table subpath')
assert(pkg.exports['./empty'].import === './dist/empty/index.js', 'empty subpath')
assert(pkg.exports['./date'].import === './dist/date/index.js', 'date subpath')
assert(pkg.exports['./auth'].import === './dist/auth/index.js', 'auth subpath')
assert(pkg.exports['./auth/styles'].import === './dist/auth/admin-auth.css', 'auth styles subpath')
assert(!tokens.includes('@font-face'), 'tokens must not embed font-face')
assert(!tokens.includes('url('), 'tokens must not embed app asset URLs')
assert(!tokens.includes('--color-school:'), 'domain school color stays in apps')
assert(!tokens.includes('--color-instructor:'), 'domain instructor color stays in apps')
assert(!cmsVite.includes("packages/admin-ui/src"), 'CMS must not alias admin-ui src')
assert(!adminVite.includes("packages/admin-ui/src"), 'Admin must not alias admin-ui src')

const distFiles = [
  'dist/index.js',
  'dist/index.d.ts',
  'dist/theme/index.js',
  'dist/styles/admin-ui.css',
  'dist/styles/tokens.css',
  'dist/button/index.js',
  'dist/field/index.js',
  'dist/input/index.js',
  'dist/select/index.js',
  'dist/button/admin-button.css',
  'dist/field/admin-field.css',
  'dist/input/admin-input.css',
  'dist/select/admin-select.css',
  'dist/modal/index.js',
  'dist/tabs/index.js',
  'dist/table/index.js',
  'dist/empty/index.js',
  'dist/date/index.js',
  'dist/auth/index.js',
  'dist/auth/admin-auth.css',
]
for (const rel of distFiles) {
  assert(existsSync(join(root, rel)), `missing ${rel}`)
}

console.log('admin-ui exports-contract.test.mjs ok')
