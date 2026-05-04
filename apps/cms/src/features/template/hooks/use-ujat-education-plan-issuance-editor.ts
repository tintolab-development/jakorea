import { useCallback } from 'react'
import { message } from 'antd'
import {
  createUjatEducationPlanIssuanceDraft,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS,
  UJAT_EDUCATION_PLAN_SEED_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { useWritingFormEditorWithUserPreview } from '@/features/template/hooks/use-writing-form-editor-with-user-preview'

/**
 * 발급 양식 > UJAT 교육계획서 — 단락 편집·미리보기(설문 에디터 공통 훅)
 */
export function useUjatEducationPlanIssuanceEditor(active: boolean) {
  const getInitialDraft = useCallback(() => createUjatEducationPlanIssuanceDraft(), [])
  const getDefaultActiveParagraphId = useCallback(
    (_draft: WritingFormDraft) => UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.title,
    []
  )
  const onSave = useCallback(() => {
    message.success('저장 API 연동 전입니다.')
  }, [])

  const base = useWritingFormEditorWithUserPreview({
    open: active,
    getInitialDraft,
    getDefaultActiveParagraphId,
    previewHeaderTitle: 'UJAT 교육계획서',
    editorKind: 'survey',
    onSave,
  })

  return {
    ...base,
    structureLockedParagraphIds: UJAT_EDUCATION_PLAN_SEED_PARAGRAPH_IDS,
  }
}

export type UjatEducationPlanIssuanceEditorViewModel = ReturnType<
  typeof useUjatEducationPlanIssuanceEditor
>
