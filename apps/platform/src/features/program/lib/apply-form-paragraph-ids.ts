/**
 * CMS 신청 양식 시드 단락 ID — Platform sidecar 매칭.
 * schema 자리 표시 표는 CMS DetailInfoForm 본문으로 대체되므로 동일 ID를 slot으로 렌더한다.
 */

import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
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

export function shouldShowEducationPlaceOnBasicInfo(paragraphId: string): boolean {
  return (
    paragraphId === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo ||
    paragraphId === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo
  )
}
