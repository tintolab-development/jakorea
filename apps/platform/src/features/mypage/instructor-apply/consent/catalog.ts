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
  consentEducatorPledge: 'JA Korea 교육진행자 서약서(안)',
  consentAdministrativeJoint: '행정정보 공동이용 사전동의서',
  consentSexOffenseCheck: '성범죄 경력 조회 동의서',
}

export function isInstructorApplyConsentKey(value: string): value is InstructorApplyConsentKey {
  return (INSTRUCTOR_APPLY_CONSENT_KEYS as readonly string[]).includes(value)
}

export function getInstructorApplyConsentPageTitle(key: InstructorApplyConsentKey): string {
  return PAGE_TITLES[key]
}

const PAGE_DESCRIPTIONS: Partial<Record<InstructorApplyConsentKey, string>> = {
  consentSexOffenseCheck: '동의서 양식을 다운로드하여 작성 후 업로드해 주세요.',
}

export function getInstructorApplyConsentPageDescription(
  key: InstructorApplyConsentKey,
): string | undefined {
  return PAGE_DESCRIPTIONS[key]
}

export function getInstructorApplyConsentPath(key: InstructorConsentDocumentKey): string {
  return instructorApplyConsentPath(key)
}

/**
 * 강사 신청 제출 시 필수에서 빼는 동의서 — 작성·보기·제출(동의 여부 전송)은 그대로 둔다.
 * 행정정보 공동이용: 2026-10-29 필수 해제. 공용 레이아웃(`@jakorea/domain` form-layout)은 CMS와 같이 쓰므로 앱에서만 덮어쓴다.
 */
export const INSTRUCTOR_APPLY_OPTIONAL_CONSENT_KEYS: readonly InstructorConsentDocumentKey[] = [
  'consentAdministrativeJoint',
]

export function isInstructorApplyOptionalConsentKey(key: string): boolean {
  return (INSTRUCTOR_APPLY_OPTIONAL_CONSENT_KEYS as readonly string[]).includes(key)
}

export const CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE = '필수 항목을 모두 작성해주세요'
