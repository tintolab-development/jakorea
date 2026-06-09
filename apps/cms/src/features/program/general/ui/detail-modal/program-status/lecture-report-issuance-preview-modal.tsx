import { useMemo } from 'react'
import { TemplatePreviewModal } from '@/features/template/ui/modal/template-preview-modal'
import {
  buildLectureReportFilledDraft,
  buildLectureReportPreviewFileName,
  LECTURE_REPORT_DOCUMENT_TITLE,
  type LectureReportPreviewContext,
} from '@/features/program/general/lib/build-lecture-report-issuance-preview'

export interface LectureReportIssuancePreviewModalProps {
  open: boolean
  onClose: () => void
  context: LectureReportPreviewContext | null
}

export function LectureReportIssuancePreviewModal({
  open,
  onClose,
  context,
}: LectureReportIssuancePreviewModalProps) {
  const draft = useMemo(
    () => (context != null ? buildLectureReportFilledDraft(context) : null),
    [context]
  )

  const fileName = useMemo(
    () => (context != null ? buildLectureReportPreviewFileName(context) : LECTURE_REPORT_DOCUMENT_TITLE),
    [context]
  )

  if (draft == null) return null

  return (
    <TemplatePreviewModal
      open={open}
      onClose={onClose}
      headerTitle={fileName}
      draft={draft}
      updateParagraph={() => {}}
      editorKind="survey"
      hideParagraphRequiredChrome
      zIndex={1100}
    />
  )
}
