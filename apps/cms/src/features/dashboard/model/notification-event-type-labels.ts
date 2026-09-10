/**
 * 자동발송 `eventType` → 인박스/목록 한글 표시명 (Wave1–13).
 * BE SSOT: CMS_FE_QA_AUTO_SEND_WAVES_1_13 / CMS_FE_BE_HANDOFF_AUTO_SEND_CASE_PRIORITY
 * invent-ban: 여기 없는 코드는 raw 노출 대신 fallback.
 */

export const NOTIFICATION_EVENT_TYPE_LABELS: Readonly<Record<string, string>> = {
  // 인증
  MEMBER_LOGIN_FAILURE_NOTICE: '로그인 실패 안내',
  MEMBER_LOGIN_LOCK_NOTICE: '계정 잠금 처리 안내',
  ADMIN_LOGIN_LOCK_NOTICE: '계정 잠금 처리 안내',
  ADMIN_MFA_FAILURE_NOTICE: 'MFA 2단계 인증 실패 안내',
  // 가입·동의·휴면
  MEMBER_SIGNUP_COMPLETED: '회원가입 완료 안내',
  MEMBER_CONSENT_COMPLETED: '동의 완료',
  MEMBER_CONSENT_WITHDRAWN: '동의 철회 안내',
  DORMANT_ACCOUNT_TRANSITIONED: '계정 휴면 전환 처리 안내',
  DORMANT_ACCOUNT_PRE_NOTICE: '계정 휴면 전환 예정 안내',
  MEMBER_CONSENT_EXPIRING: '필수 동의 항목 만료 예정',
  MEMBER_IDENTITY_VERIFIED: '본인인증 완료',
  DORMANT_ACCOUNT_WITHDRAWAL_PRE_NOTICE: '장기 휴면 회원 탈퇴 처리 안내',
  MEMBER_WITHDRAWAL_COMPLETED: '홈페이지 탈퇴 완료 안내',
  // 신청 cancel (Wave5)
  ORGANIZATION_APPLICATION_APPROVAL_CANCELLED: '기관 승인 취소',
  ORGANIZATION_APPLICATION_REJECTION_CANCELLED: '기관 반려 취소',
  INDIVIDUAL_APPLICATION_REJECTION_CANCELLED: '개인 반려 취소',
  PROGRAM_APPLICATION_CANCELLED: '프로그램 신청 취소 완료',
  ADMIN_PROGRAM_APPLICATION_CANCELLED: '프로그램 신청 취소',
  // 마감
  STUDENT_ROSTER_SUBMISSION_DEADLINE_NOTICE: '학생 명단 제출 마감일 안내',
  PORTRAIT_CONSENT_SUBMISSION_DEADLINE_NOTICE: '초상권 동의서 제출 마감일 안내',
  LECTURE_REPORT_SUBMISSION_DEADLINE_NOTICE: '강의보고서 제출 마감일 안내',
  EXPENSE_RECEIPT_SUBMISSION_DEADLINE_NOTICE: '영수증 제출 마감일 안내',
  SETTLEMENT_APPLICATION_SUBMISSION_DEADLINE_NOTICE: '지급조서 제출 마감일 안내',
  // UJAT — BE 키 SSOT (`UJAT_VOLUNTEER_ATTENDANCE_STATUS_CHANGED`)
  UJAT_ORGANIZATION_SCHEDULE_SUBMITTED: 'UJAT 진행 일정 제출 완료',
  UJAT_ORGANIZATION_SCHEDULE_APPROVED: 'UJAT 진행 일정 승인 완료',
  UJAT_ORGANIZATION_SCHEDULE_REVISION_REQUESTED: 'UJAT 진행 일정 수정 요청',
  UJAT_VOLUNTEER_ATTENDANCE_STATUS_CHANGED: 'UJAT 출석 현황 안내',
  /** @deprecated BE는 STATUS_CHANGED — 구 키 호환 */
  UJAT_VOLUNTEER_ATTENDANCE_NOTICE: 'UJAT 출석 현황 안내',
  UJAT_ATTENDANCE_MANAGER_CHANGED: 'UJAT 출석 현황 관리자 변경 안내',
  // 수료·배정 — BE 키 SSOT (`…_NOT_COMPLETED`)
  PROGRAM_PARTICIPANT_COMPLETION_COMPLETED: '프로그램 수료 완료 안내',
  PROGRAM_PARTICIPANT_COMPLETION_NOT_COMPLETED: '프로그램 수료 불가 안내',
  /** @deprecated BE는 NOT_COMPLETED — 구 키 호환 */
  PROGRAM_PARTICIPANT_COMPLETION_FAILED: '프로그램 수료 불가 안내',
  ACTIVITY_ORGANIZATION_ASSIGNED: '활동 기관 배정 완료',
  ACTIVITY_ORGANIZATION_ASSIGNMENT_CANCELLED: '활동 기관 배정 취소',
  // 시작·안내 — 회원 vs 관리자 문구 구분 (G2)
  PROGRAM_START_NOTICE: '프로그램 시작 안내',
  PROGRAM_PREPARATION_NOTICE: '프로그램 준비 안내',
  PROGRAM_NOTICE_CREATED: '신규 안내사항 안내',
  SETTLEMENT_CORRECTION_COMPLETED: '지급조서 정정 완료',
  PROGRAM_INFO_CHANGED: '프로그램 정보 변경 안내',
  // 교육 일정
  EDUCATION_SCHEDULE_CONFIRMED: '교육 일정 확정',
  EDUCATION_SCHEDULE_CHANGED_BEFORE_ASSIGNMENT: '교육 일정 변경 (배정 전)',
  EDUCATION_SCHEDULE_CHANGED_AFTER_ASSIGNMENT: '교육 일정 변경 (배정 후)',
  // 피드백 확인 요청
  ASSIGNMENT_FEEDBACK_REQUESTED: '과제 피드백 확인 요청',
  EDUCATION_PLAN_FEEDBACK_REQUESTED: '교육계획서 피드백 확인 요청',
  EDUCATION_JOURNAL_FEEDBACK_REQUESTED: '교육일지 피드백 확인 요청',
  // CMS 어드민 Wave12
  ADMIN_INDIVIDUAL_PROGRAM_INSTRUCTOR_UNASSIGNED: '개인 프로그램 교육진행자 미배정 건 안내',
  ADMIN_ORGANIZATION_PROGRAM_INSTRUCTOR_UNASSIGNED: '기관 프로그램 교육진행자 미배정 건 안내',
  ADMIN_PROGRAM_NOTICE_CREATED: '신규 안내사항 안내 (관리자)',
  ADMIN_PORTRAIT_CONSENT_UNSUBMITTED: '초상권 동의서 미제출',
  ADMIN_STUDENT_ROSTER_UNSUBMITTED: '학생 명단 미제출',
} as const

const FALLBACK_LABEL = '알림'

/** eventType 코드를 한글 라벨로. 미등록 코드는 fallback(기본: 알림). */
export function resolveNotificationEventTypeLabel(
  eventType?: string | null,
  fallback: string = FALLBACK_LABEL
): string {
  const key = eventType?.trim()
  if (!key) return fallback
  return NOTIFICATION_EVENT_TYPE_LABELS[key] ?? fallback
}

/** title이 비었거나 eventType raw 코드와 같으면 라벨로 대체 */
export function resolveNotificationInboxTitle(input: {
  title?: string | null
  eventType?: string | null
}): string {
  const title = input.title?.trim() ?? ''
  const eventType = input.eventType?.trim() ?? ''
  if (!title || (eventType && title === eventType)) {
    return resolveNotificationEventTypeLabel(eventType)
  }
  return title
}
