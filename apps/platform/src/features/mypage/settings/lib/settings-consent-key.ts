import {
  isDocumentConsentWriteKey,
  RECEIPT_PRE_CONSENT_WRITE_KEY,
  type DocumentConsentWriteKey,
  type InstructorApplyConsentKey,
} from '../../instructor-apply/consent/catalog'
import type { SettingsConsentItemId } from './consent-catalog'

export const SETTINGS_PORTRAIT_CONSENT_WRITE_KEY = 'consentPortrait'

const SETTINGS_TO_INSTRUCTOR: Record<
  Extract<
    SettingsConsentItemId,
    'paymentStatement' | 'educatorPledge' | 'administrativeJoint' | 'sexOffenseCheck'
  >,
  InstructorApplyConsentKey
> = {
  paymentStatement: 'consentPaymentStatement',
  educatorPledge: 'consentEducatorPledge',
  administrativeJoint: 'consentAdministrativeJoint',
  sexOffenseCheck: 'consentSexOffenseCheck',
}

export function settingsConsentItemIdToInstructorKey(
  id: SettingsConsentItemId,
): InstructorApplyConsentKey | null {
  if (id in SETTINGS_TO_INSTRUCTOR) {
    return SETTINGS_TO_INSTRUCTOR[id as keyof typeof SETTINGS_TO_INSTRUCTOR]
  }
  return null
}

const INSTRUCTOR_TO_SETTINGS: Record<
  InstructorApplyConsentKey,
  keyof typeof SETTINGS_TO_INSTRUCTOR
> = {
  consentPaymentStatement: 'paymentStatement',
  consentEducatorPledge: 'educatorPledge',
  consentAdministrativeJoint: 'administrativeJoint',
  consentSexOffenseCheck: 'sexOffenseCheck',
}

export function instructorApplyKeyToSettingsConsentItemId(
  key: InstructorApplyConsentKey,
): keyof typeof SETTINGS_TO_INSTRUCTOR {
  return INSTRUCTOR_TO_SETTINGS[key]
}

/** 마이페이지 작성 라우트 `:consentKey` (강사 신청 키 + 초상권) */
export function settingsConsentItemIdToWriteKey(id: SettingsConsentItemId): string | null {
  const instructorKey = settingsConsentItemIdToInstructorKey(id)
  if (instructorKey) return instructorKey
  if (id === 'portrait') return SETTINGS_PORTRAIT_CONSENT_WRITE_KEY
  if (id === 'receiptPreConsent') return RECEIPT_PRE_CONSENT_WRITE_KEY
  return null
}

export function isSettingsConsentWriteKey(value: string): boolean {
  return isDocumentConsentWriteKey(value) || value === SETTINGS_PORTRAIT_CONSENT_WRITE_KEY
}

export function isSettingsDocumentConsentItemId(
  id: SettingsConsentItemId,
): id is keyof typeof SETTINGS_TO_INSTRUCTOR | 'portrait' | 'receiptPreConsent' {
  return id in SETTINGS_TO_INSTRUCTOR || id === 'portrait' || id === 'receiptPreConsent'
}

/** POST /me/consents/documents — 강사 신청 termsType과 동일 enum */
export const PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY: Record<
  InstructorApplyConsentKey,
  string
> = {
  consentPaymentStatement: 'PAYMENT_STATEMENT_PRE_CONSENT',
  consentEducatorPledge: 'FACILITATOR_PLEDGE',
  consentAdministrativeJoint: 'ADMINISTRATIVE_INFO_CONSENT',
  consentSexOffenseCheck: 'CRIMINAL_HISTORY_CHECK_CONSENT',
}

export const PORTAL_RECEIPT_PRE_CONSENT_CREATE_TYPE = 'RECEIPT_PRE_CONSENT'

export function resolvePortalConsentCreateType(key: DocumentConsentWriteKey): string {
  if (key === RECEIPT_PRE_CONSENT_WRITE_KEY) return PORTAL_RECEIPT_PRE_CONSENT_CREATE_TYPE
  return PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY[key]
}
