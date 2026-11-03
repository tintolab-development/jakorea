import type { Editor } from '@/shared/rich-text'
import { useAdminHtmlEditor, type RichTextContentFormat } from '@/shared/rich-text'

/** 시안 에디터 높이 — 모달 max-height로 수용 (에디터 축소 금지) */
const DEFAULT_EDITOR_HEIGHT = '369px'
const DEFAULT_PLACEHOLDER = '게시글 내용을 입력하세요'

export type RecruitPostingWysiwygEditorOptions = {
  height?: string
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
  const editorMinHeight = options?.height ?? DEFAULT_EDITOR_HEIGHT
  const placeholder = options?.placeholder ?? DEFAULT_PLACEHOLDER
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
    editorMinHeight,
    contentFormat,
    allowInlineMedia,
  }
}
