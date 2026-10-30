/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/auth/lib/format-admin-gnb-role-label.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { formatAdminGnbRoleLabel } from './format-admin-gnb-role-label.ts'

assert.equal(formatAdminGnbRoleLabel('MASTER'), '최고관리자')
assert.equal(formatAdminGnbRoleLabel('GENERAL'), '관리자')
assert.equal(formatAdminGnbRoleLabel(undefined), '관리자')
assert.equal(formatAdminGnbRoleLabel(null), '관리자')
assert.equal(formatAdminGnbRoleLabel(''), '관리자')
assert.equal(formatAdminGnbRoleLabel('PM'), '관리자')
assert.equal(formatAdminGnbRoleLabel('master'), '관리자')
assert.equal(formatAdminGnbRoleLabel('UNKNOWN'), '관리자')

console.log('format-admin-gnb-role-label selfcheck: ok')
