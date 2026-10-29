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
const tableCss = readFileSync(join(root, 'src/table/admin-data-table.css'), 'utf8')
const footerCss = readFileSync(
  join(root, '../../apps/admin/src/features/footer/ui/section-shared.css'),
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
assert.match(
  tableCss,
  /\.cms-data-table \.ant-table-tbody > tr,\n\.cms-data-table \.ant-table-tbody > tr > th,\n\.cms-data-table \.ant-table-tbody > tr > td \{\n  transition: none !important;/
)
assert.doesNotMatch(
  tableCss,
  /\.cms-data-table \.ant-table-tbody > tr[^{}]*:hover[^{}]*\{[^}]*\b(?:padding|height|min-height|max-height|border-width)\s*:/s
)
assert.match(
  footerCss,
  /\.footer-top-menu-table\.footer-sortable-table\.cms-data-table/
)
assert.match(
  footerCss,
  /\.footer-related-logos-table\.footer-sortable-table\.cms-data-table/
)
assert.match(footerCss, /white-space: nowrap !important;/)

console.log('admin-ui r52-table-ssot-contract.test.mjs ok')
