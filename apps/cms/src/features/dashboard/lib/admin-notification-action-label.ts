/**
 * 알림 안내 팝업 — 이동 버튼 문구.
 * 시안 Figma 「시스템 안내 팝업」(17119:183139) 이벤트별 버튼 문구를 우선 쓰고,
 * 시안에 없는 이벤트는 이동 대상(`admin-notification-navigation`)에 맞춘 linkType 문구, 모르는 값은 「자세히 보기」.
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

/** 시안 「시스템 안내 팝업」 이벤트별 버튼 문구 — linkType 문구보다 우선 */
const EVENT_TYPE_ACTION_LABELS: Readonly<Record<string, string>> = {
  /** 신청·매칭 — 관리자_신규_관리자_권한_요청 / 관리자_신규_강사_권한_요청 */
  ADMIN_SIGNUP_APPROVAL_REQUESTED: '신청 목록 보기',
  ADMIN_INSTRUCTOR_ROLE_REQUESTED: '신청 목록 보기',
  /** 신청·매칭 — 관리자_프로그램_신규_신청자·기관·강사·봉사자 */
  ADMIN_PROGRAM_APPLICATION_DAILY_SUMMARY: '신청 목록 보기',
  ADMIN_PROGRAM_APPLICATION_SUBMITTED: '신청 목록 보기',
  ADMIN_ORGANIZATION_APPLICATION_SUBMITTED: '신청 목록 보기',
  ADMIN_INSTRUCTOR_APPLICATION_SUBMITTED: '신청 목록 보기',
  ADMIN_VOLUNTEER_APPLICATION_SUBMITTED: '신청 목록 보기',
  /** 프로그램 진행 — 관리자_학생_명단_제출_완료·수정_제출·미제출 / 관리자_초상권_동의서_미제출 */
  ADMIN_STUDENT_ROSTER_SUBMITTED: '학생 명단 확인',
  ADMIN_STUDENT_ROSTER_UPDATED: '학생 명단 확인',
  ADMIN_STUDENT_ROSTER_UNSUBMITTED: '학생 명단 확인',
  ADMIN_PORTRAIT_CONSENT_UNSUBMITTED: '학생 명단 확인',
  /** 정산 — 관리자_신규_정산_신청 / 관리자_정산_재신청 */
  ADMIN_SETTLEMENT_APPLICATION_SUBMITTED: '신청 내역 확인',
  ADMIN_SETTLEMENT_APPLICATION_RESUBMITTED: '신청 내역 확인',
  /** 정산 — 관리자_강사비_정정_요청 (17149:68674) */
  [ADMIN_PAYMENT_STATEMENT_CORRECTION_REQUESTED_EVENT]: '정정 요청 확인',
  /** 정산 — 관리자_강사비_확인_완료 / 관리자_영수증_확인_완료 */
  ADMIN_PAYMENT_STATEMENT_CONFIRMED: '지급 대상 목록 보기',
  ADMIN_EXPENSE_RECEIPT_CONFIRMED: '지급 대상 목록 보기',
  /** 문의 — 관리자_신규_문의_접수 */
  ADMIN_INQUIRY_CREATED: '문의 내용 확인',
  ADMIN_INQUIRY_CREATED_UNASSIGNED: '문의 내용 확인',
  ADMIN_INQUIRY_CREATED_MAILBOX: '문의 내용 확인',
  /** 업데이트 — 관리자_교사_정보_변경 / 관리자_신규_게시글_안내 / 관리자_신규_댓글_안내 */
  ADMIN_TEACHER_EMPLOYMENT_CHANGED: '회원 정보 보기',
  ADMIN_PROGRAM_NOTICE_CREATED: '게시글 확인',
  ADMIN_PROGRAM_POST_COMMENT_CREATED: '댓글 확인',
  /** 시스템 — 관리자_관리자_권한_변경 */
  ADMIN_ROLE_CHANGED: '내 정보 보기',
}

/** 시안상 [닫기]만 두는 이벤트 — 관리자_프로그램_신청_취소 (17149:68492) */
const CLOSE_ONLY_EVENT_TYPES: ReadonlySet<string> = new Set(['ADMIN_PROGRAM_APPLICATION_CANCELLED'])

/** 시안 버튼 「#{교육진행자} 배정」 — 관리자_기관·개인_프로그램_#{교육진행자}_미배정_건_안내 */
const INSTRUCTOR_UNASSIGNED_EVENT_TYPES: ReadonlySet<string> = new Set([
  'ADMIN_ORGANIZATION_PROGRAM_INSTRUCTOR_UNASSIGNED',
  'ADMIN_INDIVIDUAL_PROGRAM_INSTRUCTOR_UNASSIGNED',
])

/** 알림 응답에 변수 값이 없어, 시안 제목 「#{교육진행자} 미배정 건 안내」에서 #{교육진행자} 자리를 읽는다 */
const INSTRUCTOR_UNASSIGNED_TITLE_PATTERN = /(\S+)\s+미배정\s+건\s+안내/
const INSTRUCTOR_UNASSIGNED_FALLBACK_ROLE = '교육진행자'

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
