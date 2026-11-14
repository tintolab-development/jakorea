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

/**
 * 템플릿 관리 작성 화면 전용 — 시안 5767:42072·16046:109928.
 * 대리 확인 2단 카드(회원 대리 동의용) 대신 문구 카드·회색 날짜·서명·「JA KOREA 귀하」 카드를 따로 보인다.
 * 우측 「커스텀 필드」 목록은 그대로 날짜·서명·귀하를 뺀다(`RECEIPT_PRE_CONSENT_TEMPLATE_MANAGEMENT_NAV_HIDDEN_IDS`).
 */
const {
  agreementAdminProxyConfirm: _proxyConfirm,
  hiddenParagraphIds: _proxyHiddenIds,
  ...sheetLayoutBaseOptions
} = RECEIPT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS

export const RECEIPT_PRE_CONSENT_TEMPLATE_MANAGEMENT_PARAGRAPH_BODY_OPTIONS = {
  ...sheetLayoutBaseOptions,
  paymentPreConsentSheetLayout: true,
} satisfies RenderFormParagraphBodyOptions

export const RECEIPT_PRE_CONSENT_TEMPLATE_MANAGEMENT_NAV_HIDDEN_IDS: ReadonlySet<string> =
  RECEIPT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS.hiddenParagraphIds
