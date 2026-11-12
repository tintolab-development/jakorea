/** 안내사항 게시일 — 예: 2026년 01월 15일 오후 3:00 */
export function formatEducationNoticePublishedAt(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hours24 = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = hours24 < 12 ? '오전' : '오후'
  const hours12 = hours24 % 12 || 12
  return `${y}년 ${m}월 ${d}일 ${period} ${hours12}:${minutes}`
}

/** 파일 업로드일 — 예: 2026년 01월 15일 */
export function formatEducationNoticeFileDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}년 ${m}월 ${d}일`
}

/** 파일 크기 — 1MB 이상은 반올림 MB, 미만은 KB */
export function formatEducationNoticeFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${Math.round(mb)}MB`
  const kb = bytes / 1024
  return `${Math.max(1, Math.round(kb))}KB`
}

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

/** 마크다운 백슬래시 이스케이프(`\[`, `\*` 등) — CMS 에디터가 `[E2E]`를 `\[E2E\]`로 저장한다 */
const MARKDOWN_ESCAPE = /\\([\\`*_{}[\]()#+\-.!|~<>])/g
const ESCAPED_CHAR_TOKEN = /\uE000(\d+)\uE001/g

/** CMS 본문(마크다운 + 인라인 HTML)을 카드·제목용 텍스트로 — 이미지·태그·마크다운 기호 제거 */
export function toEducationNoticePlainText(value: string): string {
  return value
    // 이스케이프된 글자는 아래 마크다운 기호 제거에 걸리지 않게 잠시 토큰으로 바꿔 두고 마지막에 글자로 되돌린다
    .replace(MARKDOWN_ESCAPE, (_, char: string) => `\uE000${char.codePointAt(0)}\uE001`)
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    // 서버 제목은 HTML 앞부분을 잘라 저장되어 `<img src="…` 처럼 닫히지 않은 태그로 끝날 수 있다
    .replace(/<[a-z!/][^>]*$/i, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/^[ \t]{0,3}(#{1,6}|>|[-*+]|\d+\.)[ \t]+/gm, '')
    .replace(/(\*\*|__|~~|`)/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, entity => HTML_ENTITIES[entity] ?? entity)
    .replace(ESCAPED_CHAR_TOKEN, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function resolveEducationNoticeTitle(title: string, content: string): string {
  const trimmedTitle = toEducationNoticePlainText(title).split(/\n/)[0]?.trim() ?? ''
  if (trimmedTitle.length > 0) return trimmedTitle
  const firstLine = toEducationNoticePlainText(content).split(/\n/)[0]?.trim() ?? ''
  return firstLine || '-'
}
