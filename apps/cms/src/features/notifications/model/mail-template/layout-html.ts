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

export function mailDetailButton(label: string, hrefVariableLabel: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;"><tr><td align="center" height="52" bgcolor="#01a1af" style="height:52px;border-radius:8px;background:#01a1af;text-align:center;"><a href="#{${hrefVariableLabel}}" target="_blank" rel="noopener noreferrer" style="display:block;height:52px;box-sizing:border-box;padding:8px 20px;color:#ffffff;font-family:Pretendard,Arial,sans-serif;font-size:16px;line-height:36px;font-weight:600;text-decoration:none;">${label}</a></td></tr></table>`
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
