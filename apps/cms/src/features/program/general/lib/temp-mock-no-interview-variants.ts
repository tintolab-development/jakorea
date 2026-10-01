/**
 * TODO(temp-mock): 열여라 참깨 — 면접 없음 기관·개인 쇼케이스 변형 (검증 후 삭제)
 */

import {
  TEMP_MOCK_INDIVIDUAL_NO_INTERVIEW_PROGRAM_ID,
  TEMP_MOCK_INDIVIDUAL_PROGRAM_ID,
  TEMP_MOCK_ORG_NO_INTERVIEW_PROGRAM_ID,
  TEMP_MOCK_ORG_PROGRAM_ID,
} from '@/features/program/general/api/temp-mock-capabilities'
import {
  cloneJson,
  replaceTempMockIdPrefixes,
  replaceTempMockJsonStringValues,
} from '@/features/program/general/lib/temp-mock-shared'
import type { Program } from '@/types/domain'

export const TEMP_MOCK_ORG_NOIV_SCHOOL_PREFIX = 'temp-mock-org-noiv-school-'
export const TEMP_MOCK_ORG_NOIV_INSTRUCTOR_APP_PREFIX = 'temp-mock-org-noiv-instructor-app-'
export const TEMP_MOCK_ORG_NOIV_VOLUNTEER_APP_PREFIX = 'temp-mock-org-noiv-volunteer-app-'
export const TEMP_MOCK_ORG_NOIV_PROGRESS_INSTRUCTOR_PREFIX =
  'temp-mock-org-noiv-progress-instructor-'
export const TEMP_MOCK_ORG_NOIV_PROGRESS_VOLUNTEER_PREFIX =
  'temp-mock-org-noiv-progress-volunteer-'

export const TEMP_MOCK_INDIVIDUAL_NOIV_PARTICIPANT_PREFIX =
  'temp-mock-individual-noiv-participant-'
export const TEMP_MOCK_INDIVIDUAL_NOIV_INSTRUCTOR_APP_PREFIX =
  'temp-mock-individual-noiv-instructor-app-'
export const TEMP_MOCK_INDIVIDUAL_NOIV_VOLUNTEER_APP_PREFIX =
  'temp-mock-individual-noiv-volunteer-app-'
export const TEMP_MOCK_INDIVIDUAL_NOIV_PROGRESS_INSTRUCTOR_PREFIX =
  'temp-mock-individual-noiv-progress-instructor-'
export const TEMP_MOCK_INDIVIDUAL_NOIV_PROGRESS_VOLUNTEER_PREFIX =
  'temp-mock-individual-noiv-progress-volunteer-'

export const ORG_NOIV_ID_PREFIX_REPLACEMENTS: Array<[string, string]> = [
  ['temp-mock-org-school-', TEMP_MOCK_ORG_NOIV_SCHOOL_PREFIX],
  ['temp-mock-org-instructor-app-', TEMP_MOCK_ORG_NOIV_INSTRUCTOR_APP_PREFIX],
  ['temp-mock-org-volunteer-app-', TEMP_MOCK_ORG_NOIV_VOLUNTEER_APP_PREFIX],
  ['temp-mock-org-progress-instructor-', TEMP_MOCK_ORG_NOIV_PROGRESS_INSTRUCTOR_PREFIX],
  ['temp-mock-org-progress-volunteer-', TEMP_MOCK_ORG_NOIV_PROGRESS_VOLUNTEER_PREFIX],
  ['temp-mock-org-round-', 'temp-mock-org-noiv-round-'],
  ['temp-mock-org-manager-', 'temp-mock-org-noiv-manager-'],
]

export const INDIVIDUAL_NOIV_ID_PREFIX_REPLACEMENTS: Array<[string, string]> = [
  ['temp-mock-individual-participant-', TEMP_MOCK_INDIVIDUAL_NOIV_PARTICIPANT_PREFIX],
  ['temp-mock-individual-app-', 'temp-mock-individual-noiv-app-'],
  ['temp-mock-individual-instructor-app-', TEMP_MOCK_INDIVIDUAL_NOIV_INSTRUCTOR_APP_PREFIX],
  ['temp-mock-individual-volunteer-app-', TEMP_MOCK_INDIVIDUAL_NOIV_VOLUNTEER_APP_PREFIX],
  ['temp-mock-individual-progress-instructor-', TEMP_MOCK_INDIVIDUAL_NOIV_PROGRESS_INSTRUCTOR_PREFIX],
  ['temp-mock-individual-progress-volunteer-', TEMP_MOCK_INDIVIDUAL_NOIV_PROGRESS_VOLUNTEER_PREFIX],
  ['temp-mock-individual-round-', 'temp-mock-individual-noiv-round-'],
  ['temp-mock-individual-manager-', 'temp-mock-individual-noiv-manager-'],
]

