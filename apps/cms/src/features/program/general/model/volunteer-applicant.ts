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

/** GET 봉사자 신청 상세 `application.attachments` 한 건 */
export type VolunteerApplicationEvidenceAttachment = {
  submissionFileId: number
  questionKey: string
  fileObjectId: number
  originalFileName: string
  contentType?: string | null
  fileSize?: number | null
  downloadPolicyPath: string
}

export interface GeneralVolunteerApplicantRow {
  id: string
  /** BE 회원 ID — 봉사 신청 PK와 구분 */
  memberId?: number
  /** DB로 연결된 기존 소속 학교/기관 ID. 소속 없음은 null */
  affiliationOrganizationId?: number | null
  no: number
  name: string
  contact: string
  email: string
  contactRaw: string
  emailRaw: string
  /** 목록·상세 `homeAddressSummary`/`homeAddress`. 없으면 빈 문자열 */
  homeAddress?: string
  id1365: string
  scheduleChangeCancelCount: number
  applicationType: GeneralVolunteerApplicationType
  hasJaVolunteerExperience: boolean
  /** 신청서 「이전 참여 JA 봉사 프로그램」 — 진행년도 · 프로그램명 */
  previousJaProgram?: string
  /** 신청서 증빙 첨부. 상세 API `application.attachments` */
  evidenceAttachments?: VolunteerApplicationEvidenceAttachment[]
  essayIntro: string
  essayEducationExperience: string
  essayNecessity: string
  essayJaExperience: string
  managerAEvaluation: GeneralManagerEvaluation
  managerBEvaluation: GeneralManagerEvaluation
  canEditManagerAEvaluation: boolean
  canEditManagerBEvaluation: boolean
  /** Admin API가 현재 상태에서 허용하는 canonical action 목록 */
  availableActions: string[]
  /** wire `applicationStatus` — 승인 취소·반려·포기 후 면접/교육일 배정 차단 */
  applicationStatus?: string | null
  documentScreeningStatus: GeneralDocumentScreeningStatus
  documentApprovalNotifyTiming?: PermissionModalNotifyTiming
  documentRejectionNotifyTiming?: PermissionModalNotifyTiming
  /** 반려 취소(alreadySent) 시 재발송 알림 시기 */
  documentCancelRejectionNotifyTiming?: PermissionModalNotifyTiming
  /** 반려 취소(alreadySent) 시 취소 사유 */
  documentCancelRejectionReason?: string
  interviewSlotCount: number
  interviewAssignmentStatus: GeneralInterviewAssignmentStatus
  /** wire `interviewAssignmentStatus`/`interviewStatus` — 재배정 가능 판별용 (EVALUATED 등) */
  interviewAssignmentApiStatus?: string | null
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
  /** 활성 면접 슬롯 시작 시각(ISO-8601, BE `interview_slot.start_at`) */
  assignedInterviewStartAt?: string
  /** 활성 면접 슬롯 종료 시각(ISO-8601, BE `interview_slot.end_at`) */
  assignedInterviewEndAt?: string
  /** BE 면접 배정 ID — 면접 평가 API path용 */
  interviewAssignmentId?: number
  secondInterviewScreeningStatus?: GeneralSecondInterviewScreeningStatus
  /** 2차 면접 합격/불합격 알림 발송 방식 — 취소 모달 분기용 (세션 내) */
  finalResultNotifyTiming?: PermissionModalNotifyTiming
  totalScore?: number | null
  managerAScore?: number | null
  managerBScore?: number | null
  /** 면접 평가 담당자 A(`evaluatorOrder` 1)를 입력한 관리자 ID */
  managerAEvaluatorAdminId?: number | null
  /** 면접 평가 담당자 B(`evaluatorOrder` 2)를 입력한 관리자 ID */
  managerBEvaluatorAdminId?: number | null
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
  status: GeneralSecondInterviewScreeningStatus,
  notifyTiming?: PermissionModalNotifyTiming
): GeneralVolunteerApplicantRow[] {
  const idSet = new Set(ids)
  return rows.map(row =>
    idSet.has(row.id)
      ? {
          ...row,
          secondInterviewScreeningStatus: status,
          ...(notifyTiming ? { finalResultNotifyTiming: notifyTiming } : {}),
        }
      : row
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

export function formatGeneralVolunteerApplicationType(
  type: GeneralVolunteerApplicationType
): string {
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
