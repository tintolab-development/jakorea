/**
 * 일반 프로그램 봉사자 신청 — 타입 및 상태 패치 도우미.
 * @/features/program/general/model/volunteer-applicant에서 이전 (Phase 2).
 */

import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import type {
  GeneralDocumentScreeningStatus,
  GeneralInterviewAssignmentStatus,
  GeneralManagerEvaluation,
  GeneralSecondInterviewScreeningStatus,
  GeneralVolunteerApplicationType,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { GENERAL_VOLUNTEER_APPLICATION_TYPE_LABELS } from '@/features/program/general/lib/volunteer-screening-constants'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'

export type GeneralVolunteerInterviewAvailabilityDay = {
  dateLabel: string
  slots: string[]
}

export interface GeneralVolunteerApplicantRow {
  id: string
  /** BE 회원 ID — 봉사 신청 PK와 구분 */
  memberId?: number
  no: number
  name: string
  contact: string
  email: string
  contactRaw: string
  emailRaw: string
  id1365: string
  scheduleChangeCancelCount: number
  applicationType: GeneralVolunteerApplicationType
  hasJaVolunteerExperience: boolean
  essayIntro: string
  essayEducationExperience: string
  essayNecessity: string
  essayJaExperience: string
  managerAEvaluation: GeneralManagerEvaluation
  managerBEvaluation: GeneralManagerEvaluation
  documentScreeningStatus: GeneralDocumentScreeningStatus
  documentApprovalNotifyTiming?: PermissionModalNotifyTiming
  documentRejectionNotifyTiming?: PermissionModalNotifyTiming
  /** 반려 취소(alreadySent) 시 재발송 알림 시기 */
  documentCancelRejectionNotifyTiming?: PermissionModalNotifyTiming
  /** 반려 취소(alreadySent) 시 취소 사유 */
  documentCancelRejectionReason?: string
  interviewSlotCount: number
  interviewAssignmentStatus: GeneralInterviewAssignmentStatus
  programId: string
  englishName: string
  gender: string
  birthDate: string
  age: number
  universityName: string
  major: string
  applicationRoute: string
  interviewAvailability: GeneralVolunteerInterviewAvailabilityDay[]
  assignedInterviewDateLabel?: string
  assignedInterviewTime?: string
  /** BE 면접 배정 ID — 면접 평가 API path용 */
  interviewAssignmentId?: number
  secondInterviewScreeningStatus?: GeneralSecondInterviewScreeningStatus
  totalScore?: number | null
  managerAScore?: number | null
  managerBScore?: number | null
  interviewEvaluationRemark?: string
  /** 참여자 심사 UI 재사용 시 상세에 전달할 원본 개인 신청 행 */
  participantApplicant?: GeneralIndividualApplicantRow
  /** 관리자 코멘트 (GET /api/admin/comments hydrate) */
  adminComment?: string
}

export type GeneralVolunteerInterviewEvaluationPayload = {
  managerAScore: number | null
  managerBScore: number | null
  interviewEvaluationRemark: string
}

export function patchGeneralVolunteerDocumentScreeningStatus(
  rows: GeneralVolunteerApplicantRow[],
  ids: string[],
  status: 'pass' | 'fail',
  notifyTiming?: PermissionModalNotifyTiming
): GeneralVolunteerApplicantRow[] {
  const idSet = new Set(ids)
  return rows.map(row => {
    if (!idSet.has(row.id)) return row
    if (status === 'pass') {
      return {
        ...row,
        documentScreeningStatus: status,
        documentApprovalNotifyTiming: notifyTiming,
        documentRejectionNotifyTiming: undefined,
        documentCancelRejectionNotifyTiming: undefined,
        documentCancelRejectionReason: undefined,
      }
    }
    return {
      ...row,
      documentScreeningStatus: status,
      documentRejectionNotifyTiming: notifyTiming,
      documentApprovalNotifyTiming: undefined,
      documentCancelRejectionNotifyTiming: undefined,
      documentCancelRejectionReason: undefined,
    }
  })
}

export function patchGeneralVolunteerDocumentScreeningCancel(
  rows: GeneralVolunteerApplicantRow[],
  id: string,
  notifyOptions?: {
    notifyTiming: PermissionModalNotifyTiming
    rejectionReason?: string
  }
): GeneralVolunteerApplicantRow[] {
  return rows.map(row =>
    row.id === id
      ? {
          ...row,
          documentScreeningStatus: 'pending' as const,
          documentApprovalNotifyTiming: undefined,
          documentRejectionNotifyTiming: undefined,
          documentCancelRejectionNotifyTiming: notifyOptions?.notifyTiming,
          documentCancelRejectionReason: notifyOptions?.rejectionReason,
        }
      : row
  )
}

export function patchGeneralVolunteerSecondInterviewScreeningStatus(
  rows: GeneralVolunteerApplicantRow[],
  ids: string[],
  status: GeneralSecondInterviewScreeningStatus
): GeneralVolunteerApplicantRow[] {
  const idSet = new Set(ids)
  return rows.map(row =>
    idSet.has(row.id) ? { ...row, secondInterviewScreeningStatus: status } : row
  )
}

export function patchGeneralVolunteerInterviewEvaluation(
  rows: GeneralVolunteerApplicantRow[],
  id: string,
  payload: GeneralVolunteerInterviewEvaluationPayload,
  computeTotalScore?: (scores: {
    managerAScore: number | null
    managerBScore: number | null
  }) => number | null
): GeneralVolunteerApplicantRow[] {
  return rows.map(row => {
    if (row.id !== id) return row
    const totalScore = computeTotalScore
      ? computeTotalScore({
          managerAScore: payload.managerAScore,
          managerBScore: payload.managerBScore,
        })
      : payload.managerAScore != null && payload.managerBScore != null
        ? payload.managerAScore + payload.managerBScore
        : null
    return {
      ...row,
      managerAScore: payload.managerAScore,
      managerBScore: payload.managerBScore,
      interviewEvaluationRemark: payload.interviewEvaluationRemark,
      totalScore,
      secondInterviewScreeningStatus: 'completed',
    }
  })
}

export function formatGeneralVolunteerApplicationType(type: GeneralVolunteerApplicationType): string {
  return GENERAL_VOLUNTEER_APPLICATION_TYPE_LABELS[type]
}

/** Mock 시드 제거 */
export const MOCK_GENERAL_VOLUNTEER_APPLICANTS: GeneralVolunteerApplicantRow[] = []

export function getGeneralVolunteerApplicants(_programId?: string): GeneralVolunteerApplicantRow[] {
  return []
}

export function getGeneralVolunteerDoc1Applicants(
  _programId?: string
): GeneralVolunteerApplicantRow[] {
  return []
}

export function getGeneralVolunteerDocPassedApplicants(
  _programId?: string
): GeneralVolunteerApplicantRow[] {
  return []
}

export function getGeneralVolunteerInterview2Applicants(
  _programId?: string
): GeneralVolunteerApplicantRow[] {
  return []
}

export function sortGeneralVolunteerByInterviewSlotCount(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return rows
}

export function sortGeneralParticipantDocPassedVolunteerRows(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return rows
}

export function sortGeneralVolunteerDocPassedApplicants(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return rows
}
