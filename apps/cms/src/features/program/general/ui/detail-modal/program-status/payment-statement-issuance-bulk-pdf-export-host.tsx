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
import { createPaymentStatementIssuanceDraft } from '@/features/template/model/payment-statement-issuance-draft'
import {
  getPaymentStatementA4ParagraphGap,
  PAYMENT_STATEMENT_A4_HIDDEN_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-issuance-a4-preview'
import { normalizeWritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { resolvePaymentStatementIssuanceDocumentParagraphBodyOptions } from '@/features/template/ui/form-set/payment-statement-issuance/paragraph-config'
import {
  buildParticipatingInstructorPaymentStatementViewOptions,
  buildPaymentStatementIssuancePreviewFileName,
  PAYMENT_STATEMENT_ISSUANCE_DOCUMENT_TITLE,
  type PaymentStatementIssuancePreviewContext,
} from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import type { LectureReportPdfFile } from '@/features/program/general/lib/download-lecture-reports-bulk-pdf'
import './lecture-report-issuance-preview-modal.css'

export interface PaymentStatementIssuanceBulkPdfExportHostProps {
  context: PaymentStatementIssuancePreviewContext
  onComplete: (result: LectureReportPdfFile | null) => void
}

export function PaymentStatementIssuanceBulkPdfExportHost({
  context,
  onComplete,
}: PaymentStatementIssuanceBulkPdfExportHostProps) {
  const pdfHostRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef(false)

  const draft = useMemo(
    () => normalizeWritingFormDraft(createPaymentStatementIssuanceDraft()),
    []
  )
  const fileName = useMemo(() => buildPaymentStatementIssuancePreviewFileName(context), [context])
  const paragraphBodyOptions = useMemo(
    () =>
      resolvePaymentStatementIssuanceDocumentParagraphBodyOptions(
        buildParticipatingInstructorPaymentStatementViewOptions(
          context.instructor,
          context.settlementRow
        )
      ),
    [context]
  )
  const previewParagraphs = useMemo(
    () => getA4PreviewParagraphs(draft.paragraphs, PAYMENT_STATEMENT_A4_HIDDEN_PARAGRAPH_IDS),
    [draft.paragraphs]
  )
  const documentTitle = useMemo(
    () => getA4DocumentTitle(draft, PAYMENT_STATEMENT_ISSUANCE_DOCUMENT_TITLE),
    [draft]
  )

  const { pages, overflowParagraphIds, measureLayer, pagesReady } = useA4ParagraphPages({
    allParagraphs: previewParagraphs,
    titleNumbering: draft.formSettings.titleNumbering,
    editorKind: 'horizontal_table',
    enabled: true,
    paragraphBodyOptions,
    renderMode: 'contentOnly',
    paragraphGapPx: getPaymentStatementA4ParagraphGap,
  })

  useEffect(() => {
    completedRef.current = false
  }, [context.settlementRow.id])

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
            title={documentTitle}
            pageIndex={pageIndex}
            pdfCapture
          >
            <div style={{ width: '100%', paddingBottom: 16, boxSizing: 'border-box' }}>
              <FormDocumentPreviewBody
                paragraphs={pageParagraphs}
                allParagraphs={previewParagraphs}
                titleNumbering={draft.formSettings.titleNumbering}
                editorKind="horizontal_table"
                overflowParagraphIds={overflowParagraphIds}
                renderMode="contentOnly"
                paragraphBodyOptions={paragraphBodyOptions}
                paragraphGapPx={getPaymentStatementA4ParagraphGap}
              />
            </div>
          </A4DocumentPageLayout>
        ))}
      </div>
    </>
  )
}
