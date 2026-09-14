import type { ParagraphKindSelectValue } from '@/features/template/model/writing-form/paragraph-selectors'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/gemini-visiting-training-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@/features/template/model/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/program-application-form-volunteer-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@/features/template/model/program-application-form-trained-teachers-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/ujat-program-application-form-institution-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'

/**
 * 시드 잠금 단락 — 우측 「단락 유형」표시용 kind 오버라이드.
 * (스키마는 placeholder 가로표여도 UI상 단일항목으로 노출하는 경우 등)
 */
export const STRUCTURE_LOCKED_DISPLAY_KIND_BY_PARAGRAPH_ID: ReadonlyMap<
  string,
  ParagraphKindSelectValue
> = new Map([
  [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule, 'single_item'],
  [PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection, 'table'],
  [PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent, 'table'],
  [PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.jaVolunteerExperience, 'single_item'],
  [PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousJaProgram, 'table'],
  [PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems, 'table'],
  [PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule, 'single_item'],
  [PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule, 'single_item'],
  [PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice, 'single_item'],
  [PROGRAM_PARTICIPANT_APPLICATION_IDS.personalInfoCollection, 'table'],
  [PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent, 'table'],
  [PROGRAM_PARTICIPANT_APPLICATION_IDS.selfIntro, 'single_item'],
  [PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo, 'table'],
  [PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice, 'single_item'],
  [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.personalInfoCollection, 'table'],
  [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent, 'table'],
  [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo, 'table'],
  [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.guidance, 'table'],
  [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentSubmissionRequest, 'table'],
  [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod, 'table'],
  [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.lessonReply, 'single_item'],
  [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.educationExperience, 'single_item'],
  [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.preferredSchedule, 'table'],
  [GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection, 'table'],
  [GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent, 'table'],
  [GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.portraitConsent, 'table'],
  [GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.trainingInfo, 'table'],
  [GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.contactPerson, 'table'],
  [GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule, 'table'],
  [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection, 'table'],
  [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent, 'table'],
  [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.applicationRegion, 'single_item'],
  [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo, 'table'],
  [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo, 'table'],
  [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime, 'table'],
  [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule, 'single_item'],
  [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.submitConfirmation, 'single_item'],
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection, 'table'],
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent, 'table'],
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo, 'table'],
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm, 'table'],
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.preferredRegion, 'single_item'],
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.educationExperience, 'single_item'],
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule, 'single_item'],
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems, 'table'],
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.submitConfirmation, 'single_item'],
  [PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.personalInfoCollection, 'table'],
  [PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.thirdPartyConsent, 'table'],
  [PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo, 'table'],
  [PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule, 'table'],
])

export function resolveStructureLockedDisplayKind(
  paragraphId: string,
  fallback: ParagraphKindSelectValue
): ParagraphKindSelectValue {
  return STRUCTURE_LOCKED_DISPLAY_KIND_BY_PARAGRAPH_ID.get(paragraphId) ?? fallback
}
