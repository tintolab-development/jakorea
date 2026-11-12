/**
 * 관리자 알림 클릭 → 이동 대상 (QA-0140).
 *
 * GET /api/admin/notifications 는 linkUrl 없이 `linkType`·`linkId`·`programId`만 내려 준다.
 * generated 타입의 linkType은 enum 없이 string이므로, 관리자 알림 발행 코드 기준 값만 매핑하고
 * 모르는 값은 이동하지 않는다(null).
 *
 * - MEMBER: 회원 상세 (`/users/list?id=…&memberId=…`, URL 구동 상세 — 상세 GET 후 canonical id는 replace)
 *   sourceDomain=TEACHER_PROFILE 이면 교사 상세 힌트(memberRole·instructorProfile)를 함께 싣는다.
 * - 프로그램 범위(PROGRAM_APPLICATION 등): 프로그램 상세 — 유형별 경로는 navigateToProgramAdminDetail이 확정 후 1회 이동
 * - ADMIN_ACCOUNT: 관리자 회원 상세
 * - INSTRUCTOR_ROLE_REQUEST / INQUIRY: 상세 URL 계약이 없어 해당 목록으로 이동
 */

import type { Notification } from '@/features/dashboard/api/notification-service'
import {
  USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY,
  USER_DETAIL_MEMBER_ID_QUERY_KEY,
  USER_DETAIL_MEMBER_ROLE_QUERY_KEY,
} from '@/features/user/detail/lib/teacher-detail-url-context'

export type AdminNotificationNavigation =
  | { kind: 'path'; path: string }
  | { kind: 'program'; programId: string }

/** 프로그램 상세로 여는 linkType (programId 필수) */
const PROGRAM_SCOPED_LINK_TYPES: ReadonlySet<string> = new Set([
  'PROGRAM',
  'PROGRAM_APPLICATION',
  'PROGRAM_APPLICATION_LIST',
  'PROGRAM_POST',
  'PROGRAM_SCHEDULE',
  'SETTLEMENT',
  'SETTLEMENT_APPLICATION',
])

/** linkId 자체가 programId인 linkType */
const LINK_ID_IS_PROGRAM_ID: ReadonlySet<string> = new Set(['PROGRAM', 'PROGRAM_APPLICATION_LIST'])

const PERMISSION_REQUESTS_PATH = '/admin/permission-requests'
const INQUIRIES_PATH = '/admin/posts/inquiries'

function isPositiveId(value: string | undefined): value is string {
  return value != null && /^\d+$/.test(value) && Number(value) > 0
}

export function buildMemberDetailPathFromNotification(
  memberId: string,
  options: { schoolTeacher: boolean }
): string {
  const params = new URLSearchParams({
    kind: 'all',
    id: memberId,
    lnb: 'detail-info',
    [USER_DETAIL_MEMBER_ID_QUERY_KEY]: memberId,
  })
  if (options.schoolTeacher) {
    params.set(USER_DETAIL_MEMBER_ROLE_QUERY_KEY, 'INSTRUCTOR')
    params.set(USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY, 'school_teacher')
  }
  return `/users/list?${params.toString()}`
}

function buildAdminAccountDetailPath(adminAccountId: string): string {
  const params = new URLSearchParams({
    kind: 'admins',
    id: `admin-account-${adminAccountId}`,
    lnb: 'detail-info',
    [USER_DETAIL_MEMBER_ROLE_QUERY_KEY]: 'ADMIN',
  })
  return `/users/list?${params.toString()}`
}

export function resolveAdminNotificationNavigation(
  notification: Pick<Notification, 'link' | 'target'>
): AdminNotificationNavigation | null {
  const link = notification.link?.trim()
  if (link) return { kind: 'path', path: link }

  const target = notification.target
  const linkType = target?.linkType?.trim().toUpperCase()
  if (!target || !linkType) return null

  if (linkType === 'MEMBER') {
    if (!isPositiveId(target.linkId)) return null
    return {
      kind: 'path',
      path: buildMemberDetailPathFromNotification(target.linkId, {
        schoolTeacher: target.sourceDomain?.trim().toUpperCase() === 'TEACHER_PROFILE',
      }),
    }
  }

  if (linkType === 'ADMIN_ACCOUNT') {
    if (!isPositiveId(target.linkId)) return null
    return { kind: 'path', path: buildAdminAccountDetailPath(target.linkId) }
  }

  if (linkType === 'INSTRUCTOR_ROLE_REQUEST') {
    return { kind: 'path', path: PERMISSION_REQUESTS_PATH }
  }

  if (linkType === 'INQUIRY') {
    return { kind: 'path', path: INQUIRIES_PATH }
  }

  if (PROGRAM_SCOPED_LINK_TYPES.has(linkType)) {
    const programId = isPositiveId(target.programId)
      ? target.programId
      : LINK_ID_IS_PROGRAM_ID.has(linkType) && isPositiveId(target.linkId)
        ? target.linkId
        : undefined
    return programId ? { kind: 'program', programId } : null
  }

  return null
}

export function hasAdminNotificationNavigation(
  notification: Pick<Notification, 'link' | 'target'>
): boolean {
  return resolveAdminNotificationNavigation(notification) != null
}
