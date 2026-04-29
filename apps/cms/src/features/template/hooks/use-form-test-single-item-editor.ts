import { useCallback } from 'react'
import { message } from 'antd'
import {
  createSingleItemPreviewDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { useWritingFormEditorWithUserPreview } from '@/features/template/hooks/use-writing-form-editor-with-user-preview'

/**
 * 양식 테스트 > 단일 항목 모음 — `useWritingFormEditorWithUserPreview`에 테스트용 초안·제목을 주입
 */
export function useFormTestSingleItemEditor(open: boolean) {
  const getInitialDraft = useCallback(() => createSingleItemPreviewDraft(), [])
  const getDefaultActiveParagraphId = useCallback(
    (_draft: WritingFormDraft) => DEFAULT_SURVEY_PARAGRAPH_IDS.title,
    []
  )
  const onSave = useCallback(() => {
    message.success('저장 API 연동 전입니다.')
  }, [])

  return useWritingFormEditorWithUserPreview({
    open,
    getInitialDraft,
    getDefaultActiveParagraphId,
    previewHeaderTitle: '단일 항목 모음',
    editorKind: 'survey',
    onSave,
  })
}
