export const VOLUNTEER_1365_URL = 'https://www.1365.go.kr'

export const EMPTY_SETTINGS_VALUE = '-'

export const SETTINGS_WITHDRAW_GUIDE = {
  title: '회원 탈퇴 안내',
  description:
    'JA KOREA 서비스를 탈퇴하시겠습니까?\n탈퇴 시 개인정보는 관련 법령 및 당사의 개인정보처리방침에 따라 삭제·처리됩니다. 삭제된 정보는 복구할 수 없습니다. 탈퇴하시려면 로그인 비밀번호를 입력해 주세요.',
  passwordPlaceholder: '현재 사용 중인 비밀번호를 입력해 주세요',
  cancelLabel: '취소',
  confirmLabel: '탈퇴하기',
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

/** 로컬/dev 조회 mock — 교사 회원 필드셋 */
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
