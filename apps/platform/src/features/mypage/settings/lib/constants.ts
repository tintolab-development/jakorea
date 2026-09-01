export const VOLUNTEER_1365_URL = 'https://www.1365.go.kr'

export const EMPTY_SETTINGS_VALUE = '-'

/** 로컬/dev 조회 mock — 시안 일반회원 필드셋 */
export const MOCK_SETTINGS_PROFILE = {
  joinedAt: '2026-09-15',
  name: '홍길동',
  phone: '010-1234-5678',
  birthDate: '1999-01-01',
  gender: 'M',
  schoolEnrollmentStatus: 'ENROLLED',
  schoolName: '재희 고등학교',
  grade: '2학년',
  address: '서울시 강서구 제이로 23',
  addressDetail: '9층 901호',
  email: 'user@example.com',
  external1365Id: '',
} as const

export const MOCK_SETTINGS_GUARDIAN = {
  name: '홍길동',
  phone: '010-1234-5678',
  relationship: '아빠',
} as const
