/** 메일 본문 표 공통 프리셋. TipTap/미리보기 CSS(body-tables.css)와 인라인 스타일을 맞춘다. */

export const MAIL_TABLE_LABEL_COL_WIDTH_PX = 140

export const mailVariable = (label: string) =>
  `<span data-mail-variable="${label}">#{${label}}</span>`

const cellStyle =
  'border:0;vertical-align:middle;color:#3d3d3d;font-family:Pretendard,Arial,sans-serif;font-size:12px;line-height:1.5;'
const labelCellStyle = `${cellStyle}width:${MAIL_TABLE_LABEL_COL_WIDTH_PX}px;min-width:${MAIL_TABLE_LABEL_COL_WIDTH_PX}px;max-width:${MAIL_TABLE_LABEL_COL_WIDTH_PX}px;padding:9px 10px;background:linear-gradient(0deg,rgba(231,235,239,0.6) 0%,rgba(231,235,239,0.6) 100%),#fff;text-align:center;font-weight:700;white-space:nowrap;`
const valueCellStyle = `${cellStyle}padding:9px 12px;background:#ffffff;text-align:left;font-weight:500;word-break:break-word;`
const longTextValueCellStyle = `${cellStyle}vertical-align:top;padding:9px 12px;background:#ffffff;text-align:left;font-weight:500;word-break:break-word;`
const labelCellAttributes = `colwidth="${MAIL_TABLE_LABEL_COL_WIDTH_PX}"`

export function mailSectionHeading(label: string): string {
  return `<h3 style="margin:0 0 6px 0;color:#3d3d3d;font-family:Pretendard,Arial,sans-serif;font-size:14px;line-height:1.4;font-weight:700;">${label}</h3>`
}

export function mailTableShell(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;background:#ffffff;">${rows}</table>`
}

export function mailLabelCell(label: string): string {
  return `<th ${labelCellAttributes} style="${labelCellStyle}">${label}</th>`
}

export function mailValueCell(label: string, colspan?: number): string {
  const span = colspan && colspan > 1 ? ` colspan="${colspan}"` : ''
  return `<td${span} style="${valueCellStyle}">${mailVariable(label)}</td>`
}

export function mailLongTextValueCell(label: string): string {
  return `<td style="${longTextValueCellStyle}">${mailVariable(label)}</td>`
}

/** 첫 행 열 폭을 140/flex/140/flex 로 잠그고, 값은 한 칸처럼 보이게 나머지 칸을 비운다. */
export function mailFirstRowSpanRestLock(): string {
  return `<td ${labelCellAttributes} style="${valueCellStyle}width:${MAIL_TABLE_LABEL_COL_WIDTH_PX}px;min-width:${MAIL_TABLE_LABEL_COL_WIDTH_PX}px;max-width:${MAIL_TABLE_LABEL_COL_WIDTH_PX}px;">&nbsp;</td><td style="${valueCellStyle}">&nbsp;</td>`
}

/**
 * 알림 메일 버튼 링크 (BE 회신 방식 A-2, 2026-11).
 * - `#{알림 링크 경로}`는 상대경로 그대로, 도메인은 수신자 유형별 별도 변수(서버 설정 `ja.notification.links.*`, scheme·경로 없이 호스트만).
 * - 회원(MEMBER): `https://#{홈페이지 도메인}#{알림 링크 경로}` / 관리자(ADMIN, CMS 화면): `https://#{CMS 어드민 도메인}#{알림 링크 경로}`.
 * - 회원 템플릿에 관리자 도메인 변수, 관리자 템플릿에 `#{홈페이지 도메인}`을 넣지 않는다(값이 비면 필수 변수 누락으로 발송 실패).
 * - 링크 버튼은 BE가 링크 경로를 채우는 이벤트의 템플릿에만 넣는다. 수신자 유형·이벤트 바인딩은 서버 정본이며 FE에 매핑을 두지 않는다.
 */
export const MAIL_NOTIFICATION_LINK_PATH_VARIABLE_LABEL = '알림 링크 경로'
export const MAIL_HOMEPAGE_DOMAIN_VARIABLE_LABEL = '홈페이지 도메인'
export const MAIL_CMS_ADMIN_DOMAIN_VARIABLE_LABEL = 'CMS 어드민 도메인'

export type MailLinkAudience = 'MEMBER' | 'ADMIN'

export const MAIL_LINK_DOMAIN_VARIABLE_LABEL_BY_AUDIENCE: Readonly<
  Record<MailLinkAudience, string>
> = {
  MEMBER: MAIL_HOMEPAGE_DOMAIN_VARIABLE_LABEL,
  ADMIN: MAIL_CMS_ADMIN_DOMAIN_VARIABLE_LABEL,
}

/**
 * 버튼 href. `audience`가 null이면 도메인 없이 경로 변수만 쓴다 —
 * 발송 주체가 확인되지 않은 상담·인재채용·재능기부 프리셋 전용(BE 회신: href 변경 보류).
 */
export function mailNotificationLinkHref(
  audience: MailLinkAudience | null,
  pathVariableLabel: string = MAIL_NOTIFICATION_LINK_PATH_VARIABLE_LABEL
): string {
  const path = `#{${pathVariableLabel}}`
  if (audience == null) return path
  return `https://#{${MAIL_LINK_DOMAIN_VARIABLE_LABEL_BY_AUDIENCE[audience]}}${path}`
}

/** 버튼은 `<table>` 블록이라 이 버튼이 든 본문은 BE 평문 판정(블록 태그 없음)에 걸리지 않는다. */
export function mailDetailButton(
  label: string,
  hrefVariableLabel: string,
  audience: MailLinkAudience | null
): string {
  const href = mailNotificationLinkHref(audience, hrefVariableLabel)
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;"><tr><td align="center" height="52" bgcolor="#01a1af" style="height:52px;border-radius:8px;background:#01a1af;text-align:center;"><a href="${href}" target="_blank" rel="noopener noreferrer" style="display:block;height:52px;box-sizing:border-box;padding:8px 20px;color:#ffffff;font-family:Pretendard,Arial,sans-serif;font-size:16px;line-height:36px;font-weight:600;text-decoration:none;">${label}</a></td></tr></table>`
}

export function mailGreetingParagraphs(lines: string[]): string {
  const paragraphStyle =
    'margin:0 0 24px 0;color:#3d3d3d;font-family:Pretendard,Arial,sans-serif;font-size:14px;line-height:1.5;'
  return lines.map(line => `<p style="${paragraphStyle}">${line}</p>`).join('')
}

export function wrapMailLayoutHtml(version: string, inner: string): string {
  return `<!-- ja-mail-layout:${version} -->
<div style="width:100%;max-width:100%;margin:0 auto;padding:0;background:#ffffff;">
  ${inner}
</div>`
}

export function resolvePresetBodyHtml(
  templateId: string | number | null | undefined,
  expectedId: string,
  version: string,
  bodyHtml: string,
  build: () => string
): string {
  if (String(templateId) !== expectedId) return bodyHtml
  if (bodyHtml.includes(`ja-mail-layout:${version}`)) return bodyHtml
  return build()
}

export function ensurePresetLayoutMarker(
  templateId: string | number | null | undefined,
  expectedId: string,
  version: string,
  bodyHtml: string
): string {
  if (String(templateId) !== expectedId || !bodyHtml.trim()) {
    return bodyHtml
  }
  const marker = 'ja-mail-layout:' + version
  if (bodyHtml.includes(marker)) return bodyHtml
  return '<!-- ' + marker + ' -->\n' + bodyHtml
}
