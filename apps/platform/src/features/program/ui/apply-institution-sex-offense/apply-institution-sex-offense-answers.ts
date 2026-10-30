import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import {
  DEFAULT_SEX_OFFENSE_INQUIRY_METHOD,
  DEFAULT_SEX_OFFENSE_SITE_SUBMISSION,
  isSexOffenseInquiryMethod,
  isSexOffenseSiteSubmission,
  normalizeSexOffenseInquiryAnswer,
  resolveSexOffenseInquiryCase,
  shouldShowSexOffenseSiteFields,
  type SexOffenseInquiryCase,
} from '@jakorea/form-schema/program-application'

/** CMS `application.institution.sexOffense.*` 와 동일 */
export type ApplySexOffenseSubmissionRequest = 'request' | 'no_submit'
export type ApplySexOffenseInquiryMethod = 'ja_system' | 'criminal_record_site'
export type ApplySexOffenseSiteSubmission = 'direct' | 'online'
export type ApplySexOffenseInquiryCase = SexOffenseInquiryCase

export type ApplyInstitutionSexOffenseValues = {
  submissionRequest: ApplySexOffenseSubmissionRequest | ''
  inquiryMethod: ApplySexOffenseInquiryMethod | ''
  siteSubmission: ApplySexOffenseSiteSubmission | ''
  institutionId: string
  verificationNumber: string
}

const SEX_OFFENSE_QUESTION_PAIRS = [
  {
    submission: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest,
    inquiry: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod,
  },
  {
    submission: PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentSubmissionRequest,
    inquiry: PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod,
  },
] as const

export function readSexOffenseSubmissionRequest(
  answer: unknown,
): ApplySexOffenseSubmissionRequest | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const value = (answer as Record<string, unknown>).submissionRequest
  if (value === 'no_submit' || value === 'request') return value
  return null
}

/**
 * `no_submit`이면 조회 방식 키를 answers에서 제거한다.
 * `{}` / `null`도 보내지 않는다. 기관·경제금융 단락 ID만 다룬다.
 */
export function omitSexOffenseInquiryAnswersIfNotRequested(
  answers: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...answers }
  for (const pair of SEX_OFFENSE_QUESTION_PAIRS) {
    if (readSexOffenseSubmissionRequest(next[pair.submission]) !== 'no_submit') continue
    delete next[pair.inquiry]
  }
  return next
}

export function emptyInstitutionSexOffense(): ApplyInstitutionSexOffenseValues {
  return {
    submissionRequest: '',
    inquiryMethod: DEFAULT_SEX_OFFENSE_INQUIRY_METHOD,
    siteSubmission: '',
    institutionId: '',
    verificationNumber: '',
  }
}

export function shouldShowSexOffenseInquiry(
  values: ApplyInstitutionSexOffenseValues,
): boolean {
  return values.submissionRequest === 'request'
}

export function applySexOffenseInquiryMethodChange(
  current: ApplyInstitutionSexOffenseValues,
  next: ApplySexOffenseInquiryMethod,
): ApplyInstitutionSexOffenseValues {
  if (next === current.inquiryMethod) return current
  if (next === 'ja_system') {
    return {
      ...current,
      inquiryMethod: next,
      siteSubmission: '',
      institutionId: '',
      verificationNumber: '',
    }
  }
  return {
    ...current,
    inquiryMethod: next,
    siteSubmission: DEFAULT_SEX_OFFENSE_SITE_SUBMISSION,
    institutionId: '',
    verificationNumber: '',
  }
}

function incompleteSiteCredentialMessage(
  values: ApplyInstitutionSexOffenseValues,
): string | null {
  if (values.inquiryMethod !== 'ja_system' && values.inquiryMethod !== 'criminal_record_site') {
    return '성범죄 경력조회 동의서 조회 방식을 선택해 주세요.'
  }
  if (values.inquiryMethod === 'ja_system') return null
  if (values.siteSubmission !== 'online' && values.siteSubmission !== 'direct') {
    return '사이트 제출 방식을 선택해 주세요.'
  }
  if (!values.institutionId.trim()) return '성범죄 경력조회 기관 아이디를 입력해 주세요.'
  if (!values.verificationNumber.trim()) return '성범죄 경력조회 검증번호를 입력해 주세요.'
  return null
}

export function findIncompleteUjatSexOffenseWriteMessage(
  values: ApplyInstitutionSexOffenseValues,
): string | null {
  return incompleteSiteCredentialMessage(values)
}

export function findIncompleteSexOffenseMessage(
  values: ApplyInstitutionSexOffenseValues,
): string | null {
  if (values.submissionRequest !== 'request' && values.submissionRequest !== 'no_submit') {
    return '성범죄 경력조회 동의서 제출 여부를 선택해 주세요.'
  }
  if (values.submissionRequest !== 'request') return null
  return incompleteSiteCredentialMessage(values)
}

export function sexOffenseSubmissionAnswerFromValues(
  values: ApplyInstitutionSexOffenseValues,
): Record<string, unknown> {
  return { submissionRequest: values.submissionRequest }
}

export function sexOffenseInquiryAnswerFromValues(
  values: ApplyInstitutionSexOffenseValues,
): Record<string, unknown> {
  return (
    normalizeSexOffenseInquiryAnswer(values) ?? {
      inquiryMethod: DEFAULT_SEX_OFFENSE_INQUIRY_METHOD,
    }
  )
}

export function resolveApplySexOffenseInquiryCase(
  values: ApplyInstitutionSexOffenseValues,
): ApplySexOffenseInquiryCase | null {
  return resolveSexOffenseInquiryCase(values)
}

export function sexOffenseValuesFromDraftAnswers(
  submission: unknown,
  inquiry: unknown,
): ApplyInstitutionSexOffenseValues | null {
  const empty = emptyInstitutionSexOffense()
  const sub = submission && typeof submission === 'object' && !Array.isArray(submission)
    ? (submission as Record<string, unknown>)
    : null
  const inq = inquiry && typeof inquiry === 'object' && !Array.isArray(inquiry)
    ? (inquiry as Record<string, unknown>)
    : null
  if (!sub && !inq) return null
  if (sub?.submissionRequest === 'no_submit') {
    return { ...empty, submissionRequest: 'no_submit', inquiryMethod: '' }
  }
  const inquiryMethod = isSexOffenseInquiryMethod(inq?.inquiryMethod) ? inq.inquiryMethod : ''
  const showSite = shouldShowSexOffenseSiteFields(inquiryMethod)
  const siteSubmission =
    showSite && isSexOffenseSiteSubmission(inq?.siteSubmission) ? inq.siteSubmission : ''
  return {
    ...empty,
    submissionRequest: 'request',
    inquiryMethod,
    siteSubmission,
    institutionId:
      showSite && typeof inq?.institutionId === 'string' ? inq.institutionId : '',
    verificationNumber:
      showSite && typeof inq?.verificationNumber === 'string' ? inq.verificationNumber : '',
  }
}
