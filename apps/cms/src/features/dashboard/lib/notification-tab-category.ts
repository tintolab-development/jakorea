/**
 * 헤더 알림 드롭다운 탭 ↔ GET /api/admin/notifications `category` 파라미터.
 *
 * - 대응 카테고리가 하나인 탭은 서버에서 걸러 받는다(`?category=`).
 * - 전체·시스템은 전체 목록을 받아 type으로 거른다.
 *   시스템 탭은 SYSTEM·APPROVAL_REJECTION·모르는 값이 섞여 서버 필터 하나로 받을 수 없다.
 */

export type NotificationTabKey =
  | 'all'
  | 'matching'
  | 'progress'
  | 'settlement'
  | 'inquiry'
  | 'schedule'
  | 'system'

const TAB_SERVER_CATEGORY: Readonly<Partial<Record<NotificationTabKey, string>>> = {
  matching: 'APPLICATION_MATCHING',
  progress: 'PROGRAM_PROGRESS',
  settlement: 'SETTLEMENT',
  inquiry: 'INQUIRY_SYSTEM',
  schedule: 'UPDATE',
}

/** 서버 `category` 값. 전체 목록을 받아 거르는 탭이면 undefined */
export function resolveNotificationServerCategory(tab: NotificationTabKey): string | undefined {
  return TAB_SERVER_CATEGORY[tab]
}
