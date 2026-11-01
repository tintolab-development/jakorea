/** participation.certificateStatus 표시 라벨 — 발급 가능 여부 판정에 쓰지 않는다. */

const CERTIFICATE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: '발급 가능',
  COMPLETION_ISSUED: '수료증 발급 완료',
  PARTICIPATION_ISSUED: '참여증 발급 완료',
  NOT_ELIGIBLE: '발급 불가',
  PENDING: '발급 대기',
  REQUESTED: '발급 요청',
}

export function labelForPortalCertificateStatus(
  status: string | null | undefined,
): string | null {
  if (!status?.trim()) return null
  const key = status.trim().toUpperCase()
  if (CERTIFICATE_STATUS_LABELS[key]) return CERTIFICATE_STATUS_LABELS[key]
  if (key.endsWith('_ISSUED')) return '발급 완료'
  return null
}
