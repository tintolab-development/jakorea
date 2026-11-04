import type { Editor } from '@/shared/rich-text'
import { useAdminHtmlEditor, type RichTextContentFormat } from '@/shared/rich-text'

export type RecruitPostingWysiwygEditorOptions = {
  placeholder?: string
  contentFormat?: RichTextContentFormat
  allowInlineMedia?: boolean
}

/**
 * 채용공고 WYSIWYG — 공지 모달과 동일 패턴 (Tiptap).
 * create/update API 전이라 인라인 이미지 업로드는 local data URL 미지원(resolveImageSrc 없음).
 */
export function useRecruitPostingWysiwygEditor(
  open: boolean,
  initialMarkdown: string = '',
  resetKey?: string | number,
  options?: RecruitPostingWysiwygEditorOptions
) {
  const placeholder = options?.placeholder
  const contentFormat = options?.contentFormat ?? 'markdown'
  const allowInlineMedia = options?.allowInlineMedia ?? true

  const adminEditor = useAdminHtmlEditor({
    enabled: open,
    initialContent: initialMarkdown,
    contentFormat,
    resetKey,
    placeholder,
    autofocus: false,
    preset: allowInlineMedia ? 'full' : 'basic',
  })

  return {
    ...adminEditor,
    editor: adminEditor.editor as Editor | null,
    contentFormat,
    allowInlineMedia,
  }
}
