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

/** 커서가 남긴 문서 끝 빈 문단만 제거. 본문 중간 Enter 빈 줄은 유지. */
const TRAILING_EMPTY_HTML_PARAGRAPH_RE =
  /(?:<p(?:\s[^>]*)?>(?:\s|&nbsp;|&#160;|\u00a0|<br\b[^>]*>)*<\/p>\s*)+$/i

export function stripTrailingEmptyParagraphs(html: string): string {
  return html.replace(TRAILING_EMPTY_HTML_PARAGRAPH_RE, '').trimEnd()
}

/** 끝 빈 문단이 만든 trailing `\n\n` / `&nbsp;`만 제거. 중간 빈 줄은 유지. */
export function stripTrailingEmptyMarkdown(markdown: string): string {
  return markdown.replace(/(?:\n*&nbsp;\s*)+$/g, '').replace(/\n+$/g, '')
}

export function serializeEditorContent(
  editor: Editor,
  format: RichTextContentFormat
): string {
  if (format === 'markdown') {
    const withMarkdown = editor as Editor & { getMarkdown?: () => string }
    if (typeof withMarkdown.getMarkdown === 'function') {
      return stripTrailingEmptyMarkdown(withMarkdown.getMarkdown())
    }
  }
  return stripTrailingEmptyParagraphs(editor.getHTML())
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
