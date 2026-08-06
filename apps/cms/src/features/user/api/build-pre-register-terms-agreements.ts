import type { AdminTermsAgreementRequest } from '@/shared/api/generated/members/schemas/adminTermsAgreementRequest'
import type { TermsAgreementRequest } from '@/shared/api/generated/members/schemas/termsAgreementRequest'
import type { TermsAgreementRequestTermsType } from '@/shared/api/generated/members/schemas/termsAgreementRequestTermsType'

/** CMS 관리자 사전등록 — version은 createUser 제출 시 서버 current API로 갱신 */
export const ADMIN_PRE_REGISTER_TERMS_VERSION = '1.0'

export type PreRegisterConsentValue = 'agree' | 'disagree'

export type PreRegisterRadioConsentFields = {
  consentTermsOfService: PreRegisterConsentValue
  /** 강사·개인 등록 폼 필드명 차이 (`consentPersonal` | `consentPersonalInfo`) */
  consentPersonal: PreRegisterConsentValue
  consentMarketing: PreRegisterConsentValue
}

/** 동의서 작성형 — `termsAgreements.termsType` (consent-records 매핑과 동일 계열) */
export type PreRegisterDocumentConsentKey =
  | 'consentPortrait'
  | 'consentPaymentStatement'
  | 'consentWithholdingTax'
  | 'consentEducatorPledge'
  | 'consentFacilitatorPledge'
  | 'consentAdministrativeJoint'
  | 'consentSexOffenseCheck'

const DOCUMENT_TERMS_TYPE: Record<PreRegisterDocumentConsentKey, TermsAgreementRequestTermsType> = {
  consentPortrait: 'PORTRAIT_RIGHTS',
  consentPaymentStatement: 'PAYMENT_STATEMENT_PRE_CONSENT',
  consentWithholdingTax: 'PAYMENT_STATEMENT_PRE_CONSENT',
  consentEducatorPledge: 'FACILITATOR_PLEDGE',
  consentFacilitatorPledge: 'FACILITATOR_PLEDGE',
  consentAdministrativeJoint: 'ADMINISTRATIVE_INFO_CONSENT',
  consentSexOffenseCheck: 'CRIMINAL_HISTORY_CHECK_CONSENT',
}

function toAgreed(value: PreRegisterConsentValue): boolean {
  return value === 'agree'
}

/** 라디오형 3건 — 서비스·개인정보·마케팅 */
export function buildPreRegisterRadioTermsAgreements(
  values: PreRegisterRadioConsentFields
): TermsAgreementRequest[] {
  return [
    {
      termsType: 'SERVICE_TERMS',
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: true,
      agreed: toAgreed(values.consentTermsOfService),
    },
    {
      termsType: 'PRIVACY_COLLECTION',
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: true,
      agreed: toAgreed(values.consentPersonal),
    },
    {
      termsType: 'MARKETING',
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: false,
      agreed: toAgreed(values.consentMarketing),
    },
  ]
}

/**
 * 동의서 작성형 — 폼에 있는 항목은 agree/disagree 모두 termsAgreements에 포함.
 * formResponseId·전문 스냅샷 API는 BE 확정 전 — agreed 플래그만 전송.
 */
export function buildPreRegisterDocumentTermsAgreements(
  documents: Partial<Record<PreRegisterDocumentConsentKey, PreRegisterConsentValue>> | undefined
): TermsAgreementRequest[] {
  if (!documents) return []

  const seenTermsTypes = new Set<string>()
  const rows: TermsAgreementRequest[] = []

  for (const [key, value] of Object.entries(documents) as Array<
    [PreRegisterDocumentConsentKey, PreRegisterConsentValue | undefined]
  >) {
    if (value == null) continue
    const termsType = DOCUMENT_TERMS_TYPE[key]
    if (!termsType || seenTermsTypes.has(termsType)) continue
    seenTermsTypes.add(termsType)
    rows.push({
      termsType,
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: false,
      agreed: toAgreed(value),
    })
  }

  return rows
}

export function buildPreRegisterTermsAgreements(
  radio: PreRegisterRadioConsentFields,
  documents?: Partial<Record<PreRegisterDocumentConsentKey, PreRegisterConsentValue>>
): TermsAgreementRequest[] {
  return [
    ...buildPreRegisterRadioTermsAgreements(radio),
    ...buildPreRegisterDocumentTermsAgreements(documents),
  ]
}

export type AdminAccountCreateConsentFields = PreRegisterRadioConsentFields & {
  consentMfaSetup: PreRegisterConsentValue
}

/**
 * 관리자 계정 생성용 약관 4종.
 * SERVICE_TERMS, PRIVACY_COLLECTION, MFA_SETUP_CONSENT, MARKETING — 각 1건.
 */
export function buildAdminAccountCreateTermsAgreements(
  values: AdminAccountCreateConsentFields
): AdminTermsAgreementRequest[] {
  return [
    {
      termsType: 'SERVICE_TERMS',
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: true,
      agreed: toAgreed(values.consentTermsOfService),
    },
    {
      termsType: 'PRIVACY_COLLECTION',
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: true,
      agreed: toAgreed(values.consentPersonal),
    },
    {
      termsType: 'MFA_SETUP_CONSENT',
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: false,
      agreed: toAgreed(values.consentMfaSetup),
    },
    {
      termsType: 'MARKETING',
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: false,
      agreed: toAgreed(values.consentMarketing),
    },
  ]
}

/** @deprecated `buildPreRegisterTermsAgreements` 사용 */
export function buildInstructorRegisterTermsAgreements(
  values: PreRegisterRadioConsentFields
): TermsAgreementRequest[] {
  return buildPreRegisterRadioTermsAgreements(values)
}
