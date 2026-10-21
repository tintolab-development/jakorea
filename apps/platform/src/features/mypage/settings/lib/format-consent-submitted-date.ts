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
