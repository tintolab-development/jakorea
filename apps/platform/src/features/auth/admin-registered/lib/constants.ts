import type { SchoolStatus } from '@/features/auth/sign-up'

/** API 연동 전 관리자 등록 회원 이메일 중복확인 mock */
export const MOCK_ADMIN_REGISTERED_EMAIL = 'gildong@gmail.com'

/** API 연동 전 회원가입 본인인증 mock — 생년월일 일치 시 관리자 등록 회원으로 취급 */
export const MOCK_ADMIN_REGISTERED_BIRTH_DATE = '2000.01.01'


export const MOCK_ADMIN_REGISTERED_PROFILE = {
  memberType: 'general' as const,
  address: '서울시 강서구 제이로 23',
  addressDetail: '3층',
  schoolStatus: 'none' as SchoolStatus,
  schoolName: '',
  grade: '',
  volunteerId: '',
}

export const ADMIN_REGISTERED_NOTICE_PATH = '/auth/admin-registered/notice'
