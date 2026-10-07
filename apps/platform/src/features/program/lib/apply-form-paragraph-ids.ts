/**
 * CMS 신청 양식 시드 단락 ID — Platform sidecar 매칭.
 * schema 자리 표시 표는 CMS DetailInfoForm 본문으로 대체되므로 동일 ID를 slot으로 렌더한다.
 */

import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'

const INSTITUTION_LIKE_BASIC_INFO_IDS = new Set<string>([
  PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo,
])

const SEX_OFFENSE_SUBMISSION_IDS = new Set<string>([
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentSubmissionRequest,
])

const SEX_OFFENSE_INQUIRY_IDS = new Set<string>([
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod,
])

const GUIDANCE_IDS = new Set<string>([
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS.guidance,
])

const PREFERRED_SCHEDULE_IDS = new Set<string>([
  PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS.preferredSchedule,
])

const INSTRUCTOR_CRIME_RECORD_IDS = new Set<string>([
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord,
])

const INSTRUCTOR_AVAILABLE_SCHEDULE_IDS = new Set<string>([
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
])

/** BE `IndividualApplicationInterviewAvailabilityService.INTERVIEW_KEYS` 와 동일 */
const INDIVIDUAL_INTERVIEW_SCHEDULE_IDS = new Set<string>([
  'program-participant-application-seed-interview-schedule',
  'program-individual-application-seed-interview-schedule',
  'program-participant-individual-application-seed-interview-schedule',
  'individual-interview-schedule',
])

export const DYNAMIC_INTERVIEW_SLOTS_INPUT_MODE = 'dynamic_interview_slots'

export function isApplicationBasicInfoParagraphId(id: string): boolean {
  return INSTITUTION_LIKE_BASIC_INFO_IDS.has(id)
}

export function isApplicationTeamInfoParagraphId(id: string): boolean {
  return id === PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo
}

export function isApplicationSexOffenseSubmissionParagraphId(id: string): boolean {
  return SEX_OFFENSE_SUBMISSION_IDS.has(id)
}

export function isApplicationSexOffenseInquiryParagraphId(id: string): boolean {
  return SEX_OFFENSE_INQUIRY_IDS.has(id)
}

export function isApplicationGuidanceParagraphId(id: string): boolean {
  return GUIDANCE_IDS.has(id)
}

export function isApplicationPreferredScheduleParagraphId(id: string): boolean {
  return PREFERRED_SCHEDULE_IDS.has(id)
}

/** 강사 신청 — 성범죄 경력 조회서 제출 (CMS InstructorCrimeRecordParagraph) */
export function isInstructorCrimeRecordParagraphId(id: string): boolean {
  return INSTRUCTOR_CRIME_RECORD_IDS.has(id)
}

/** 강사 신청 — 강의 진행 가능 일정 (CMS InstructorAvailableScheduleParagraph) */
export function isInstructorAvailableScheduleParagraphId(id: string): boolean {
  return INSTRUCTOR_AVAILABLE_SCHEDULE_IDS.has(id)
}

/** 개인 신청 — 면접 진행 가능 일정 */
export function isIndividualInterviewScheduleParagraphId(id: string): boolean {
  return INDIVIDUAL_INTERVIEW_SCHEDULE_IDS.has(id)
}

/** 면접 있는 프로그램에서 BE가 슬롯 선택지(`items`)를 붙여 내려준 개인 면접 단락 */
export function isDynamicIndividualInterviewParagraph(paragraph: unknown): boolean {
  if (!paragraph || typeof paragraph !== 'object') return false
  const row = paragraph as Record<string, unknown>
  return (
    typeof row.id === 'string' &&
    isIndividualInterviewScheduleParagraphId(row.id) &&
    row.runtimeInputMode === DYNAMIC_INTERVIEW_SLOTS_INPUT_MODE &&
    row.runtimeHidden !== true &&
    row.hidden !== true
  )
}

export function shouldShowEducationPlaceOnBasicInfo(paragraphId: string): boolean {
  return (
    paragraphId === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo ||
    paragraphId === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo
  )
}
