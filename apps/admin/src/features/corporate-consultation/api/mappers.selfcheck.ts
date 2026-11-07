/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     --import ./scripts/register-src-alias.mjs \
 *     src/features/corporate-consultation/api/mappers.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { ConsultationListItemStatus } from '../../../shared/api/generated/sponsorship/schemas/consultationListItemStatus.ts'

function displayServerPiiAsIs(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}
import {
  mapConsultationListItemToDomain,
  toConsultationListParams,
} from './mappers.ts'

const mapped = mapConsultationListItemToDomain({
  id: 1,
  status: ConsultationListItemStatus.PENDING,
  companyName: 'JA Korea',
  contactName: '홍길동',
  departmentTitle: '기획팀',
  maskedContactPhone: '010-****-5678',
  createdAt: '2026-11-07T00:00:00+09:00',
  version: 1,
})

assert.equal(mapped.contactName, '홍길동')
assert.equal(displayServerPiiAsIs(mapped.contactName), '홍길동')
assert.equal(mapped.phone, '010-****-5678')
assert.equal(displayServerPiiAsIs(mapped.phone), '010-****-5678')

const emptyName = mapConsultationListItemToDomain({
  id: 2,
  contactName: null,
  maskedContactPhone: '010-****-1111',
})
assert.equal(emptyName.contactName, '')
assert.equal(displayServerPiiAsIs(emptyName.contactName), '-')
assert.notEqual(emptyName.contactName, '홍**')
assert.notEqual(emptyName.contactName, '*')

const params = toConsultationListParams({ contactName: '길동' })
assert.equal(params.contactName, '길동')

console.log('corporate-consultation list name selfcheck: ok')
