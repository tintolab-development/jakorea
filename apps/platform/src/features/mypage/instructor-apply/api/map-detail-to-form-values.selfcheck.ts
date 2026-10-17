/**
 * Portal 강사 신청 상세 → 제출 스냅샷 매핑 검증.
 */
import assert from 'node:assert/strict'
import { CONSENT_VALUE } from '@jakorea/domain/instructor/consent'
import { mapInstructorRoleRequestDetailToSubmittedSnapshot } from './map-detail-to-form-values.ts'
import type { InstructorRoleRequestDetail } from './types.ts'

const detail: InstructorRoleRequestDetail = {
  requestedAt: '2026-01-15T09:15:00+09:00',
  name: '홍길동',
  gender: 'M',
  birthDate: '2000-09-15',
  phone: '01012345678',
  email: 'gildong@jakorea.org',
  profile: {
    memberType: 'GENERAL',
    affiliation: { organizationNames: ['한국대학교'] },
    homeAddress: { line: '서울특별시 강서구 마곡중앙로 171', detail: '101동 1001호' },
    instructorCareerSummary: '5년',
    education: {
      highestSchoolType: 'graduate',
      highestStatus: 'graduated',
      detailKeys: ['high', 'college23', 'college4', 'graduate'],
      highSchool: {
        schoolName: '서울고등학교',
        admitYear: '2013-01',
        gradYear: '2016-01',
      },
      college23: [
        {
          schoolName: '한국전문대학교',
          major: '경영학과',
          admitYear: '2016',
          gradYear: '2018',
        },
      ],
      graduate: [
        {
          schoolName: '한국대학교 대학원',
          major: '경제교육학과',
          degree: 'master',
          admitYear: '2022',
          gradYear: '2024',
        },
      ],
    },
    career: { level: 'experienced', rows: [] },
    jaKoreaActivities: [],
    licenses: [],
    awards: [],
    essays: {},
  },
  settlement: {
    businessIncome: false,
    bankName: '국민',
    accountNumber: '123',
    accountHolder: '홍길동',
  },
  termsAgreements: [
    {
      termsType: 'PAYMENT_STATEMENT_PRE_CONSENT',
      version: '1.0',
      required: false,
      agreed: true,
      agreedAt: '2026-01-15T09:15:42+09:00',
    },
  ],
}

const snapshot = mapInstructorRoleRequestDetailToSubmittedSnapshot(detail)

assert.equal(snapshot.values.name, '홍길동')
assert.equal(snapshot.values.birthDate, '2000.09.15')
assert.equal(snapshot.values.contact, '010-1234-5678')
assert.equal(snapshot.values.affiliationName, '한국대학교')
assert.equal(snapshot.values.instructorCareer, '5년')
assert.deepEqual(snapshot.values.educationDetailKeys, [
  'high',
  'college23',
  'college4',
  'graduate',
])
assert.equal(snapshot.values.highSchool.admitYear, '2013')
assert.equal(snapshot.values.highSchool.gradYear, '2016')
assert.equal(snapshot.values.college23Rows[0]?.admitYear, '2016')
assert.equal(snapshot.values.college23Rows[0]?.gradYear, '2018')
assert.equal(snapshot.values.consentPaymentStatement, CONSENT_VALUE.agree)
assert.equal(
  snapshot.consentAgreedAt.consentPaymentStatement,
  '2026-01-15T09:15:42+09:00',
)

console.log('map-detail-to-form-values.selfcheck: ok')
