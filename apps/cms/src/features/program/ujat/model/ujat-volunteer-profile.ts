/**
 * UJAT 봉사자 프로필 id/헬퍼 — 시드 배열 제거, id 파싱·슬롯 카운트만 유지
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

import type {
  UjatDocumentScreeningStatus,
  UjatInterviewAssignmentStatus,
  UjatManagerEvaluation,
  UjatSecondInterviewScreeningStatus,
  UjatVolunteerApplicationType,
  UjatVolunteerGrade,
  UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type {
  UjatEducationProgressVolunteerAssignmentStatus,
  UjatEducationProgressVolunteerGrade,
} from '@/features/program/ujat/ui/detail-modal/progress/volunteers/types'
import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'

export type UjatVolunteerMockInterviewAvailabilityDay = {
  dateLabel: string
  slots: string[]
}

export type UjatVolunteerMockProfileId =
  | 'kim-minto'
  | 'lee-minto'
  | 'park-tinto'
  | 'park-seoyeon'
  | 'choi-junho'
  | 'jung-haeun'
  | 'han-jiwoo'

export type UjatVolunteerMockPreviousUjatActivity = {
  term: string
  year: string
  certificateFileName: string
  certificateFileUrl?: string
}

export type UjatVolunteerMockProfile = {
  id: UjatVolunteerMockProfileId
  name: string
  englishName: string
  grade: UjatVolunteerGrade & UjatEducationProgressVolunteerGrade
  regionKey: UjatInstitutionApplicationRegionKey
  mobile: string
  email: string
  id1365: string
  gender: string
  birthDate: string
  age: number
  universityName: string
  major: string
  applicationRoute: string
  applicationRouteOther?: string
  hasEducationExperience: boolean
  applicationType: UjatVolunteerApplicationType
  essayIntro: string
  essayEducationExperience: string
  essayNecessity: string
  essayJaExperience: string
  scheduleChangeCancelCount: number
  adminComment: string
  assignmentStatus: UjatEducationProgressVolunteerAssignmentStatus
  totalAssignmentDays: number | null
  documentScreeningStatus: UjatDocumentScreeningStatus
  managerAEvaluation: UjatManagerEvaluation
  managerBEvaluation: UjatManagerEvaluation
  interviewAssignmentStatus: UjatInterviewAssignmentStatus
  interviewAvailability: UjatVolunteerMockInterviewAvailabilityDay[]
  secondInterviewScreeningStatus?: UjatSecondInterviewScreeningStatus
  assignedInterviewDateLabel?: string
  assignedInterviewTime?: string
  totalScore?: number | null
  interviewEvaluationRemark?: string
  previousUjatActivity?: UjatVolunteerMockPreviousUjatActivity
}

/** Mock 시드 제거 */
export const UJAT_VOLUNTEER_MOCK_PROFILES: readonly UjatVolunteerMockProfile[] = []

export function patchUjatVolunteerMockProfilePreferredRegion(
  _profileId: UjatVolunteerMockProfileId,
  _regionKey: UjatInstitutionApplicationRegionKey | string
): void {}

export function getUjatVolunteerMockProfilesResolved(): UjatVolunteerMockProfile[] {
  return []
}

export function getUjatVolunteerMockProfile(
  _id: UjatVolunteerMockProfileId
): UjatVolunteerMockProfile | undefined {
  return undefined
}

export function getUjatVolunteerMockProfileByName(
  _name: string
): UjatVolunteerMockProfile | undefined {
  return undefined
}

export function regionLabelForVolunteerProfile(
  profileOrRegionKey: UjatVolunteerMockProfile | UjatInstitutionApplicationRegionKey | string
): string {
  if (typeof profileOrRegionKey === 'string') {
    return getUjatEducationRegionLabel(profileOrRegionKey, profileOrRegionKey)
  }
  return getUjatEducationRegionLabel(profileOrRegionKey.regionKey, profileOrRegionKey.regionKey)
}

export function buildUjatVolunteerApplicantId(
  programId: string,
  half: UjatVolunteerRecruitHalf,
  profileId: UjatVolunteerMockProfileId
): string {
  return `ujat-vol-${half}-${programId}-${profileId}`
}

export function buildUjatEducationProgressVolunteerRowId(
  half: EducationProgressHalfKey,
  profileId: UjatVolunteerMockProfileId
): string {
  return `${half}-vol-${profileId}`
}

const PROFILE_IDS = new Set<string>([
  'kim-minto',
  'lee-minto',
  'park-tinto',
  'park-seoyeon',
  'choi-junho',
  'jung-haeun',
  'han-jiwoo',
])

export function parseEducationProgressVolunteerProfileId(
  volunteerRowId: string
): UjatVolunteerMockProfileId | null {
  const match = volunteerRowId.match(/^h[12]-vol-(.+)$/)
  const id = match?.[1]
  if (id && PROFILE_IDS.has(id)) {
    return id as UjatVolunteerMockProfileId
  }
  return null
}

export function countVolunteerProfileInterviewSlots(
  days: UjatVolunteerMockInterviewAvailabilityDay[]
): number {
  return days.reduce((sum, day) => sum + day.slots.length, 0)
}
