import type { ProgramExtraSection } from '../model/types'

const HTML_MARKUP_RE = /<\/?[a-z][^>]*>/i

export function isHtmlContent(value: string): boolean {
  return HTML_MARKUP_RE.test(value)
}

/** 평문은 기존 텍스트 렌더. 에디터 HTML만 RichTextViewer로 보낸다. */
export function extraSection(title: string, body: string): ProgramExtraSection {
  if (!isHtmlContent(body)) return { title, body }
  return { title, body, bodyFormat: 'html' }
}
