export const MYPAGE_PATH = '/mypage'

/** 마이페이지 — 회원정보 설정 */
export const MYPAGE_SETTINGS_PATH = '/mypage/settings'

/** 마이페이지 — 문의내역 */
export const MYPAGE_INQUIRIES_PATH = '/mypage/inquiries'

/** 마이페이지 — 교육현황 */
export const MYPAGE_EDUCATION_PATH = '/mypage/education'

export function educationApplicationDetailPath(applicationId: string): string {
  return `${MYPAGE_EDUCATION_PATH}/${applicationId}`
}

/** 마이페이지 — 봉사현황 */
export const MYPAGE_VOLUNTEER_PATH = '/mypage/volunteer'

export function volunteerApplicationDetailPath(applicationId: string): string {
  return `${MYPAGE_VOLUNTEER_PATH}/${applicationId}`
}

/** 마이페이지 LNB — 강사 역할 신청 양식 */
export const INSTRUCTOR_APPLY_PATH = '/mypage/instructor-apply'

export function instructorApplyConsentPath(consentKey: string): string {
  return `${INSTRUCTOR_APPLY_PATH}/consent/${consentKey}`
}

export const MOCK_MYPAGE_USER_NAME = '홍길동'
