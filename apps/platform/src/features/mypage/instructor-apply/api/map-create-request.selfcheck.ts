/**
 * Platform 강사 신청 → CreateRequest 매핑 검증.
 */
import assert from 'node:assert/strict'
import { INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES } from '@jakorea/domain/instructor/profile-form-values'
import { mapInstructorApplyFormToCreateRequest } from './map-create-request.ts'
import { resolveInstructorEmploymentStatusToSync } from './resolve-employment-status-sync.ts'

const values = {
  ...INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
  name: '홍길동',
  gender: 'male' as const,
  birthDate: '1990.05.01',
  contact: '01012345678',
  email: 'a@b.com',
  homeAddress: '서울시 중구',
  homeAddressDetail: '101호',
  oneLineIntro: '한줄',
  instructorCareer: '5년',
  memberType: 'general' as const,
  affiliationName: 'JA Korea',
  eduSchoolType: 'college4',
  eduStatus: 'graduated',
  educationDetailKeys: ['college4' as const],
  college4Rows: [
    {
      admitYear: '2010.03',
      gradYear: '2014.02',
      schoolName: '서울대',
      major: '경영',
    },
  ],
  careerLevel: 'experienced' as const,
  careers: [
    {
      companyName: 'ABC',
      roleName: '매니저',
      periodStart: '2015.01',
      periodEnd: '2020.12',
      currentlyEmployed: false,
    },
  ],
  bankName: '국민',
  accountNumber: '123',
  accountHolder: '홍길동',
  isBusinessIncome: 'no' as const,
  freeWrite1: '소개',
  consentPaymentStatement: 'agree' as const,
  consentEducatorPledge: 'agree' as const,
  consentAdministrativeJoint: 'agree' as const,
  consentSexOffenseCheck: 'agree' as const,
}

const body = mapInstructorApplyFormToCreateRequest(values)

assert.equal(body.name, '홍길동')
assert.equal(body.gender, 'MALE')
assert.equal(body.birthDate, '1990-05-01')
assert.equal(body.phone, '010-1234-5678')
assert.equal(
  mapInstructorApplyFormToCreateRequest({ ...values, contact: '010-1234-5678' }).phone,
  '010-1234-5678'
)
assert.equal(body.email, 'a@b.com')
assert.equal(body.requestedActivityType, 'JA 강사단')

assert.equal(body.profile.homeAddress.line, '서울시 중구')
assert.equal(body.profile.homeAddress.detail, '101호')
assert.equal(body.profile.education.college4?.[0]?.schoolName, '서울대')
assert.equal(body.profile.education.college4?.[0]?.admitYear, '2010-03')
assert.equal(body.profile.career.rows[0]?.companyName, 'ABC')
assert.equal(body.profile.essays.freeWrite1, '소개')
assert.equal(body.profile.oneLineIntro, '한줄')

/* 정산: 사업소득 여부만 — 계좌 필드는 보내지 않는다(지급조서 사전 동의서 전용) */
assert.deepEqual(body.settlement, { businessIncome: false })
assert.deepEqual(
  mapInstructorApplyFormToCreateRequest({ ...values, isBusinessIncome: 'yes' }).settlement,
  { businessIncome: true },
)

assert.equal(body.termsAgreements[0]?.termsType, 'PAYMENT_STATEMENT_PRE_CONSENT')
/** 동기 매핑 fallback — 원격 제출 시 resolveInstructorApplyTermsAgreementVersions로 교체 */
assert.equal(body.termsAgreements[0]?.version, '2026-01')
assert.equal(body.termsAgreements.length, 4)

assert.equal(
  resolveInstructorEmploymentStatusToSync('school_teacher', 'ON_LEAVE', 'ACTIVE'),
  'ON_LEAVE'
)
assert.equal(
  resolveInstructorEmploymentStatusToSync('school_teacher', 'ACTIVE', 'ACTIVE'),
  undefined
)
assert.equal(resolveInstructorEmploymentStatusToSync('general', 'ON_LEAVE', 'ACTIVE'), undefined)

const serialized = JSON.stringify(body)
assert.equal(serialized.includes('SnapshotJson'), false)
assert.equal(serialized.includes('nameSnapshot'), false)
assert.equal(serialized.includes('careerTextSnapshot'), false)

// 프로필 성별이 있으면 폼 라디오(male) 대신 프로필 값을 보낸다 — OTHER를 MALE로 바꾸지 않는다
const withProfileGender = (profileGender: string) =>
  mapInstructorApplyFormToCreateRequest(values, { profileGender }).gender
assert.equal(withProfileGender('OTHER'), 'OTHER')
assert.equal(withProfileGender('FEMALE'), 'FEMALE')
assert.equal(withProfileGender('f'), 'FEMALE')
assert.equal(withProfileGender('MALE'), 'MALE')
assert.equal(withProfileGender(' 기타 '), '기타')
assert.equal(withProfileGender(''), '')

console.log('map-create-request.selfcheck: ok')
