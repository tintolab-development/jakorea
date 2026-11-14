import {
  AGREEMENT_NOTICE_HIDDEN_DRAG_HANDLE_IDS,
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_HIDDEN_DRAG_HANDLE_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS,
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createDefaultDirectAgreementDraft,
  createEducatorFacilitatorPledgeDraft,
  DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_HIDDEN_DRAG_HANDLE_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_SEED_PARAGRAPH_IDS,
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
  AGREEMENT_EXPENSE_A4_HIDDEN_PARAGRAPH_IDS,
  getAgreementExpenseA4ParagraphGap,
} from '@/features/template/model/agreement-expense-a4-preview'
import {
  createPaymentStatementPreConsentDraft,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-pre-consent-draft'
import {
  getPaymentStatementPreConsentA4ParagraphGap,
  PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-pre-consent-a4-preview'
import {
  createReceiptPreConsentDraft,
  RECEIPT_PRE_CONSENT_IDS,
  RECEIPT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/receipt-pre-consent-draft'
import {
  getReceiptPreConsentA4ParagraphGap,
  RECEIPT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS,
  RECEIPT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS,
} from '@/features/template/model/receipt-pre-consent-a4-preview'
import {
  RECEIPT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS,
  RECEIPT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS,
  RECEIPT_PRE_CONSENT_TEMPLATE_MANAGEMENT_NAV_HIDDEN_IDS,
  RECEIPT_PRE_CONSENT_TEMPLATE_MANAGEMENT_PARAGRAPH_BODY_OPTIONS,
} from '@/features/template/ui/form-set/receipt-pre-consent/paragraph-config'
import {
  PAYMENT_STATEMENT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS,
  PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_MANAGEMENT_NAV_HIDDEN_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_MANAGEMENT_PARAGRAPH_BODY_OPTIONS,
} from '@/features/template/ui/form-set/payment-statement-pre-consent/paragraph-config'
import { AGREEMENT_PORTRAIT_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/agreement-portrait/paragraph-config'
import { AGREEMENT_NOTICE_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/agreement-notice/paragraph-config'
import { EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/agreement-expense/paragraph-config'
import type { AgreementWritingFormShellProps } from '@/features/template/ui/form-set/editors/new-agreement-form'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import { AGREEMENT_MODAL_DESCRIPTION, DIRECT_AGREEMENT_MODAL_DESCRIPTION } from './template-registry'
import { DIRECT_AGREEMENT_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/agreement-direct/paragraph-config'

export type AgreementTemplateConfigKey =
  | 'agreement-expense'
  | 'agreement-notice'
  | 'agreement-portrait'
  | 'agreement-third-party'
  | 'agreement-receipt-pre-consent'

export type AgreementWritingFormConfig = Omit<AgreementWritingFormShellProps, 'onClose'> & {
  /**
   * 템플릿 관리 작성 화면(`stripAgreementWritingFormStructureLocks`)에서만 덮어쓸 값.
   * 회원 대리 동의 fill 등 카탈로그 원본(`resolveAgreementWritingFormConfig`) 사용처에는 적용하지 않는다.
   */
  templateManagement?: Pick<
    AgreementWritingFormShellProps,
    'paragraphBodyOptions' | 'navHiddenParagraphIds' | 'agreementClosingFooter'
  >
}

function resolveRowTitle(templateId: string, fallback: string): string {
  return findWritingTemplateRowByDefinitionId(templateId)?.templateName ?? fallback
}

export const AGREEMENT_TEMPLATE_CONFIG_REGISTRY: Record<
  AgreementTemplateConfigKey,
  () => AgreementWritingFormConfig
> = {
  'agreement-expense': () => {
    const title = resolveRowTitle('agreement-expense', 'JA Korea 교육진행자 서약서')
    return {
      initialDraft: createEducatorFacilitatorPledgeDraft,
      defaultActiveParagraphId: EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title,
      modalTitle: title,
      modalDescription: AGREEMENT_MODAL_DESCRIPTION,
      writingPreviewHeaderTitle: title,
      structureLockedParagraphIds: EDUCATOR_FACILITATOR_PLEDGE_SEED_PARAGRAPH_IDS,
      hideDragHandleForParagraphIds: EDUCATOR_FACILITATOR_PLEDGE_HIDDEN_DRAG_HANDLE_IDS,
      /** 템플릿 관리 — 시스템 동의 양식은 단락·항목 추가·삭제·이동 불가, 문구만 수정 (QA 261113 #16) */
      authoringStructureControlLockedParagraphIds: EDUCATOR_FACILITATOR_PLEDGE_SEED_PARAGRAPH_IDS,
      previewLayout: 'a4-document',
      a4HiddenParagraphIds: AGREEMENT_EXPENSE_A4_HIDDEN_PARAGRAPH_IDS,
      a4RenderMode: 'contentOnly',
      a4ParagraphGapPx: getAgreementExpenseA4ParagraphGap,
      paragraphBodyOptions: EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_BODY_OPTIONS,
      /** 시안: JA KOREA 귀하·작성완료 없음 */
      agreementClosingFooter: { showSubmitButton: false, showRecipient: false },
    }
  },
  'agreement-notice': () => {
    const title = resolveRowTitle('agreement-notice', '행정정보 공동이용 사전동의서')
    return {
      initialDraft: createAgreementNoticeDraft,
      defaultActiveParagraphId: AGREEMENT_NOTICE_PARAGRAPH_IDS.title,
      modalTitle: title,
      modalDescription: AGREEMENT_MODAL_DESCRIPTION,
      writingPreviewHeaderTitle: title,
      structureLockedParagraphIds: AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS,
      hideDragHandleForParagraphIds: AGREEMENT_NOTICE_HIDDEN_DRAG_HANDLE_IDS,
      /** 템플릿 관리 — 시스템 동의 양식은 단락·항목 추가·삭제·이동 불가, 문구만 수정 (QA 261113 #16) */
      authoringStructureControlLockedParagraphIds: AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS,
      previewLayout: 'a4-document',
      a4HiddenParagraphIds: AGREEMENT_NOTICE_A4_HIDDEN_PARAGRAPH_IDS,
      a4RenderMode: 'contentOnly',
      a4ParagraphGapPx: getAgreementNoticeA4ParagraphGap,
      paragraphBodyOptions: AGREEMENT_NOTICE_PARAGRAPH_BODY_OPTIONS,
      agreementClosingFooter: { showSubmitButton: false, showRecipient: false },
    }
  },
  'agreement-portrait': () => {
    const title = resolveRowTitle('agreement-portrait', '초상권 수집·이용 동의서')
    return {
      initialDraft: createAgreementPortraitDraft,
      defaultActiveParagraphId: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title,
      modalTitle: title,
      modalDescription: AGREEMENT_MODAL_DESCRIPTION,
      writingPreviewHeaderTitle: title,
      structureLockedParagraphIds: AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS,
      hideDragHandleForParagraphIds: AGREEMENT_PORTRAIT_HIDDEN_DRAG_HANDLE_IDS,
      /** 템플릿 관리 — 시스템 동의 양식은 단락·항목 추가·삭제·이동 불가, 문구만 수정 (QA 261113 #16) */
      authoringStructureControlLockedParagraphIds: AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS,
      previewLayout: 'a4-document',
      a4HiddenParagraphIds: AGREEMENT_PORTRAIT_A4_HIDDEN_PARAGRAPH_IDS,
      a4RenderMode: 'contentOnly',
      a4ParagraphGapPx: getAgreementPortraitA4ParagraphGap,
      paragraphBodyOptions: AGREEMENT_PORTRAIT_PARAGRAPH_BODY_OPTIONS,
      agreementClosingFooter: { showSubmitButton: false, showRecipient: false },
    }
  },
  'agreement-third-party': () => {
    const title = resolveRowTitle('agreement-third-party', '지급조서 사전 동의서')
    return {
      initialDraft: createPaymentStatementPreConsentDraft,
      defaultActiveParagraphId: PAYMENT_STATEMENT_PRE_CONSENT_IDS.title,
      modalTitle: title,
      modalDescription: AGREEMENT_MODAL_DESCRIPTION,
      writingPreviewHeaderTitle: title,
      structureLockedParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
      hideDragHandleForParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS,
      /** 템플릿 관리 — 시스템 동의 양식은 단락·항목 추가·삭제·이동 불가, 문구만 수정 (QA 261113 #16) */
      authoringStructureControlLockedParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
      previewLayout: 'a4-document',
      a4HiddenParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS,
      a4PageBreakBeforeParagraphIds:
        PAYMENT_STATEMENT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS,
      a4RenderMode: 'contentOnly',
      a4ParagraphGapPx: getPaymentStatementPreConsentA4ParagraphGap,
      paragraphBodyOptions: PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS,
      /** 시안: 귀하만 (작성완료는 회원 fill) */
      agreementClosingFooter: { showSubmitButton: false, showRecipient: true },
      /** 템플릿 관리 시안 5767:42072 — 문구 카드·회색 날짜·서명·「JA KOREA 귀하」 카드를 따로 보인다 */
      templateManagement: {
        paragraphBodyOptions: PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_MANAGEMENT_PARAGRAPH_BODY_OPTIONS,
        navHiddenParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_MANAGEMENT_NAV_HIDDEN_IDS,
        agreementClosingFooter: { showSubmitButton: false, showRecipient: false },
      },
    }
  },
  'agreement-receipt-pre-consent': () => {
    const title = resolveRowTitle('agreement-receipt-pre-consent', '영수증 사전 동의서')
    return {
      initialDraft: createReceiptPreConsentDraft,
      defaultActiveParagraphId: RECEIPT_PRE_CONSENT_IDS.title,
      modalTitle: title,
      modalDescription: AGREEMENT_MODAL_DESCRIPTION,
      writingPreviewHeaderTitle: title,
      structureLockedParagraphIds: RECEIPT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
      hideDragHandleForParagraphIds: RECEIPT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS,
      /** 템플릿 관리 잠금 해제 후에도 유지 — 영수증은 항목(단락·표 행/열) 추가·삭제·이동 불가, 문구만 수정(0647) */
      authoringStructureControlLockedParagraphIds: RECEIPT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
      previewLayout: 'a4-document',
      a4HiddenParagraphIds: RECEIPT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS,
      a4PageBreakBeforeParagraphIds: RECEIPT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS,
      a4RenderMode: 'contentOnly',
      a4ParagraphGapPx: getReceiptPreConsentA4ParagraphGap,
      paragraphBodyOptions: RECEIPT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS,
      agreementClosingFooter: { showSubmitButton: false, showRecipient: true },
      /** 템플릿 관리 시안 16046:109928 — 문구 카드·회색 날짜·서명·「JA KOREA 귀하」 카드를 따로 보인다 */
      templateManagement: {
        paragraphBodyOptions: RECEIPT_PRE_CONSENT_TEMPLATE_MANAGEMENT_PARAGRAPH_BODY_OPTIONS,
        navHiddenParagraphIds: RECEIPT_PRE_CONSENT_TEMPLATE_MANAGEMENT_NAV_HIDDEN_IDS,
        agreementClosingFooter: { showSubmitButton: false, showRecipient: false },
      },
    }
  },
}

/**
 * 템플릿 관리 authoring — 시스템 생성 동의 양식도 단락 본문 입력을 연다.
 * 회원 fill은 `resolveAgreementWritingFormConfig`의 카탈로그 잠금을 그대로 쓴다.
 */
export function stripAgreementWritingFormStructureLocks(
  config: AgreementWritingFormConfig
): AgreementWritingFormConfig {
  const {
    structureLockedParagraphIds: _structureLockedParagraphIds,
    hideDragHandleForParagraphIds: _hideDragHandleForParagraphIds,
    templateManagement,
    paragraphBodyOptions: catalogParagraphBodyOptions,
    ...rest
  } = config
  const { paragraphBodyOptions: templateManagementBodyOptions, ...templateManagementRest } =
    templateManagement ?? {}
  const editable = { ...rest, ...templateManagementRest }
  const paragraphBodyOptions = templateManagementBodyOptions ?? catalogParagraphBodyOptions
  if (paragraphBodyOptions == null) return editable
  const {
    structureLockedAuthoringChoicePreview: _choicePreview,
    ...keptBodyOptions
  } = paragraphBodyOptions
  return { ...editable, paragraphBodyOptions: keptBodyOptions }
}

export function resolveAgreementWritingFormConfig(
  templateId: string | undefined | null
): AgreementWritingFormConfig | null {
  if (templateId == null || templateId.trim() === '') return null
  const code = templateId.trim()
  const direct = AGREEMENT_TEMPLATE_CONFIG_REGISTRY[code as AgreementTemplateConfigKey]
  if (direct != null) return direct()

  const copyMatch = code.match(/^(.*)-copy(?:-\d+)?$/i)
  const baseKey = copyMatch?.[1] as AgreementTemplateConfigKey | undefined
  if (baseKey == null) return null
  const factory = AGREEMENT_TEMPLATE_CONFIG_REGISTRY[baseKey]
  return factory != null ? stripAgreementWritingFormStructureLocks(factory()) : null
}

/** 직접 등록·사용자 생성 동의 양식 — 카탈로그 키 없는 templateCode용 */
export function createDirectAgreementWritingFormConfig(
  modalTitle = '동의 양식 신규 폼'
): AgreementWritingFormConfig {
  return {
    initialDraft: createDefaultDirectAgreementDraft,
    defaultActiveParagraphId: DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.title,
    modalTitle,
    modalDescription: DIRECT_AGREEMENT_MODAL_DESCRIPTION,
    writingPreviewHeaderTitle: modalTitle,
    paragraphBodyOptions: DIRECT_AGREEMENT_PARAGRAPH_BODY_OPTIONS,
  }
}
