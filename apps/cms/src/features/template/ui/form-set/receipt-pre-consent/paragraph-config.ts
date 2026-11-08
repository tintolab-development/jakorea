import { RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE } from '@jakorea/form-schema/consent'
import { RECEIPT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/receipt-pre-consent-a4-preview'
import { RECEIPT_PRE_CONSENT_IDS } from '@/features/template/model/receipt-pre-consent-draft'
import { getReceiptPreConsentAdminProxyHiddenIds } from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export const RECEIPT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  RECEIPT_PRE_CONSENT_IDS.title,
  RECEIPT_PRE_CONSENT_IDS.midConsentLine,
  RECEIPT_PRE_CONSENT_IDS.midDate,
  RECEIPT_PRE_CONSENT_IDS.midSignature,
  RECEIPT_PRE_CONSENT_IDS.finalConfirm,
  RECEIPT_PRE_CONSENT_IDS.tailDate,
  RECEIPT_PRE_CONSENT_IDS.tailSignature,
  RECEIPT_PRE_CONSENT_IDS.closingRecipient,
])

export const RECEIPT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS = {
  paymentStatementBasicInfoValues: {
    paymentPurpose: RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE,
  },
  paymentStatementBasicInfoOnlyPaymentPurposeLocked: true,
  paymentStatementBasicInfoHideResidentFields: true,
  agreementAdminProxyConfirm: true,
  structureLockedAuthoringChoicePreview: true,
  hiddenParagraphIds: new Set([
    ...getReceiptPreConsentAdminProxyHiddenIds(),
    RECEIPT_PRE_CONSENT_IDS.closingRecipient,
  ]),
  agreementSystemParticipantName: '이름예시',
  documentPreviewClassName: RECEIPT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME,
} satisfies RenderFormParagraphBodyOptions
