import { createAgreementNoticeDraft } from '../writing-form/draft-schema.js'
import { createAgreementPortraitDraft } from '../writing-form/draft-schema.js'
import { createEducatorFacilitatorPledgeDraft } from '../writing-form/draft-schema.js'
import { createPaymentStatementPreConsentDraft } from '../paragraph-ids/payment-statement-pre-consent-draft.js'
import { createReceiptPreConsentDraft } from '../paragraph-ids/receipt-pre-consent-draft.js'
import type { WritingFormDraft } from '../writing-form/draft-schema.js'

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
      modalTitle: '행정정보 공동이용 사전동의서',
    },
    consentSexOffenseCheck: {
      fieldKey: 'consentSexOffenseCheck',
      templateId: 'agreement-crime',
      modalTitle: '성범죄 경력조회 동의서',
    },
    consentReceiptPreConsent: {
      fieldKey: 'consentReceiptPreConsent',
      templateId: 'agreement-receipt-pre-consent',
      modalTitle: '영수증 발급 사전 동의서',
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

export const RECEIPT_PRE_CONSENT_WRITE_KEY = 'consentReceiptPreConsent' as const

export type DocumentConsentWriteKey = InstructorApplyConsentKey | typeof RECEIPT_PRE_CONSENT_WRITE_KEY

export function resolveDocumentConsentTemplate(
  key: DocumentConsentWriteKey
): MemberConsentTemplateEntry {
  if (key === RECEIPT_PRE_CONSENT_WRITE_KEY) {
    return MEMBER_CONSENT_TEMPLATE_MAP.consentReceiptPreConsent
  }
  return resolveInstructorApplyConsentTemplate(key)
}

export function isCrimeConsentTemplate(templateId: string): boolean {
  return templateId === 'agreement-crime'
}

const SEED_FACTORIES: Record<string, () => WritingFormDraft> = {
  'agreement-portrait': createAgreementPortraitDraft,
  'agreement-third-party': createPaymentStatementPreConsentDraft,
  'agreement-receipt-pre-consent': createReceiptPreConsentDraft,
  'agreement-expense': createEducatorFacilitatorPledgeDraft,
  'agreement-notice': createAgreementNoticeDraft,
}

export function createConsentTemplateSeedDraft(templateId: string): WritingFormDraft | null {
  const factory = SEED_FACTORIES[templateId]
  return factory != null ? factory() : null
}
