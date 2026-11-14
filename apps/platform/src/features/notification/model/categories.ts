/**
 * USER-FUNC-0038 · 이용 가이드 슬라이드 31 — 8탭. 코드는 포털 category 쿼리와 맞춘다.
 * 순서·구분점(∙ U+2219)은 Platform 시안 기준 (CMS는 `·`).
 */
export const NOTIFICATION_CATEGORY_ALL = 'ALL'

export const NOTIFICATION_CATEGORY_TABS = [
  { key: NOTIFICATION_CATEGORY_ALL, label: '전체' },
  { key: 'APPROVAL_REJECTION', label: '승인∙반려' },
  { key: 'APPLICATION_MATCHING', label: '신청∙매칭' },
  { key: 'PROGRAM_PROGRESS', label: '프로그램 진행' },
  { key: 'UPDATE', label: '업데이트' },
  { key: 'SETTLEMENT', label: '정산' },
  { key: 'INQUIRY', label: '문의' },
  { key: 'SYSTEM', label: '시스템' },
] as const

export type NotificationCategoryTabKey = (typeof NOTIFICATION_CATEGORY_TABS)[number]['key']

/**
 * 서버 notificationCategoryLabel은 CMS와 같은 `·`를 쓴다. Platform 시안은 `∙`(U+2219)라 표시만 바꾼다.
 * `문의·시스템` 등 목록에 없는 라벨은 그대로 둔다.
 */
const PLATFORM_CATEGORY_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  '승인·반려': '승인∙반려',
  '신청·매칭': '신청∙매칭',
}

export function toPlatformNotificationCategoryLabel(label: string): string {
  return PLATFORM_CATEGORY_LABEL_OVERRIDES[label] ?? label
}
