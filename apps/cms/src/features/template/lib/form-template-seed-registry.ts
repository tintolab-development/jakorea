import { createApplicantRecruitFormIndividualDraft } from '@/features/template/model/applicant-recruit-form-individual-draft'
import { createApplicantRecruitFormInstitutionDraft } from '@/features/template/model/applicant-recruit-form-institution-draft'
import { createGeminiVisitingTrainingApplicationFormInstructorDraft } from '@/features/template/model/gemini-visiting-training-application-form-instructor-draft'
import { createGeminiVisitingTrainingApplicationFormInstitutionDraft } from '@/features/template/model/gemini-visiting-training-application-form-institution-draft'
import { createProgramApplicationFormEconomyDraft } from '@/features/template/model/program-application-form-economy-draft'
import { createProgramApplicationFormInstructorDraft } from '@/features/template/model/program-application-form-instructor-draft'
import { createProgramApplicationFormInstitutionDraft } from '@/features/template/model/program-application-form-institution-draft'
import { createProgramApplicationFormTrainedTeachersDraft } from '@/features/template/model/program-application-form-trained-teachers-draft'
import { createProgramApplicationFormVolunteerDraft } from '@/features/template/model/program-application-form-volunteer-draft'
import { createProgramParticipantApplicationDraft } from '@/features/template/model/program-application-form-individual-draft'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'
import { createRecruitFormInstructorDraft } from '@/features/template/model/recruit-form-instructor-draft'
import { createRecruitFormVolunteerDraft } from '@/features/template/model/recruit-form-volunteer-draft'
import { createUjatProgramApplicationFormInstitutionDraft } from '@/features/template/model/ujat-program-application-form-institution-draft'
import { createUjatProgramApplicationFormVolunteerDraft } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import { createUjatProgramRegistrationDraft } from '@/features/template/model/ujat-program-registration-draft'
import { createUjatRecruitFormInstitutionDraft } from '@/features/template/model/ujat-recruit-form-institution-draft'
import { createUjatRecruitFormVolunteerDraft } from '@/features/template/model/ujat-recruit-form-volunteer-draft'
import { createPaymentStatementIssuanceDraft } from '@/features/template/model/payment-statement-issuance-draft'
import { createPaymentStatementPreConsentDraft } from '@/features/template/model/payment-statement-pre-consent-draft'
import { createSettlementApplicationIssuanceDraft } from '@/features/template/model/settlement-application-issuance-draft'
import {
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createDefaultSurveyDraft,
  createEducatorFacilitatorPledgeDraft,
  createLectureReportIssuanceDraft,
  createUjatEducationJournalIssuanceDraft,
  createUjatEducationPlanIssuanceDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

export type FormTemplateSeedFactory = () => WritingFormDraft

const FORM_TEMPLATE_SEED_FACTORIES: Record<string, FormTemplateSeedFactory> = {
  'registration-general': () => createProgramRegistrationDraft('general'),
  'registration-economy': () => createProgramRegistrationDraft('economy'),
  'registration-trained-teachers': () => createProgramRegistrationDraft('trainedTeachers'),
  'registration-ujat': () => createUjatProgramRegistrationDraft(),
  'recruitment-participant-school': () => createApplicantRecruitFormInstitutionDraft(),
  'recruitment-participant-individual': () => createApplicantRecruitFormIndividualDraft(),
  'recruitment-instructor': () => createRecruitFormInstructorDraft(),
  'recruitment-volunteer': () => createRecruitFormVolunteerDraft(),
  'recruitment-ujat-school': () => createUjatRecruitFormInstitutionDraft(),
  'recruitment-ujat-volunteer': () => createUjatRecruitFormVolunteerDraft(),
  'application-participant-school': () => createProgramApplicationFormInstitutionDraft(),
  'application-participant-individual': () => createProgramParticipantApplicationDraft(),
  'application-instructor': () => createProgramApplicationFormInstructorDraft(),
  'application-volunteer': () => createProgramApplicationFormVolunteerDraft(),
  'application-economy': () => createProgramApplicationFormEconomyDraft(),
  'application-trained-teachers': () => createProgramApplicationFormTrainedTeachersDraft(),
  'application-gemini-visiting-training-instructor': () =>
    createGeminiVisitingTrainingApplicationFormInstructorDraft(),
  'application-gemini-visiting-training-school': () =>
    createGeminiVisitingTrainingApplicationFormInstitutionDraft(),
  'application-ujat-school': () => createUjatProgramApplicationFormInstitutionDraft(),
  'application-ujat-volunteer': () => createUjatProgramApplicationFormVolunteerDraft(),
  'survey-default': () => createDefaultSurveyDraft(),
  'survey-student': () => createDefaultSurveyDraft(),
  'survey-teacher': () => createDefaultSurveyDraft(),
  'survey-admin': () => createDefaultSurveyDraft(),
  'agreement-third-party': () => createPaymentStatementPreConsentDraft(),
  'agreement-notice': () => createAgreementNoticeDraft(),
  'agreement-expense': () => createEducatorFacilitatorPledgeDraft(),
  'agreement-portrait': () => createAgreementPortraitDraft(),
  'document-payment-order-issue': () => createPaymentStatementIssuanceDraft(),
  'document-payment-order-pre-consent': () => createPaymentStatementPreConsentDraft(),
  'issuance-2': () => createUjatEducationPlanIssuanceDraft(),
  'issuance-ujat-edu-journal': () => createUjatEducationJournalIssuanceDraft(),
  'issuance-3': () => createLectureReportIssuanceDraft(),
  'issuance-4': () => createSettlementApplicationIssuanceDraft(),
}

/** paragraphs 빈 배열을 허용하는 templateCode (시드 보정 제외) */
const EMPTY_PARAGRAPHS_ALLOWED = new Set(['agreement-crime'])

export function getFormTemplateSeedDraft(templateCode: string): WritingFormDraft | null {
  const factory = FORM_TEMPLATE_SEED_FACTORIES[templateCode]
  return factory != null ? factory() : null
}

export function normalizeWritingFormDraftFromApi(
  templateCode: string,
  draft: WritingFormDraft
): WritingFormDraft {
  if (draft.paragraphs.length > 0 || EMPTY_PARAGRAPHS_ALLOWED.has(templateCode)) {
    return draft
  }
  const seed = getFormTemplateSeedDraft(templateCode)
  if (seed == null) return draft
  return {
    ...draft,
    formSettings: draft.formSettings ?? seed.formSettings,
    paragraphs: seed.paragraphs,
  }
}
