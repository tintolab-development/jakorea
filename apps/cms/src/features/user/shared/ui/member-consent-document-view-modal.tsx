import { CloseOutlined, DownloadOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import crimeConsentDefaultImage from '@/assets/images/template/성범좌 경력 조회.png'
import {
  AGREEMENT_CRIME_TEMPLATE_CODE,
  parseAgreementCrimeConsentSettings,
} from '@/features/template/lib/agreement-crime-consent-settings'
import { loadWritingFormTemplateDraft } from '@/features/template/lib/writing-form-template-local-save'
import {
  ensureAgreementNoticeConfirmationClosing,
  normalizeWritingFormDraft,
  overlayAgreementNoticeSeedHorizontalTable,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { resolveAgreementWritingFormConfig } from '@/features/template/model/template-registry/agreement-template-config-registry'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { downloadBlob } from '@/shared/utils/file-download'
import { useFormResponseDraftQuery } from '@/features/user/api/hooks/use-form-response-draft-query'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import '@/features/template/ui/template-management/crime-record-consent-document-fullpage-modal.css'
import './member-consent-agreement-modal.css'
import './member-consent-document-view-modal.css'

const MEMBER_CONSENT_VIEW_MODAL_Z_INDEX = 1200
const DEFAULT_CRIME_DOWNLOAD_FILENAME = '성범죄_경력조회_동의서.png'
const NO_SUBMITTED_CONSENT_MESSAGE = '제출된 동의서를 불러올 수 없습니다.'
const SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE =
  '제출된 동의서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'

export interface MemberConsentDocumentViewModalProps {
  open: boolean
  templateId: string
  modalTitle: string
  /** 제출된 동의서 formResponse ID — API 연동 후 draft 로드에 사용 */
  formResponseId?: number
  onClose: () => void
}

function MemberConsentCrimeDocumentView({
  open,
  modalTitle,
  onClose,
}: {
  open: boolean
  modalTitle: string
  onClose: () => void
}) {
  const [displaySrc, setDisplaySrc] = useState<string>(crimeConsentDefaultImage)

  useEffect(() => {
    if (!open) {
      setDisplaySrc(crimeConsentDefaultImage)
      return
    }

    let cancelled = false
    void loadWritingFormTemplateDraft(AGREEMENT_CRIME_TEMPLATE_CODE).then(saved => {
      if (cancelled) return
      const settings = parseAgreementCrimeConsentSettings(saved?.settingsJson)
      setDisplaySrc(settings.documentImageUrl ?? crimeConsentDefaultImage)
    })

    return () => {
      cancelled = true
    }
  }, [open])

  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(displaySrc)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      downloadBlob(blob, DEFAULT_CRIME_DOWNLOAD_FILENAME)
    } catch (error) {
      console.debug('memberConsentCrimeView download failed', error)
    }
  }, [displaySrc])

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title={modalTitle}
      size="full"
      hideHeader
      zIndex={MEMBER_CONSENT_VIEW_MODAL_Z_INDEX}
      className="crime-consent-doc-modal member-consent-document-view-modal"
    >
      <div className="crime-consent-doc-modal__layout">
        <header className="crime-consent-doc-modal__topbar">
          <div className="crime-consent-doc-modal__title-row">
            <span className="crime-consent-doc-modal__title-text">{modalTitle}</span>
          </div>
          <button
            type="button"
            className="crime-consent-doc-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseOutlined />
          </button>
        </header>

        <div className="crime-consent-doc-modal__body">
          <div className="crime-consent-doc-modal__toolbar member-consent-document-view-modal__toolbar">
            <div className="crime-consent-doc-modal__actions member-consent-document-view-modal__actions">
              <CmsButton variant="secondary" size="medium" onClick={onClose}>
                닫기
              </CmsButton>
              <CmsButton
                variant="secondary"
                icon={<DownloadOutlined />}
                onClick={() => void handleDownload()}
                className="crime-consent-doc-modal__download-btn"
              >
                문서 다운로드
              </CmsButton>
            </div>
          </div>

          <div className="crime-consent-doc-modal__a4-outer">
            <img
              className="crime-consent-doc-modal__a4-img"
              src={displaySrc}
              alt={modalTitle}
              width={1146}
              height={1618}
            />
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}

