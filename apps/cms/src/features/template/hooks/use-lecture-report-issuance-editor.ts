import { useCallback } from 'react'
import {
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS,
  LECTURE_REPORT_SEED_PARAGRAPH_IDS,
  createLectureReportIssuanceDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { createLectureReportIssuanceA4Preview } from '@/features/template/model/lecture-report-issuance-a4-preview'
import { useWritingFormEditorWithUserPreview } from '@/features/template/hooks/use-writing-form-editor-with-user-preview'

const lectureReportA4Preview = createLectureReportIssuanceA4Preview()

/**
 * 발급 양식 > 강의보고서 — UJAT 교육일지와 동일 설문 에디터·구조 잠금 패턴
 */
export function useLectureReportIssuanceEditor(
  active: boolean,
  templateCode?: string,
  onTemplateDraftSaveConfirmed?: () => void
) {
  const getInitialDraft = useCallback(() => createLectureReportIssuanceDraft(), [])
  const getDefaultActiveParagraphId = useCallback(
    (_draft: WritingFormDraft) => LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.title,
    []
  )

  const base = useWritingFormEditorWithUserPreview({
    open: active,
    getInitialDraft,
    getDefaultActiveParagraphId,
    previewHeaderTitle: '강의보고서',
    editorKind: 'survey',
    previewParagraphBodyOptions: lectureReportA4Preview.paragraphBodyOptions,
    a4PreviewOptions: {
      previewLayout: 'a4-document',
      a4RenderMode: lectureReportA4Preview.a4RenderMode,
      hideParagraphRequiredChrome: false,
      a4HiddenParagraphIds: lectureReportA4Preview.a4HiddenParagraphIds,
      a4PageBreakBeforeParagraphIds: lectureReportA4Preview.a4PageBreakBeforeParagraphIds,
      a4ParagraphGapPx: lectureReportA4Preview.a4ParagraphGapPx,
    },
    templateCode,
    onTemplateDraftSaveConfirmed,
  })

  return {
    ...base,
    structureLockedParagraphIds: LECTURE_REPORT_SEED_PARAGRAPH_IDS,
  }
}

export type LectureReportIssuanceEditorViewModel = ReturnType<typeof useLectureReportIssuanceEditor>
