import type { InstructorConsentDocumentKey } from '@jakorea/domain/instructor/consent'
import { instructorApplyConsentPath } from '../../lib/constants'

export const INSTRUCTOR_APPLY_CONSENT_KEYS = [
  'consentPaymentStatement',
  'consentEducatorPledge',
  'consentAdministrativeJoint',
  'consentSexOffenseCheck',
] as const

export type InstructorApplyConsentKey = (typeof INSTRUCTOR_APPLY_CONSENT_KEYS)[number]

/** 작성 화면 제목 — Platform 시안(P2~P6) */
const PAGE_TITLES: Record<DocumentConsentWriteKey, string> = {
  consentPaymentStatement: '지급조서 사전 동의서',
  consentEducatorPledge: 'JA Korea 교육진행자 서약서',
  consentAdministrativeJoint: '행정정보 공동이용 사전동의서',
  consentSexOffenseCheck: '성범죄경력 조회 동의서',
  consentReceiptPreConsent: '영수증 사전 동의서',
}

export function isInstructorApplyConsentKey(value: string): value is InstructorApplyConsentKey {
  return (INSTRUCTOR_APPLY_CONSENT_KEYS as readonly string[]).includes(value)
}

export const RECEIPT_PRE_CONSENT_WRITE_KEY = 'consentReceiptPreConsent' as const

export type DocumentConsentWriteKey =
  | InstructorApplyConsentKey
  | typeof RECEIPT_PRE_CONSENT_WRITE_KEY

export function isDocumentConsentWriteKey(value: string): value is DocumentConsentWriteKey {
  return isInstructorApplyConsentKey(value) || value === RECEIPT_PRE_CONSENT_WRITE_KEY
}

export function getInstructorApplyConsentPageTitle(key: DocumentConsentWriteKey): string {
  return PAGE_TITLES[key]
}

const PAGE_DESCRIPTIONS: Partial<Record<InstructorApplyConsentKey, string>> = {
  consentSexOffenseCheck: '동의서 양식을 다운로드하여 작성 후 업로드해 주세요.',
}

export function getInstructorApplyConsentPageDescription(
  key: DocumentConsentWriteKey,
): string | undefined {
  return PAGE_DESCRIPTIONS[key as InstructorApplyConsentKey]
}

export function getInstructorApplyConsentPath(key: InstructorConsentDocumentKey): string {
  return instructorApplyConsentPath(key)
}

export const CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE = '필수 항목을 모두 작성해주세요'
