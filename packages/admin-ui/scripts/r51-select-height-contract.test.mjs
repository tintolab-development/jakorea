import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const selectSrc = readFileSync(join(root, 'src/select/admin-select.tsx'), 'utf8')
const selectCss = readFileSync(join(root, 'src/select/admin-select.css'), 'utf8')
const fieldCss = readFileSync(join(root, 'src/field/admin-field.css'), 'utf8')
const fieldTs = readFileSync(join(root, 'src/field/control-size.ts'), 'utf8')
const adminWrapper = readFileSync(
  join(root, '../../apps/admin/src/shared/ui/cms-select.tsx'),
  'utf8'
)

assert.doesNotMatch(
  selectSrc,
  /flex:\s*`0 0 \$\{width\}px`/,
  'numeric width must not set flex-basis (column flex stretch)'
)
assert.match(selectSrc, /flexGrow:\s*0/)
assert.match(selectSrc, /flexShrink:\s*0/)
assert.doesNotMatch(selectSrc, /align-self:\s*stretch/)
assert.doesNotMatch(selectCss, /\.cms-select[^{]*\{[^}]*align-self:\s*stretch/)

assert.match(fieldCss, /\.cms-control--compact\s*\{[^}]*--cms-control-h:\s*32px/)
assert.match(fieldCss, /\.cms-control--small\s*\{[^}]*--cms-control-h:\s*36px/)
assert.match(fieldCss, /\.cms-control--medium\s*\{[^}]*--cms-control-h:\s*40px/)
assert.match(fieldCss, /\.cms-control--large\s*\{[^}]*--cms-control-h:\s*44px/)
assert.match(fieldCss, /\.cms-control--xlarge\s*\{[^}]*--cms-control-h:\s*52px/)

assert.match(
  selectCss,
  /\.cms-select\.cms-field__box:not\(\.cms-select--multiple-ui\)\s*\{[^}]*max-height:\s*var\(--cms-control-h/
)
assert.match(
  selectCss,
  /\.cms-select:not\(\.cms-select--multiple-ui\) \.ant-select\s*\{[^}]*max-height:\s*var\(--cms-control-h/
)

assert.match(fieldTs, /'xlarge' \| 'large' \| 'medium' \| 'small' \| 'compact'/)
assert.match(fieldTs, /cms-control--\$\{size\}/)

assert.match(adminWrapper, /if \(size === 'small'\) return 'compact'/)
assert.doesNotMatch(adminWrapper, /cms-select--stretch|align-self:\s*stretch/)

console.log('admin-ui r51-select-height-contract.test.mjs ok')
