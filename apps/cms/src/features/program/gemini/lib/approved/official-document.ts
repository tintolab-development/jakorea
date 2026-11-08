export function formatOfficialDocumentRequiredLabel(
  required: boolean | null | undefined
): string {
  if (required === true) return '필요'
  if (required === false) return '필요 없음'
  return '-'
}

export function formatOfficialDocumentRequiredInfo(
  info: string | null | undefined
): string {
  const trimmed = info?.trim() ?? ''
  return trimmed || '-'
}
