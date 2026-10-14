/** CMS와 동일 — 본문 인라인 `<img>` 금지 */
export function noticeContentHasInlineImage(html: string): boolean {
  return /<img\b/i.test(html)
}
