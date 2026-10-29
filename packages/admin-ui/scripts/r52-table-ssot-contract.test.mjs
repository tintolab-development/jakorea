import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tableSrc = readFileSync(join(root, 'src/table/admin-data-table.tsx'), 'utf8')
const cmsWrapper = readFileSync(
  join(root, '../../apps/cms/src/shared/ui/cms-data-table.tsx'),
  'utf8'
)
const adminWrapper = readFileSync(
  join(root, '../../apps/admin/src/shared/ui/cms-data-table.tsx'),
  'utf8'
)

assert.match(tableSrc, /TableProps<RecordType>/)
assert.match(tableSrc, /\{\.\.\.rest\}/)
assert.match(tableSrc, /AdminDataTable\.Summary = Table\.Summary/)
assert.doesNotMatch(tableSrc, /onChange\s*=/)
assert.match(cmsWrapper, /from '@jakorea\/admin-ui\/table'/)
assert.match(adminWrapper, /from '@jakorea\/admin-ui\/table'/)
assert.match(adminWrapper, /CmsDataTable\.Summary = AdminDataTable\.Summary/)
assert.doesNotMatch(adminWrapper, /from 'antd'/)

console.log('admin-ui r52-table-ssot-contract.test.mjs ok')
