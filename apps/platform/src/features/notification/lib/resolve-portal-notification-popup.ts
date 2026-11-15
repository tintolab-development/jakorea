import { MYPAGE_INQUIRIES_PATH } from '../../mypage/lib/constants.ts'
import type { MemberNotificationResponse } from '../api/client.ts'
import { resolvePortalNotificationPath } from './resolve-portal-notification-path.ts'

/**
 * 알림 클릭 시 안내 팝업 — 시안 Figma 사용자 플랫폼 「시스템 안내 팝업」(tiDywBHEhTkruOHjh1ctuT, node 14592:80111).
 * 시안 프레임이 있는 알림만 팝업을 띄우고, 그 밖의 알림은 null → 기존처럼 바로 이동한다.
 *
 * - 제목·본문: 서버 title·message 그대로 (FE 문구 생성 금지 — BE 2026-11-16 계약)
 * - 회색 [프로그램명] 줄: 서버 programName이 있을 때만 (활동 기관 배정 취소는 서버가 배정 기관명을 담아 보낸다)
 * - 사유 상자: 서버 reason이 있을 때만. 상자 제목은 시안대로 이벤트별로 붙인다.
 * - 이동 버튼: 시안 문구. 이동 위치는 기존 linkType 라우팅, [관리자 문의]는 기획대로 1:1 문의.
 *   이동 위치가 없으면 버튼 없이 [닫기]만.
 */
export type PortalNotificationPopup = {
  title: string
  /** 회색 [프로그램명] 줄 값. 없으면 줄을 그리지 않는다 */
  programName: string | null
  message: string
  /** 회색 사유 상자. reason이 없으면 null */
  reason: { label: string; text: string } | null
  actionLabel: string | null
  path: string | null
}

type ReasonLabel = '취소 사유' | '반려 사유' | '해제 사유' | '수정 요청' | '거절 사유'

type PopupSpec = {
  actionLabel: string
  reasonLabel?: ReasonLabel
}

const INQUIRY_ACTION_LABEL = '관리자 문의'

function spec(actionLabel: string, reasonLabel?: ReasonLabel): PopupSpec {
  return reasonLabel ? { actionLabel, reasonLabel } : { actionLabel }
}

