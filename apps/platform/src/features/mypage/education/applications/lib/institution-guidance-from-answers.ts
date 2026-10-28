import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import type { ProgramDetailCase } from '@/features/program'
import {
  emptyInstitutionGuidanceAnswers,
  guidanceAnswerFromValues,
  guidanceValuesFromDraftAnswer,
  type ApplyInstitutionGuidanceAnswers,
} from '@/features/program/ui/apply-institution-guidance/apply-institution-guidance'
import {
  emptyUjatInstitutionGuidanceExtras,
  mergeUjatGuidanceExtrasIntoAnswer,
  ujatGuidanceExtrasFromDraftAnswer,
  type ApplyUjatInstitutionGuidanceExtras,
} from '@/features/program/ui/apply-institution-guidance/ujat-institution-guidance-fields'
import {
  emptyInstitutionSexOffense,
  resolveApplySexOffenseInquiryCase,
  sexOffenseInquiryAnswerFromValues,
  sexOffenseSubmissionAnswerFromValues,
  sexOffenseValuesFromDraftAnswers,
  shouldShowSexOffenseInquiry,
  type ApplyInstitutionSexOffenseValues,
} from '@/features/program/ui/apply-institution-sex-offense/apply-institution-sex-offense'
import {
  formatSexOffenseTeacherGuidanceValue,
  isSexOffenseInquiryMethod,
  isSexOffenseSiteSubmission,
} from '@jakorea/form-schema/program-application'
import type { EducationTeacherApplicationGuidance } from '../model/types'

export type TeacherInstitutionGuidanceFormState = {
  guidance: ApplyInstitutionGuidanceAnswers
  sexOffense: ApplyInstitutionSexOffenseValues
  ujatExtras?: ApplyUjatInstitutionGuidanceExtras
}

type InstitutionGuidanceParagraphIds = {
  guidance: string
  sexOffenseSubmission: string
  sexOffenseInquiry: string
}

const INSTITUTION_GUIDANCE_PARAGRAPH_IDS: InstitutionGuidanceParagraphIds = {
  guidance: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance,
  sexOffenseSubmission: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest,
  sexOffenseInquiry: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod,
}

const ECONOMY_GUIDANCE_PARAGRAPH_IDS: InstitutionGuidanceParagraphIds = {
  guidance: PROGRAM_APPLICATION_FORM_ECONOMY_IDS.guidance,
  sexOffenseSubmission: PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentSubmissionRequest,
  sexOffenseInquiry: PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod,
}

function preferredInstitutionGuidanceParagraphIds(
  detailCase: ProgramDetailCase | undefined,
): InstitutionGuidanceParagraphIds {
  return detailCase === 'gemini'
    ? ECONOMY_GUIDANCE_PARAGRAPH_IDS
    : INSTITUTION_GUIDANCE_PARAGRAPH_IDS
}

function readAnswer(answers: Record<string, unknown>, key: string): unknown {
  if (!key) return undefined
  if (key in answers) return answers[key]
  return undefined
}

function pickExistingAnswerKey(
  answers: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    if (key in answers) return key
  }
  return undefined
}

function resolveInstitutionGuidanceParagraphIds(
  detailCase: ProgramDetailCase | undefined,
  existingAnswers?: Record<string, unknown> | null,
): InstitutionGuidanceParagraphIds {
  const preferred = preferredInstitutionGuidanceParagraphIds(detailCase)
  const answers = existingAnswers ?? {}
  const guidanceKey =
    pickExistingAnswerKey(answers, [
      preferred.guidance,
      INSTITUTION_GUIDANCE_PARAGRAPH_IDS.guidance,
      ECONOMY_GUIDANCE_PARAGRAPH_IDS.guidance,
    ]) ??
    Object.keys(answers).find(key => key.includes('seed-guidance')) ??
    preferred.guidance
  const sexOffenseSubmissionKey =
    pickExistingAnswerKey(answers, [
      preferred.sexOffenseSubmission,
      INSTITUTION_GUIDANCE_PARAGRAPH_IDS.sexOffenseSubmission,
      ECONOMY_GUIDANCE_PARAGRAPH_IDS.sexOffenseSubmission,
    ]) ?? preferred.sexOffenseSubmission
  const sexOffenseInquiryKey =
    pickExistingAnswerKey(answers, [
      preferred.sexOffenseInquiry,
      INSTITUTION_GUIDANCE_PARAGRAPH_IDS.sexOffenseInquiry,
      ECONOMY_GUIDANCE_PARAGRAPH_IDS.sexOffenseInquiry,
    ]) ?? preferred.sexOffenseInquiry
  return {
    guidance: guidanceKey,
    sexOffenseSubmission: sexOffenseSubmissionKey,
    sexOffenseInquiry: sexOffenseInquiryKey,
  }
}

