export type MemberConsentFieldKey =
  | 'consentPortrait'
  | 'consentWithholdingTax'
  | 'consentFacilitatorPledge'
  | 'consentAdministrativeJoint'
  | 'consentSexOffenseCheck'

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
      modalTitle: '교육진행자 동의 서약서',
    },
    consentAdministrativeJoint: {
      fieldKey: 'consentAdministrativeJoint',
      templateId: 'agreement-notice',
      modalTitle: '행정정보 공동이용 사전동의서',
    },
    consentSexOffenseCheck: {
      fieldKey: 'consentSexOffenseCheck',
      templateId: 'agreement-crime',
      modalTitle: '성범죄 경력 조회 및 아동학대 관련 범죄전력조회 동의서',
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

export function isMemberCrimeConsentField(fieldKey: MemberConsentFieldKey): boolean {
  return fieldKey === 'consentSexOffenseCheck'
}

export function isAgreementMemberConsentField(
  fieldKey: MemberConsentFieldKey
): fieldKey is Exclude<MemberConsentFieldKey, 'consentSexOffenseCheck'> {
  return !isMemberCrimeConsentField(fieldKey)
}
