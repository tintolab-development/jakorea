import {
  AGREEMENT_NOTICE_HIDDEN_DRAG_HANDLE_IDS,
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_HIDDEN_DRAG_HANDLE_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS,
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createEducatorFacilitatorPledgeDraft,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'
import {
  AGREEMENT_NOTICE_A4_HIDDEN_PARAGRAPH_IDS,
  getAgreementNoticeA4ParagraphGap,
} from '@/features/template/model/agreement-notice-a4-preview'
import {
  AGREEMENT_PORTRAIT_A4_HIDDEN_PARAGRAPH_IDS,
  getAgreementPortraitA4ParagraphGap,
} from '@/features/template/model/agreement-portrait-a4-preview'
import {
  createPaymentStatementPreConsentDraft,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-pre-consent-draft'
import {
  getPaymentStatementPreConsentA4ParagraphGap,
  PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-pre-consent-a4-preview'
import {
  PAYMENT_STATEMENT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS,
} from '@/features/template/ui/form-set/payment-statement-pre-consent/paragraph-config'
import type { AgreementWritingFormShellProps } from '@/features/template/ui/form-set/editors/new-agreement-form'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import { TEMPLATE_FORM_MODAL_DESCRIPTION } from './template-registry'

export type AgreementTemplateConfigKey =
  | 'agreement-expense'
  | 'agreement-notice'
  | 'agreement-portrait'
  | 'agreement-third-party'

export type AgreementWritingFormConfig = Omit<AgreementWritingFormShellProps, 'onClose'>

function resolveRowTitle(templateId: string, fallback: string): string {
  return findWritingTemplateRowByDefinitionId(templateId)?.templateName ?? fallback
}

export const AGREEMENT_TEMPLATE_CONFIG_REGISTRY: Record<
  AgreementTemplateConfigKey,
  () => AgreementWritingFormConfig
> = {
  'agreement-expense': () => {
    const title = resolveRowTitle('agreement-expense', '교육진행자 동의 서약서')
    return {
      initialDraft: createEducatorFacilitatorPledgeDraft,
      defaultActiveParagraphId: EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title,
      modalTitle: title,
      modalDescription: TEMPLATE_FORM_MODAL_DESCRIPTION,
      writingPreviewHeaderTitle: title,
      previewLayout: 'a4-document',
      a4RenderMode: 'contentOnly',
    }
  },
  'agreement-notice': () => {
    const title = resolveRowTitle('agreement-notice', '행정정보 공동이용 사전동의서')
    return {
      initialDraft: createAgreementNoticeDraft,
      defaultActiveParagraphId: AGREEMENT_NOTICE_PARAGRAPH_IDS.title,
      modalTitle: title,
      modalDescription: TEMPLATE_FORM_MODAL_DESCRIPTION,
      writingPreviewHeaderTitle: title,
      structureLockedParagraphIds: AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS,
      hideDragHandleForParagraphIds: AGREEMENT_NOTICE_HIDDEN_DRAG_HANDLE_IDS,
      previewLayout: 'a4-document',
      a4HiddenParagraphIds: AGREEMENT_NOTICE_A4_HIDDEN_PARAGRAPH_IDS,
      a4RenderMode: 'contentOnly',
      a4ParagraphGapPx: getAgreementNoticeA4ParagraphGap,
    }
  },
  'agreement-portrait': () => {
    const title = resolveRowTitle('agreement-portrait', '초상권 수집·이용 동의서')
    return {
      initialDraft: createAgreementPortraitDraft,
      defaultActiveParagraphId: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title,
      modalTitle: title,
      modalDescription: TEMPLATE_FORM_MODAL_DESCRIPTION,
      writingPreviewHeaderTitle: title,
      structureLockedParagraphIds: AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS,
      hideDragHandleForParagraphIds: AGREEMENT_PORTRAIT_HIDDEN_DRAG_HANDLE_IDS,
      previewLayout: 'a4-document',
      a4HiddenParagraphIds: AGREEMENT_PORTRAIT_A4_HIDDEN_PARAGRAPH_IDS,
      a4RenderMode: 'contentOnly',
      a4ParagraphGapPx: getAgreementPortraitA4ParagraphGap,
    }
  },
  'agreement-third-party': () => {
    const title = resolveRowTitle('agreement-third-party', '지급조서 사전 동의서')
    return {
      initialDraft: createPaymentStatementPreConsentDraft,
      defaultActiveParagraphId: PAYMENT_STATEMENT_PRE_CONSENT_IDS.title,
      modalTitle: title,
      modalDescription: TEMPLATE_FORM_MODAL_DESCRIPTION,
      writingPreviewHeaderTitle: title,
      structureLockedParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
      hideDragHandleForParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS,
      previewLayout: 'a4-document',
      a4HiddenParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS,
      a4RenderMode: 'contentOnly',
      a4ParagraphGapPx: getPaymentStatementPreConsentA4ParagraphGap,
      paragraphBodyOptions: PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS,
    }
  },
}

export function resolveAgreementWritingFormConfig(
  templateId: string | undefined | null
): AgreementWritingFormConfig | null {
  if (templateId == null || templateId.trim() === '') return null
  const code = templateId.trim()
  const direct = AGREEMENT_TEMPLATE_CONFIG_REGISTRY[code as AgreementTemplateConfigKey]
  if (direct != null) return direct()

  const copyMatch = code.match(/^(.*)-copy-\d+$/)
  const baseKey = copyMatch?.[1] as AgreementTemplateConfigKey | undefined
  if (baseKey == null) return null
  const factory = AGREEMENT_TEMPLATE_CONFIG_REGISTRY[baseKey]
  return factory != null ? factory() : null
}
