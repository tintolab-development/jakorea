/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     --import ./scripts/register-src-alias.mjs \
 *     src/features/recruit-applicant/api/mappers.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { CareerTalentApplicationDetailResponseCareerType } from '../../../shared/api/generated/careers/schemas/careerTalentApplicationDetailResponseCareerType.ts'
import { CareerTalentApplicationDetailResponseEducationLevel } from '../../../shared/api/generated/careers/schemas/careerTalentApplicationDetailResponseEducationLevel.ts'
import { CareerTalentApplicationDetailResponseJobInterest } from '../../../shared/api/generated/careers/schemas/careerTalentApplicationDetailResponseJobInterest.ts'
import { CareerTalentApplicationDetailResponseStatus } from '../../../shared/api/generated/careers/schemas/careerTalentApplicationDetailResponseStatus.ts'
import { CareerTalentApplicationListItemCareerType } from '../../../shared/api/generated/careers/schemas/careerTalentApplicationListItemCareerType.ts'
import { CareerTalentApplicationListItemJobInterest } from '../../../shared/api/generated/careers/schemas/careerTalentApplicationListItemJobInterest.ts'
import { CareerTalentApplicationListItemStatus } from '../../../shared/api/generated/careers/schemas/careerTalentApplicationListItemStatus.ts'
import {
  mapCareerTalentApplicationDetail,
  mapCareerTalentApplicationListItem,
} from './mappers.ts'

const listed = mapCareerTalentApplicationListItem({
  id: 123,
  status: CareerTalentApplicationListItemStatus.PENDING,
  jobInterest: CareerTalentApplicationListItemJobInterest.ACCOUNTING,
  careerType: CareerTalentApplicationListItemCareerType.EXPERIENCED,
  name: '홍길동',
  phone: '010-****-5678',
  email: 'hong***@example.com',
  appliedAt: '2026-11-07T10:00:00Z',
  version: 1,
})
assert.ok(listed)
// 목록: 이름은 원문, 전화·이메일은 서버 마스킹 값을 가공 없이 그대로
assert.equal(listed.applicantName, '홍길동')
assert.equal(listed.phone, '010-****-5678')
assert.equal(listed.email, 'hong***@example.com')

for (const serverPhone of ['02-***-1234', '****']) {
  const row = mapCareerTalentApplicationListItem({
    id: 124,
    status: CareerTalentApplicationListItemStatus.PENDING,
    jobInterest: CareerTalentApplicationListItemJobInterest.ACCOUNTING,
    careerType: CareerTalentApplicationListItemCareerType.EXPERIENCED,
    name: '김철수',
    phone: serverPhone,
    appliedAt: '2026-11-07T10:00:00Z',
    version: 1,
  })
  assert.equal(row?.phone, serverPhone)
}

const detail = mapCareerTalentApplicationDetail({
  id: 123,
  status: CareerTalentApplicationDetailResponseStatus.PENDING,
  jobInterest: CareerTalentApplicationDetailResponseJobInterest.ACCOUNTING,
  careerType: CareerTalentApplicationDetailResponseCareerType.EXPERIENCED,
  name: '홍길동',
  phone: '010-1234-5678',
  email: 'hong@example.com',
  addressRoad: '서울시 종로구 세종대로 1',
  addressDetail: '101호',
  educationLevel: CareerTalentApplicationDetailResponseEducationLevel.UNIVERSITY,
  schoolName: '한국대학교',
  major: '경영학',
  educationInfo: '학력 본문',
  careerInfo: '경력 본문',
  privacyAgreed: true,
  appliedAt: '2026-11-07T10:00:00Z',
  confirmedAt: null,
  confirmedByName: null,
  version: 1,
  attachmentOriginalName: 'resume.pdf',
  attachments: [],
})
assert.ok(detail)
assert.equal(detail.applicantName, '홍길동')
assert.equal(detail.phone, '010-1234-5678')
assert.equal(detail.email, 'hong@example.com')
assert.equal(detail.addressRoad, '서울시 종로구 세종대로 1')
assert.equal(detail.addressDetail, '101호')
assert.equal(detail.schoolName, '한국대학교')
assert.equal(detail.major, '경영학')
assert.equal(detail.educationInfo, '학력 본문')
assert.equal(detail.careerInfo, '경력 본문')
assert.equal(detail.attachmentFileName, 'resume.pdf')
assert.equal(detail.privacyAgreed, true)

// 스펙은 nullable이 아니지만 BE 런타임은 빈 값을 null로 보낼 수 있다 — null 입력을 그대로 검증한다.
const emptyDetail = mapCareerTalentApplicationDetail({
  id: 124,
  status: CareerTalentApplicationDetailResponseStatus.PENDING,
  jobInterest: CareerTalentApplicationDetailResponseJobInterest.OTHER,
  careerType: CareerTalentApplicationDetailResponseCareerType.NEWBIE,
  name: '',
  phone: null,
  email: null,
  addressRoad: null,
  addressDetail: null,
  educationLevel: null,
  schoolName: null,
  major: '',
  educationInfo: null,
  careerInfo: null,
  privacyAgreed: true,
  appliedAt: '2026-11-07T10:00:00Z',
  attachments: [],
} as unknown as Parameters<typeof mapCareerTalentApplicationDetail>[0])
assert.ok(emptyDetail)
assert.equal(emptyDetail.applicantName, null)
assert.equal(emptyDetail.phone, null)
assert.equal(emptyDetail.email, null)
assert.equal(emptyDetail.major, null)
assert.equal(emptyDetail.attachmentFileName, null)
assert.equal(emptyDetail.addressDetail, null)
assert.equal(emptyDetail.educationInfo, null)
assert.equal(emptyDetail.careerInfo, null)

const attachmentNameOnlyFromListFallback = mapCareerTalentApplicationDetail({
  id: 125,
  status: CareerTalentApplicationDetailResponseStatus.PENDING,
  jobInterest: CareerTalentApplicationDetailResponseJobInterest.OTHER,
  careerType: CareerTalentApplicationDetailResponseCareerType.NEWBIE,
  name: '홍길동',
  phone: '010-1234-5678',
  email: 'hong@example.com',
  privacyAgreed: true,
  appliedAt: '2026-11-07T10:00:00Z',
  attachmentOriginalName: null,
  attachments: [{ assetId: 9, originalName: 'should-not-invent.pdf', displayOrder: 0 }],
})
assert.ok(attachmentNameOnlyFromListFallback)
assert.equal(attachmentNameOnlyFromListFallback.attachmentFileName, null)

console.log('recruit-applicant detail original PII selfcheck: ok')
