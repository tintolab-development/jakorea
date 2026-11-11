import { useCallback } from 'react'
import type { Editor } from '@/shared/rich-text'
import { useAdminHtmlEditor, type RichTextContentFormat } from '@/shared/rich-text'
import { uploadRecruitPostingInlineImage } from '../api/upload-posting-attachment'

export type RecruitPostingWysiwygEditorOptions = {
  placeholder?: string
  contentFormat?: RichTextContentFormat
  allowInlineMedia?: boolean
}

/**
 * 채용공고 WYSIWYG — 공지 모달과 동일 패턴 (Tiptap).
 * 본문 이미지는 채용공고 전용 업로드(CAREERS_POSTING_ATTACHMENT) 후 공개 주소로 넣는다 — 서버는 data: 이미지를 거절한다.
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
  const resolveImageSrc = useCallback((file: File) => uploadRecruitPostingInlineImage(file), [])

  const adminEditor = useAdminHtmlEditor({
    enabled: open,
    initialContent: initialMarkdown,
    contentFormat,
    resetKey,
    placeholder,
    autofocus: false,
    preset: allowInlineMedia ? 'full' : 'basic',
    resolveImageSrc: allowInlineMedia ? resolveImageSrc : undefined,
  })

  return {
    ...adminEditor,
    editor: adminEditor.editor as Editor | null,
    contentFormat,
    allowInlineMedia,
    resolveImageSrc,
  }
}
