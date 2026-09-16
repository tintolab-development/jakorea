import type { Dayjs } from 'dayjs'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'

/** 신청 기관(학교) — 타입·승인 상태 패치 도우미 */

export type ApplicantApprovalStatusKey = 'pending' | 'rejected' | 'approved'

export type ApplicantSchoolApprovalNotifyTiming = 'immediate' | 'on_announcement' | 'manual'

export type ApplicantSchoolApprovalNotifyOptions = {
  notifyTiming: ApplicantSchoolApprovalNotifyTiming
  manualNotifyAt?: Dayjs | null
  /** 반려 시 사유 */
  rejectionReason?: string
}

/** TT 희망 교육 일정 세션 (OpenAPI PreferredScheduleSessionTime) */
export type ApplicantPreferredScheduleSessionTime = {
  sessionIndex: number
  classPeriod: string
  timeRange: string
  startTime?: string
  endTime?: string
}

/** TT 희망 교육 일정 블록 — memo와 별도, memo 파싱 금지 */
export type ApplicantPreferredScheduleBlock = {
  preferenceRank: number
  /** YYYY-MM-DD 또는 표시용 날짜 문자열 */
  date: string
  dayOfWeek: string
  sessionCount: number
  sessionTimes: ApplicantPreferredScheduleSessionTime[]
}

/** 신청 기관 상세 — 기본 정보·안내 사항 확장 필드 (mock/UI 공통) */
export interface ApplicantInstitutionDetailExtend {
  addressDetail?: string
  educationLocation?: string
  educationType?: string
  textbookName?: string
  totalHoursAndSessions?: string
  previousYearParticipation?: string
  affiliatedFinancialCompany?: string
  /** 담당 교사 정보 (교사명 | Tel | M | E-mail) */
  teacherInfo?: string
  applicationReason?: string
  otherRequests?: string
  computerInSpace?: string
  waitingRoom?: string
  parkingInfo?: string
  mealInfo?: string
  sexOffenseCheckRequest?: string
  /** 성범죄 경력 조회서 첨부 파일명 (표시용) */
  sexOffenseRecordAttachmentFileName?: string
  /** 교재 마스터 id (일반 프로그램 기관 상세 수정) */
  textbookId?: string
  /** 합반 신청 여부 (일반 프로그램 기관 상세) */
  combinedClassApplication?: '신청' | '미신청'
  /** 합반 대상 신청 id 목록 */
  combinedClassPartnerApplicantIds?: string[]
  /** 합반 대상 학년 표시용 */
  combinedClassPartnerGrades?: string[]
  /** 대기 장소 안내 (일반 프로그램 기관 상세) */
  waitingPlaceGuide?: string
  /** 기타 특이사항 — 주차, 전달사항 등 (일반 프로그램 기관 상세) */
  otherSpecialNotes?: string
}

export interface ApplicantSchoolRow {
  id: string
  /** BE 기관 ID — 신청 PK와 구분 */
  organizationId?: number
  /** BE 담당 교사 회원 ID */
  teacherMemberId?: number
  no: number
  schoolName: string
  region: string
  /** 희망 교육 진행 기간 (예: 26.01.09(금)~26.01.30(금)) - 하위 호환용, sessions 우선 */
  desiredEducationPeriod?: string
  educationGrade: string
  classCount: number
  studentCount: number
  teacherName: string
  contact?: string
  appliedAt?: string
  approvalStatus: ApplicantApprovalStatusKey
  /** 일정 변경&취소 이력 횟수 (참여 학교명 옆 배지용) */
  scheduleChangeCancelCount?: number
  /** 프로그램 ID (수강 신청 학교 목록 모달에서 프로그램별 필터용) */
  programId?: string
  /** 강의 회차 별 희망 교육 날짜 및 시간 (참여 기관과 동일 형식) */
  sessions?: ParticipatingSchoolSession[]
  /**
   * 교육받은 교사 희망 교육 일정 structured blocks.
   * remote SoT — desiredEducationScheduleMemo를 파싱해 채우지 않음.
   */
  preferredScheduleBlocks?: ApplicantPreferredScheduleBlock[]
  /** 담당 강사(들) — 신청 단계에서는 미배정일 수 있음 */
  assignedInstructorNames?: string
  /** 기본 정보·안내 사항 상세 (mock 시안용) */
  detail?: ApplicantInstitutionDetailExtend
  /** 참여 반려 시 사유 (프로그램 승인 현황 영역 표시용) */
  participationRejectionReason?: string
  /** 승인 알림 발송 예약 방식 */
  approvalNotifyTiming?: ApplicantSchoolApprovalNotifyTiming
  /** 반려 알림 발송 예약 방식 */
  rejectionNotifyTiming?: ApplicantSchoolApprovalNotifyTiming
  /** 승인/반려 알림 발송 일시 — 상세 승인 현황 행 표시 */
  approvalNotificationSentAt?: string
  /** 신청 건별 관리자 코멘트 (회원 상세 adminComment와 별도) */
  adminComment?: string
}

