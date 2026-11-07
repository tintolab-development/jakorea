/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     --import ./scripts/register-src-alias.mjs \
 *     src/features/talent-donation-application/api/mappers.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { TalentApplicationListItemStatus } from '../../../shared/api/generated/sponsorship/schemas/talentApplicationListItemStatus.ts'

function displayServerPiiAsIs(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}
import {
  mapTalentApplicationListItemToDomain,
  toTalentApplicationListParams,
} from './mappers.ts'

const mapped = mapTalentApplicationListItemToDomain({
  id: 1,
  status: TalentApplicationListItemStatus.pending,
  name: '홍길동',
  phone: '010-****-5678',
  email: 'hong***@example.com',
  jaParticipation: 'no',
  appliedAt: '2026-11-07T00:00:00+09:00',
})

assert.equal(mapped.applicantName, '홍길동')
assert.equal(displayServerPiiAsIs(mapped.applicantName), '홍길동')
assert.equal(mapped.phone, '010-****-5678')
assert.equal(displayServerPiiAsIs(mapped.phone), '010-****-5678')
assert.equal(mapped.email, 'hong***@example.com')
assert.equal(displayServerPiiAsIs(mapped.email), 'hong***@example.com')

const emptyName = mapTalentApplicationListItemToDomain({
  id: 2,
  name: null,
  phone: '010-****-1111',
  email: 'a***@b.com',
})
assert.equal(emptyName.applicantName, '')
assert.equal(displayServerPiiAsIs(emptyName.applicantName), '-')
assert.notEqual(emptyName.applicantName, '홍**')
assert.notEqual(emptyName.applicantName, '*')

const params = toTalentApplicationListParams({ applicantName: '길동' })
assert.equal(params.applicantName, '길동')

console.log('talent-donation-application list name selfcheck: ok')
