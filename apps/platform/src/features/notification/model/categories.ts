/** USER-FUNC-0038 · 이용 가이드 슬라이드 31 — 8탭. 코드는 포털 category 쿼리와 맞춘다. */
export const NOTIFICATION_CATEGORY_ALL = 'ALL'

export const NOTIFICATION_CATEGORY_TABS = [
  { key: NOTIFICATION_CATEGORY_ALL, label: '전체' },
  { key: 'APPROVAL_REJECTION', label: '승인·반려' },
  { key: 'APPLICATION_MATCHING', label: '신청·매칭' },
  { key: 'PROGRAM_PROGRESS', label: '프로그램 진행' },
  { key: 'SETTLEMENT', label: '정산' },
  { key: 'UPDATE', label: '업데이트' },
  { key: 'INQUIRY', label: '문의' },
  { key: 'SYSTEM', label: '시스템' },
] as const

export type NotificationCategoryTabKey = (typeof NOTIFICATION_CATEGORY_TABS)[number]['key']
