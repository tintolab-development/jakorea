import { CloseOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildAgreementConsentFillParagraphBodyOptions,
  resolveAgreementConsentFillInteractionMode,
} from '@/features/template/lib/build-agreement-consent-fill-options'
import {
  extractAgreementDraftAuthorName,
  resolveAgreementUserModeAuthorDisplayName,
} from '@/features/template/lib/extract-agreement-draft-author-name'
import { loadWritingFormTemplateDraft } from '@/features/template/lib/writing-form-template-local-save'
import { resolveAgreementWritingFormConfig } from '@/features/template/model/template-registry/agreement-template-config-registry'
import {
  ensureAgreementNoticeConfirmationClosing,
  normalizeWritingFormDraft,
  overlayAgreementNoticeSeedHorizontalTable,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE } from '@/shared/constants/messages'
import {
  applyEducatorFacilitatorPledgeDefaultAgree,
  applyMemberNoticeConsentPrefill,
  applyMemberPortraitConsentPrefill,
  type MemberConsentMemberContext,
} from '@/features/user/shared/lib/build-member-portrait-consent-draft'
import { hasMemberConsentIncompleteRequiredFields } from '@/features/user/shared/lib/validate-member-consent-draft'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import './member-consent-agreement-modal.css'

const MEMBER_CONSENT_MODAL_Z_INDEX = 1200
const PAYMENT_STATEMENT_TEMPLATE_IDS = new Set([
  'agreement-third-party',
  'document-payment-order-pre-consent',
])

export interface MemberConsentAgreementModalProps {
  open: boolean
  templateId: string
  modalTitle: string
  memberContext: MemberConsentMemberContext
  /** 지급조서 사전 동의서 — 등록 폼에 입력된 기본정보 prefill */
  paymentStatementBasicInfoAutofill?: Partial<PaymentStatementBasicInfoAutofillValues>
  onClose: () => void
  onComplete: () => void
}

function resolveSeedDraft(templateId: string): WritingFormDraft | null {
  const config = resolveAgreementWritingFormConfig(templateId)
  if (config == null) return null
  const initialDraft = config.initialDraft
  return typeof initialDraft === 'function' ? initialDraft() : initialDraft
}

