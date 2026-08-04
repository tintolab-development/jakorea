import type { TermsAgreementRequest } from '@/shared/api/generated/members/schemas/termsAgreementRequest'

/** CMS 관리자 사전등록 — 약관 카탈로그 미연동 시 사용하는 기본 버전 */
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

const DOCUMENT_TERMS_TYPE: Record<PreRegisterDocumentConsentKey, string> = {
  consentPortrait: 'PORTRAIT_RIGHTS',
  consentPaymentStatement: 'PAYMENT_STATEMENT',
  consentWithholdingTax: 'PAYMENT_STATEMENT',
  consentEducatorPledge: 'EDUCATOR_PLEDGE',
  consentFacilitatorPledge: 'EDUCATOR_PLEDGE',
  consentAdministrativeJoint: 'ADMINISTRATIVE_JOINT',
  consentSexOffenseCheck: 'SEX_OFFENSE_CHECK',
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
 * 동의서 작성형 — `agree`일 때만 termsAgreements에 포함.
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
    if (value !== 'agree') continue
    const termsType = DOCUMENT_TERMS_TYPE[key]
    if (!termsType || seenTermsTypes.has(termsType)) continue
    seenTermsTypes.add(termsType)
    rows.push({
      termsType,
      version: ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: false,
      agreed: true,
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

/** @deprecated `buildPreRegisterTermsAgreements` 사용 */
export function buildInstructorRegisterTermsAgreements(
  values: PreRegisterRadioConsentFields
): TermsAgreementRequest[] {
  return buildPreRegisterRadioTermsAgreements(values)
}
