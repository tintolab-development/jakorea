import { formatDottedSeoulDateTime } from '../../../../shared/lib/format-display-date.ts'

/** ISO·API 일시 → `YYYY.MM.DD HH:mm` (승인 대기 신청일, 서울) */
export function formatInstructorApplyRequestedAtLabel(iso: string | undefined): string {
  const formatted = formatDottedSeoulDateTime(iso)
  if (formatted) return formatted
  return iso?.trim() ?? ''
}

/** 동의서 행 — `YYYY.MM.DD HH:mm:ss` (서울) */
export function formatInstructorConsentAgreedAtLabel(iso: string | undefined): string {
  const formatted = formatDottedSeoulDateTime(iso, { seconds: true })
  if (formatted) return formatted
  return iso?.trim() ?? ''
}
