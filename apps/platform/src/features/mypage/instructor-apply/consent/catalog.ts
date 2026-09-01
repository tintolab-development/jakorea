import type { InstructorConsentDocumentKey } from '@jakorea/domain/instructor/consent'
import { instructorApplyConsentPath } from '../../lib/constants'

export const INSTRUCTOR_APPLY_CONSENT_KEYS = [
  'consentPaymentStatement',
  'consentEducatorPledge',
  'consentAdministrativeJoint',
  'consentSexOffenseCheck',
] as const

export type InstructorApplyConsentKey = (typeof INSTRUCTOR_APPLY_CONSENT_KEYS)[number]

const PAGE_TITLES: Record<InstructorApplyConsentKey, string> = {
  consentPaymentStatement: '지급조서 사전 동의서',
  consentEducatorPledge: '교육진행자 동의 서약서',
  consentAdministrativeJoint: '행정정보 공동이용 사전동의서',
  consentSexOffenseCheck: '성범죄 경력 조회 동의서',
}

export function isInstructorApplyConsentKey(value: string): value is InstructorApplyConsentKey {
  return (INSTRUCTOR_APPLY_CONSENT_KEYS as readonly string[]).includes(value)
}

export function getInstructorApplyConsentPageTitle(key: InstructorApplyConsentKey): string {
  return PAGE_TITLES[key]
}

export function getInstructorApplyConsentPath(key: InstructorConsentDocumentKey): string {
  return instructorApplyConsentPath(key)
}

export const CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE = '필수 항목을 모두 작성해주세요'
