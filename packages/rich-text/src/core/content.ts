import type { Editor } from '@tiptap/react'
import { marked } from 'marked'
import type { RichTextContentFormat, RichTextEditorContentType } from './types'

export function toEditorContentType(format: RichTextContentFormat): RichTextEditorContentType {
  return format
}

/** Markdown extension 없을 때 뷰어 HTML 폴백 */
export function markdownToHtml(markdown: string): string {
  const trimmed = markdown.trim()
  if (!trimmed) return ''
  return marked.parse(trimmed, { async: false }) as string
}

export function serializeEditorContent(
  editor: Editor,
  format: RichTextContentFormat
): string {
  if (format === 'markdown') {
    const withMarkdown = editor as Editor & { getMarkdown?: () => string }
    if (typeof withMarkdown.getMarkdown === 'function') {
      return withMarkdown.getMarkdown()
    }
  }
  return editor.getHTML()
}

export function getInitialEditorContent(
  content: string,
  format: RichTextContentFormat
): { content: string; contentType: RichTextEditorContentType } {
  if (format === 'html') {
    return { content, contentType: 'html' }
  }
  return { content, contentType: 'markdown' }
}
