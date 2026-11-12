import assert from 'node:assert/strict'
import {
  MOCK_SETTINGS_GUARDIAN,
  MOCK_SETTINGS_PROFILE,
  MOCK_TEACHER_SETTINGS_PROFILE,
} from './constants.ts'
import {
  formatSettingsDateDot,
  formatSettingsEmployment,
  formatSettingsEnrollment,
  formatSettingsGender,
  formatSettingsGrade,
  formatSettingsJoinedAt,
  formatSettingsPhone,
  mapPortalGuardianToSettingsView,
  mapPortalProfileToSettingsView,
} from './map-view.ts'

assert.equal(formatSettingsJoinedAt('2026-09-15'), '2026년 09월 15일')
assert.equal(formatSettingsDateDot('1999-01-01'), '1999.01.01')
assert.equal(formatSettingsPhone('01012345678'), '010-1234-5678')
assert.equal(formatSettingsPhone('0212345678'), '02-1234-5678')
assert.equal(formatSettingsGender('F'), '여성')
assert.equal(formatSettingsEnrollment('ENROLLED'), '재학 중')
assert.equal(formatSettingsGrade('2'), '2학년')
assert.equal(formatSettingsGrade('2학년'), '2학년')

const view = mapPortalProfileToSettingsView(MOCK_SETTINGS_PROFILE, MOCK_SETTINGS_GUARDIAN)
assert.equal(view.basicRows[0]?.value, '2026년 09월 15일')
assert.equal(view.basicRows[1]?.label, '이메일 ID')
assert.equal(view.basicRows[7]?.label, '소속/학교')
assert.equal(view.basicRows[7]?.value, '재희 고등학교')
assert.equal(view.basicRows[10]?.value, '-')
assert.equal(view.basicRows[10]?.action, '1365-shortcut')
assert.equal(view.guardian?.relationship, '아빠')
assert.equal(view.basicRows.some(row => row.label === '휴대폰 번호'), true)

const minorView = mapPortalProfileToSettingsView(
  {
    name: '신영서',
    under14: true,
    ageGroup: 'UNDER_14',
    birthDate: '2020-08-08',
    phone: undefined,
    guardian: {
      guardianName: '최지원',
      guardianRelation: 'ㄷ',
      guardianPhone: '01033275124',
    },
  },
  mapPortalGuardianToSettingsView({
    guardianName: '최지원',
    guardianRelation: 'ㄷ',
    guardianPhone: '01033275124',
  }),
)
assert.equal(minorView.basicRows.some(row => row.label === '휴대폰 번호'), false)
assert.equal(minorView.guardian?.phone, '010-3327-5124')

const remoteWithoutGuardian = mapPortalProfileToSettingsView({
  name: '김회원',
  email: 'member@example.com',
})
assert.equal(remoteWithoutGuardian.guardian, null)
assert.equal(remoteWithoutGuardian.basicRows[2]?.value, '김회원')

const notEnrolledView = mapPortalProfileToSettingsView({
  schoolEnrollmentStatus: 'NOT_ENROLLED',
  affiliationName: '지역아동센터',
  grade: '2',
})
assert.equal(notEnrolledView.basicRows[7]?.label, '소속 기관명')
assert.equal(notEnrolledView.basicRows[7]?.value, '지역아동센터')
assert.equal(notEnrolledView.basicRows.some(row => row.label === '학년'), false)
assert.equal(notEnrolledView.basicRows.some(row => row.label === '소속/학교명'), false)

const notEnrolledEmptyAffiliation = mapPortalProfileToSettingsView({
  schoolEnrollmentStatus: 'NOT_ENROLLED',
})
assert.equal(notEnrolledEmptyAffiliation.basicRows[7]?.label, '소속 기관명')
assert.equal(notEnrolledEmptyAffiliation.basicRows[7]?.value, '소속 없음')

assert.equal(formatSettingsEmployment('ACTIVE'), '재직 중')
assert.equal(formatSettingsEmployment('ON_LEAVE'), '휴직 중')
assert.equal(formatSettingsEmployment('TRANSFERRED'), '-')

const teacherView = mapPortalProfileToSettingsView(MOCK_TEACHER_SETTINGS_PROFILE, null, {
  variant: 'teacher',
})
assert.equal(teacherView.basicRows[1]?.label, '이메일 ID')
assert.equal(teacherView.basicRows[2]?.label, '이름')
assert.equal(teacherView.basicRows[6]?.label, '소속/학교')
assert.equal(teacherView.basicRows[6]?.value, '서울초등학교')
assert.equal(teacherView.basicRows[7]?.label, '재직 현황')
assert.equal(teacherView.basicRows[7]?.value, '재직 중')
assert.equal(teacherView.guardian, null)

const mappedGuardian = mapPortalGuardianToSettingsView({
  guardianName: '홍보호',
  guardianPhone: '01012345678',
  guardianRelation: '모',
})
assert.equal(mappedGuardian?.name, '홍보호')
assert.equal(mappedGuardian?.phone, '010-1234-5678')
assert.equal(mappedGuardian?.relationship, '모')
assert.equal(
  mapPortalGuardianToSettingsView({
    guardianName: '최지원',
    guardianRelation: 'PARENT',
    guardianPhone: '010-3327-5124',
  })?.phone,
  '010-3327-5124',
)
assert.equal(mapPortalGuardianToSettingsView({}), null)
assert.equal(mapPortalGuardianToSettingsView(undefined), null)

const remoteWithGuardian = mapPortalProfileToSettingsView(
  {
    name: '김미성',
    guardian: {
      guardianName: '김보호',
      guardianPhone: '01099998888',
      guardianRelation: '부',
    },
  },
  mapPortalGuardianToSettingsView({
    guardianName: '김보호',
    guardianPhone: '01099998888',
    guardianRelation: '부',
  }),
)
assert.equal(remoteWithGuardian.guardian?.name, '김보호')
assert.equal(remoteWithGuardian.guardian?.relationship, '부')

console.log('map-view.selfcheck: ok')
