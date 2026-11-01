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
  /** 목록 DTO `preferredRegionCode`. 셀렉트 value. 없으면 라벨에서 매핑 */
  preferredRegionCode?: string | null
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
  /** 목록 GET `totalAssignedDays`. 없으면 null */
  totalAssignedDays: number | null
  /** 상세·unmask `profile.homeAddress`. MASKED는 시/도, UNMASKED는 원문 */
  homeAddress: string
  /**
   * 회원 프로필 학교 재학 여부 표시값.
   * `profile.schoolEnrollmentStatus` → `toSchoolEnrollmentStatusLabelOrRaw`. null/없음 → '' (UI `-`).
   * application.ujat 대학 필드로 채우지 않는다.
   */
  schoolEnrollmentStatus: string
  /** 회원 프로필 소속 학교명. `profile.affiliationSchool`만. 대학명과 별개 */
  affiliationSchool: string
  /** 회원 프로필 소속 학년. `profile.affiliationGrade`만. UjatProjection.grade(대학 학년)와 별개 */
  affiliationGrade: string
  managerAEvaluation: UjatManagerEvaluation
  managerBEvaluation: UjatManagerEvaluation
  documentScreeningStatus: UjatDocumentScreeningStatus
  interviewSlotCount: number
  interviewAssignmentStatus: UjatInterviewAssignmentStatus
  /** wire `interviewAssignmentStatus`/`interviewStatus` — 재배정 가능 판별용 (EVALUATED 등) */
  interviewAssignmentApiStatus?: string | null
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
  assignedInterviewStartAt?: string
  assignedInterviewEndAt?: string
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

/**
 * 목록 query 동기화 — 서버 행이 정본.
 * 로컬 배정 optimistic은 GET이 waiting이면 되돌린다.
 */
export function mergeUjatVolunteerApplicantQueryRow(
  _previous: UjatVolunteerApplicantRow | undefined,
  incoming: UjatVolunteerApplicantRow
): UjatVolunteerApplicantRow {
  return incoming
}

export function formatUjatVolunteerApplicationType(type: UjatVolunteerApplicationType): string {
  return UJAT_VOLUNTEER_APPLICATION_TYPE_LABELS[type]
}
