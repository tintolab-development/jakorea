/**
 * 일반 프로그램 개인 참여자 신청 — 타입 및 상태 패치 도우미.
 * @/features/program/general/model/individual-applicant에서 이전 (Phase 2).
 */

import type { ParticipatingSchoolSession, TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import type { ApplicantApprovalStatusKey, ApplicantSchoolApprovalNotifyOptions, ApplicantSchoolApprovalNotifyTiming } from '@/features/program/shared/model/applicant-institution'
import { resolveApplicantSchoolApprovalNotificationSentAt } from '@/features/program/shared/model/applicant-institution'
import type { GeneralDocumentScreeningStatus, GeneralInterviewAssignmentStatus, GeneralManagerEvaluation, GeneralSecondInterviewScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'

export type GeneralIndividualApplicantInterviewAvailabilityDay = {
  dateLabel: string
  slots: string[]
}

export type IndividualApplicantConsentValue = 'agree' | 'disagree'

/** 일반 프로그램 개인 참여자 신청 상세 확장 필드 */
export interface GeneralIndividualApplicantDetail {
  gender?: string
  birthDate?: string
  age?: number
  schoolEnrollmentStatus?: string
  affiliationSchool?: string
  affiliationGrade?: string
  contact?: string
  email?: string
  homeAddressFull?: string
  id1365?: string
  selfIntroduction?: string
  personalInfoConsent?: IndividualApplicantConsentValue
  thirdPartyConsent?: IndividualApplicantConsentValue
  teamName?: string
  /** 팀 인원 수 (직접 입력 포함 최종 인원) */
  teamMemberCount?: number
  /** 셀렉트 값 — 1~5 또는 custom */
  teamMemberCountSelect?: '1' | '2' | '3' | '4' | '5' | 'custom'
  teamRole?: 'leader' | 'member'
  interviewAvailability?: GeneralIndividualApplicantInterviewAvailabilityDay[]
  scheduleChangeCancelCount?: number
}

export interface GeneralIndividualApplicantRow {
  id: string
  /** unmask path용 — remote 목록 `memberId` */
  memberId?: string
  no: number
  applicantName: string
  /** Admin API가 현재 상태에서 허용하는 canonical action 목록 */
  availableActions?: string[]
  privacyMaskingLevel?: 'MASKED' | 'UNMASKED'
  canRevealPersonalInfo?: boolean
  canEditManagerAEvaluation?: boolean
  canEditManagerBEvaluation?: boolean
  affiliation: string
  educationGrade: string
  homeAddress: string
  approvalStatus: ApplicantApprovalStatusKey
  programId?: string
  sessions?: ParticipatingSchoolSession[]
  detail?: GeneralIndividualApplicantDetail
  participationRejectionReason?: string
  /** 승인 알림 발송 예약 방식 */
  approvalNotifyTiming?: ApplicantSchoolApprovalNotifyTiming
  /** 반려 알림 발송 예약 방식 */
  rejectionNotifyTiming?: ApplicantSchoolApprovalNotifyTiming
  /** 승인/반려 알림 발송 일시 — 상세 승인 현황 행 표시 */
  approvalNotificationSentAt?: string
  /** 신청 건별 관리자 코멘트 (회원 상세 adminComment와 별도) */
  adminComment?: string
  /** 교재 배정 — 미선택 시 상세 '미정' */
  textbookId?: string
  textbookName?: string
  textbookKits?: number
  textbookQuantity?: number
  textbookStatus?: TextbookStatusKey
  /** 1차 서류 심사 — 담당자 평가·현황 (면접 있는 개인 프로그램) */
  managerAEvaluation?: GeneralManagerEvaluation
  managerBEvaluation?: GeneralManagerEvaluation
  documentScreeningStatus?: GeneralDocumentScreeningStatus
  interviewSlotCount?: number
  interviewAssignmentStatus?: GeneralInterviewAssignmentStatus
  assignedInterviewDateLabel?: string
  assignedInterviewTime?: string
  secondInterviewScreeningStatus?: GeneralSecondInterviewScreeningStatus
  totalScore?: number | null
  managerAScore?: number | null
  managerBScore?: number | null
  interviewEvaluationRemark?: string
}

export interface GeneralIndividualApplicantDetailSavePayload {
  adminComment?: string
  textbookId?: string
  textbookName?: string
  textbookKits?: number
  textbookQuantity?: number
  textbookStatus?: TextbookStatusKey
  teamName?: string
  teamMemberCount?: number
  teamMemberCountSelect?: GeneralIndividualApplicantDetail['teamMemberCountSelect']
}

export function formatApprovalNotificationSentAt(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}:${ss}`
}

export function patchGeneralIndividualApplicantForApprovalStatus(
  row: GeneralIndividualApplicantRow,
  approvalStatus: ApplicantApprovalStatusKey,
  notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): GeneralIndividualApplicantRow {
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

export function patchGeneralIndividualApplicantForCancelApproval(
  row: GeneralIndividualApplicantRow,
  notifyOptions: ApplicantSchoolApprovalNotifyOptions
): GeneralIndividualApplicantRow {
  return patchGeneralIndividualApplicantForApprovalStatus(row, 'rejected', notifyOptions)
}

export function patchGeneralIndividualApplicantForCancelRejection(
  row: GeneralIndividualApplicantRow,
  notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): GeneralIndividualApplicantRow {
  const pending = patchGeneralIndividualApplicantForApprovalStatus(row, 'pending')
  if (!notifyOptions) {
    return pending
  }
  return {
    ...pending,
    approvalNotificationSentAt: resolveApplicantSchoolApprovalNotificationSentAt(notifyOptions),
  }
}

export function patchGeneralIndividualApplicantForNotificationResend(
  row: GeneralIndividualApplicantRow,
  sentAt = new Date(),
  options?: { rejectionReason?: string }
): GeneralIndividualApplicantRow {
  return {
    ...row,
    approvalNotificationSentAt: formatApprovalNotificationSentAt(sentAt),
    ...(options?.rejectionReason != null && options.rejectionReason.trim() !== ''
      ? { participationRejectionReason: options.rejectionReason.trim() }
      : {}),
  }
}

export function patchGeneralIndividualApplicantManagerEvaluation(
  applicantIdOrRow: string | GeneralIndividualApplicantRow,
  manager: 'A' | 'B',
  evaluation: GeneralManagerEvaluation
): GeneralIndividualApplicantRow | null {
  if (typeof applicantIdOrRow === 'string') {
    return null
  }
  if (manager === 'A') {
    return { ...applicantIdOrRow, managerAEvaluation: evaluation }
  }
  return { ...applicantIdOrRow, managerBEvaluation: evaluation }
}

/** Mock 시드 제거 */
export const MOCK_GENERAL_INDIVIDUAL_APPLICATIONS: GeneralIndividualApplicantRow[] = []

export function getGeneralIndividualApplicationsForProgram(
  _programId?: string
): GeneralIndividualApplicantRow[] {
  return []
}

export function getGeneralParticipantDoc1Applicants(
  _programId?: string
): GeneralIndividualApplicantRow[] {
  return []
}

export function getGeneralParticipantDocPassedApplicants(
  _programId?: string
): GeneralIndividualApplicantRow[] {
  return []
}

export function getGeneralParticipantInterview2Applicants(
  _programId?: string
): GeneralIndividualApplicantRow[] {
  return []
}

export function updateGeneralIndividualApplicantApprovalStatus(
  _applicantId: string,
  _approvalStatus: ApplicantApprovalStatusKey,
  _notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): void {}

export function updateGeneralIndividualApplicantCancelApproval(
  _applicantId: string,
  _notifyOptions: ApplicantSchoolApprovalNotifyOptions
): void {}

export function updateGeneralIndividualApplicantCancelRejection(
  _applicantId: string,
  _notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): void {}

export function updateGeneralIndividualApplicantNotificationResend(
  _applicantId: string,
  _sentAt?: Date,
  _options?: { rejectionReason?: string }
): void {}

export function updateGeneralIndividualApplicantTeamRole(
  _applicantId: string,
  _teamRole: NonNullable<GeneralIndividualApplicantDetail['teamRole']>
): void {}

export function patchGeneralIndividualApplicantDetail(
  _applicantId: string,
  _payload: GeneralIndividualApplicantDetailSavePayload
): GeneralIndividualApplicantRow | null {
  return null
}
