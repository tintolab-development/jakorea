import editUrl from '@/shared/assets/icons/gnb/edit.svg'
import { Alert } from 'antd'
import { generateFilename } from '@/shared/utils/file-download'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type {
  FormEditorKind,
  WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import { CmsButton } from '@/shared/ui/cms-button'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { A4DocumentPageLayout } from '@/features/template/ui/layout'
import { useA4ParagraphPages } from '@/features/template/hooks/use-a4-paragraph-pages'
import { FormDocumentPreviewBody } from '@/features/template/ui/document-preview'
import {
  collectFormDocumentPdfPageElements,
  downloadFormDocumentPdfFromPageElements } from '@/features/template/lib/generate-form-document-pdf'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import './agreement-template-preview-modal.css'
import { handleError, unknownErrorText } from '@/shared/utils/error-handler'

export interface AgreementTemplatePreviewModalProps {
  open: boolean
  onClose: () => void
  headerTitle: string
  draft: WritingFormDraft
  updateParagraph: FormUpdateParagraph
  editorKind?: FormEditorKind
  zIndex?: number
  focusedParagraphId?: string | null
}

/** `[JA Korea] {양식명}_YYMMDD.pdf` — 공통 파일명 규칙 */
function safePdfFileName(title: string): string {
  const base = title.trim().replace(/[\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').slice(0, 80) || '양식'
  return generateFilename(base, 'pdf')
}

export function AgreementTemplatePreviewModal({
  open,
  onClose,
  headerTitle,
  draft,
  updateParagraph,
  editorKind = 'agreement',
  zIndex = 1100,
  focusedParagraphId = null }: AgreementTemplatePreviewModalProps) {
  void updateParagraph
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const { pages, overflowParagraphIds, measureLayer } = useA4ParagraphPages({
    allParagraphs: draft.paragraphs,
    titleNumbering: draft.formSettings.titleNumbering,
    editorKind,
    enabled: open })

  const focusInAnyPage = useMemo(
    () =>
      focusedParagraphId != null &&
      focusedParagraphId !== '' &&
      draft.paragraphs.some(p => p.id === focusedParagraphId),
    [focusedParagraphId, draft.paragraphs]
  )

  useLayoutEffect(() => {
    if (!open || !focusInAnyPage || focusedParagraphId == null || focusedParagraphId === '') return
    const root = previewScrollRef.current
    if (root == null) return
    const el = root.querySelector(`[data-paragraph-id="${CSS.escape(focusedParagraphId)}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [open, focusInAnyPage, focusedParagraphId, pages])

  const pdfHostRef = useRef<HTMLDivElement>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const handlePdfDownload = useCallback(async () => {
    const root = pdfHostRef.current
    if (root == null) return
    setPdfLoading(true)
    setPdfError(null)
    try {
      const pageEls = collectFormDocumentPdfPageElements(root)
      await downloadFormDocumentPdfFromPageElements(pageEls, safePdfFileName(headerTitle))
    } catch (e) {
      handleError(e, { context: 'agreementTemplatePreviewModal.pdfDownload' })
      setPdfError(unknownErrorText(e, 'PDF 생성에 실패했습니다'))
    } finally {
      setPdfLoading(false)
    }
  }, [headerTitle])

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      className="agreement-template-preview-modal teal-header-modal--full"
      zIndex={zIndex}
    >
      {measureLayer}
      <div className="agreement-template-preview-modal__shell">
        <header className="agreement-template-preview-modal__header">
          <div className="agreement-template-preview-modal__title-wrap">
            <h2 className="agreement-template-preview-modal__title">{headerTitle}</h2>
            <span className="agreement-template-preview-modal__title-pen" aria-hidden="true">
              <img src={editUrl} width={28} height={28} alt="" draggable={false} />
            </span>
          </div>
          <button
            type="button"
            className="agreement-template-preview-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M18 6L6 18"
                stroke="#3D3D3D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="#3D3D3D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        <div ref={previewScrollRef} className="agreement-template-preview-modal__body">
          <div className="agreement-template-preview-modal__toolbar">
            {pdfError ? <Alert type="error" description={pdfError} showIcon /> : null}
            <div className="agreement-template-preview-modal__actions">
              <CmsButton
                type="button"
                variant="secondary"
                size="large"
                icon={<ButtonDownloadIcon />}
                adminAction="download"
                onClick={() => void handlePdfDownload()}
                loading={pdfLoading}
                disabled={pdfLoading || pages.length === 0} >
                문서 다운로드
              </CmsButton>
              <CmsButton
                type="button"
                variant="primary"
                size="large"
                disabled >
                문서 변경
              </CmsButton>
            </div>
          </div>

          <div className="agreement-template-preview-modal__preview-wrapper">
            <div className="agreement-template-preview-modal__a4-stage">
              <div ref={pdfHostRef} className="agreement-template-preview-modal__a4-stack">
                {pages.map((pageParagraphs, pageIndex) => (
                  <div key={pageIndex} className="agreement-template-preview-modal__a4-frame">
                    <div className="agreement-template-preview-modal__a4-scale-inner">
                      <A4DocumentPageLayout title={headerTitle} pageIndex={pageIndex} pdfCapture>
                        <div className="agreement-template-preview-modal__a4-text-content">
                          <FormDocumentPreviewBody
                            paragraphs={pageParagraphs}
                            allParagraphs={draft.paragraphs}
                            titleNumbering={draft.formSettings.titleNumbering}
                            editorKind={editorKind}
                            overflowParagraphIds={overflowParagraphIds}
                            focusedParagraphId={focusedParagraphId}
                          />
                        </div>
                      </A4DocumentPageLayout>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}
