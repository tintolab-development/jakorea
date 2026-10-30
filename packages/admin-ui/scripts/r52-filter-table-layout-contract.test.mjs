import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const adminLayout = readFileSync(
  join(root, 'apps/admin/src/shared/ui/filter-table-layout.tsx'),
  'utf8'
)
const cmsLayout = readFileSync(
  join(root, 'apps/cms/src/shared/components/filter-table-layout.tsx'),
  'utf8'
)

assert.equal(existsSync(join(root, 'packages/admin-list')), false)
assert.doesNotMatch(adminLayout, /excelExport/)
assert.doesNotMatch(adminLayout, /toolbarAdminAction/)
assert.doesNotMatch(adminLayout, /useSessionAdminRoleCode/)
assert.doesNotMatch(adminLayout, /onAdminWriteClickCapture/)
assert.match(adminLayout, /filter\?: ReactNode/)
assert.match(cmsLayout, /excelExport/)
assert.match(cmsLayout, /toolbarAdminAction/)

const popup = readFileSync(join(root, 'apps/admin/src/pages/main/popups/page.tsx'), 'utf8')
assert.match(popup, /<FilterTableLayout/)
assert.match(popup, /pendingFilters\.isActive/)
assert.match(popup, /handleSearch/)

const filtered = [
  'apps/admin/src/pages/education/textbooks/page.tsx',
  'apps/admin/src/pages/logs/bugs/page.tsx',
  'apps/admin/src/pages/logs/member-login/page.tsx',
  'apps/admin/src/pages/ja-korea/notices/page.tsx',
  'apps/admin/src/pages/impact/stories/page.tsx',
  'apps/admin/src/pages/ja-korea/recruit/postings/page.tsx',
  'apps/admin/src/pages/ja-korea/recruit/applicants/page.tsx',
  'apps/admin/src/pages/sponsor/talent/applications/page.tsx',
  'apps/admin/src/pages/sponsor/corporate/consultations/page.tsx',
  'apps/admin/src/pages/sponsor/corporate/partners/page.tsx',
  'apps/admin/src/pages/main/strip-banners/page.tsx',
  'apps/admin/src/pages/stats/menu-views/page.tsx',
  'apps/admin/src/pages/stats/visitors/page.tsx',
  'apps/admin/src/features/reports-disclosure/ui/report-list-panel.tsx',
  'apps/admin/src/features/history-awards-certs/ui/history-panel.tsx',
  'apps/admin/src/features/history-awards-certs/ui/award-panel.tsx',
  'apps/admin/src/features/history-awards-certs/ui/cert-panel.tsx',
]
for (const rel of filtered) {
  const src = readFileSync(join(root, rel), 'utf8')
  assert.match(src, /<FilterTableLayout/, `${rel} must use FilterTableLayout`)
}

const simple = readFileSync(
  join(root, 'apps/admin/src/pages/main/hero-banners/page.tsx'),
  'utf8'
)
assert.doesNotMatch(simple, /FilterTableLayout/)
assert.match(simple, /HeroBannersSortableTable/)
assert.match(
  readFileSync(
    join(root, 'apps/admin/src/features/hero-banner/ui/sortable-table.tsx'),
    'utf8'
  ),
  /CmsDataTable/
)

console.log('admin-ui r52-filter-table-layout-contract.test.mjs ok')
