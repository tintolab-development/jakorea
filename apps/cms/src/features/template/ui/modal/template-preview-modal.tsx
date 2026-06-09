import { CloseOutlined } from '@ant-design/icons'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type {
  FormEditorKind,
  WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import { A4DocumentPageLayout } from '@/features/template/ui/layout'
import type {
  FormUpdateParagraph,
  RenderFormParagraphBodyOptions,
} from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
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
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
/** 강사 신청 폼 등 `data-paragraph-id` 스코프 스타일(불가 일정 DatePicker 폭 등) — 미리보기 단독 열림에도 적용 */
import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'
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
   * 부모 풀페이지 모달 위에 겹침
   * @default 1300
   */
  zIndex?: number
  previewLayout?: TemplateWritingPreviewLayout
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  /** 지급조서 발급 미리보기 등 — 단락 필수 UI 숨김 */
  hideParagraphRequiredChrome?: boolean
  a4HiddenParagraphIds?: ReadonlySet<string>
  a4PageBreakBeforeParagraphIds?: ReadonlySet<string>
  a4RenderMode?: FormDocumentPreviewRenderMode
  a4ParagraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
  /** 작성 화면에서 선택한 단락 — A4 미리보기 페이지·스크롤·강조와 맞춤 */
  focusedParagraphId?: string | null
  /** 미리보기에서 「양식 수정」 — 템플릿 편집 등 */
  onEditForm?: () => void
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
  zIndex = 1300,
  previewLayout = 'default',
  paragraphBodyOptions,
  hideParagraphRequiredChrome,
  a4HiddenParagraphIds,
  a4PageBreakBeforeParagraphIds,
  a4RenderMode = 'card',
  a4ParagraphGapPx,
  focusedParagraphId = null,
  onEditForm,
}: TemplatePreviewModalProps) {
  const previewBodyRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const isA4DocumentPreviewLayout = previewLayout === 'a4-document'
  const isAgreementPreviewLayout = editorKind === 'agreement'
  const isHorizontalTablePreviewLayout = editorKind === 'horizontal_table'
  const isFormPreviewLayout = isA4DocumentPreviewLayout || isAgreementPreviewLayout
  const isCardUserPreviewLayout = !isA4DocumentPreviewLayout
  const modalClassName = [
    'template-preview-modal',
    'teal-header-modal--full',
    isFormPreviewLayout ? 'template-preview-modal--form-layout' : '',
    isCardUserPreviewLayout ? 'template-preview-modal--card-layout' : '',
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

  const {
    pages: pagedParagraphs,
    overflowParagraphIds,
    measureLayer,
  } = useA4ParagraphPages({
    allParagraphs: previewParagraphs,
    titleNumbering: draft.formSettings.titleNumbering,
    editorKind,
    enabled: open && isA4DocumentPreviewLayout,
    paragraphBodyOptions,
    renderMode: a4RenderMode,
    paragraphGapPx: a4ParagraphGapPx,
    pageBreakBeforeParagraphIds: a4PageBreakBeforeParagraphIds,
  })
  const pageCount = pagedParagraphs.length
  const safeActivePage = Math.min(readPreviewPage(searchParams), Math.max(1, pageCount))
  const safeActivePageIndex = safeActivePage - 1
  const activePageParagraphs = useMemo(
    () => pagedParagraphs[safeActivePageIndex] ?? [],
    [pagedParagraphs, safeActivePageIndex]
  )

  const setPreviewPageParam = (page: number | null) => {
    const next = new URLSearchParams(searchParams)
    if (page == null || page <= 1) {
      next.delete(PREVIEW_PAGE_QUERY_PARAM)
    } else {
      next.set(PREVIEW_PAGE_QUERY_PARAM, String(page))
    }
    setSearchParams(next, { replace: true })
  }

  const focusedPage1Based = useMemo(() => {
    if (focusedParagraphId == null || focusedParagraphId === '') return null
    const idx = pagedParagraphs.findIndex(page => page.some(p => p.id === focusedParagraphId))
    return idx >= 0 ? idx + 1 : null
  }, [focusedParagraphId, pagedParagraphs])

  useEffect(() => {
    if (!open || !isA4DocumentPreviewLayout) return
    if (focusedPage1Based == null) return
    if (focusedPage1Based === safeActivePage) return
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (focusedPage1Based <= 1) {
          next.delete(PREVIEW_PAGE_QUERY_PARAM)
        } else {
          next.set(PREVIEW_PAGE_QUERY_PARAM, String(focusedPage1Based))
        }
        return next
      },
      { replace: true }
    )
  }, [
    open,
    isA4DocumentPreviewLayout,
    focusedParagraphId,
    focusedPage1Based,
    safeActivePage,
    setSearchParams,
  ])

  const focusVisibleOnCurrentPage = useMemo(
    () =>
      focusedParagraphId != null &&
      focusedParagraphId !== '' &&
      activePageParagraphs.some(p => p.id === focusedParagraphId),
    [focusedParagraphId, activePageParagraphs]
  )

  useLayoutEffect(() => {
    if (!open || !isA4DocumentPreviewLayout) return
    if (!focusVisibleOnCurrentPage || focusedParagraphId == null || focusedParagraphId === '')
      return
    const root = previewBodyRef.current
    if (root == null) return
    const el = root.querySelector(`[data-paragraph-id="${CSS.escape(focusedParagraphId)}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [
    open,
    isA4DocumentPreviewLayout,
    focusVisibleOnCurrentPage,
    focusedParagraphId,
    safeActivePage,
  ])

  const handleClose = () => {
    setPreviewPageParam(null)
    onClose()
  }

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), pageCount)
    setPreviewPageParam(nextPage)
  }

  if (isAgreementPreviewLayout && previewLayout !== 'a4-document') {
    return (
      <AgreementTemplatePreviewModal
        open={open}
        onClose={onClose}
        headerTitle={headerTitle}
        draft={draft}
        updateParagraph={updateParagraph}
        editorKind={editorKind}
        zIndex={zIndex}
        focusedParagraphId={focusedParagraphId}
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
          <button
            type="button"
            className="template-preview-modal__title-close"
            onClick={handleClose}
            aria-label="닫기"
          >
            <CloseOutlined />
          </button>
        </header>

        <div ref={previewBodyRef} className="template-preview-modal__body">
          {isA4DocumentPreviewLayout || isCardUserPreviewLayout ? (
            <div className="template-preview-modal__notice-wrap">
              <div className="template-preview-modal__notice">
                <span className="template-preview-modal__notice-text">
                  현재 화면은 미리보기 화면입니다.
                </span>
                <div className="template-preview-modal__notice-actions">
                  <CmsButton
                    type="button"
                    variant="secondary"
                    size="large"
                    width={140}
                    className="template-preview-modal__notice-close-btn"
                    onClick={handleClose}
                  >
                    미리보기 닫기
                  </CmsButton>
                  {onEditForm != null ? (
                    <CmsButton
                      type="button"
                      variant="primary"
                      size="large"
                      width={140}
                      className="template-preview-modal__notice-edit-btn"
                      onClick={onEditForm}
                    >
                      양식 수정
                    </CmsButton>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div
            className={
              isFormPreviewLayout || isCardUserPreviewLayout
                ? 'template-preview-modal__pages'
                : 'template-preview-modal__content'
            }
          >
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
                            focusedParagraphId={focusedParagraphId}
                          />
                        </div>
                      </A4DocumentPageLayout>
                    </div>
                  </div>
                </div>
                <TemplatePreviewPageNavigator
                  currentPage={safeActivePage}
                  totalPages={pageCount}
                  onPageChange={handlePageChange}
                />
              </div>
            ) : (
              <FormEditorLeftPanel
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
          {isCardUserPreviewLayout && !isA4DocumentPreviewLayout ? (
            <div className="template-preview-modal__body-bottom" aria-hidden="true" />
          ) : null}
        </div>
      </div>
    </TealHeaderModal>
  )
}
