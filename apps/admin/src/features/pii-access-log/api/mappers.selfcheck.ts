/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     --import ./scripts/register-src-alias.mjs \
 *     src/features/pii-access-log/api/mappers.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { displayLogField } from '../../logs/shared/lib/display-log-field.ts'
import {
  mapPrivacyAccessPageToDomain,
  toPrivacyAccessExportParams,
  toPrivacyAccessParams,
} from './mappers.ts'

const mapped = mapPrivacyAccessPageToDomain({
  items: [
    {
      id: 1,
      adminName: '관리자',
      targetName: '홍길동',
      accessPurpose: '상담 확인',
      clientIp: '127.0.0.1',
      createdAt: '2026-11-07T00:00:00+09:00',
    },
  ],
  totalCount: 1,
})

assert.equal(mapped.rows[0]?.targetName, '홍길동')
assert.equal(displayLogField(mapped.rows[0]?.targetName), '홍길동')
assert.equal(mapped.rows[0]?.accessorName, '관리자')

const emptyName = mapPrivacyAccessPageToDomain({
  items: [{ id: 2, targetName: null }],
  totalCount: 1,
})
assert.equal(emptyName.rows[0]?.targetName, '')
assert.equal(displayLogField(emptyName.rows[0]?.targetName), '-')
assert.notEqual(emptyName.rows[0]?.targetName, '홍**')
assert.notEqual(emptyName.rows[0]?.targetName, '*')

const listParams = toPrivacyAccessParams({ targetName: '길동' })
assert.equal(listParams.targetName, '길동')

const exportParams = toPrivacyAccessExportParams({ targetName: '길동' })
assert.equal(exportParams.targetName, '길동')

console.log('pii-access-log list name selfcheck: ok')
