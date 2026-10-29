import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const pkg = join(dirname(fileURLToPath(import.meta.url)), '..')

assert.equal(existsSync(join(repo, 'packages/admin-list')), false)

const pageTabs = readFileSync(join(pkg, 'src/tabs/admin-page-tabs.tsx'), 'utf8')
const textTabs = readFileSync(join(pkg, 'src/tabs/admin-text-tabs.tsx'), 'utf8')
assert.doesNotMatch(pageTabs, /react-router/)
assert.doesNotMatch(pageTabs, /useNavigate|useLocation|useSearchParams/)
assert.doesNotMatch(pageTabs, /WRITING|ISSUANCE/)
assert.match(pageTabs, /value: Value/)
assert.match(pageTabs, /onChange: \(value: Value\) => void/)
assert.match(textTabs, /count\?: number/)
assert.doesNotMatch(textTabs, /react-router/)

const cmsWrapper = readFileSync(join(repo, 'apps/cms/src/shared/ui/cms-text-tabs.tsx'), 'utf8')
const adminWrapper = readFileSync(join(repo, 'apps/admin/src/shared/ui/cms-text-tabs.tsx'), 'utf8')
assert.match(cmsWrapper, /AdminPageTabs as CmsPageTabs/)
assert.match(adminWrapper, /AdminPageTabs as CmsPageTabs/)

const template = readFileSync(join(repo, 'apps/cms/src/pages/templates/template-list-page.tsx'), 'utf8')
assert.match(template, /<CmsPageTabs/)
assert.match(template, /handleFormTabChange/)
assert.match(template, /tab: key/)

const payments = readFileSync(
  join(repo, 'apps/cms/src/pages/settlement-management/account-payments-page.tsx'),
  'utf8'
)
assert.match(payments, /<CmsPageTabs/)
assert.doesNotMatch(payments, /account-payments-page__tab--active/)
assert.match(payments, /AP_YEAR_PARAM/)

const paymentsCss = readFileSync(
  join(repo, 'apps/cms/src/pages/settlement-management/account-payments-page.css'),
  'utf8'
)
assert.doesNotMatch(paymentsCss, /\.account-payments-page__tab\s*\{/)

console.log('admin-ui r52-tabs-ssot-contract.test.mjs ok')
