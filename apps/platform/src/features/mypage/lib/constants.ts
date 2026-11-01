export const MYPAGE_PATH = '/mypage'

/** 마이페이지 — 회원정보 설정 */
export const MYPAGE_SETTINGS_PATH = '/mypage/settings'

export const MYPAGE_SETTINGS_CONSENTS_TAB = `${MYPAGE_SETTINGS_PATH}?tab=consents`

export function settingsConsentWritePath(
  consentKey: string,
  options?: { mode?: 'view' },
): string {
  const base = `${MYPAGE_SETTINGS_PATH}/consents/${encodeURIComponent(consentKey)}`
  if (options?.mode === 'view') {
    return `${base}?mode=view`
  }
  return base
}

/** 마이페이지 — 문의내역 */
export const MYPAGE_INQUIRIES_PATH = '/mypage/inquiries'

/** 마이페이지 — 교육현황 */
export const MYPAGE_EDUCATION_PATH = '/mypage/education'

export function educationApplicationDetailPath(
  applicationId: string,
  applicationType?: string,
): string {
  if (applicationType) return `${MYPAGE_EDUCATION_PATH}/${applicationType}/${applicationId}`
  return `${MYPAGE_EDUCATION_PATH}/${applicationId}`
}

/** 마이페이지 — 봉사현황 */
export const MYPAGE_VOLUNTEER_PATH = '/mypage/volunteer'

export function volunteerApplicationDetailPath(
  applicationId: string,
  applicationType?: string,
): string {
  if (applicationType) return `${MYPAGE_VOLUNTEER_PATH}/${applicationType}/${applicationId}`
  return `${MYPAGE_VOLUNTEER_PATH}/${applicationId}`
}

/** 마이페이지 — 강의현황(강사·강사겸교사 전용) */
export const MYPAGE_LECTURE_PATH = '/mypage/lectures'

/** 마이페이지 — 정산 현황(강사·강사겸교사 전용) */
export const MYPAGE_SETTLEMENT_PATH = '/mypage/settlement'

export function lectureApplicationDetailPath(
  applicationId: string,
  applicationType?: string,
): string {
  if (applicationType) return `${MYPAGE_LECTURE_PATH}/${applicationType}/${applicationId}`
  return `${MYPAGE_LECTURE_PATH}/${applicationId}`
}

/** 마이페이지 LNB — 강사 역할 신청 양식 */
export const INSTRUCTOR_APPLY_PATH = '/mypage/instructor-apply'

/** 반려 후 재신청 — 신청 양식을 바로 노출 */
export const INSTRUCTOR_APPLY_REAPPLY_QUERY = 'reapply'

export function instructorApplyPath(options?: { reapply?: boolean }): string {
  if (options?.reapply) {
    return `${INSTRUCTOR_APPLY_PATH}?${INSTRUCTOR_APPLY_REAPPLY_QUERY}=1`
  }
  return INSTRUCTOR_APPLY_PATH
}

export function instructorApplyConsentPath(consentKey: string): string {
  return `${INSTRUCTOR_APPLY_PATH}/consent/${consentKey}`
}

/** DEV-only placeholder — PROD tree-shake (`import.meta.env.DEV` false → '') */
export const MOCK_MYPAGE_USER_NAME = import.meta.env.DEV ? '이름예시' : ''
