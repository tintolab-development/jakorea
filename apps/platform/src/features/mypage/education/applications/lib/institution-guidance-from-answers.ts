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
  sexOffenseInquiryAnswerFromValues,
  sexOffenseSubmissionAnswerFromValues,
  sexOffenseValuesFromDraftAnswers,
  shouldShowSexOffenseInquiry,
  type ApplyInstitutionSexOffenseValues,
} from '@/features/program/ui/apply-institution-sex-offense/apply-institution-sex-offense'
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

function resolveInstitutionGuidanceParagraphIds(
  detailCase: ProgramDetailCase | undefined,
): InstitutionGuidanceParagraphIds {
  if (detailCase === 'gemini') {
    return {
      guidance: PROGRAM_APPLICATION_FORM_ECONOMY_IDS.guidance,
      sexOffenseSubmission: PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentSubmissionRequest,
      sexOffenseInquiry: PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod,
    }
  }
  return {
    guidance: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance,
    sexOffenseSubmission: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest,
    sexOffenseInquiry: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod,
  }
}

function readAnswer(answers: Record<string, unknown>, key: string): unknown {
  if (!key) return undefined
  if (key in answers) return answers[key]
  return undefined
}

export function mapInstitutionGuidanceFromApplicationAnswers(
  answers: Record<string, unknown> | undefined,
  detailCase: ProgramDetailCase | undefined,
): TeacherInstitutionGuidanceFormState {
  const ids = resolveInstitutionGuidanceParagraphIds(detailCase)
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
): Record<string, unknown> {
  const ids = resolveInstitutionGuidanceParagraphIds(detailCase)
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

function formatSiteSubmissionLabel(value: ApplyInstitutionSexOffenseValues['siteSubmission']): string {
  return value === 'online' ? '온라인 제출' : '직접 제출'
}

export function formatSexOffenseConsentMethodDisplay(
  sexOffense: ApplyInstitutionSexOffenseValues,
): string | undefined {
  if (sexOffense.submissionRequest === 'no_submit') {
    return '동의서 미제출'
  }
  const parts = [formatSiteSubmissionLabel(sexOffense.siteSubmission)]
  if (sexOffense.siteSubmission === 'online') {
    const id = sexOffense.institutionId.trim()
    const verification = sexOffense.verificationNumber.trim()
    if (id) parts.push(`ID: ${id}`)
    if (verification) parts.push(`검증번호: ${verification}`)
  }
  const label = parts.filter(Boolean).join(' | ')
  return label || '동의서 제출 요청'
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
  if (methodLabel.includes('미제출')) {
    sexOffense.submissionRequest = 'no_submit'
  } else if (methodLabel) {
    sexOffense.submissionRequest = 'request'
    if (methodLabel.includes('직접 제출')) {
      sexOffense.siteSubmission = 'direct'
    }
    const idMatch = /ID:\s*([^|]+)/.exec(methodLabel)
    const verificationMatch = /검증번호:\s*([^|]+)/.exec(methodLabel)
    if (idMatch?.[1]) sexOffense.institutionId = idMatch[1].trim()
    if (verificationMatch?.[1]) sexOffense.verificationNumber = verificationMatch[1].trim()
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
