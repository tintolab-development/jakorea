import type { Editor } from '@/shared/rich-text'
import { useCallback } from 'react'
import { shouldUseNoticesRemoteApi } from '@/features/notices/api/capabilities'
import { uploadNoticeInlineImage } from '@/features/notices/api/upload-notice-attachment'
import { useAdminHtmlEditor, type RichTextContentFormat } from '@/shared/rich-text'

export type NoticeWysiwygEditorOptions = {
  placeholder?: string
  contentFormat?: RichTextContentFormat
  /**
   * 인라인 이미지·YouTube 등 (기본 true — full preset)
   */
  allowInlineMedia?: boolean
}

/**
 * 공지 WYSIWYG — Tiptap headless.
 * remote 응답(HTML)은 contentFormat='html', local mock은 markdown.
 */
export function useNoticeWysiwygEditor(
  open: boolean,
  initialMarkdown: string = '',
  resetKey?: string | number,
  options?: NoticeWysiwygEditorOptions
) {
  const placeholder = options?.placeholder
  const contentFormat = options?.contentFormat ?? 'markdown'
  const allowInlineMedia = options?.allowInlineMedia ?? true
  const resolveImageSrc = useCallback((file: File) => {
    return uploadNoticeInlineImage(file)
  }, [])

  const adminEditor = useAdminHtmlEditor({
    enabled: open,
    initialContent: initialMarkdown,
    contentFormat,
    resetKey,
    placeholder,
    autofocus: false,
    // full: file paste 이미지 / basic: paste 이미지 비활성
    preset: allowInlineMedia ? 'full' : 'basic',
    resolveImageSrc: shouldUseNoticesRemoteApi() ? resolveImageSrc : undefined,
  })

  return {
    ...adminEditor,
    editor: adminEditor.editor as Editor | null,
    contentFormat,
    allowInlineMedia,
    resolveImageSrc: shouldUseNoticesRemoteApi() ? resolveImageSrc : undefined,
  }
}
