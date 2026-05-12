import { DownloadOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { useCallback, useRef, useState } from 'react'
import type {
  FormEditorKind,
  WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { A4DocumentPageLayout } from '@/features/template/ui/layout'
import { useA4ParagraphPages } from '@/features/template/hooks/use-a4-paragraph-pages'
import { FormDocumentPreviewBody } from '@/features/template/ui/document-preview'
import {
  collectFormDocumentPdfPageElements,
  downloadFormDocumentPdfFromPageElements,
} from '@/features/template/lib/generate-form-document-pdf'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import './agreement-template-preview-modal.css'

export interface AgreementTemplatePreviewModalProps {
  open: boolean
  onClose: () => void
  headerTitle: string
  draft: WritingFormDraft
  updateParagraph: FormUpdateParagraph
  editorKind?: FormEditorKind
  zIndex?: number
}

function safePdfFileName(title: string): string {
  const base = title.trim().replace(/[^\w가-힣-]+/gu, '_').replace(/_+/g, '_').slice(0, 80) || 'form'
  return `${base}.pdf`
}

export function AgreementTemplatePreviewModal({
  open,
  onClose,
  headerTitle,
  draft,
  updateParagraph,
  editorKind = 'agreement',
  zIndex = 1100,
}: AgreementTemplatePreviewModalProps) {
  void updateParagraph
  const { pages, overflowParagraphIds, measureLayer } = useA4ParagraphPages({
    allParagraphs: draft.paragraphs,
    titleNumbering: draft.formSettings.titleNumbering,
    editorKind,
    enabled: open,
  })

  const pdfHostRef = useRef<HTMLDivElement>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handlePdfDownload = useCallback(async () => {
    const root = pdfHostRef.current
    if (root == null) return
    setPdfLoading(true)
    try {
      const pageEls = collectFormDocumentPdfPageElements(root)
      await downloadFormDocumentPdfFromPageElements(pageEls, safePdfFileName(headerTitle))
      message.success('PDF가 저장되었습니다')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'PDF 생성에 실패했습니다'
      message.error(msg)
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
                <path d="M1.75 24.612C1.27283 24.612 0.861875 24.4415 0.517125 24.1004C0.172375 23.7594 0 23.3466 0 22.862C0 22.3848 0.172375 21.9739 0.517125 21.6291C0.861875 21.2844 1.27283 21.112 1.75 21.112H21.5833C22.0605 21.112 22.4715 21.2825 22.8162 21.6236C23.161 21.9646 23.3333 22.3774 23.3333 22.862C23.3333 23.3392 23.161 23.7501 22.8162 24.0949C22.4715 24.4396 22.0605 24.612 21.5833 24.612H1.75ZM4.66667 15.7611H6.10925L15.7926 6.09554L15.059 5.35092L14.3322 4.63517L4.66667 14.3185V15.7611ZM2.91667 16.4564V14.0134C2.91667 13.8728 2.94019 13.739 2.98725 13.6118C3.0345 13.4846 3.11267 13.3664 3.22175 13.2571L15.9947 0.513626C16.1637 0.344654 16.3555 0.216806 16.5702 0.130084C16.7846 0.0433618 17.0063 0 17.2352 0C17.4716 0 17.6964 0.0433618 17.9095 0.130084C18.1226 0.216806 18.3197 0.350682 18.5007 0.531709L19.9028 1.95183C20.0838 2.12081 20.2146 2.31369 20.2953 2.5305C20.3762 2.7475 20.4167 2.97413 20.4167 3.21038C20.4167 3.42738 20.3762 3.64311 20.2953 3.85758C20.2146 4.07225 20.0838 4.2701 19.9028 4.45113L7.15925 17.1946C7.04997 17.3039 6.93185 17.3839 6.80488 17.4347C6.67771 17.4856 6.54383 17.5111 6.40325 17.5111H3.97133C3.67053 17.5111 3.4196 17.4105 3.21854 17.2092C3.01729 17.0082 2.91667 16.7572 2.91667 16.4564ZM15.7926 6.09554L15.059 5.35092L14.3322 4.63517L15.7926 6.09554Z" fill="#3D3D3D"/>
              </svg>
            </span>
          </div>
          <button
            type="button"
            className="agreement-template-preview-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 6L18 18" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className="agreement-template-preview-modal__body">
          <div className="agreement-template-preview-modal__toolbar">
            <p className="agreement-template-preview-modal__notice">
              * 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다.
            </p>
            <div className="agreement-template-preview-modal__actions">
              <button
                type="button"
                className="agreement-template-preview-modal__action-button agreement-template-preview-modal__action-button--download"
                onClick={() => void handlePdfDownload()}
                disabled={pdfLoading || pages.length === 0}
              >
                <DownloadOutlined />
                문서 다운로드
              </button>
              <button
                type="button"
                className="agreement-template-preview-modal__action-button agreement-template-preview-modal__action-button--change"
                disabled
              >
                문서 변경
              </button>
            </div>
          </div>

          <div className="agreement-template-preview-modal__preview-wrapper">
            <div className="agreement-template-preview-modal__a4-stage">
              <div ref={pdfHostRef} className="agreement-template-preview-modal__a4-stack">
                {pages.map((pageParagraphs, pageIndex) => (
                  <div key={pageIndex} className="agreement-template-preview-modal__a4-frame">
                    <div className="agreement-template-preview-modal__a4-scale-inner">
                      <A4DocumentPageLayout
                        title={headerTitle}
                        pageIndex={pageIndex}
                        pdfCapture
                      >
                        <div className="agreement-template-preview-modal__a4-text-content">
                          <FormDocumentPreviewBody
                            paragraphs={pageParagraphs}
                            allParagraphs={draft.paragraphs}
                            titleNumbering={draft.formSettings.titleNumbering}
                            editorKind={editorKind}
                            overflowParagraphIds={overflowParagraphIds}
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