export interface ApplicantInstitutionDetailSavePayload {
  adminComment?: string
  educationGrade: string
  classCount: number
  studentCount: number
  addressDetail?: string
  educationType?: string
  applicationReason?: string
  otherRequests?: string
  computerInSpace?: string
  waitingPlaceGuide?: string
  mealInfo?: string
  otherSpecialNotes?: string
  textbookId: string
  textbookName: string
  combinedClassApplication: '신청' | '미신청'
  combinedClassPartnerApplicantIds: string[]
  teacherName?: string
  contact?: string
  teacherInfo?: string
}

export function formatApplicantSchoolApprovalNotificationSentAt(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}:${ss}`
}

export function resolveApplicantSchoolApprovalNotificationSentAt(
  options?: ApplicantSchoolApprovalNotifyOptions
): string | undefined {
  if (!options || options.notifyTiming === 'immediate') {
    return formatApplicantSchoolApprovalNotificationSentAt()
  }
  if (options.notifyTiming === 'on_announcement') {
    return undefined
  }
  if (options.notifyTiming === 'manual' && options.manualNotifyAt) {
    return formatApplicantSchoolApprovalNotificationSentAt(options.manualNotifyAt.toDate())
  }
  return undefined
}

export function patchApplicantSchoolForApprovalStatus(
  row: ApplicantSchoolRow,
  approvalStatus: ApplicantApprovalStatusKey,
  notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): ApplicantSchoolRow {
  if (approvalStatus === 'approved') {
    return {
      ...row,
      approvalStatus,
      participationRejectionReason: undefined,
      approvalNotifyTiming: notifyOptions?.notifyTiming,
      rejectionNotifyTiming: undefined,
      approvalNotificationSentAt: resolveApplicantSchoolApprovalNotificationSentAt(notifyOptions),
    }
  }
  if (approvalStatus === 'rejected') {
    return {
      ...row,
      approvalStatus,
      participationRejectionReason: notifyOptions?.rejectionReason ?? row.participationRejectionReason,
      approvalNotifyTiming: undefined,
      rejectionNotifyTiming: notifyOptions?.notifyTiming,
      approvalNotificationSentAt: resolveApplicantSchoolApprovalNotificationSentAt(notifyOptions),
    }
  }
  return {
    ...row,
    approvalStatus,
    participationRejectionReason: undefined,
    approvalNotifyTiming: undefined,
    rejectionNotifyTiming: undefined,
    approvalNotificationSentAt: undefined,
  }
}

export function patchApplicantSchoolForCancelApproval(
  row: ApplicantSchoolRow,
  notifyOptions: ApplicantSchoolApprovalNotifyOptions
): ApplicantSchoolRow {
  return patchApplicantSchoolForApprovalStatus(row, 'rejected', notifyOptions)
}

export function patchApplicantSchoolForCancelRejection(
  row: ApplicantSchoolRow,
  notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): ApplicantSchoolRow {
  const pending = patchApplicantSchoolForApprovalStatus(row, 'pending')
  if (!notifyOptions) {
    return pending
  }
  return {
    ...pending,
    approvalNotificationSentAt: resolveApplicantSchoolApprovalNotificationSentAt(notifyOptions),
  }
}

export function patchApplicantSchoolForNotificationResend(
  row: ApplicantSchoolRow,
  sentAt = new Date()
): ApplicantSchoolRow {
  return {
    ...row,
    approvalNotificationSentAt: formatApplicantSchoolApprovalNotificationSentAt(sentAt),
  }
}

/** Mock 시드 제거 */
export const MOCK_APPLICANT_INSTITUTIONS: ApplicantSchoolRow[] = []

export function getApplicantSchoolsByProgramId(_programId?: string): ApplicantSchoolRow[] {
  return []
}

export function updateApplicantSchoolApprovalStatus(
  _schoolId: string,
  _approvalStatus: ApplicantApprovalStatusKey,
  _notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): void {}

export function updateApplicantSchoolCancelApproval(
  _schoolId: string,
  _notifyOptions: ApplicantSchoolApprovalNotifyOptions
): void {}

export function updateApplicantSchoolCancelRejection(
  _schoolId: string,
  _notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): void {}

export function updateApplicantSchoolNotificationResend(
  _schoolId: string,
  _sentAt?: Date
): void {}

export function patchApplicantInstitutionAdminComment(
  _schoolId: string,
  _adminComment: string
): ApplicantSchoolRow | null {
  return null
}

export function patchApplicantInstitutionDetail(
  _schoolId: string,
  _payload: ApplicantInstitutionDetailSavePayload
): ApplicantSchoolRow | null {
  return null
}

export function patchApplicantInstitutionDetailWithCombinedClass(
  _sourceId: string,
  _payload: ApplicantInstitutionDetailSavePayload
): ApplicantSchoolRow[] {
  return []
}
