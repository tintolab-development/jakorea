/**
 * 모집 상세 리치 텍스트 — 수정 중에만 TipTap을 마운트한다.
 * memo: 형제 필드 타이핑으로 부모가 리렌더돼도 에디터를 다시 그리지 않는다.
 * 본문은 키 입력마다 state에 올리지 않고, 저장·미리보기 때 getHTML로 읽는다.
 */

import { memo, useEffect } from 'react'
import { RichTextEditor } from '@/shared/rich-text'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import {
  programInlineImageOwner,
  type AdminFileUploadOwner,
} from '@/shared/lib/admin-file-upload'
import type {
  GeminiRecruitmentRichTextGetter,
  GeminiRecruitmentRichTextKey,
} from '../../lib/recruitment/add-form-options'

const EDITOR_HEIGHT = '200px'

export const GeminiRecruitmentRichTextEditor = memo(function GeminiRecruitmentRichTextEditor({
  fieldKey,
  resetKey,
  initialContent,
  placeholder,
  registerGetHtml,
  onEdit,
  fileUploadOwner,
}: {
  fieldKey: GeminiRecruitmentRichTextKey
  resetKey: string
  initialContent: string
  placeholder: string
  registerGetHtml: (
    key: GeminiRecruitmentRichTextKey,
    getter: GeminiRecruitmentRichTextGetter | null
  ) => void
  onEdit?: () => void
  fileUploadOwner?: AdminFileUploadOwner | null
}) {
  const inlineImageOwner = fileUploadOwner ?? programInlineImageOwner(null)
  const { editor, getHTML } = useNoticeWysiwygEditor(true, initialContent, resetKey, {
    placeholder,
    contentFormat: 'html',
    height: EDITOR_HEIGHT,
    fileUploadOwner: inlineImageOwner,
  })

  useEffect(() => {
    registerGetHtml(fieldKey, getHTML)
    return () => registerGetHtml(fieldKey, null)
  }, [fieldKey, getHTML, registerGetHtml])

  useEffect(() => {
    if (editor == null || onEdit == null) return
    const handleUpdate = () => onEdit()
    editor.on('update', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor, onEdit])

  return (
    <div className="gemini-recruitment-detail-editor">
      <div className="notice-register-modal__editor-host">
        <RichTextEditor
          editor={editor}
          minHeight={EDITOR_HEIGHT}
          fileUploadOwner={inlineImageOwner}
        />
      </div>
    </div>
  )
})
