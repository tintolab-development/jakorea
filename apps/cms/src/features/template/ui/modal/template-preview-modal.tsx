import { DownloadOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { useCallback, useRef, useState } from 'react'
import type {
  FormEditorKind,
  WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorLeftPane } from '@/features/template/ui/form-editor/form-editor-left-pane'
import { A4DocumentPageLayout } from '@/features/template/ui/layout'
import type {
  FormUpdateParagraph,
  RenderFormParagraphBodyOptions,
} from '@/features/template/ui/paragraph/render-form-paragraph-body'
import { AgreementTemplatePreviewModal } from '@/features/template/ui/modal/agreement-template-preview-modal'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { useA4ParagraphPages } from '@/features/template/hooks/use-a4-paragraph-pages'
import { FormDocumentPreviewBody } from '@/features/template/ui/document-preview'
import {
  collectFormDocumentPdfPageElements,
  downloadFormDocumentPdfFromPageElements,
} from '@/features/template/lib/generate-form-document-pdf'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import './template-preview-modal.css'

export interface TemplatePreviewModalProps {
  open: boolean
  onClose: () => void
  /** 상단 청록 바에 표시할 양식 제목 */
  headerTitle: string
  draft: WritingFormDraft
  updateParagraph: FormUpdateParagraph
  editorKind?: FormEditorKind
  /**
   * 부모 풀페이지 모달 위에 겹침 — Ant Modal 기본 z-index(1000)보다 높게
   * @default 1100
   */
  zIndex?: number
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  /** 지급조서 발급 미리보기 등 — 단락 필수 UI 숨김 */
  hideParagraphRequiredChrome?: boolean
}

function safePdfFileName(title: string): string {
  const base = title.trim().replace(/[^\w가-힣-]+/gu, '_').replace(/_+/g, '_').slice(0, 80) || 'form'
  return `${base}.pdf`
}

/**
 * 작성 화면과 별도로, 응답자(user) 관점 레이아웃으로 단락을 렌더하는 풀페이지 미리보기.
 * 설문 A4: 읽기 전용 문서 표현 + 높이 기준 페이지 분할.
 */
export function TemplatePreviewModal({
  open,
  onClose,
  headerTitle,
  draft,
  updateParagraph,
  editorKind = 'survey',
  zIndex = 1100,
  paragraphBodyOptions,
  hideParagraphRequiredChrome,
}: TemplatePreviewModalProps) {
  const isReportPreviewLayout = editorKind === 'survey'
  const isAgreementPreviewLayout = editorKind === 'agreement'
  const isHorizontalTablePreviewLayout = editorKind === 'horizontal_table'
  const isFormPreviewLayout = isReportPreviewLayout || isAgreementPreviewLayout
  const modalClassName = [
    'template-preview-modal',
    'teal-header-modal--full',
    isFormPreviewLayout ? 'template-preview-modal--form-layout' : '',
    isReportPreviewLayout ? 'template-preview-modal--agreement-layout' : '',
    isReportPreviewLayout ? 'template-preview-modal--survey-layout' : '',
    isHorizontalTablePreviewLayout ? 'template-preview-modal--horizontal-table-layout' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const { pages: pagedParagraphs, overflowParagraphIds, measureLayer } = useA4ParagraphPages({
    allParagraphs: draft.paragraphs,
    titleNumbering: draft.formSettings.titleNumbering,
    editorKind,
    enabled: open && isReportPreviewLayout,
  })

  const pdfHostRef = useRef<HTMLDivElement>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleSurveyPdfDownload = useCallback(async () => {
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

  if (isAgreementPreviewLayout) {
    return (
      <AgreementTemplatePreviewModal
        open={open}
        onClose={onClose}
        headerTitle={headerTitle}
        draft={draft}
        updateParagraph={updateParagraph}
        editorKind={editorKind}
        zIndex={zIndex}
      />
    )
  }

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      className={modalClassName}
      zIndex={zIndex}
    >
      {isReportPreviewLayout ? measureLayer : null}
      <div className="template-preview-modal__shell">
        <header className="template-preview-modal__title-row">
          <div className="template-preview-modal__title-left">
            <span className="template-preview-modal__title-text">{headerTitle}</span>
            <span className="template-preview-modal__badge">미리보기</span>
          </div>
          {isReportPreviewLayout ? (
            <div className="template-preview-modal__title-actions">
              <button
                type="button"
                className="template-preview-modal__pdf-button"
                onClick={() => void handleSurveyPdfDownload()}
                disabled={pdfLoading || pagedParagraphs.length === 0}
              >
                <DownloadOutlined />
                PDF 다운로드
              </button>
            </div>
          ) : null}
        </header>

        <div className="template-preview-modal__body">
          {isReportPreviewLayout ? (
            <div className="template-preview-modal__notice">
              <div className="template-preview-modal__notice-text-wrap">
                <p className="template-preview-modal__notice-text">
                  현재 화면은 미리보기 화면입니다.
                </p>
              </div>
              <button
                type="button"
                className="template-preview-modal__notice-close-btn"
                onClick={onClose}
              >
                미리보기 닫기
              </button>
            </div>
          ) : null}

          <div className={isFormPreviewLayout ? 'template-preview-modal__pages' : 'template-preview-modal__content'}>
            {isReportPreviewLayout ? (
              <div className="template-preview-modal__a4-stage">
                <div ref={pdfHostRef} className="template-preview-modal__a4-stack">
                  {pagedParagraphs.map((pageParagraphs, pageIndex) => (
                    <div key={pageIndex} className="template-preview-modal__a4-frame">
                      <div className="template-preview-modal__a4-scale-inner">
                        <A4DocumentPageLayout
                          title={headerTitle}
                          pageIndex={pageIndex}
                          pdfCapture
                        >
                          <div className="template-preview-modal__a4-text-content">
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
            ) : (
              <FormEditorLeftPane
                paragraphs={draft.paragraphs}
                titleNumbering={draft.formSettings.titleNumbering}
                selectedCardId={null}
                onSelectCard={() => {}}
                onReorderMiddle={() => {}}
                updateParagraph={updateParagraph}
                editorKind={editorKind}
                singleItemListActiveItemId={null}
                paragraphInteractionMode="user"
                showEditorChrome={false}
                paragraphBodyOptions={paragraphBodyOptions}
                hideParagraphRequiredChrome={hideParagraphRequiredChrome}
              />
            )}
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}
