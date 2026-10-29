import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const pkg = JSON.parse(
  readFileSync(join(repoRoot, 'packages/form-template-runtime/package.json'), 'utf8')
)
const cmsVite = readFileSync(join(repoRoot, 'apps/cms/vite.config.ts'), 'utf8')
const adminVite = readFileSync(join(repoRoot, 'apps/admin/vite.config.ts'), 'utf8')
const platformVite = readFileSync(join(repoRoot, 'apps/platform/vite.config.ts'), 'utf8')

assert(pkg.exports['.'].import === './dist/index.js', 'JS export stays on dist')
assert(
  pkg.exports['./detail-info-form.css'].import === './dist/detail-info-form/detail-info-form.css',
  'CSS export stays on dist'
)
assert(pkg.exports['./styles'].import === './dist/host/form-template-host.css', 'styles export stays on dist')
assert(
  !cmsVite.includes("packages/form-template-runtime/src/detail-info-form/detail-info-form.css"),
  'CMS must not alias DetailInfoForm CSS to src'
)
assert(
  !adminVite.includes("packages/form-template-runtime/src/detail-info-form/detail-info-form.css"),
  'Admin must not alias DetailInfoForm CSS to src'
)
assert(
  cmsVite.includes('FORM_TEMPLATE_RUNTIME_OPTIMIZE_DEPS_EXCLUDE'),
  'CMS excludes package from optimizeDeps'
)
assert(
  adminVite.includes('FORM_TEMPLATE_RUNTIME_OPTIMIZE_DEPS_EXCLUDE'),
  'Admin excludes package from optimizeDeps'
)
assert(
  platformVite.includes('FORM_TEMPLATE_RUNTIME_OPTIMIZE_DEPS_EXCLUDE'),
  'Platform excludes package from optimizeDeps'
)
assert(
  !platformVite.includes("packages/form-template-runtime/src/detail-info-form/detail-info-form.css"),
  'Platform must not alias DetailInfoForm CSS to src'
)

console.log('resolution-contract.test.mjs ok')
