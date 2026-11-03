/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/recruit-posting/lib/resolve-current-admin-author-name.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { resolveCurrentAdminAuthorName } from './resolve-current-admin-author-name.ts'

const created = resolveCurrentAdminAuthorName({
  mode: 'create',
  meName: '  김관리  ',
  meQueryEnabled: true,
  meQueryStatus: 'success',
})
assert.equal(created.status, 'ready')
if (created.status === 'ready') assert.equal(created.authorName, '김관리')

const loading = resolveCurrentAdminAuthorName({
  mode: 'create',
  meQueryEnabled: true,
  meQueryStatus: 'pending',
})
assert.equal(loading.status, 'loading')

const missing = resolveCurrentAdminAuthorName({
  mode: 'create',
  meName: '  ',
  meQueryEnabled: true,
  meQueryStatus: 'success',
})
assert.equal(missing.status, 'unavailable')

const failed = resolveCurrentAdminAuthorName({
  mode: 'create',
  meName: '',
  meQueryEnabled: true,
  meQueryStatus: 'error',
})
assert.equal(failed.status, 'unavailable')

const disabled = resolveCurrentAdminAuthorName({
  mode: 'create',
  meQueryEnabled: false,
  meQueryStatus: 'pending',
})
assert.equal(disabled.status, 'unavailable')

const cachedAfterError = resolveCurrentAdminAuthorName({
  mode: 'create',
  meName: '김관리',
  meQueryEnabled: true,
  meQueryStatus: 'error',
})
assert.equal(cachedAfterError.status, 'ready')
if (cachedAfterError.status === 'ready') assert.equal(cachedAfterError.authorName, '김관리')

const edited = resolveCurrentAdminAuthorName({
  mode: 'edit',
  existingAuthorName: '기존작성자',
  meName: '김관리',
  meQueryEnabled: false,
  meQueryStatus: 'pending',
})
assert.equal(edited.status, 'ready')
if (edited.status === 'ready') assert.equal(edited.authorName, '기존작성자')

console.log('resolve-current-admin-author-name selfcheck: ok')
