/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/auth/lib/resolve-admin-gnb-role-label.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { resolveAdminGnbRoleLabel } from './resolve-admin-gnb-role-label.ts'

assert.equal(resolveAdminGnbRoleLabel('MASTER', 'verified'), '최고관리자')
assert.equal(resolveAdminGnbRoleLabel('GENERAL', 'verified'), '관리자')
assert.equal(resolveAdminGnbRoleLabel(undefined, 'verified'), '관리자')
assert.equal(resolveAdminGnbRoleLabel('PM', 'verified'), '관리자')
assert.equal(resolveAdminGnbRoleLabel('UNKNOWN', 'verified'), '관리자')

assert.equal(resolveAdminGnbRoleLabel('MASTER', 'unverified'), '관리자')
assert.equal(resolveAdminGnbRoleLabel(undefined, 'unverified'), '관리자')

console.log('resolve-admin-gnb-role-label selfcheck: ok')
