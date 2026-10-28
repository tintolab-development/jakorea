/**
 * EMAIL 평문 본문 표시·편집 보조 (저장·발송 본문은 바꾸지 않는다).
 *
 * BE SSOT (NHN free-form EMAIL body는 HTML로 렌더됨):
 * - 치환 **전** 템플릿 원문에 `<p|br|div|li|table|h1~h6` 가 하나도 없으면 평문.
 * - 평문 본문: 고정 문자열·치환값 모두 HTML 이스케이프 후 `\r?\n` → `<br>`.
 * - HTML 본문: 이스케이프·줄바꿈 변환 없음. 제목에는 이 로직을 쓰지 않는다.
 */

const BLOCK_TAG_RE = /<(?:p|br|div|li|table|h[1-6])\b/i
const MAIL_VARIABLE_TOKEN_RE = /#\{([^{}]+)\}/g
const MAIL_VARIABLE_ATTR_SPAN_RE = /<span\b[^>]*data-mail-variable="([^"]*)"[^>]*>[\s\S]*?<\/span>/gi

export function escapeMailBodyHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function unescapeMailBodyHtml(value: string): string {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
}

/** BE와 동일: 블록 태그가 없으면 평문 (빈 문자열은 평문 아님). */
export function isPlainTextMailBody(template: string | null | undefined): boolean {
  if (!template || !template.trim()) return false
  return !BLOCK_TAG_RE.test(template)
}

/** 이미 치환이 끝난 평문 → 발송 HTML (이스케이프 후 `\n` → `<br>`). */
export function renderPlainMailBodyAfterSubstitute(rendered: string): string {
  return escapeMailBodyHtml(rendered).replace(/\r?\n/g, '<br>')
}

/**
 * 표시용(변수 치환 없음). 평문이면 이스케이프 + `<br>`, HTML이면 그대로.
 * 발송 이력의 contentTemplate fallback 등에 사용. `renderedContent`에는 쓰지 말 것(이미 BE가 변환).
 */
export function mailBodyToDisplayHtml(template: string): string {
  return isPlainTextMailBody(template) ? renderPlainMailBodyAfterSubstitute(template) : template
}

/**
 * 평문 템플릿 → 메일 TipTap 에디터 초기 HTML.
 * 줄마다 `<p>`, 빈 줄은 `<p></p>`(`<br>` 없음). `#{변수}`는 에디터가 변수 노드로 파싱하는 span으로 만든다.
 * HTML 템플릿이면 그대로 반환.
 */
export function mailBodyToEditorHtml(template: string): string {
  if (!isPlainTextMailBody(template)) return template
  return template
    .replace(/^(?:[ \t]*\r?\n)+|(?:\r?\n[ \t]*)+$/g, '')
    .split(/\r?\n/)
    .map(line => {
      if (!line.trim()) return '<p></p>'
      const parts: string[] = []
      let last = 0
      for (const match of line.matchAll(MAIL_VARIABLE_TOKEN_RE)) {
        const index = match.index ?? 0
        parts.push(escapeMailBodyHtml(line.slice(last, index)))
        const label = match[1] ?? ''
        parts.push(
          `<span data-mail-variable="${escapeMailBodyHtml(label)}">#{${escapeMailBodyHtml(label)}}</span>`
        )
        last = index + match[0].length
      }
      parts.push(escapeMailBodyHtml(line.slice(last)))
      return `<p>${parts.join('')}</p>`
    })
    .join('')
}

function normalizePlainLines(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
}

/**
 * 에디터 출력이 `<p>`(+변수 span)만으로 이루어졌으면 줄바꿈 평문으로 되돌린다. 그 외 구조면 null.
 */
function editorHtmlToPlainLines(html: string): string | null {
  const unspanned = html.replace(MAIL_VARIABLE_ATTR_SPAN_RE, (_, label: string) => `#{${label}}`)
  if (!/^(?:<p(?:\s[^>]*)?>[^<]*<\/p>\s*)+$/i.test(unspanned.trim())) return null
  const lines = [...unspanned.matchAll(/<p(?:\s[^>]*)?>([^<]*)<\/p>/gi)].map(m =>
    unescapeMailBodyHtml(m[1] ?? '')
  )
  return lines.join('\n')
}

/**
 * 평문 템플릿을 에디터에 불러온 뒤 사용자가 손대지 않았는지(= 변환만 된 상태인지).
 * true면 발송 시 contentTemplate override를 보내지 않아도 된다(등록 평문 그대로 BE 사용).
 */
export function isMailEditorBodyUntouchedFromPlainTemplate(
  editorHtml: string,
  storedTemplate: string
): boolean {
  if (!isPlainTextMailBody(storedTemplate)) return false
  const editorLines = editorHtmlToPlainLines(editorHtml)
  if (editorLines == null) return false
  return normalizePlainLines(editorLines) === normalizePlainLines(storedTemplate)
}
