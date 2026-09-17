/**
 * 모집 정보 수정 시에만 TipTap 마운트 — 조회 모드에서 에디터 생성으로 상세 진입이 멈추는 것을 막는다.
 */

import { useEffect } from 'react'
import { RichTextEditor } from '@/shared/rich-text'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'

export function GeminiRecruitmentAdditionalContentEditor({
  recruitmentId,
  initialMarkdown,
  registerGetMarkdown,
}: {
  recruitmentId: string
  initialMarkdown: string
  registerGetMarkdown: (getMarkdown: () => string) => void
}) {
  const { editor, editorMinHeight, getMarkdown } = useNoticeWysiwygEditor(
    true,
    initialMarkdown,
    `gemini-recruitment-info-edit-${recruitmentId}`,
    {
      placeholder: '내용을 작성하세요',
    }
  )

  useEffect(() => {
    registerGetMarkdown(getMarkdown)
    return () => registerGetMarkdown(() => '')
  }, [getMarkdown, registerGetMarkdown])

  return (
    <div className="notice-register-modal__section notice-register-modal__section--editor gemini-recruitment-info-tab__editor">
      <div className="notice-register-modal__editor-host">
        <RichTextEditor editor={editor} minHeight={editorMinHeight} />
      </div>
    </div>
  )
}
