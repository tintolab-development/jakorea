import type {
  EducationTeacherApplicationGuidance,
  EducationTeacherSexOffenseConsent,
  EducationTeacherSexOffenseSiteSubmission,
} from '../../model/types'
import {
  TEACHER_SEX_OFFENSE_INQUIRY_METHOD_OPTIONS,
  TEACHER_SEX_OFFENSE_SITE_SUBMISSION_OPTIONS,
} from '../teacher-application-content/guidance-fields'

export function hasTeacherSexOffenseGuidance(
  guidance: EducationTeacherApplicationGuidance,
): boolean {
  return Boolean(guidance.sexOffenseConsent || guidance.sexOffenseConsentMethod?.trim())
}

export function resolveTeacherSexOffenseConsent(
  guidance: EducationTeacherApplicationGuidance,
): EducationTeacherSexOffenseConsent | undefined {
  if (guidance.sexOffenseConsent) {
    return { ...guidance.sexOffenseConsent }
  }
  if (!guidance.sexOffenseConsentMethod?.trim()) return undefined
  return parseTeacherSexOffenseConsentMethod(guidance.sexOffenseConsentMethod)
}

export function parseTeacherSexOffenseConsentMethod(
  value: string,
): EducationTeacherSexOffenseConsent {
  const trimmed = value.trim()
  const jaLabel = TEACHER_SEX_OFFENSE_INQUIRY_METHOD_OPTIONS[0].label
  if (trimmed === jaLabel || trimmed.includes('JA 시스템')) {
    return { inquiryMethod: 'ja_system' }
  }

  const directLabel = TEACHER_SEX_OFFENSE_SITE_SUBMISSION_OPTIONS[0].label
  if (trimmed === directLabel || trimmed.startsWith('직접 제출')) {
    return { inquiryMethod: 'criminal_record_site', siteSubmission: 'direct' }
  }

  const parts = trimmed.split('|').map(part => part.trim())
  const orgId = parts.find(part => part.startsWith('ID:'))?.replace(/^ID:\s*/i, '') ?? ''
  const verificationCode =
    parts.find(part => part.startsWith('검증번호:'))?.replace(/^검증번호:\s*/i, '') ?? ''

  return {
    inquiryMethod: 'criminal_record_site',
    siteSubmission: 'online',
    orgId,
    verificationCode,
  }
}

export function formatTeacherSexOffenseConsentMethod(
  consent: EducationTeacherSexOffenseConsent,
): string {
  if (consent.inquiryMethod === 'ja_system') {
    return TEACHER_SEX_OFFENSE_INQUIRY_METHOD_OPTIONS[0].label
  }

  const siteSubmission: EducationTeacherSexOffenseSiteSubmission =
    consent.siteSubmission ?? 'direct'

  if (siteSubmission === 'direct') {
    return TEACHER_SEX_OFFENSE_SITE_SUBMISSION_OPTIONS[0].label
  }

  const orgId = consent.orgId?.trim() || '-'
  const verificationCode = consent.verificationCode?.trim() || '-'
  return `온라인 제출 | ID: ${orgId} | 검증번호: ${verificationCode}`
}

export type TeacherGuidanceEditDraft = {
  computerInRoom: string
  waitingPlace: string
  meal: string
  otherNotes: string
  sexOffenseConsent?: EducationTeacherSexOffenseConsent
}

export function toTeacherGuidanceEditDraft(
  guidance: EducationTeacherApplicationGuidance,
): TeacherGuidanceEditDraft {
  return {
    computerInRoom: guidance.computerInRoom,
    waitingPlace: guidance.waitingPlace,
    meal: guidance.meal,
    otherNotes: guidance.otherNotes,
    sexOffenseConsent: resolveTeacherSexOffenseConsent(guidance),
  }
}

export function fromTeacherGuidanceEditDraft(
  draft: TeacherGuidanceEditDraft,
  hadSexOffense: boolean,
): EducationTeacherApplicationGuidance {
  const next: EducationTeacherApplicationGuidance = {
    computerInRoom: draft.computerInRoom,
    waitingPlace: draft.waitingPlace,
    meal: draft.meal,
    otherNotes: draft.otherNotes,
  }

  if (hadSexOffense && draft.sexOffenseConsent) {
    next.sexOffenseConsent = { ...draft.sexOffenseConsent }
    next.sexOffenseConsentMethod = formatTeacherSexOffenseConsentMethod(draft.sexOffenseConsent)
  }

  return next
}
