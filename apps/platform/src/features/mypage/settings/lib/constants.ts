export const VOLUNTEER_1365_URL = 'https://www.1365.go.kr'

export const EMPTY_SETTINGS_VALUE = '-'

export const SETTINGS_WITHDRAW_GUIDE = {
  title: '회원 탈퇴 안내',
  description:
    '탈퇴하시면 서비스 이용이 중단되며, 개인정보는 관련 법령에 따라 보관 후 파기됩니다. 진행 중인 프로그램이 있는 경우 탈퇴가 제한될 수 있습니다.',
  confirmLabel: '확인',
  /** OpenAPI `PortalWithdrawalRequest.confirmationText` */
  confirmationText: '탈퇴',
  /** OpenAPI `PortalWithdrawalRequest.reason` */
  reason: '회원 요청에 의한 탈퇴',
} as const

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

/** 로컬/dev 조회 mock — 교사회원 필드셋 */
export const MOCK_TEACHER_SETTINGS_PROFILE = {
  joinedAt: '2026-09-15',
  name: '김교사',
  phone: '010-1234-5678',
  birthDate: '1985-03-12',
  gender: 'F',
  schoolName: '서울초등학교',
  affiliationName: '서울초등학교',
  teacherEmploymentStatus: 'ACTIVE',
  email: 'teacher@example.com',
} as const

export const MOCK_SETTINGS_GUARDIAN = {
  name: '홍길동',
  phone: '010-1234-5678',
  relationship: '아빠',
} as const
