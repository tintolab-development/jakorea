/**
 * UJAT 봉사자 신청자 — 타입·빈 stub (FE Mock 시드 제거)
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

import type { VolunteerApplicationEvidenceAttachment } from '@/features/program/general/model/volunteer-applicant'
import {
  UJAT_VOLUNTEER_APPLICATION_TYPE_LABELS,
  type UjatDocumentScreeningStatus,
  type UjatInterviewAssignmentStatus,
  type UjatManagerEvaluation,
  type UjatSecondInterviewScreeningStatus,
  type UjatVolunteerApplicationType,
  type UjatVolunteerGrade,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

export type UjatVolunteerInterviewAvailabilityDay = {
  dateLabel: string
  slots: string[]
}

export type UjatVolunteerPreviousUjatActivity = {
  term: string
  year: string
  certificateFileName: string
  certificateFileUrl?: string
}

export interface UjatVolunteerApplicantRow {
  id: string
  no: number
  name: string
  /** 목록 DTO에 학년이 없으면 빈 문자열. 1학년으로 채우지 않는다. */
  grade: UjatVolunteerGrade | ''
  preferredRegion: UjatVolunteerPreferredRegion
  contact: string
  email: string
  contactRaw: string
  emailRaw: string
  /** 목록 DTO에 없으면 null. false로 채우지 않는다. */
  hasEducationExperience: boolean | null
  applicationType: UjatVolunteerApplicationType
  essayIntro: string
  essayEducationExperience: string
  essayNecessity: string
  essayJaExperience: string
  managerAEvaluation: UjatManagerEvaluation
  managerBEvaluation: UjatManagerEvaluation
  documentScreeningStatus: UjatDocumentScreeningStatus
  interviewSlotCount: number
  interviewAssignmentStatus: UjatInterviewAssignmentStatus
  programId: string
  half: UjatVolunteerRecruitHalf
  englishName: string
  /** 원격 응답 memberId — 출석·배정 API(participantId) 조인용 */
  memberId?: string
  id1365: string
  gender: string
  birthDate: string
  age: number
  universityName: string
  major: string
  applicationRoute: string
  applicationRouteOther?: string
  scheduleChangeCancelCount: number
  interviewAvailability: UjatVolunteerInterviewAvailabilityDay[]
  previousUjatActivity?: UjatVolunteerPreviousUjatActivity
  /** 상세 API `application.attachments` */
  evidenceAttachments?: VolunteerApplicationEvidenceAttachment[]
  assignedInterviewDateLabel?: string
  assignedInterviewTime?: string
  /** 목록 DTO `interviewAssignmentId`. 평가 POST에 사용 */
  interviewAssignmentId?: number
  secondInterviewScreeningStatus?: UjatSecondInterviewScreeningStatus
  totalScore?: number | null
  managerAScore?: number | null
  managerBScore?: number | null
  interviewEvaluationRemark?: string
}

export type UjatVolunteerPreferredRegion = string

export type UjatVolunteerInterviewEvaluationPayload = {
  managerAScore: number | null
  managerBScore: number | null
  interviewEvaluationRemark: string
}

export function clearUjatVolunteerApplicantsMockCache(): void {}

export function getUjatVolunteerApplicants(
  _programId?: string,
  _half?: UjatVolunteerRecruitHalf
): UjatVolunteerApplicantRow[] {
  return []
}

export function findUjatVolunteerApplicantById(
  programIdOrId: string,
  half?: UjatVolunteerRecruitHalf,
  id?: string
): UjatVolunteerApplicantRow | undefined {
  void programIdOrId
  void half
  void id
  return undefined
}

export function findUjatVolunteerApplicantByName(
  _name: string
): UjatVolunteerApplicantRow | undefined {
  return undefined
}

export function sortUjatVolunteerApplicants(
  rows: UjatVolunteerApplicantRow[]
): UjatVolunteerApplicantRow[] {
  return rows
}

export function sortUjatVolunteerDocPassedApplicants(
  rows: UjatVolunteerApplicantRow[]
): UjatVolunteerApplicantRow[] {
  return rows
}

export function getUjatVolunteerDocPassedApplicants(
  _programId?: string,
  _half?: UjatVolunteerRecruitHalf
): UjatVolunteerApplicantRow[] {
  return []
}

export function sortUjatVolunteerInterview2Applicants(
  rows: UjatVolunteerApplicantRow[]
): UjatVolunteerApplicantRow[] {
  return rows
}

export function getUjatVolunteerInterview2Applicants(
  _programId?: string,
  _half?: UjatVolunteerRecruitHalf
): UjatVolunteerApplicantRow[] {
  return []
}

export function patchUjatVolunteerSecondInterviewScreeningStatus(
  rows: UjatVolunteerApplicantRow[],
  ids: string[],
  status: UjatSecondInterviewScreeningStatus
): UjatVolunteerApplicantRow[] {
  const idSet = new Set(ids)
  return rows.map(row =>
    idSet.has(row.id) ? { ...row, secondInterviewScreeningStatus: status } : row
  )
}

function computeInterviewTotalScore(
  managerAScore: number | null,
  managerBScore: number | null
): number | null {
  if (managerAScore == null || managerBScore == null) return null
  return managerAScore + managerBScore
}

export function patchUjatVolunteerInterviewEvaluation(
  rows: UjatVolunteerApplicantRow[],
  id: string,
  payload: UjatVolunteerInterviewEvaluationPayload
): UjatVolunteerApplicantRow[] {
  return rows.map(row => {
    if (row.id !== id) return row
    const totalScore = computeInterviewTotalScore(payload.managerAScore, payload.managerBScore)
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

export function patchUjatVolunteerInterviewAssignmentWithdrawn(
  rows: UjatVolunteerApplicantRow[],
  id: string
): UjatVolunteerApplicantRow[] {
  return rows.map(row =>
    row.id === id ? { ...row, interviewAssignmentStatus: 'withdrawn' as const } : row
  )
}

export function formatUjatVolunteerApplicationType(type: UjatVolunteerApplicationType): string {
  return UJAT_VOLUNTEER_APPLICATION_TYPE_LABELS[type]
}
