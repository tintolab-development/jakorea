import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'

/** CMS `application.institution.sexOffense.*` 와 동일 */
export type ApplySexOffenseSubmissionRequest = 'request' | 'no_submit'
export type ApplySexOffenseInquiryMethod = 'ja_system' | 'criminal_record_site'
export type ApplySexOffenseSiteSubmission = 'direct' | 'online'

export type ApplyInstitutionSexOffenseValues = {
  submissionRequest: ApplySexOffenseSubmissionRequest
  inquiryMethod: ApplySexOffenseInquiryMethod
  siteSubmission: ApplySexOffenseSiteSubmission
  institutionId: string
  verificationNumber: string
}

/** 조회 방식 선택 항목 제거 — 저장 값은 범죄경력회보서 사이트 이용으로 고정 */
const FIXED_INQUIRY_METHOD: ApplySexOffenseInquiryMethod = 'criminal_record_site'

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
    submissionRequest: 'request',
    inquiryMethod: FIXED_INQUIRY_METHOD,
    siteSubmission: 'online',
    institutionId: '',
    verificationNumber: '',
  }
}

export function shouldShowSexOffenseInquiry(
  values: ApplyInstitutionSexOffenseValues,
): boolean {
  return values.submissionRequest === 'request'
}

export function findIncompleteSexOffenseMessage(
  values: ApplyInstitutionSexOffenseValues,
): string | null {
  if (values.submissionRequest !== 'request') return null
  if (values.siteSubmission !== 'online') return null
  if (!values.institutionId.trim()) return '성범죄 경력조회 기관 아이디를 입력해 주세요.'
  if (!values.verificationNumber.trim()) return '성범죄 경력조회 검증번호를 입력해 주세요.'
  return null
}

export function sexOffenseSubmissionAnswerFromValues(
  values: ApplyInstitutionSexOffenseValues,
): Record<string, unknown> {
  return { submissionRequest: values.submissionRequest }
}

export function sexOffenseInquiryAnswerFromValues(
  values: ApplyInstitutionSexOffenseValues,
): Record<string, unknown> {
  return {
    inquiryMethod: FIXED_INQUIRY_METHOD,
    siteSubmission: values.siteSubmission,
    institutionId: values.institutionId.trim(),
    verificationNumber: values.verificationNumber.trim(),
  }
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
    return { ...empty, submissionRequest: 'no_submit' }
  }
  return {
    ...empty,
    submissionRequest: 'request',
    inquiryMethod: FIXED_INQUIRY_METHOD,
    siteSubmission: inq?.siteSubmission === 'direct' ? 'direct' : empty.siteSubmission,
    institutionId: typeof inq?.institutionId === 'string' ? inq.institutionId : '',
    verificationNumber:
      typeof inq?.verificationNumber === 'string' ? inq.verificationNumber : '',
  }
}