function remapVariantValue<T>(
  value: T,
  prefixReplacements: Array<[string, string]>,
  programIdFrom: string,
  programIdTo: string
): T {
  return replaceTempMockJsonStringValues(
    replaceTempMockIdPrefixes(cloneJson(value), prefixReplacements),
    [[programIdFrom, programIdTo]]
  )
}

function overlayVolunteerInterviewOff(program: Program): void {
  const volunteerInfo = program.generalCommonInfo?.volunteerRecruitmentInfo
  if (volunteerInfo) {
    volunteerInfo.volunteerInterviewEnabled = false
    volunteerInfo.generalVolunteerInterviewEnabled = false
    volunteerInfo.volunteerInterviewEnabledLabel = '면접 없음'
    volunteerInfo.interviewStartDate = undefined
    volunteerInfo.interviewEndDate = undefined
    volunteerInfo.interviewMethod = undefined
    volunteerInfo.applicationMethod = 'JA Korea 홈페이지 > 봉사자 신청'
    volunteerInfo.remarks = '면접 없이 서류 검토 후 참여가 확정됩니다.'
  }
  program.generalVolunteerInterviewEnabled = false
  program.interviewStartDate = undefined
  program.interviewEndDate = undefined
  program.interviewMethod = undefined
}

export function overlayOrgNoInterviewProgram(source: Program): Program {
  const program = remapVariantValue(
    source,
    ORG_NOIV_ID_PREFIX_REPLACEMENTS,
    TEMP_MOCK_ORG_PROGRAM_ID,
    TEMP_MOCK_ORG_NO_INTERVIEW_PROGRAM_ID
  )
  program.id = TEMP_MOCK_ORG_NO_INTERVIEW_PROGRAM_ID
  program.title = '[임시] 기관 경제교육 쇼케이스 (면접 없음)'
  program.mainTitle = '기관 경제교육 쇼케이스 (면접 없음)'
  program.titleEn = 'Organization Economic Education Showcase (No Interview)'
  overlayVolunteerInterviewOff(program)
  return program
}

export function overlayIndividualNoInterviewProgram(source: Program): Program {
  const program = remapVariantValue(
    source,
    INDIVIDUAL_NOIV_ID_PREFIX_REPLACEMENTS,
    TEMP_MOCK_INDIVIDUAL_PROGRAM_ID,
    TEMP_MOCK_INDIVIDUAL_NO_INTERVIEW_PROGRAM_ID
  )
  program.id = TEMP_MOCK_INDIVIDUAL_NO_INTERVIEW_PROGRAM_ID
  program.title = '[임시] 개인 경제교육 쇼케이스 (면접 없음)'
  program.mainTitle = '개인 경제교육 쇼케이스 (면접 없음)'
  program.titleEn = 'Individual Economic Education Showcase (No Interview)'
  program.generalParticipantInterviewEnabled = false
  overlayVolunteerInterviewOff(program)
  const participantInfo = program.generalCommonInfo?.participantRecruitmentInfo
  if (participantInfo) {
    participantInfo.interviewEnabled = false
  }
  return program
}

export function remapOrgNoInterviewRows<T>(rows: T[]): T[] {
  return remapVariantValue(
    rows,
    ORG_NOIV_ID_PREFIX_REPLACEMENTS,
    TEMP_MOCK_ORG_PROGRAM_ID,
    TEMP_MOCK_ORG_NO_INTERVIEW_PROGRAM_ID
  )
}

export function remapIndividualNoInterviewRows<T>(rows: T[]): T[] {
  return remapVariantValue(
    rows,
    INDIVIDUAL_NOIV_ID_PREFIX_REPLACEMENTS,
    TEMP_MOCK_INDIVIDUAL_PROGRAM_ID,
    TEMP_MOCK_INDIVIDUAL_NO_INTERVIEW_PROGRAM_ID
  )
}
