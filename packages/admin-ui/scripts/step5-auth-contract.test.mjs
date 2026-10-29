import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const css = readFileSync(join(root, 'src/auth/admin-auth.css'), 'utf8')
const src = readFileSync(join(root, 'src/auth/admin-auth.tsx'), 'utf8')
const index = readFileSync(join(root, 'src/index.ts'), 'utf8')

assert.equal(pkg.exports['./auth'].import, './dist/auth/index.js')
assert.equal(pkg.exports['./auth/styles'].import, './dist/auth/admin-auth.css')
assert.match(css, /\.auth-page/)
assert.match(css, /\.auth-card/)
assert.match(css, /\.auth-label/)
assert.doesNotMatch(src, /fetch\(|localStorage|sessionStorage|cookie/i)
assert.doesNotMatch(src, /login|signup|mfa|token/i)
assert.match(index, /AdminAuthPage/)
assert.match(index, /AdminAuthFormLabel/)
assert.equal(existsSync(join(root, '../admin-shell')), false, 'must not create admin-shell')
assert.equal(existsSync(join(root, '../admin-list')), false, 'must not create admin-list')

for (const rel of ['dist/auth/index.js', 'dist/auth/admin-auth.css']) {
  assert.equal(existsSync(join(root, rel)), true, `missing ${rel}`)
}

console.log('admin-ui step5-auth-contract.test.mjs ok')
