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
 * - ADMIN_PAYMENT_STATEMENT_CORRECTION_REQUESTED(강사비 정정 요청, linkType SETTLEMENT·linkId settlementId):
 *   정산 관리 > 지급조서 확인 > 신청자 별 상세. 신청자(강사 회원) ID는 알림에 없어 정산 상세로 확인한 뒤 이동한다.
 */

import type { Notification } from '@/features/dashboard/api/notification-service'
import {
  PAYMENT_ORDERS_DETAIL_KEY_PARAM,
  PAYMENT_ORDERS_DETAIL_TYPE_PARAM,
} from '@/pages/settlement-management/payment-orders-table.config'
import {
  ADMIN_INQUIRIES_PATH,
  buildInquiryDetailPath,
} from '@/features/posts/lib/inquiry-detail-link'
import {
  USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY,
  USER_DETAIL_MEMBER_ID_QUERY_KEY,
  USER_DETAIL_MEMBER_ROLE_QUERY_KEY,
} from '@/features/user/detail/lib/teacher-detail-url-context'

/**
 * 프로그램 상세에서 바로 열 진행 현황 탭 — 시안 「시스템 안내 팝업」 버튼 기준.
 * - participants: 참여 기관(강사 배정·학생 명단은 기관 상세 안 탭. 알림에 참여 기관 ID가 없어 목록까지 연다)
 * - instructors: 참여 강사(개인 프로그램 강사 배정)
 * - posts: 게시글(알림에 게시글 상세 URL 계약이 없어 게시판까지 연다)
 */
export type ProgramDetailSection = 'participants' | 'instructors' | 'posts'

export type AdminNotificationNavigation =
  | { kind: 'path'; path: string }
  | { kind: 'program'; programId: string; section?: ProgramDetailSection }
  /** 관리자 권한 변경 — 헤더의 「내 정보 확인」 팝업 */
  | { kind: 'profile' }
  /** 강사비 정정 요청 — settlementId로 신청자를 확인해 신청자 별 지급 현황 상세를 연다 */
  | { kind: 'payment-statement-correction'; settlementId: string }

/** 관리자_강사비_정정_요청 (BE 2026-11-15). 강사 본인 알림 PAYMENT_STATEMENT_CORRECTION_REQUESTED와 다르다. */
export const ADMIN_PAYMENT_STATEMENT_CORRECTION_REQUESTED_EVENT =
  'ADMIN_PAYMENT_STATEMENT_CORRECTION_REQUESTED'

const PAYMENT_ORDERS_PATH = '/settlement-management/payment-orders'

/** 정산 관리 > 지급조서 확인 > 신청자 별 지급 현황 상세 (URL 구동 풀페이지) */
export function buildPaymentOrderInstructorDetailPath(instructorMemberId: string): string {
  const params = new URLSearchParams({
    [PAYMENT_ORDERS_DETAIL_TYPE_PARAM]: 'instructor',
    [PAYMENT_ORDERS_DETAIL_KEY_PARAM]: instructorMemberId,
  })
  return `${PAYMENT_ORDERS_PATH}?${params.toString()}`
}

/** 신청자를 확인하지 못했을 때 — 지급조서 확인 목록 */
export const PAYMENT_ORDERS_LIST_PATH = PAYMENT_ORDERS_PATH

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
/** 권한 신청 관리 탭 — `permission-request-list-page`의 `pr_detail_role` */
const PERMISSION_REQUESTS_ROLE_PARAM = 'pr_detail_role'
/** 정산 관리 > 계좌 지급 확인(「계좌 지급 대상 목록」) */
export const ACCOUNT_PAYMENTS_PATH = '/settlement-management/account-payments'

function buildPermissionRequestsPath(role: 'admin' | 'instructor'): string {
  return `${PERMISSION_REQUESTS_PATH}?${new URLSearchParams({ [PERMISSION_REQUESTS_ROLE_PARAM]: role })}`
}

/** 정산 관리 > 지급조서 확인 > 프로그램 별 상세 */
function buildPaymentOrderProgramDetailPath(programId: string): string {
  const params = new URLSearchParams({
    [PAYMENT_ORDERS_DETAIL_TYPE_PARAM]: 'program',
    [PAYMENT_ORDERS_DETAIL_KEY_PARAM]: programId,
  })
  return `${PAYMENT_ORDERS_PATH}?${params.toString()}`
}

