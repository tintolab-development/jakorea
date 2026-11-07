export type MemberConsentFieldKey =
  | 'consentPortrait'
  | 'consentWithholdingTax'
  | 'consentFacilitatorPledge'
  | 'consentAdministrativeJoint'
  | 'consentSexOffenseCheck'
  | 'consentReceiptPreConsent'

export type MemberConsentTemplateEntry = {
  fieldKey: MemberConsentFieldKey
  templateId: string
  modalTitle: string
}

export const MEMBER_CONSENT_TEMPLATE_MAP: Record<MemberConsentFieldKey, MemberConsentTemplateEntry> =
  {
    consentPortrait: {
      fieldKey: 'consentPortrait',
      templateId: 'agreement-portrait',
      modalTitle: '초상권 수집·이용 동의서',
    },
    consentWithholdingTax: {
      fieldKey: 'consentWithholdingTax',
      templateId: 'agreement-third-party',
      modalTitle: '지급조서 사전 동의서',
    },
    consentFacilitatorPledge: {
      fieldKey: 'consentFacilitatorPledge',
      templateId: 'agreement-expense',
      modalTitle: 'JA Korea 교육진행자 서약서(안)',
    },
    consentAdministrativeJoint: {
      fieldKey: 'consentAdministrativeJoint',
      templateId: 'agreement-notice',
      modalTitle: '행정정보 공동이용 동의서',
    },
    consentSexOffenseCheck: {
      fieldKey: 'consentSexOffenseCheck',
      templateId: 'agreement-crime',
      modalTitle: '성범죄경력 조회 동의서',
    },
    consentReceiptPreConsent: {
      fieldKey: 'consentReceiptPreConsent',
      templateId: 'agreement-receipt-pre-consent',
      modalTitle: '영수증 발급 사전 동의서',
    },
  }

export const MEMBER_CONSENT_FIELD_KEYS = Object.keys(
  MEMBER_CONSENT_TEMPLATE_MAP
) as MemberConsentFieldKey[]

export function resolveMemberConsentTemplateEntry(
  fieldKey: MemberConsentFieldKey
): MemberConsentTemplateEntry {
  return MEMBER_CONSENT_TEMPLATE_MAP[fieldKey]
}

const CONSENT_LABEL_TO_FIELD_KEY: Record<string, MemberConsentFieldKey> = {
  '초상권 수집·이용 동의': 'consentPortrait',
  '지급조서 사전 동의서': 'consentWithholdingTax',
  '영수증 발급 사전 동의서': 'consentReceiptPreConsent',
  '교육진행자 서약서': 'consentFacilitatorPledge',
  '교육진행자 동의 서약서': 'consentFacilitatorPledge',
  'JA Korea 교육진행자 서약서(안)': 'consentFacilitatorPledge',
  '행정정보 공동이용 동의서': 'consentAdministrativeJoint',
  '성범죄경력 조회 동의서': 'consentSexOffenseCheck',
  /** 구 라벨 별칭 — 2026-10-29 라벨 변경 전 문자열도 계속 매칭 */
  '행정정보 공동이용 사전동의서': 'consentAdministrativeJoint',
  '성범죄 경력 조회 동의서': 'consentSexOffenseCheck',
}

/** 회원 상세 약관·동의 UI 라벨 → 동의서 템플릿 */
export function resolveMemberConsentTemplateByLabel(
  label: string
): MemberConsentTemplateEntry | undefined {
  const fieldKey = CONSENT_LABEL_TO_FIELD_KEY[label.trim()]
  if (!fieldKey) return undefined
  return MEMBER_CONSENT_TEMPLATE_MAP[fieldKey]
}

export function isMemberCrimeConsentField(fieldKey: MemberConsentFieldKey): boolean {
  return fieldKey === 'consentSexOffenseCheck'
}

/** 0483 — 성범죄·행정정보 동의서 열람·다운로드 제한 대상 */
export function isSensitiveConsentDocumentLabel(label: string): boolean {
  const fieldKey = resolveMemberConsentTemplateByLabel(label)?.fieldKey
  return fieldKey === 'consentSexOffenseCheck' || fieldKey === 'consentAdministrativeJoint'
}

export function isAgreementMemberConsentField(
  fieldKey: MemberConsentFieldKey
): fieldKey is Exclude<MemberConsentFieldKey, 'consentSexOffenseCheck'> {
  return !isMemberCrimeConsentField(fieldKey)
}
