import { createAgreementNoticeDraft } from '../writing-form/draft-schema.js'
import { createEducatorFacilitatorPledgeDraft } from '../writing-form/draft-schema.js'
import { createPaymentStatementPreConsentDraft } from '../paragraph-ids/payment-statement-pre-consent-draft.js'
import type { WritingFormDraft } from '../writing-form/draft-schema.js'

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

/** Platform 강사 신청 — InstructorConsentDocumentKey */
export type InstructorApplyConsentKey =
  | 'consentPaymentStatement'
  | 'consentEducatorPledge'
  | 'consentAdministrativeJoint'
  | 'consentSexOffenseCheck'

const INSTRUCTOR_TO_MEMBER: Record<InstructorApplyConsentKey, MemberConsentFieldKey> = {
  consentPaymentStatement: 'consentWithholdingTax',
  consentEducatorPledge: 'consentFacilitatorPledge',
  consentAdministrativeJoint: 'consentAdministrativeJoint',
  consentSexOffenseCheck: 'consentSexOffenseCheck',
}

export function resolveInstructorApplyConsentTemplate(
  key: InstructorApplyConsentKey
): MemberConsentTemplateEntry {
  return MEMBER_CONSENT_TEMPLATE_MAP[INSTRUCTOR_TO_MEMBER[key]]
}

export function isCrimeConsentTemplate(templateId: string): boolean {
  return templateId === 'agreement-crime'
}

const SEED_FACTORIES: Record<string, () => WritingFormDraft> = {
  'agreement-third-party': createPaymentStatementPreConsentDraft,
  'agreement-expense': createEducatorFacilitatorPledgeDraft,
  'agreement-notice': createAgreementNoticeDraft,
}

export function createConsentTemplateSeedDraft(templateId: string): WritingFormDraft | null {
  const factory = SEED_FACTORIES[templateId]
  return factory != null ? factory() : null
}
