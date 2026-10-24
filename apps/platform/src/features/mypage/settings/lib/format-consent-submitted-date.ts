export const CONSENT_A4_TEMPLATE_DATE_LABEL = 'YYYY년 MM월 DD일'

/** 제출일 → `YYYY년 MM월 DD일`. 값이 없으면 `-`. */
export function formatConsentSubmittedDateLabel(value: string | null | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return '-'
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}년 ${iso[2]}월 ${iso[3]}일`
  const dotted = trimmed.match(/^(\d{4})\.(\d{2})\.(\d{2})/)
  if (dotted) return `${dotted[1]}년 ${dotted[2]}월 ${dotted[3]}일`
  return '-'
}

/** CMS A4 — 제출본은 실제 날짜, 템플릿/로컬 초안은 YYYY placeholder */
export function resolveConsentA4PreviewDateLabel(
  value: string | null | undefined,
  isSubmittedDocument: boolean,
): string {
  if (!isSubmittedDocument) return CONSENT_A4_TEMPLATE_DATE_LABEL
  return formatConsentSubmittedDateLabel(value)
}
