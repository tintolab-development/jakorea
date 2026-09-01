/** 프로그램 풀페이지 상세 LNB·공통정보 탭 키 (사이드바 props와 URL 파라미터와 공유) */

export const TAB_KEYS = ['info', 'institutions', 'instructors', 'volunteers'] as const
export type TabKey = (typeof TAB_KEYS)[number]

export const TAB_LABELS: Record<TabKey, string> = {
  info: '공통 정보',
  institutions: '참여자 정보',
  instructors: '강사 정보',
  volunteers: '봉사자 정보',
}

export const LNB_KEYS = [
  'info',
  'applicants',
  'applicant_instructors',
  'progress',
  'survey',
  'managers',
] as const
export type LnbKey = (typeof LNB_KEYS)[number]