/** 프로그램 진행 현황 탭으로 여는 이벤트 */
const PROGRAM_SECTION_EVENTS: Readonly<Record<string, ProgramDetailSection>> = {
  /** 시안 17149:68534 기관 프로그램 강사 미배정 → [강사 배정] */
  ADMIN_ORGANIZATION_PROGRAM_INSTRUCTOR_UNASSIGNED: 'participants',
  /** 시안 17149:68548 개인 프로그램 강사 미배정 → [강사 배정] */
  ADMIN_INDIVIDUAL_PROGRAM_INSTRUCTOR_UNASSIGNED: 'instructors',
  /** 시안 17149:68562·68576·68590·68604 학생 명단·초상권 → [학생 명단 확인] */
  ADMIN_STUDENT_ROSTER_SUBMITTED: 'participants',
  ADMIN_STUDENT_ROSTER_UPDATED: 'participants',
  ADMIN_STUDENT_ROSTER_UNSUBMITTED: 'participants',
  ADMIN_PORTRAIT_CONSENT_UNSUBMITTED: 'participants',
  /** 시안 17149:68730·68744 신규 게시글·댓글 → [게시글 확인]·[댓글 확인] */
  ADMIN_PROGRAM_NOTICE_CREATED: 'posts',
  ADMIN_PROGRAM_POST_COMMENT_CREATED: 'posts',
}

/** 시안에 이동 버튼이 없는 이벤트 (팝업에 [닫기]만) */
const NO_NAVIGATION_EVENTS: ReadonlySet<string> = new Set([
  /** 시안 17149:68492 프로그램 신청 취소 */
  'ADMIN_PROGRAM_APPLICATION_CANCELLED',
])

const SETTLEMENT_APPLICATION_EVENTS: ReadonlySet<string> = new Set([
  'ADMIN_SETTLEMENT_APPLICATION_SUBMITTED',
  'ADMIN_SETTLEMENT_APPLICATION_RESUBMITTED',
])

const INQUIRY_CREATED_EVENTS: ReadonlySet<string> = new Set([
  'ADMIN_INQUIRY_CREATED',
  'ADMIN_INQUIRY_CREATED_UNASSIGNED',
  'ADMIN_INQUIRY_CREATED_MAILBOX',
])

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

  const eventType = target.eventType?.trim().toUpperCase() ?? ''
  const programId = isPositiveId(target.programId) ? target.programId : undefined

  if (NO_NAVIGATION_EVENTS.has(eventType)) return null

  // 시안 17149:68380 신규 관리자 권한 요청 · 17149:68394 신규 강사 권한 요청 → [신청 목록 보기]
  if (eventType === 'ADMIN_SIGNUP_APPROVAL_REQUESTED') {
    return { kind: 'path', path: buildPermissionRequestsPath('admin') }
  }
  if (eventType === 'ADMIN_INSTRUCTOR_ROLE_REQUESTED') {
    return { kind: 'path', path: buildPermissionRequestsPath('instructor') }
  }

  const section = PROGRAM_SECTION_EVENTS[eventType]
  if (section) {
    return programId ? { kind: 'program', programId, section } : null
  }

  // 시안 17149:68646·68660 신규 정산 신청·정산 재신청 → [신청 내역 확인] (지급조서 확인 > 프로그램 별 상세)
  if (SETTLEMENT_APPLICATION_EVENTS.has(eventType)) {
    return programId ? { kind: 'path', path: buildPaymentOrderProgramDetailPath(programId) } : null
  }

  // 시안 17149:68688 강사비 확인 완료 → [지급 대상 목록 보기]
  if (eventType === 'ADMIN_PAYMENT_STATEMENT_CONFIRMED') {
    return { kind: 'path', path: ACCOUNT_PAYMENTS_PATH }
  }

  // 시안 17149:68716 신규 문의 접수 → [문의 내용 확인]
  if (INQUIRY_CREATED_EVENTS.has(eventType)) {
    return {
      kind: 'path',
      path: isPositiveId(target.linkId) ? buildInquiryDetailPath(target.linkId) : ADMIN_INQUIRIES_PATH,
    }
  }

  // 시안 17149:68758 관리자 권한 변경 → [내 정보 보기]
  if (eventType === 'ADMIN_ROLE_CHANGED') {
    return { kind: 'profile' }
  }

  if (eventType === ADMIN_PAYMENT_STATEMENT_CORRECTION_REQUESTED_EVENT) {
    return linkType === 'SETTLEMENT' && isPositiveId(target.linkId)
      ? { kind: 'payment-statement-correction', settlementId: target.linkId }
      : null
  }

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
    return { kind: 'path', path: ADMIN_INQUIRIES_PATH }
  }

  if (PROGRAM_SCOPED_LINK_TYPES.has(linkType)) {
    const scopedProgramId =
      programId ??
      (LINK_ID_IS_PROGRAM_ID.has(linkType) && isPositiveId(target.linkId)
        ? target.linkId
        : undefined)
    return scopedProgramId ? { kind: 'program', programId: scopedProgramId } : null
  }

  return null
}

export function hasAdminNotificationNavigation(
  notification: Pick<Notification, 'link' | 'target'>
): boolean {
  return resolveAdminNotificationNavigation(notification) != null
}
