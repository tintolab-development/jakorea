import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeAdminDataTableClassName } from '../dist/table/table-class.js'
import { ADMIN_MODAL_SIZE_WIDTH } from '../dist/modal/modal-size.js'
import { CMS_TABLE_EMPTY_COPY_GUARD } from './step4-empty-copy-guard.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const emptySrc = readFileSync(join(root, 'src/empty/admin-empty-state.tsx'), 'utf8')
assert(!emptySrc.includes('등록된 데이터가 없습니다'), 'empty must not embed domain copy')
assert(!emptySrc.includes('프로그램이 없습니다'), 'empty must not embed domain copy')
assert(!emptySrc.includes('회원이 없습니다'), 'empty must not embed domain copy')
assert.equal(CMS_TABLE_EMPTY_COPY_GUARD, true)

assert.equal(ADMIN_MODAL_SIZE_WIDTH.compact, 600)
assert.equal(ADMIN_MODAL_SIZE_WIDTH.default, 800)
assert.equal(ADMIN_MODAL_SIZE_WIDTH.full, undefined)

assert.equal(mergeAdminDataTableClassName(undefined), 'cms-data-table')
assert.equal(
  mergeAdminDataTableClassName('cms-data-table extra'),
  'cms-data-table extra'
)

for (const rel of [
  'dist/modal/index.js',
  'dist/tabs/index.js',
  'dist/table/index.js',
  'dist/empty/index.js',
  'dist/date/index.js',
  'dist/table/admin-data-table.css',
  'dist/modal/teal-header-modal.css',
]) {
  assert(existsSync(join(root, rel)), `missing ${rel}`)
}

console.log('admin-ui step4-contract.test.mjs ok')
