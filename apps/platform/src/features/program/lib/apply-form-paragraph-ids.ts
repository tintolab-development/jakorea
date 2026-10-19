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
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'

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

/** 강사 신청 — 성범죄경력 조회 동의서 제출 방법 안내 (CMS InstructorCrimeRecordParagraph) */
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

/** 일반 봉사자 신청 — CMS `VolunteerPreviousJaProgramParagraph` */
export function isVolunteerPreviousJaProgramParagraphId(id: string): boolean {
  return id === PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousJaProgram
}

/** 일반 봉사자 신청 — CMS `VolunteerFreeTextItemsParagraph` */
export function isVolunteerFreeTextItemsParagraphId(id: string): boolean {
  return id === PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems
}

/** UJAT 봉사자 신청 — CMS `UjatProgramApplicationVolunteerBasicInfoParagraph` */
export function isUjatVolunteerBasicInfoParagraphId(id: string): boolean {
  return id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo
}

/** UJAT 봉사자 신청 — 이전 UJAT 활동 기수 (지원 형태 「UJAT 수료자 봉사자」일 때만) */
export function isUjatVolunteerPreviousTermParagraphId(id: string): boolean {
  return id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm
}

/** UJAT 봉사자 신청 — 자유 작성 항목 (지원 형태 「신규 봉사자」일 때만) */
export function isUjatVolunteerFreeTextItemsParagraphId(id: string): boolean {
  return id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems
}

const VOLUNTEER_INTERVIEW_SCHEDULE_IDS = new Set<string>([
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule,
])

/** Portal 제출 answers — `string[]` (테이블 `fieldDataRows` 금지) */
const PORTAL_DYNAMIC_OPTION_ARRAY_PARAGRAPH_IDS = new Set<string>([
  ...VOLUNTEER_INTERVIEW_SCHEDULE_IDS,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule,
  ...INDIVIDUAL_INTERVIEW_SCHEDULE_IDS,
])

function isVisibleApplicationParagraphRow(row: Record<string, unknown>): boolean {
  return row.runtimeHidden !== true && row.hidden !== true
}

function paragraphHasRuntimeBindingOptions(row: Record<string, unknown>): boolean {
  const rawItems = Array.isArray(row.items)
    ? row.items
    : Array.isArray(row.options)
      ? row.options
      : []
  return rawItems.some(item => {
    if (!item || typeof item !== 'object') return false
    const option = item as Record<string, unknown>
    const id = String(option.id ?? option.option_value ?? '').trim()
    return id.length > 0
  })
}

function isRuntimeDynamicInterviewParagraphRow(
  row: Record<string, unknown>,
  idAllowed: (id: string) => boolean,
): boolean {
  if (typeof row.id !== 'string' || !idAllowed(row.id) || !isVisibleApplicationParagraphRow(row)) {
    return false
  }
  if (row.runtimeInputMode === DYNAMIC_INTERVIEW_SLOTS_INPUT_MODE) return true
  if (row.runtimeResolved === true) return true
  return paragraphHasRuntimeBindingOptions(row)
}

export function isVolunteerInterviewScheduleParagraphId(id: string): boolean {
  return VOLUNTEER_INTERVIEW_SCHEDULE_IDS.has(id)
}

/** form-binding 동적 선택 문항 — answers는 option id 문자열 배열 */
export function isPortalDynamicOptionArrayParagraphId(id: string): boolean {
  return PORTAL_DYNAMIC_OPTION_ARRAY_PARAGRAPH_IDS.has(id)
}

/** 일반 봉사자 신청 — 봉사 진행 가능 일정 (BE `dynamic_schedule_options`) */
export function isVolunteerActivityScheduleParagraphId(id: string): boolean {
  return id === PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule
}

/** 일반 봉사자 신청 — BE form-binding 동적 일정 선택지 */
export function isDynamicVolunteerActivityScheduleParagraph(paragraph: unknown): boolean {
  if (!paragraph || typeof paragraph !== 'object') return false
  const row = paragraph as Record<string, unknown>
  if (
    typeof row.id !== 'string' ||
    !isVolunteerActivityScheduleParagraphId(row.id) ||
    !isVisibleApplicationParagraphRow(row)
  ) {
    return false
  }
  if (row.runtimeResolved === true) return true
  return paragraphHasRuntimeBindingOptions(row)
}

/** 일반·UJAT 봉사자 신청 — BE가 면접 슬롯 선택지(`items`)를 붙여 내려준 면접 단락 */
export function isDynamicVolunteerInterviewParagraph(paragraph: unknown): boolean {
  if (!paragraph || typeof paragraph !== 'object') return false
  const row = paragraph as Record<string, unknown>
  return isRuntimeDynamicInterviewParagraphRow(row, id => VOLUNTEER_INTERVIEW_SCHEDULE_IDS.has(id))
}

/** 면접 있는 프로그램에서 BE가 슬롯 선택지(`items`)를 붙여 내려준 개인 면접 단락 */
export function isDynamicIndividualInterviewParagraph(paragraph: unknown): boolean {
  if (!paragraph || typeof paragraph !== 'object') return false
  const row = paragraph as Record<string, unknown>
  return isRuntimeDynamicInterviewParagraphRow(row, isIndividualInterviewScheduleParagraphId)
}

export function shouldShowEducationPlaceOnBasicInfo(paragraphId: string): boolean {
  return (
    paragraphId === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo ||
    paragraphId === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo
  )
}

/** 일반 기관 신청 — M·E-mail은 로그인 회원 정보로 고정 */
export function shouldLockTeacherMobileEmailOnBasicInfo(paragraphId: string): boolean {
  return paragraphId === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo
}
