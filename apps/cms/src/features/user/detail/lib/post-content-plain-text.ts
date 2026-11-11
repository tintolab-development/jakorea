/**
 * 프로그램 게시글(안내사항) 목록 미리보기용 일반 텍스트.
 *
 * 목록에서는 텍스트 서식을 적용하지 않고 상세에서만 적용한다(홈페이지 마이페이지 안내사항 목록과 같은 규칙).
 * 본문은 CMS 글쓰기(마크다운)와 홈페이지 글쓰기(HTML)가 섞여 있어 두 형식의 표시 기호를 모두 걷어 낸다.
 * @see apps/platform/src/features/mypage/education/notices/lib/format.ts `toEducationNoticePlainText`
 */

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

export function toProgramPostPlainText(value: string): string {
  return value
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/<[a-z!/][^>]*$/i, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/^[ \t]{0,3}(#{1,6}|>|[-*+]|\d+\.)[ \t]+/gm, '')
    .replace(/(\*\*|__|~~|`|==)/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, entity => HTML_ENTITIES[entity] ?? entity)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
