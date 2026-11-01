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

/** UJAT 안내사항 — UI `직접 제출` | `온라인 제출` */
export type UjatSexOffenseWriteChoice = 'direct' | 'online'

/**
 * 저장값 → UJAT 2단계 라디오.
 * ja_system(및 레거시 site_direct) → 직접, criminal_record_site+online → 온라인.
 * empty 기본 inquiryMethod=ja_system만으로는 선택으로 치지 않는다(submissionRequest=request 필요).
 */
export function resolveUjatSexOffenseWriteChoice(
  values: ApplyInstitutionSexOffenseValues,
): UjatSexOffenseWriteChoice | '' {
  if (values.submissionRequest !== 'request') return ''
  if (values.inquiryMethod === 'ja_system') return 'direct'
  if (values.inquiryMethod === 'criminal_record_site' && values.siteSubmission === 'online') {
    return 'online'
  }
  if (values.inquiryMethod === 'criminal_record_site' && values.siteSubmission === 'direct') {
    // 레거시 site_direct — 신규 UI는 직접(ja_system)으로 편집
    return 'direct'
  }
  return ''
}

/** UJAT UI 선택 → BE inquiry 매핑 (직접=ja_system, 온라인=criminal_record_site+online) */
export function applyUjatSexOffenseWriteChoice(
  current: ApplyInstitutionSexOffenseValues,
  choice: UjatSexOffenseWriteChoice,
): ApplyInstitutionSexOffenseValues {
  const withRequest = {
    ...current,
    submissionRequest: (current.submissionRequest || 'request') as ApplySexOffenseSubmissionRequest,
  }
  if (choice === 'direct') {
    return {
      ...withRequest,
      inquiryMethod: 'ja_system',
      siteSubmission: '',
      institutionId: '',
      verificationNumber: '',
    }
  }
  const keepCredentials =
    current.inquiryMethod === 'criminal_record_site' ||
    Boolean(current.institutionId.trim() || current.verificationNumber.trim())
  return {
    ...withRequest,
    inquiryMethod: 'criminal_record_site',
    siteSubmission: 'online',
    institutionId: keepCredentials ? current.institutionId : '',
    verificationNumber: keepCredentials ? current.verificationNumber : '',
  }
}

/** 제출 직전 — 레거시 site_direct 등도 신규 계약(ja_system / online)으로 정규화 */
export function normalizeUjatSexOffenseWriteValues(
  values: ApplyInstitutionSexOffenseValues,
): ApplyInstitutionSexOffenseValues {
  const choice = resolveUjatSexOffenseWriteChoice(values)
  if (!choice) {
    return { ...values, submissionRequest: values.submissionRequest || 'request' }
  }
  return applyUjatSexOffenseWriteChoice(values, choice)
}

/**
 * UJAT 2/2 — 직접(ja_system) / 온라인(criminal_record_site+online+자격정보).
 * 일반 신버전 조회 단락(사이트 직접 제출 포함)과 검증을 분리한다.
 */
export function findIncompleteUjatSexOffenseWriteMessage(
  values: ApplyInstitutionSexOffenseValues,
): string | null {
  const choice = resolveUjatSexOffenseWriteChoice(values)
  if (!choice) return '성범죄 경력조회 동의서 제출 방식을 선택해 주세요.'
  if (choice === 'direct') return null
  if (!values.institutionId.trim()) return '성범죄 경력조회 기관 아이디를 입력해 주세요.'
  if (!values.verificationNumber.trim()) return '성범죄 경력조회 검증번호를 입력해 주세요.'
  return null
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
