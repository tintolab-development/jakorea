import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { TemplatePreviewPageNavigator } from '@/features/template/ui/modal/template-preview-page-navigator'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { useA4ParagraphPages } from '@/features/template/hooks/use-a4-paragraph-pages'
import { FormDocumentPreviewBody } from '@/features/template/ui/document-preview'
import type {
  FormDocumentPreviewParagraphGapResolver,
  FormDocumentPreviewRenderMode,
} from '@/features/template/lib/a4-document-preview'
import {
  getA4DocumentTitle,
  getA4PreviewParagraphs,
} from '@/features/template/lib/a4-document-preview'
import type { TemplateWritingPreviewLayout } from '@/features/template/context/template-writing-preview-context'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import './template-preview-modal.css'

const PREVIEW_PAGE_QUERY_PARAM = 'previewPage'

function readPreviewPage(searchParams: URLSearchParams): number {
  const value = Number(searchParams.get(PREVIEW_PAGE_QUERY_PARAM))
  return Number.isInteger(value) && value > 0 ? value : 1
}

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
  previewLayout?: TemplateWritingPreviewLayout
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  /** 지급조서 발급 미리보기 등 — 단락 필수 UI 숨김 */
  hideParagraphRequiredChrome?: boolean
  a4HiddenParagraphIds?: ReadonlySet<string>
  a4RenderMode?: FormDocumentPreviewRenderMode
  a4ParagraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
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
  previewLayout = 'default',
  paragraphBodyOptions,
  hideParagraphRequiredChrome,
  a4HiddenParagraphIds,
  a4RenderMode = 'card',
  a4ParagraphGapPx,
}: TemplatePreviewModalProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const isReportPreviewLayout = editorKind === 'survey'
  const isA4DocumentPreviewLayout = isReportPreviewLayout || previewLayout === 'a4-document'
  const isAgreementPreviewLayout = editorKind === 'agreement'
  const isHorizontalTablePreviewLayout = editorKind === 'horizontal_table'
  const isFormPreviewLayout = isA4DocumentPreviewLayout || isAgreementPreviewLayout
  const modalClassName = [
    'template-preview-modal',
    'teal-header-modal--full',
    isFormPreviewLayout ? 'template-preview-modal--form-layout' : '',
    isA4DocumentPreviewLayout ? 'template-preview-modal--agreement-layout' : '',
    isA4DocumentPreviewLayout ? 'template-preview-modal--survey-layout' : '',
    isHorizontalTablePreviewLayout ? 'template-preview-modal--horizontal-table-layout' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const previewParagraphs = useMemo(
    () => getA4PreviewParagraphs(draft.paragraphs, a4HiddenParagraphIds),
    [a4HiddenParagraphIds, draft.paragraphs]
  )
  const a4DocumentTitle = useMemo(
    () => (isA4DocumentPreviewLayout ? getA4DocumentTitle(draft, headerTitle) : headerTitle),
    [draft, headerTitle, isA4DocumentPreviewLayout]
  )

  const { pages: pagedParagraphs, overflowParagraphIds, measureLayer } = useA4ParagraphPages({
    allParagraphs: previewParagraphs,
    titleNumbering: draft.formSettings.titleNumbering,
    editorKind,
    enabled: open && isA4DocumentPreviewLayout,
    paragraphBodyOptions,
    renderMode: a4RenderMode,
    paragraphGapPx: a4ParagraphGapPx,
  })
  const pageCount = pagedParagraphs.length
  const showPageNavigator = isA4DocumentPreviewLayout && pageCount > 1
  const safeActivePage = Math.min(readPreviewPage(searchParams), Math.max(1, pageCount))
  const safeActivePageIndex = safeActivePage - 1
  const activePageParagraphs = pagedParagraphs[safeActivePageIndex] ?? []

  const setPreviewPageParam = (page: number | null) => {
    const next = new URLSearchParams(searchParams)
    if (page == null || page <= 1) {
      next.delete(PREVIEW_PAGE_QUERY_PARAM)
    } else {
      next.set(PREVIEW_PAGE_QUERY_PARAM, String(page))
    }
    setSearchParams(next, { replace: true })
  }

  const handleClose = () => {
    setPreviewPageParam(null)
    onClose()
  }

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), pageCount)
    setPreviewPageParam(nextPage)
  }

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
      onCancel={handleClose}
      title=""
      size="full"
      hideHeader
      className={modalClassName}
      zIndex={zIndex}
    >
      {isA4DocumentPreviewLayout ? measureLayer : null}
      <div className="template-preview-modal__shell">
        <header className="template-preview-modal__title-row">
          <div className="template-preview-modal__title-left">
            <span className="template-preview-modal__title-text">{headerTitle}</span>
            <span className="template-preview-modal__badge">미리보기</span>
          </div>
        </header>

        <div className="template-preview-modal__body">
          {isA4DocumentPreviewLayout ? (
            <div className="template-preview-modal__notice">
              <div className="template-preview-modal__notice-text-wrap">
                <p className="template-preview-modal__notice-text">
                  현재 화면은 미리보기 화면입니다.
                </p>
              </div>
              <button
                type="button"
                className="template-preview-modal__notice-close-btn"
                onClick={handleClose}
              >
                미리보기 닫기
              </button>
            </div>
          ) : null}

          <div className={isFormPreviewLayout ? 'template-preview-modal__pages' : 'template-preview-modal__content'}>
            {isA4DocumentPreviewLayout ? (
              <div className="template-preview-modal__a4-stage">
                <div className="template-preview-modal__a4-stack">
                  <div key={safeActivePageIndex} className="template-preview-modal__a4-frame">
                    <div className="template-preview-modal__a4-scale-inner">
                      <A4DocumentPageLayout
                        title={a4DocumentTitle}
                        pageIndex={safeActivePageIndex}
                        pdfCapture
                      >
                        <div className="template-preview-modal__a4-text-content">
                          <FormDocumentPreviewBody
                            paragraphs={activePageParagraphs}
                            allParagraphs={previewParagraphs}
                            titleNumbering={draft.formSettings.titleNumbering}
                            editorKind={editorKind}
                            overflowParagraphIds={overflowParagraphIds}
                            paragraphBodyOptions={paragraphBodyOptions}
                            renderMode={a4RenderMode}
                            paragraphGapPx={a4ParagraphGapPx}
                          />
                        </div>
                      </A4DocumentPageLayout>
                    </div>
                  </div>
                </div>
                {showPageNavigator ? (
                  <TemplatePreviewPageNavigator
                    currentPage={safeActivePage}
                    totalPages={pageCount}
                    onPageChange={handlePageChange}
                  />
                ) : null}
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
