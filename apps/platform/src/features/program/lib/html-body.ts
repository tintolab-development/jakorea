import { rewriteAdminFileContentSrcsForPortal } from '../../../shared/lib/portal-public-file-url.ts'
import type { ProgramExtraSection } from '../model/types'

const HTML_MARKUP_RE = /<\/?[a-z][^>]*>/i

export { rewriteAdminFileContentSrcsForPortal }

export function isHtmlContent(value: string): boolean {
  return HTML_MARKUP_RE.test(value)
}

/** 평문은 기존 텍스트 렌더. 에디터 HTML만 RichTextViewer로 보낸다. */
export function extraSection(title: string, body: string): ProgramExtraSection {
  const rewritten = rewriteAdminFileContentSrcsForPortal(body)
  if (!isHtmlContent(rewritten)) return { title, body: rewritten }
  return { title, body: rewritten, bodyFormat: 'html' }
}
