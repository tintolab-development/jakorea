/**
 * 동의 양식 편집기 상단 「문서 다운로드」 (QA 261113 #15·#71).
 * 미리보기(`TemplatePreviewModal`)의 A4 PDF 다운로드와 같은 페이지 분할·파일명 규칙을 쓴다.
 * 화면 밖 PDF host를 그려 두고, 버튼을 누르면 페이지 DOM을 캡처해 내려받는다.
 */

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  FormEditorKind,
  WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import {
  getA4DocumentTitle,
  getA4PreviewParagraphs,
  type FormDocumentPreviewParagraphGapResolver,
  type FormDocumentPreviewRenderMode,
} from '@/features/template/lib/a4-document-preview'
import {
  AGREEMENT_EXPENSE_A4_PREVIEW_BODY_CLASS_NAME,
  getAgreementExpenseA4DocumentDisplayTitle,
} from '@/features/template/model/agreement-expense-a4-preview'
import { useA4ParagraphPages } from '@/features/template/hooks/use-a4-paragraph-pages'
import { A4DocumentPageLayout } from '@/features/template/ui/layout'
import { FormDocumentPreviewBody } from '@/features/template/ui/document-preview'
import {
  collectFormDocumentPdfPageElements,
  downloadFormDocumentPdfFromPageElements,
} from '@/features/template/lib/generate-form-document-pdf'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { generateFilename } from '@/shared/utils/file-download'
import { handleError } from '@/shared/utils/error-handler'
import '@/features/template/ui/modal/template-preview-modal.css'

/** `[JA Korea] {양식명}_YYMMDD.pdf` — 미리보기 다운로드와 같은 파일명 규칙 */
function safePdfFileName(title: string): string {
  const base = title.trim().replace(/[\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').slice(0, 80) || '양식'
  return generateFilename(base, 'pdf')
}

type UseAgreementDocumentPdfArgs = {
  enabled: boolean
  draft: WritingFormDraft
  headerTitle: string
  a4HiddenParagraphIds?: ReadonlySet<string>
  a4PageBreakBeforeParagraphIds?: ReadonlySet<string>
  a4RenderMode?: FormDocumentPreviewRenderMode
  a4ParagraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  agreementClosingFooter?: { showSubmitButton?: boolean; showRecipient?: boolean }
  /** 기본 동의 양식. 템플릿 관리 신규 설문(시안 12723:137188)은 `survey` */
  editorKind?: Extract<FormEditorKind, 'agreement' | 'survey'>
}

type UseAgreementDocumentPdfResult = {
  download: () => void
  loading: boolean
  /** 화면 밖 측정 레이어 + PDF host — 편집기 트리에 함께 렌더 */
  hostNode: ReactNode
}

export function useAgreementDocumentPdf({
  enabled,
  draft,
  headerTitle,
  a4HiddenParagraphIds,
  a4PageBreakBeforeParagraphIds,
  a4RenderMode = 'card',
  a4ParagraphGapPx,
  paragraphBodyOptions,
  agreementClosingFooter,
  editorKind = 'agreement',
}: UseAgreementDocumentPdfArgs): UseAgreementDocumentPdfResult {
  const { showAlert } = useCmsAlert()
  const hostRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  const previewParagraphs = useMemo(
    () => getA4PreviewParagraphs(draft.paragraphs, a4HiddenParagraphIds),
    [a4HiddenParagraphIds, draft.paragraphs]
  )
  const documentTitle = useMemo(() => {
    if (
      paragraphBodyOptions?.documentPreviewClassName === AGREEMENT_EXPENSE_A4_PREVIEW_BODY_CLASS_NAME
    ) {
      return getAgreementExpenseA4DocumentDisplayTitle(draft, headerTitle)
    }
    return getA4DocumentTitle(draft, headerTitle)
  }, [draft, headerTitle, paragraphBodyOptions?.documentPreviewClassName])

  const { pages, overflowParagraphIds, measureLayer } = useA4ParagraphPages({
    allParagraphs: previewParagraphs,
    titleNumbering: draft.formSettings.titleNumbering,
    editorKind,
    enabled,
    paragraphBodyOptions,
    renderMode: a4RenderMode,
    paragraphGapPx: a4ParagraphGapPx,
    pageBreakBeforeParagraphIds: a4PageBreakBeforeParagraphIds,
  })

  const download = useCallback(() => {
    const root = hostRef.current
    if (root == null || loading) return
    setLoading(true)
    void (async () => {
      try {
        const pageEls = collectFormDocumentPdfPageElements(root)
        await downloadFormDocumentPdfFromPageElements(pageEls, safePdfFileName(documentTitle))
      } catch (error) {
        handleError(error, { context: 'agreementWritingFormShell.pdfDownload' })
        showAlert({
          title: '안내',
          content: 'PDF 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [documentTitle, loading, showAlert])

  const hostNode = enabled ? (
    <>
      {measureLayer}
      <div ref={hostRef} className="template-preview-modal__pdf-host" aria-hidden="true">
        {pages.map((pageParagraphs, pageIndex) => (
          <A4DocumentPageLayout
            key={pageIndex}
            title={documentTitle}
            pageIndex={pageIndex}
            pdfCapture
          >
            <div className="template-preview-modal__pdf-host-page-body">
              <FormDocumentPreviewBody
                paragraphs={pageParagraphs}
                allParagraphs={previewParagraphs}
                titleNumbering={draft.formSettings.titleNumbering}
                editorKind={editorKind}
                overflowParagraphIds={overflowParagraphIds}
                paragraphBodyOptions={paragraphBodyOptions}
                renderMode={a4RenderMode}
                paragraphGapPx={a4ParagraphGapPx}
                agreementClosingFooter={agreementClosingFooter}
              />
            </div>
          </A4DocumentPageLayout>
        ))}
      </div>
    </>
  ) : null

  return { download, loading, hostNode }
}
