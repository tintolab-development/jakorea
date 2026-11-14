/**
 * 알림 안내 팝업 — 이동 버튼 문구.
 * 시안(12197:393141)은 프로그램 신청 알림의 「신청 목록 보기」만 제시한다.
 * 나머지 linkType은 이동 대상(`admin-notification-navigation`)에 맞춘 문구이며, 모르는 값은 「자세히 보기」.
 */

import type { Notification } from '@/features/dashboard/api/notification-service'
import { hasAdminNotificationNavigation } from './admin-notification-navigation'

const DEFAULT_ACTION_LABEL = '자세히 보기'

const LINK_TYPE_ACTION_LABELS: Readonly<Record<string, string>> = {
  PROGRAM_APPLICATION: '신청 목록 보기',
  PROGRAM_APPLICATION_LIST: '신청 목록 보기',
  PROGRAM: '프로그램 보기',
  PROGRAM_POST: '프로그램 보기',
  PROGRAM_SCHEDULE: '프로그램 일정 보기',
  SETTLEMENT: '정산 보기',
  SETTLEMENT_APPLICATION: '정산 보기',
  MEMBER: '회원 상세 보기',
  ADMIN_ACCOUNT: '관리자 상세 보기',
  INSTRUCTOR_ROLE_REQUEST: '권한 신청 보기',
  INQUIRY: '문의 목록 보기',
}

/** 이동 대상이 없으면 null (버튼 비노출) */
export function resolveAdminNotificationActionLabel(
  notification: Pick<Notification, 'link' | 'target'>
): string | null {
  if (!hasAdminNotificationNavigation(notification)) return null
  const linkType = notification.target?.linkType?.trim().toUpperCase()
  if (linkType && LINK_TYPE_ACTION_LABELS[linkType]) return LINK_TYPE_ACTION_LABELS[linkType]
  return DEFAULT_ACTION_LABEL
}