export function MemberConsentAgreementModal({
  open,
  templateId,
  modalTitle,
  memberContext,
  paymentStatementBasicInfoAutofill,
  onClose,
  onComplete,
}: MemberConsentAgreementModalProps) {
  const { showAlert } = useCmsAlert()
  const agreementConfig = useMemo(() => resolveAgreementWritingFormConfig(templateId), [templateId])
  const [draft, setDraft] = useState<WritingFormDraft | null>(null)
  const [isDraftLoading, setIsDraftLoading] = useState(false)
  /** 지급조서 기본정보 — draft 밖 로컬 폼 값 */
  const [paymentBasicInfo, setPaymentBasicInfo] =
    useState<Partial<PaymentStatementBasicInfoAutofillValues> | null>(null)

  useEffect(() => {
    if (!open) {
      setDraft(null)
      setIsDraftLoading(false)
      setPaymentBasicInfo(null)
      return
    }

    let cancelled = false
    setIsDraftLoading(true)
    setDraft(null)
    setPaymentBasicInfo(paymentStatementBasicInfoAutofill ?? {})

    void loadWritingFormTemplateDraft(templateId)
      .then(saved => {
        if (cancelled) return
        const seed = saved?.draft ?? resolveSeedDraft(templateId)
        if (seed == null) return
        let next = normalizeWritingFormDraft(seed)
        if (templateId === 'agreement-notice') {
          next = ensureAgreementNoticeConfirmationClosing(next)
          next = overlayAgreementNoticeSeedHorizontalTable(next)
          next = applyMemberNoticeConsentPrefill(next, memberContext)
        }
        if (templateId === 'agreement-portrait') {
          next = applyMemberPortraitConsentPrefill(next, memberContext)
        }
        if (templateId === 'agreement-expense') {
          next = applyEducatorFacilitatorPledgeDefaultAgree(next)
        }
        setDraft(next)
      })
      .finally(() => {
        if (!cancelled) setIsDraftLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [memberContext, open, paymentStatementBasicInfoAutofill, templateId])

  const updateParagraph = useCallback(
    (id: string, updater: (paragraph: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => {
        if (prev == null) return prev
        return {
          ...prev,
          paragraphs: prev.paragraphs.map(paragraph =>
            paragraph.id === id ? updater(paragraph) : paragraph
          ),
        }
      })
    },
    []
  )

  const handleSubmit = useCallback(() => {
    if (draft == null) return
    if (
      hasMemberConsentIncompleteRequiredFields(draft, {
        templateId,
        paymentStatementBasicInfo: paymentBasicInfo ?? undefined,
      })
    ) {
      showAlert({
        title: '안내',
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    onComplete()
  }, [draft, onComplete, paymentBasicInfo, showAlert, templateId])

  const handlePaymentBasicInfoValuesChange = useCallback(
    (values: PaymentStatementBasicInfoAutofillValues) => {
      setPaymentBasicInfo(values)
    },
    []
  )

  const syncedAuthorName = useMemo(() => {
    if (PAYMENT_STATEMENT_TEMPLATE_IDS.has(templateId)) {
      return paymentBasicInfo?.nameKo?.trim() ?? ''
    }
    const fromDraft = extractAgreementDraftAuthorName(templateId, draft)
    if (fromDraft.trim()) return fromDraft
    return memberContext.name?.trim() ?? ''
  }, [draft, memberContext.name, paymentBasicInfo?.nameKo, templateId])

  const authorDisplayName = useMemo(
    () => resolveAgreementUserModeAuthorDisplayName(syncedAuthorName),
    [syncedAuthorName]
  )

  const paragraphBodyOptions = useMemo(
    () =>
      buildAgreementConsentFillParagraphBodyOptions(agreementConfig, {
        templateId,
        participantName: authorDisplayName,
        portraitAffiliationSelectOptions: memberContext.portraitAffiliationSelectOptions,
      }),
    [
      agreementConfig,
      authorDisplayName,
      memberContext.portraitAffiliationSelectOptions,
      templateId,
    ]
  )

  const paragraphBodyOptionsWithAutofill = useMemo(() => {
    if (paragraphBodyOptions == null) return undefined
    if (!PAYMENT_STATEMENT_TEMPLATE_IDS.has(templateId)) return paragraphBodyOptions
    if (paymentStatementBasicInfoAutofill == null) return paragraphBodyOptions
    return {
      ...paragraphBodyOptions,
      paymentStatementBasicInfoValues: {
        ...paragraphBodyOptions.paymentStatementBasicInfoValues,
        ...paymentStatementBasicInfoAutofill,
      },
    }
  }, [paragraphBodyOptions, paymentStatementBasicInfoAutofill, templateId])

  const paragraphBodyOptionsWithPaymentSync = useMemo(() => {
    if (paragraphBodyOptionsWithAutofill == null) return undefined
    if (!PAYMENT_STATEMENT_TEMPLATE_IDS.has(templateId)) return paragraphBodyOptionsWithAutofill
    return {
      ...paragraphBodyOptionsWithAutofill,
      paymentStatementBasicInfoOnValuesChange: handlePaymentBasicInfoValuesChange,
    }
  }, [handlePaymentBasicInfoValuesChange, paragraphBodyOptionsWithAutofill, templateId])

  const paragraphInteractionMode = useMemo(
    () => resolveAgreementConsentFillInteractionMode(templateId),
    [templateId]
  )

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      zIndex={MEMBER_CONSENT_MODAL_Z_INDEX}
      className="full-page-modal member-consent-agreement-modal"
    >
      <div className="full-page-modal__layout">
        <header className="full-page-modal__topbar member-consent-agreement-modal__topbar">
          <div className="full-page-modal__title member-consent-agreement-modal__title-wrap">
            <span className="full-page-modal__title-text">{modalTitle}</span>
          </div>
          <button
            type="button"
            className="full-page-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseOutlined />
          </button>
        </header>

        <div className="full-page-modal__body">
          <div className="full-page-modal__body-header member-consent-agreement-modal__body-header">
            <p className="full-page-modal__description member-consent-agreement-modal__description">
              * 동의서는 관리자가 당사자의 서면 동의 확인 후 작성이 필요합니다.
            </p>
            <div className="full-page-modal__actions member-consent-agreement-modal__actions">
              <CmsButton variant="secondary" size="medium" onClick={onClose}>
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="medium"
                width={140}
                disabled={isDraftLoading || draft == null}
                onClick={handleSubmit}
              >
                작성완료
              </CmsButton>
            </div>
          </div>

          <div className="member-consent-agreement-modal__workspace">
            {isDraftLoading ? (
              <div className="member-consent-agreement-modal__loading">
                <Spin tip="동의서 양식을 불러오는 중입니다." />
              </div>
            ) : draft != null ? (
              <div className="member-consent-agreement-modal__form-panel">
                <FormEditorLeftPanel
                  paragraphs={draft.paragraphs}
                  titleNumbering={draft.formSettings.titleNumbering}
                  selectedCardId={null}
                  onSelectCard={() => {}}
                  onReorderMiddle={() => {}}
                  updateParagraph={updateParagraph}
                  editorKind="agreement"
                  singleItemListActiveItemId={null}
                  paragraphInteractionMode={paragraphInteractionMode}
                  showEditorChrome={false}
                  structureLockedParagraphIds={agreementConfig?.structureLockedParagraphIds}
                  hideDragHandleForParagraphIds={agreementConfig?.hideDragHandleForParagraphIds}
                  hideParagraphRequiredChrome={false}
                  paragraphBodyOptions={paragraphBodyOptionsWithPaymentSync}
                  agreementClosingFooter={{
                    onSubmit: handleSubmit,
                    submitDisabled: isDraftLoading || draft == null,
                  }}
                />
              </div>
            ) : (
              <p className="member-consent-agreement-modal__error">
                동의서 양식을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            )}
          </div>
          <div className="full-page-modal__body-bottom" aria-hidden="true" />
        </div>
      </div>
    </TealHeaderModal>
  )
}
