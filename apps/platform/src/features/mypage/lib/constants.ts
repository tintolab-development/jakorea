export const MYPAGE_PATH = '/mypage'

/** 마이페이지 — 회원정보 설정 */
export const MYPAGE_SETTINGS_PATH = '/mypage/settings'

/** 마이페이지 — 문의내역 */
export const MYPAGE_INQUIRIES_PATH = '/mypage/inquiries'

/** 마이페이지 LNB — 강사 역할 신청 양식 */
export const INSTRUCTOR_APPLY_PATH = '/mypage/instructor-apply'

export function instructorApplyConsentPath(consentKey: string): string {
  return `${INSTRUCTOR_APPLY_PATH}/consent/${consentKey}`
}

export const MOCK_MYPAGE_USER_NAME = '홍길동'

/** 강사 마이페이지 mock — 소속·재직 뱃지 */
export const MOCK_MYPAGE_AFFILIATION = 'JA 코리아 초등학교'
export const MOCK_MYPAGE_EMPLOYMENT_LABEL = '재직중'

export const MOCK_MYPAGE_PROGRAM_STATS = {
  applied: 2,
  inProgress: 3,
  completed: 12,
} as const
