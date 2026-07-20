import { useEffect, useMemo, useRef } from 'react'
import { A4DocumentPageLayout } from '@/features/template/ui/layout'
import { FormDocumentPreviewBody } from '@/features/template/ui/document-preview'
import { useA4ParagraphPages } from '@/features/template/hooks/use-a4-paragraph-pages'
import {
  getA4DocumentTitle,
  getA4PreviewParagraphs,
} from '@/features/template/lib/a4-document-preview'
import {
  collectFormDocumentPdfPageElements,
  generateFormDocumentPdfBlobFromPageElements,
} from '@/features/template/lib/generate-form-document-pdf'
import { createLectureReportIssuanceA4Preview } from '@/features/template/model/lecture-report-issuance-a4-preview'
import {
  buildLectureReportFilledDraft,
  buildLectureReportPreviewFileName,
  LECTURE_REPORT_DOCUMENT_TITLE,
  type LectureReportPreviewContext,
} from '@/features/program/general/lib/build-lecture-report-issuance-preview'
import type { LectureReportPdfFile } from '@/features/program/general/lib/download-lecture-reports-bulk-pdf'
import './lecture-report-issuance-preview-modal.css'

export interface LectureReportBulkPdfExportHostProps {
  context: LectureReportPreviewContext
  onComplete: (result: LectureReportPdfFile | null) => void
}

export function LectureReportBulkPdfExportHost({
  context,
  onComplete,
}: LectureReportBulkPdfExportHostProps) {
  const pdfHostRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef(false)

  const draft = useMemo(() => buildLectureReportFilledDraft(context), [context])
  const fileName = useMemo(() => buildLectureReportPreviewFileName(context), [context])
  const a4Preview = useMemo(() => createLectureReportIssuanceA4Preview(), [])
  const previewParagraphs = useMemo(
    () => getA4PreviewParagraphs(draft.paragraphs, a4Preview.a4HiddenParagraphIds),
    [a4Preview.a4HiddenParagraphIds, draft.paragraphs]
  )
  const surveyTitle = useMemo(
    () => getA4DocumentTitle(draft, LECTURE_REPORT_DOCUMENT_TITLE),
    [draft]
  )

  const { pages, overflowParagraphIds, measureLayer, pagesReady } = useA4ParagraphPages({
    allParagraphs: previewParagraphs,
    titleNumbering: draft.formSettings.titleNumbering,
    editorKind: 'survey',
    enabled: true,
    paragraphBodyOptions: a4Preview.paragraphBodyOptions,
    renderMode: a4Preview.a4RenderMode,
    paragraphGapPx: a4Preview.a4ParagraphGapPx,
    pageBreakBeforeParagraphIds: a4Preview.a4PageBreakBeforeParagraphIds,
  })

  useEffect(() => {
    completedRef.current = false
  }, [context.row.id])

  useEffect(() => {
    if (!pagesReady || completedRef.current || pages.length === 0) return

    completedRef.current = true
    let cancelled = false

    void (async () => {
      try {
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve())
          })
        })
        if (cancelled) return

        const root = pdfHostRef.current
        if (root == null) {
          onComplete(null)
          return
        }

        const pageEls = collectFormDocumentPdfPageElements(root)
        const blob = await generateFormDocumentPdfBlobFromPageElements(pageEls)
        if (cancelled) return
        onComplete({ fileName, blob })
      } catch {
        if (!cancelled) {
          onComplete(null)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fileName, onComplete, pages.length, pagesReady])

  return (
    <>
      {measureLayer}
      <div
        ref={pdfHostRef}
        className="lecture-report-issuance-preview-modal__pdf-host"
        aria-hidden="true"
      >
        {pages.map((pageParagraphs, pageIndex) => (
          <A4DocumentPageLayout
            key={pageIndex}
            title={surveyTitle}
            pageIndex={pageIndex}
            pdfCapture
          >
            <div style={{ width: '100%', paddingBottom: 16, boxSizing: 'border-box' }}>
              <FormDocumentPreviewBody
                paragraphs={pageParagraphs}
                allParagraphs={previewParagraphs}
                titleNumbering={draft.formSettings.titleNumbering}
                editorKind="survey"
                overflowParagraphIds={overflowParagraphIds}
                renderMode={a4Preview.a4RenderMode}
                paragraphBodyOptions={a4Preview.paragraphBodyOptions}
                paragraphGapPx={a4Preview.a4ParagraphGapPx}
              />
            </div>
          </A4DocumentPageLayout>
        ))}
      </div>
    </>
  )
}
