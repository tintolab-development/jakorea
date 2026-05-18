import { useCallback } from 'react'
import {
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS,
  LECTURE_REPORT_SEED_PARAGRAPH_IDS,
  createLectureReportIssuanceDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { useWritingFormEditorWithUserPreview } from '@/features/template/hooks/use-writing-form-editor-with-user-preview'

/**
 * 발급 양식 > 강의보고서 — UJAT 교육일지와 동일 설문 에디터·구조 잠금 패턴
 */
export function useLectureReportIssuanceEditor(active: boolean) {
  const getInitialDraft = useCallback(() => createLectureReportIssuanceDraft(), [])
  const getDefaultActiveParagraphId = useCallback(
    (_draft: WritingFormDraft) => LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.title,
    []
  )
  const onSave = useCallback(() => {
    }, [])

  const base = useWritingFormEditorWithUserPreview({
    open: active,
    getInitialDraft,
    getDefaultActiveParagraphId,
    previewHeaderTitle: '강의보고서',
    editorKind: 'survey',
    onSave,
  })

  return {
    ...base,
    structureLockedParagraphIds: LECTURE_REPORT_SEED_PARAGRAPH_IDS,
  }
}

export type LectureReportIssuanceEditorViewModel = ReturnType<typeof useLectureReportIssuanceEditor>
