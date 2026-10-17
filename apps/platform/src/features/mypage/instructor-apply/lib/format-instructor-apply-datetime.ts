/** ISO·API 일시 → `YYYY.MM.DD HH:mm` (승인 대기 신청일) */
export function formatInstructorApplyRequestedAtLabel(iso: string | undefined): string {
  if (!iso?.trim()) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.trim()

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${d} ${hh}:${mm}`
}

/** 동의서 행 — `YYYY.MM.DD HH:mm:ss` */
export function formatInstructorConsentAgreedAtLabel(iso: string | undefined): string {
  if (!iso?.trim()) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.trim()

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}.${m}.${d} ${hh}:${mm}:${ss}`
}
