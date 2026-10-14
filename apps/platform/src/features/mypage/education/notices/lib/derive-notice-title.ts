/** CMS 게시글 등록과 동일 — 본문에서 제목 파생 */
export function deriveNoticeTitleFromHtml(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return '안내사항'
  return text.slice(0, 40)
}

export function isNoticeHtmlContentEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length === 0
}