function MemberConsentAgreementDocumentView({
  open,
  templateId,
  modalTitle,
  formResponseId,
  onClose,
}: MemberConsentDocumentViewModalProps) {
  const agreementConfig = useMemo(() => resolveAgreementWritingFormConfig(templateId), [templateId])
  const { draft: submittedDraft, isLoading: isSubmittedDraftLoading, isUnavailable } =
    useFormResponseDraftQuery(formResponseId)

  const paragraphBodyOptions = useMemo(() => {
    const base = agreementConfig?.paragraphBodyOptions
    if (base == null) {
      return { paragraphInteractionMode: 'preview' as const }
    }
    return {
      ...base,
      paragraphInteractionMode: 'preview' as const,
    }
  }, [agreementConfig?.paragraphBodyOptions])

  const displayDraft = useMemo((): WritingFormDraft | null => {
    if (submittedDraft == null) return null
    let next = normalizeWritingFormDraft(submittedDraft)
    if (templateId === 'agreement-notice') {
      next = ensureAgreementNoticeConfirmationClosing(next)
      next = overlayAgreementNoticeSeedHorizontalTable(next)
    }
    return next
  }, [submittedDraft, templateId])

  const emptyMessage =
    formResponseId == null ? NO_SUBMITTED_CONSENT_MESSAGE : SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE
  const showEmpty = formResponseId == null || isUnavailable
  const showLoading = formResponseId != null && isSubmittedDraftLoading

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      zIndex={MEMBER_CONSENT_VIEW_MODAL_Z_INDEX}
      className="full-page-modal member-consent-agreement-modal member-consent-document-view-modal"
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
          <div className="full-page-modal__body-header member-consent-agreement-modal__body-header member-consent-document-view-modal__body-header">
            <div className="full-page-modal__actions member-consent-agreement-modal__actions">
              <CmsButton variant="secondary" size="medium" onClick={onClose}>
                닫기
              </CmsButton>
            </div>
          </div>

          <div className="member-consent-agreement-modal__workspace">
            {showLoading ? (
              <div className="member-consent-agreement-modal__loading">
                <Spin tip="동의서를 불러오는 중입니다." />
              </div>
            ) : showEmpty ? (
              <p className="member-consent-agreement-modal__error">{emptyMessage}</p>
            ) : displayDraft != null ? (
              <div className="member-consent-agreement-modal__form-panel form-editor-left--paragraph-body-preview">
                <FormEditorLeftPanel
                  paragraphs={displayDraft.paragraphs}
                  titleNumbering={displayDraft.formSettings.titleNumbering}
                  selectedCardId={null}
                  onSelectCard={() => {}}
                  onReorderMiddle={() => {}}
                  updateParagraph={() => {}}
                  editorKind="agreement"
                  singleItemListActiveItemId={null}
                  paragraphInteractionMode="preview"
                  showEditorChrome={false}
                  structureLockedParagraphIds={agreementConfig?.structureLockedParagraphIds}
                  hideDragHandleForParagraphIds={agreementConfig?.hideDragHandleForParagraphIds}
                  hideParagraphRequiredChrome
                  paragraphBodyOptions={paragraphBodyOptions}
                />
              </div>
            ) : (
              <p className="member-consent-agreement-modal__error">{emptyMessage}</p>
            )}
          </div>
          <div className="full-page-modal__body-bottom" aria-hidden="true" />
        </div>
      </div>
    </TealHeaderModal>
  )
}

export function MemberConsentDocumentViewModal({
  open,
  templateId,
  modalTitle,
  formResponseId,
  onClose,
}: MemberConsentDocumentViewModalProps) {
  if (templateId === AGREEMENT_CRIME_TEMPLATE_CODE) {
    return (
      <MemberConsentCrimeDocumentView open={open} modalTitle={modalTitle} onClose={onClose} />
    )
  }

  return (
    <MemberConsentAgreementDocumentView
      open={open}
      templateId={templateId}
      modalTitle={modalTitle}
      formResponseId={formResponseId}
      onClose={onClose}
    />
  )
}