/** eventType → 시안 버튼 문구·사유 상자 제목 */
const POPUP_SPEC_BY_EVENT_TYPE: Readonly<Record<string, PopupSpec>> = {
  // 시스템
  MEMBER_CONSENT_COMPLETED: spec('동의 내역 보기'),
  MEMBER_CONSENT_EXPIRING: spec('다시 동의하기'),
  MEMBER_IDENTITY_VERIFIED: spec('내 정보 보기'),
  // 신청·매칭
  INSTRUCTOR_ASSIGNMENT_CANCELLED: spec('배정 현황 보기', '취소 사유'),
  INSTRUCTOR_ASSIGNMENT_ASSIGNED: spec('배정 현황 보기'),
  PROGRAM_APPLICATION_SUBMITTED: spec('신청 내역 보기'),
  PROGRAM_APPLICATION_CANCELLED: spec('신청 내역 보기'),
  INSTRUCTOR_ORGANIZATION_ASSIGNMENT_ASSIGNED: spec('배정 현황 보기'),
  GENERAL_ORGANIZATION_VOLUNTEER_ASSIGNED: spec('배정 현황 보기'),
  ACTIVITY_ORGANIZATION_ASSIGNED: spec('배정 현황 보기'),
  INSTRUCTOR_ORGANIZATION_ASSIGNMENT_CANCELLED: spec('배정 현황 보기', '취소 사유'),
  GENERAL_ORGANIZATION_VOLUNTEER_ASSIGNMENT_CANCELLED: spec('배정 현황 보기', '취소 사유'),
  ACTIVITY_ORGANIZATION_ASSIGNMENT_CANCELLED: spec('배정 현황 보기', '취소 사유'),
  PROGRAM_APPLICATION_GIVE_UP: spec('활동 내역 보기'),
  INDIVIDUAL_APPLICATION_GIVE_UP: spec('활동 내역 보기'),
  VOLUNTEER_APPLICATION_GIVE_UP: spec('활동 내역 보기'),
  // 승인·반려
  INSTRUCTOR_ROLE_APPROVED: spec('강사 프로그램 보기'),
  INSTRUCTOR_ROLE_REJECTED: spec(INQUIRY_ACTION_LABEL, '반려 사유'),
  INSTRUCTOR_ROLE_APPROVAL_CANCELLED: spec(INQUIRY_ACTION_LABEL, '취소 사유'),
  INSTRUCTOR_ROLE_REVOKED: spec(INQUIRY_ACTION_LABEL, '취소 사유'),
  INSTRUCTOR_ROLE_TERMINATED: spec(INQUIRY_ACTION_LABEL, '해제 사유'),
  ORGANIZATION_APPLICATION_APPROVED: spec('프로그램 상세 보기'),
  INDIVIDUAL_APPLICATION_APPROVED: spec('프로그램 상세 보기'),
  INSTRUCTOR_APPLICATION_APPROVED: spec('프로그램 상세 보기'),
  ORGANIZATION_APPLICATION_APPROVAL_CANCELLED: spec(INQUIRY_ACTION_LABEL, '취소 사유'),
  INDIVIDUAL_APPLICATION_APPROVAL_CANCELLED: spec(INQUIRY_ACTION_LABEL, '취소 사유'),
  INSTRUCTOR_APPLICATION_APPROVAL_CANCELLED: spec(INQUIRY_ACTION_LABEL, '취소 사유'),
  VOLUNTEER_DOCUMENT_PASSED: spec('면접 일정 보기'),
  VOLUNTEER_DOCUMENT_REJECTED: spec('신청 내역 보기'),
  VOLUNTEER_APPLICATION_APPROVED: spec('프로그램 상세 보기'),
  VOLUNTEER_APPLICATION_RESERVED: spec('신청 내역 보기'),
  VOLUNTEER_APPLICATION_REJECTED: spec('신청 내역 보기'),
  UJAT_ORGANIZATION_SCHEDULE_SUBMITTED: spec('신청 내역 보기'),
  UJAT_ORGANIZATION_SCHEDULE_REVISION_REQUESTED: spec('일정 수정하기', '수정 요청'),
  UJAT_ORGANIZATION_SCHEDULE_APPROVED: spec('프로그램 상세 보기'),
  ORGANIZATION_APPLICATION_REJECTED: spec(INQUIRY_ACTION_LABEL, '거절 사유'),
  INDIVIDUAL_APPLICATION_REJECTED: spec(INQUIRY_ACTION_LABEL, '거절 사유'),
  INSTRUCTOR_APPLICATION_REJECTED: spec(INQUIRY_ACTION_LABEL, '거절 사유'),
  UJAT_ORGANIZATION_APPLICATION_REJECTED: spec(INQUIRY_ACTION_LABEL, '거절 사유'),
  ORGANIZATION_APPLICATION_REJECTION_CANCELLED: spec('신청 내역 보기'),
  INDIVIDUAL_APPLICATION_REJECTION_CANCELLED: spec('신청 내역 보기'),
  INSTRUCTOR_APPLICATION_REJECTION_CANCELLED: spec('신청 내역 보기'),
  // 프로그램 진행
  PROGRAM_START_NOTICE: spec('안내사항 보기'),
  PROGRAM_PREPARATION_NOTICE: spec('안내사항 보기'),
  EDUCATION_SCHEDULE_CONFIRMED: spec('교육 일정 보기'),
  STUDENT_ROSTER_SUBMISSION_DEADLINE_NOTICE: spec('학생 명단 제출하기'),
  PORTRAIT_CONSENT_SUBMISSION_DEADLINE_NOTICE: spec('학생 초상권 동의서 제출하기'),
  LECTURE_REPORT_SUBMISSION_DEADLINE_NOTICE: spec('강의보고서 제출하기'),
  SETTLEMENT_APPLICATION_SUBMISSION_DEADLINE_NOTICE: spec('강사비 신청하기'),
  PROGRAM_PARTICIPANT_COMPLETION_COMPLETED: spec('수료증 발급하기'),
  PROGRAM_PARTICIPANT_COMPLETION_NOT_COMPLETED: spec(INQUIRY_ACTION_LABEL),
  UJAT_VOLUNTEER_ATTENDANCE_STATUS_CHANGED: spec('출석 현황 보기'),
  UJAT_VOLUNTEER_ATTENDANCE_ADMIN_CHANGED: spec('출석 현황 보기'),
  ASSIGNMENT_FEEDBACK_REQUESTED: spec('피드백 보기'),
  EDUCATION_PLAN_FEEDBACK_REQUESTED: spec('피드백 보기'),
  EDUCATION_JOURNAL_FEEDBACK_REQUESTED: spec('피드백 보기'),
  EXPENSE_RECEIPT_SUBMISSION_DEADLINE_NOTICE: spec('영수증 제출하기'),
  // 업데이트
  PROGRAM_NOTICE_CREATED: spec('안내사항 보기'),
  MEMBER_PROGRAM_POST_COMMENT_CREATED: spec('확인하기'),
  PROGRAM_INFO_CHANGED: spec('변경사항 보기'),
  EDUCATION_SCHEDULE_CHANGED_BEFORE_ASSIGNMENT: spec('교육 일정 보기'),
  EDUCATION_SCHEDULE_CHANGED_AFTER_ASSIGNMENT: spec('교육 일정 보기'),
  VOLUNTEER_INTERVIEW_REASSIGNED: spec('면접 일정 보기'),
  INDIVIDUAL_INTERVIEW_REASSIGNED: spec('면접 일정 보기'),
  // 정산
  SETTLEMENT_APPLICATION_SUBMITTED: spec('정산 현황 보기'),
  SETTLEMENT_APPLICATION_CONFIRMED: spec('정산 현황 보기'),
  SETTLEMENT_PAYMENT_PAID: spec('지급 내역 보기'),
  EXPENSE_RECEIPT_PAYMENT_PAID: spec('지급 내역 보기'),
  PAYMENT_STATEMENT_CORRECTION_REQUESTED: spec('정산 현황 보기'),
  SETTLEMENT_CORRECTION_COMPLETED: spec('정정 내역 확인하기'),
  SETTLEMENT_APPLICATION_REJECTED: spec('반려 사유 확인하기', '반려 사유'),
  EXPENSE_RECEIPT_SUBMITTED: spec('정산 현황 보기'),
  EXPENSE_RECEIPT_REJECTED: spec('거절 사유 확인하기', '거절 사유'),
  // 문의
  INQUIRY_RECEIVED: spec('문의 내역 보기'),
  INQUIRY_ANSWERED: spec('문의 답변 보기'),
}

function trimmedOrNull(value: string | null | undefined): string | null {
  const text = value?.trim()
  return text ? text : null
}

export function resolvePortalNotificationPopup(
  item: Pick<
    MemberNotificationResponse,
    | 'eventType'
    | 'title'
    | 'message'
    | 'programName'
    | 'reason'
    | 'linkType'
    | 'linkId'
    | 'sourceId'
    | 'programId'
    | 'sourceDomain'
  >,
): PortalNotificationPopup | null {
  const popupSpec = POPUP_SPEC_BY_EVENT_TYPE[item.eventType?.trim().toUpperCase() ?? '']
  if (!popupSpec) return null
  const path =
    popupSpec.actionLabel === INQUIRY_ACTION_LABEL
      ? MYPAGE_INQUIRIES_PATH
      : resolvePortalNotificationPath(item)
  const reasonText = trimmedOrNull(item.reason)
  return {
    title: item.title,
    programName: trimmedOrNull(item.programName),
    message: item.message,
    reason: reasonText && popupSpec.reasonLabel ? { label: popupSpec.reasonLabel, text: reasonText } : null,
    actionLabel: path ? popupSpec.actionLabel : null,
    path,
  }
}