export function mapInstitutionGuidanceFromApplicationAnswers(
  answers: Record<string, unknown> | undefined,
  detailCase: ProgramDetailCase | undefined,
): TeacherInstitutionGuidanceFormState {
  const ids = resolveInstitutionGuidanceParagraphIds(detailCase, answers)
  const guidanceRaw = readAnswer(answers ?? {}, ids.guidance)
  const submissionRaw = readAnswer(answers ?? {}, ids.sexOffenseSubmission)
  const inquiryRaw = readAnswer(answers ?? {}, ids.sexOffenseInquiry)

  const guidance =
    guidanceValuesFromDraftAnswer(guidanceRaw) ?? emptyInstitutionGuidanceAnswers()
  const sexOffense =
    sexOffenseValuesFromDraftAnswers(submissionRaw, inquiryRaw) ?? emptyInstitutionSexOffense()
  const ujatExtras =
    detailCase === 'ujat-participant' ? ujatGuidanceExtrasFromDraftAnswer(guidanceRaw) : undefined

  return { guidance, sexOffense, ujatExtras }
}

export function buildInstitutionGuidanceAnswerPatch(
  state: TeacherInstitutionGuidanceFormState,
  detailCase: ProgramDetailCase | undefined,
  existingAnswers?: Record<string, unknown> | null,
): Record<string, unknown> {
  const ids = resolveInstitutionGuidanceParagraphIds(detailCase, existingAnswers)
  const guidanceAnswer = guidanceAnswerFromValues(state.guidance)
  const patch: Record<string, unknown> = {
    [ids.guidance]:
      detailCase === 'ujat-participant' && state.ujatExtras
        ? mergeUjatGuidanceExtrasIntoAnswer(guidanceAnswer, state.ujatExtras)
        : guidanceAnswer,
    [ids.sexOffenseSubmission]: sexOffenseSubmissionAnswerFromValues(state.sexOffense),
  }
  if (shouldShowSexOffenseInquiry(state.sexOffense)) {
    patch[ids.sexOffenseInquiry] = sexOffenseInquiryAnswerFromValues(state.sexOffense)
  }
  return patch
}

export function formatSexOffenseConsentMethodDisplay(
  sexOffense: ApplyInstitutionSexOffenseValues,
): string | undefined {
  if (sexOffense.submissionRequest !== 'request') return undefined
  return formatSexOffenseTeacherGuidanceValue(sexOffense)
}

export function resolveTeacherSexOffenseInquiryCase(
  answers: Record<string, unknown> | undefined,
  detailCase: ProgramDetailCase | undefined,
) {
  const state = mapInstitutionGuidanceFromApplicationAnswers(answers, detailCase)
  if (state.sexOffense.submissionRequest !== 'request') return null
  if (!isSexOffenseInquiryMethod(state.sexOffense.inquiryMethod)) return null
  return resolveApplySexOffenseInquiryCase(state.sexOffense)
}

export function teacherGuidanceContentFromFormState(
  state: TeacherInstitutionGuidanceFormState,
): EducationTeacherApplicationGuidance {
  return {
    computerInRoom: state.guidance['computer-in-room'] ?? '',
    waitingPlace: state.guidance['waiting-place'] ?? '',
    meal: state.guidance['meal'] ?? '',
    otherNotes: state.guidance['other-notes'] ?? '',
    sexOffenseConsentMethod: formatSexOffenseConsentMethodDisplay(state.sexOffense),
  }
}

export function teacherInstitutionGuidanceFormStateFromTeacherContent(
  guidance: EducationTeacherApplicationGuidance,
): TeacherInstitutionGuidanceFormState {
  const sexOffense = emptyInstitutionSexOffense()
  const methodLabel = guidance.sexOffenseConsentMethod?.trim() ?? ''
  if (methodLabel.includes('JA 시스템')) {
    sexOffense.submissionRequest = 'request'
    sexOffense.inquiryMethod = 'ja_system'
    sexOffense.siteSubmission = ''
  } else if (methodLabel) {
    sexOffense.submissionRequest = 'request'
    sexOffense.inquiryMethod = 'criminal_record_site'
    if (methodLabel.includes('온라인 제출')) {
      sexOffense.siteSubmission = 'online'
    } else if (methodLabel.includes('직접 제출')) {
      sexOffense.siteSubmission = 'direct'
    }
    const idMatch = /ID\s*:\s*([^|]+)/.exec(methodLabel)
    const verificationMatch = /검증번호\s*:\s*([^|]+)/.exec(methodLabel)
    if (idMatch?.[1]) sexOffense.institutionId = idMatch[1].trim()
    if (verificationMatch?.[1]) sexOffense.verificationNumber = verificationMatch[1].trim()
    if (!isSexOffenseInquiryMethod(sexOffense.inquiryMethod)) {
      sexOffense.inquiryMethod = ''
    }
    if (!isSexOffenseSiteSubmission(sexOffense.siteSubmission)) {
      sexOffense.siteSubmission = ''
    }
  }
  return {
    guidance: {
      'computer-in-room': guidance.computerInRoom,
      'waiting-place': guidance.waitingPlace,
      meal: guidance.meal,
      'other-notes': guidance.otherNotes,
    },
    sexOffense,
    ujatExtras: emptyUjatInstitutionGuidanceExtras(),
  }
}
