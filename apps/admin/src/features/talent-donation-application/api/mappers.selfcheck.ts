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
  mapTalentApplicationDetailToDomain,
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

// 스펙은 nullable이 아니지만 BE 런타임은 빈 값을 null로 보낼 수 있다 — null 입력을 그대로 검증한다.
const emptyName = mapTalentApplicationListItemToDomain({
  id: 2,
  name: null,
  phone: '010-****-1111',
  email: 'a***@b.com',
} as unknown as Parameters<typeof mapTalentApplicationListItemToDomain>[0])
assert.equal(emptyName.applicantName, '')
assert.equal(displayServerPiiAsIs(emptyName.applicantName), '-')
assert.notEqual(emptyName.applicantName, '홍**')
assert.notEqual(emptyName.applicantName, '*')

const params = toTalentApplicationListParams({ applicantName: '길동' })
assert.equal(params.applicantName, '길동')

// 상세 — HOMEPAGE_PII_VIEW 없음(Program Viewer): 원문 생년월일·성별은 null, 마스킹 값을 그대로 넘긴다
const maskedDetail = mapTalentApplicationDetailToDomain({
  id: 3,
  name: '홍길동',
  birthDate: null,
  gender: null,
  phone: '010-****-5678',
  piiMasked: true,
  maskedBirthDate: '2000.**.**',
  maskedGender: '**',
})
assert.equal(maskedDetail.piiMasked, true)
assert.equal(maskedDetail.maskedBirthDate, '2000.**.**')
assert.equal(maskedDetail.maskedGender, '**')
assert.equal(maskedDetail.birthDate, '')
assert.equal(maskedDetail.phone, '010-****-5678')

const originalDetail = mapTalentApplicationDetailToDomain({
  id: 4,
  name: '홍길동',
  birthDate: '2000-03-15',
  gender: 'female',
  piiMasked: false,
  maskedBirthDate: null,
  maskedGender: null,
})
assert.equal(originalDetail.piiMasked, false)
assert.equal(originalDetail.gender, 'female')
assert.equal(originalDetail.birthDate, '2000-03-15')
assert.equal(originalDetail.maskedBirthDate, null)

console.log('talent-donation-application list name selfcheck: ok')
