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
  lectureReportPreviewParagraphBodyOptions,
  LECTURE_REPORT_DOCUMENT_TITLE,
  type LectureReportPreviewContext,
} from '@/features/program/general/lib/build-lecture-report-issuance-preview'
import type { LectureReportPdfFile } from '@/features/program/general/lib/download-lecture-reports-bulk-pdf'
import './lecture-report-issuance-preview-modal.css'

/** 보고서 한 건의 페이지 분할 대기 상한 — 사진이 많은 보고서도 측정이 끝나도록 여유를 둔다 */
const LECTURE_REPORT_PDF_PAGES_TIMEOUT_MS = 15_000

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
  const a4Preview = useMemo(() => {
    const base = createLectureReportIssuanceA4Preview()
    return {
      ...base,
      paragraphBodyOptions: {
        ...base.paragraphBodyOptions,
        ...lectureReportPreviewParagraphBodyOptions(context),
      },
    }
  }, [context])
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

  // 페이지 분할이 끝나지 않으면(pagesReady가 계속 false) 완료 신호가 오지 않는다. 프로그램 화면·회원 상세
  // 일괄 다운로드가 이 신호를 기다리므로, 제한 시간 안에 끝나지 않으면 실패로 알려 멈추지 않게 한다.
  useEffect(() => {
    if (pagesReady) return
    const timer = window.setTimeout(() => {
      if (completedRef.current) return
      completedRef.current = true
      onComplete(null)
    }, LECTURE_REPORT_PDF_PAGES_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [context.row.id, onComplete, pagesReady])

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
