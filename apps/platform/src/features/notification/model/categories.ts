/** JABACK `MemberNotificationCategory` 순서·코드·라벨과 동일하게 유지한다. */
export const NOTIFICATION_CATEGORY_ALL = 'ALL'

export const NOTIFICATION_CATEGORY_TABS = [
  { key: NOTIFICATION_CATEGORY_ALL, label: '전체' },
  { key: 'APPROVAL_REJECTION', label: '승인·반려' },
  { key: 'APPLICATION_MATCHING', label: '신청·매칭' },
  { key: 'PROGRAM_PROGRESS', label: '프로그램 진행' },
  { key: 'SETTLEMENT', label: '정산' },
  { key: 'UPDATE', label: '업데이트' },
  { key: 'INQUIRY_SYSTEM', label: '문의·시스템' },
] as const

export type NotificationCategoryTabKey = (typeof NOTIFICATION_CATEGORY_TABS)[number]['key']
