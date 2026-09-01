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
import { AGREEMENT_PORTRAIT_A4_HIDDEN_PARAGRAPH_IDS, getAgreementPortraitA4ParagraphGap } from '@/features/template/model/agreement-portrait-a4-preview'
import {
  buildPortraitConsentDownloadFileName,
  buildPortraitConsentFilledDraft,
  PORTRAIT_CONSENT_DOCUMENT_TITLE,
  type PortraitConsentDownloadContext,
} from '@/features/program/general/lib/build-portrait-consent-download'
import type { LectureReportPdfFile } from '@/features/program/general/lib/download-lecture-reports-bulk-pdf'
import './lecture-report-issuance-preview-modal.css'

export interface PortraitConsentBulkPdfExportHostProps {
  context: PortraitConsentDownloadContext
  onComplete: (result: LectureReportPdfFile | null) => void
}

export function PortraitConsentBulkPdfExportHost({
  context,
  onComplete,
}: PortraitConsentBulkPdfExportHostProps) {
  const pdfHostRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef(false)

  const draft = useMemo(() => buildPortraitConsentFilledDraft(context), [context])
  const fileName = useMemo(() => buildPortraitConsentDownloadFileName(context), [context])
  const previewParagraphs = useMemo(
    () => getA4PreviewParagraphs(draft.paragraphs, AGREEMENT_PORTRAIT_A4_HIDDEN_PARAGRAPH_IDS),
    [draft.paragraphs]
  )
  const documentTitle = useMemo(
    () => getA4DocumentTitle(draft, PORTRAIT_CONSENT_DOCUMENT_TITLE),
    [draft]
  )

  const { pages, overflowParagraphIds, measureLayer, pagesReady } = useA4ParagraphPages({
    allParagraphs: previewParagraphs,
    titleNumbering: draft.formSettings.titleNumbering,
    editorKind: 'agreement',
    enabled: true,
    renderMode: 'contentOnly',
    paragraphGapPx: getAgreementPortraitA4ParagraphGap,
  })

  useEffect(() => {
    completedRef.current = false
  }, [context.student.id])

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
                editorKind="agreement"
                overflowParagraphIds={overflowParagraphIds}
                renderMode="contentOnly"
                paragraphGapPx={getAgreementPortraitA4ParagraphGap}
              />
            </div>
          </A4DocumentPageLayout>
        ))}
      </div>
    </>
  )
}
