/**
 * Run: node --experimental-strip-types --experimental-transform-types src/features/mypage/instructor-apply/lib/instructor-register-missing-labels.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { collectInstructorRegisterValidation } from '@jakorea/domain/instructor/validate-register'
import { resolveInstructorRegisterMissingLabels } from './instructor-register-missing-labels.ts'

type Input = Parameters<typeof collectInstructorRegisterValidation>[0]

const emptySchoolRow = { admitYear: '', gradYear: '', schoolName: '', major: '' }

const filled: Input = {
  name: '홍길동',
  gender: 'male',
  birthDate: '1990-01-01',
  contact: '010-1234-5678',
  email: 'a@b.com',
  memberType: 'general',
  schoolName: '',
  employmentStatus: '',
  affiliationName: 'JA',
  affiliationNone: false,
  homeAddress: '서울시 중구',
  homeAddressDetail: '1층',
  instructorCareer: '3년',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  isBusinessIncome: 'no',
  oneLineIntro: '소개',
  consentTermsOfService: 'agree',
  consentPersonal: 'agree',
  consentMarketing: '',
  consentPortrait: 'agree',
  consentPaymentStatement: 'agree',
  consentEducatorPledge: 'agree',
  consentAdministrativeJoint: '',
  consentSexOffenseCheck: '',
  eduSchoolType: 'college4',
  eduStatus: 'graduated',
  educationDetailKeys: [],
  highSchool: emptySchoolRow,
  college23Rows: [],
  college4Rows: [],
  graduateRows: [],
  careerLevel: 'new',
  careers: [],
  freeWrite1: '',
  freeWrite2: '',
  freeWrite3: '',
  freeWrite4: '',
} as unknown as Input

const ok = collectInstructorRegisterValidation(filled)
assert.equal(ok.missingRequired, false)
assert.deepEqual(ok.missingRequiredKeys, [])

const missing = collectInstructorRegisterValidation(
  {
    ...filled,
    gender: '',
    birthDate: '',
    oneLineIntro: ' ',
    consentPortrait: '',
    eduStatus: '',
    careerLevel: '',
  } as unknown as Input,
  {},
  {
    requiredConsentAgreeKeys: ['consentPortrait'],
    requireEducation: true,
    requireCareer: true,
  }
)
assert.equal(missing.missingRequired, true)
assert.deepEqual(missing.missingRequiredKeys, [
  'gender',
  'birthDate',
  'oneLineIntro',
  'consentPortrait',
  'eduStatus',
  'careerLevel',
])

// 같은 칸(성별 및 생년월일)은 한 번만, 동의 키는 라벨이 없어 빠진다
assert.deepEqual(resolveInstructorRegisterMissingLabels(missing.missingRequiredKeys, 'apply'), [
  '성별 및 생년월일',
  '한 줄 소개',
  '최종 학력',
  '경력 구분',
])
assert.deepEqual(
  resolveInstructorRegisterMissingLabels(['name', 'schoolName', 'homeAddress'], 'settings', {
    isDualTeacher: true,
  }),
  ['이름', '소속/학교', '자택 주소']
)
assert.deepEqual(resolveInstructorRegisterMissingLabels(['memberType'], 'settings'), [])

console.log('instructor-register-missing-labels selfcheck: ok')
