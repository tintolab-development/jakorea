/**
 * 알림 안내 팝업 — 이동 버튼 문구.
 * 시안 「시스템 안내 팝업」(17119:183139)에 있는 이벤트는 이벤트별 문구, 그 밖의 linkType은 이동 대상
 * (`admin-notification-navigation`)에 맞춘 문구이며, 모르는 값은 「자세히 보기」.
 * 시안에 이동 버튼이 없는 이벤트(프로그램 신청 취소)는 이동 대상이 없어 버튼을 두지 않는다.
 */

import type { Notification } from '@/features/dashboard/api/notification-service'
import {
  ADMIN_PAYMENT_STATEMENT_CORRECTION_REQUESTED_EVENT,
  hasAdminNotificationNavigation,
} from './admin-notification-navigation'

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

/**
 * 시안 「시스템 안내 팝업」(17119:183139) 이벤트별 버튼 문구 — linkType 문구보다 우선.
 * 이동 대상은 `admin-notification-navigation`의 같은 이벤트 분기와 맞춘다.
 */
const EVENT_TYPE_ACTION_LABELS: Readonly<Record<string, string>> = {
  /** 17149:68380 신규 관리자 권한 요청 · 17149:68394 신규 강사 권한 요청 */
  ADMIN_SIGNUP_APPROVAL_REQUESTED: '신청 목록 보기',
  ADMIN_INSTRUCTOR_ROLE_REQUESTED: '신청 목록 보기',
  /** 신청 합산 — 관리자_프로그램_신규_신청자 */
  ADMIN_PROGRAM_APPLICATION_DAILY_SUMMARY: '신청 목록 보기',
  /** 17149:68436·68450·68464·68478 프로그램 신규 신청자·기관·강사·봉사자 */
  ADMIN_PROGRAM_APPLICATION_SUBMITTED: '신청 목록 보기',
  ADMIN_ORGANIZATION_APPLICATION_SUBMITTED: '신청 목록 보기',
  ADMIN_INSTRUCTOR_APPLICATION_SUBMITTED: '신청 목록 보기',
  ADMIN_VOLUNTEER_APPLICATION_SUBMITTED: '신청 목록 보기',
  /** 17149:68562·68576·68590·68604 학생 명단 제출 완료·수정 제출·미제출, 초상권 동의서 미제출 */
  ADMIN_STUDENT_ROSTER_SUBMITTED: '학생 명단 확인',
  ADMIN_STUDENT_ROSTER_UPDATED: '학생 명단 확인',
  ADMIN_STUDENT_ROSTER_UNSUBMITTED: '학생 명단 확인',
  ADMIN_PORTRAIT_CONSENT_UNSUBMITTED: '학생 명단 확인',
  /** 17149:68646·68660 신규 정산 신청·정산 재신청 */
  ADMIN_SETTLEMENT_APPLICATION_SUBMITTED: '신청 내역 확인',
  ADMIN_SETTLEMENT_APPLICATION_RESUBMITTED: '신청 내역 확인',
  /** 17149:68674 강사비 정정 요청 */
  [ADMIN_PAYMENT_STATEMENT_CORRECTION_REQUESTED_EVENT]: '정정 요청 확인',
  /** 17149:68688 강사비 확인 완료 · 영수증 확인 완료 */
  ADMIN_PAYMENT_STATEMENT_CONFIRMED: '지급 대상 목록 보기',
  ADMIN_EXPENSE_RECEIPT_CONFIRMED: '지급 대상 목록 보기',
  /** 17149:68716 신규 문의 접수 */
  ADMIN_INQUIRY_CREATED: '문의 내용 확인',
  ADMIN_INQUIRY_CREATED_UNASSIGNED: '문의 내용 확인',
  ADMIN_INQUIRY_CREATED_MAILBOX: '문의 내용 확인',
  /** 17149:68408 교사 정보 변경 */
  ADMIN_TEACHER_EMPLOYMENT_CHANGED: '회원 정보 보기',
  /** 17149:68730 신규 게시글 안내 · 17149:68744 신규 댓글 안내 */
  ADMIN_PROGRAM_NOTICE_CREATED: '게시글 확인',
  ADMIN_PROGRAM_POST_COMMENT_CREATED: '댓글 확인',
  /** 17149:68758 관리자 권한 변경 */
  ADMIN_ROLE_CHANGED: '내 정보 보기',
}

/** 시안상 [닫기]만 두는 이벤트 — 관리자_프로그램_신청_취소 (17149:68492) */
const CLOSE_ONLY_EVENT_TYPES: ReadonlySet<string> = new Set(['ADMIN_PROGRAM_APPLICATION_CANCELLED'])

/** 시안 버튼 「#{교육진행자} 배정」 — 관리자_기관·개인_프로그램_#{교육진행자}_미배정_건_안내 */
const INSTRUCTOR_UNASSIGNED_EVENT_TYPES: ReadonlySet<string> = new Set([
  'ADMIN_ORGANIZATION_PROGRAM_INSTRUCTOR_UNASSIGNED',
  'ADMIN_INDIVIDUAL_PROGRAM_INSTRUCTOR_UNASSIGNED',
])

/**
 * 제목에 역할이 있으면 그 값으로 「… 배정」을 만든다.
 * 제목에 역할이 없으면 시안 고정 문구 「강사 배정」을 쓴다.
 * TODO(ui-merge): jiwon 시안은 미배정 버튼을 「강사 배정」으로 고정하고,
 * keonhee는 제목의 #{교육진행자}를 읽어 역할명을 붙인다. 역할이 보이면 제목을 우선한다.
 */
const INSTRUCTOR_UNASSIGNED_TITLE_PATTERN = /(\S+)\s+미배정\s+건\s+안내/
const INSTRUCTOR_UNASSIGNED_FALLBACK_ROLE = '강사'

function resolveInstructorAssignLabel(title: string | undefined): string {
  const role = INSTRUCTOR_UNASSIGNED_TITLE_PATTERN.exec(title ?? '')?.[1]
  return `${role ?? INSTRUCTOR_UNASSIGNED_FALLBACK_ROLE} 배정`
}

/** 이동 대상이 없거나 시안상 [닫기]만 두는 알림이면 null (버튼 비노출) */
export function resolveAdminNotificationActionLabel(
  notification: Pick<Notification, 'link' | 'target'> & Partial<Pick<Notification, 'title'>>
): string | null {
  const eventType = notification.target?.eventType?.trim().toUpperCase()
  if (eventType && CLOSE_ONLY_EVENT_TYPES.has(eventType)) return null
  if (!hasAdminNotificationNavigation(notification)) return null
  if (eventType && INSTRUCTOR_UNASSIGNED_EVENT_TYPES.has(eventType)) {
    return resolveInstructorAssignLabel(notification.title)
  }
  if (eventType && EVENT_TYPE_ACTION_LABELS[eventType]) return EVENT_TYPE_ACTION_LABELS[eventType]
  const linkType = notification.target?.linkType?.trim().toUpperCase()
  if (linkType && LINK_TYPE_ACTION_LABELS[linkType]) return LINK_TYPE_ACTION_LABELS[linkType]
  return DEFAULT_ACTION_LABEL
}
