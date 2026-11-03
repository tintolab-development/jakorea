import type { Editor } from '@/shared/rich-text'
import { useCallback } from 'react'
import { shouldUseImpactStoriesRemoteApi } from '@/features/impact-stories/api/capabilities'
import { uploadImpactStoryInlineImage } from '@/features/impact-stories/api/upload-story-attachment'
import { useAdminHtmlEditor, type RichTextContentFormat } from '@/shared/rich-text'

const DEFAULT_EDITOR_HEIGHT = '369px'
const DEFAULT_PLACEHOLDER = '게시글 내용을 입력하세요'

export type StoryWysiwygEditorOptions = {
  height?: string
  placeholder?: string
  contentFormat?: RichTextContentFormat
  /**
   * 인라인 이미지·YouTube 등 (기본 true — full preset)
   */
  allowInlineMedia?: boolean
}

/**
 * 임팩트 스토리 WYSIWYG — Tiptap headless.
 * remote 응답(HTML)은 contentFormat='html', local mock은 markdown.
 */
export function useStoryWysiwygEditor(
  open: boolean,
  initialMarkdown: string = '',
  resetKey?: string | number,
  options?: StoryWysiwygEditorOptions
) {
  const editorMinHeight = options?.height ?? DEFAULT_EDITOR_HEIGHT
  const placeholder = options?.placeholder ?? DEFAULT_PLACEHOLDER
  const contentFormat = options?.contentFormat ?? 'markdown'
  const allowInlineMedia = options?.allowInlineMedia ?? true
  const resolveImageSrc = useCallback((file: File) => {
    return uploadImpactStoryInlineImage(file)
  }, [])

  const adminEditor = useAdminHtmlEditor({
    enabled: open,
    initialContent: initialMarkdown,
    contentFormat,
    resetKey,
    placeholder,
    autofocus: false,
    preset: allowInlineMedia ? 'full' : 'basic',
    resolveImageSrc: shouldUseImpactStoriesRemoteApi() ? resolveImageSrc : undefined,
  })

  return {
    ...adminEditor,
    editor: adminEditor.editor as Editor | null,
    editorMinHeight,
    contentFormat,
    allowInlineMedia,
    resolveImageSrc: shouldUseImpactStoriesRemoteApi() ? resolveImageSrc : undefined,
  }
}
