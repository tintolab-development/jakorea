/**
 * 변수 패널 삽입 비활성 판정.
 * - BE `enabled` 가 SSOT
 * - programId 미선택인데 `requiresProgram` 이면 FE에서도 막음 (카탈로그 지연·누락 가드)
 */
export function isNotificationCatalogVariableDisabled(
  item: { enabled?: boolean; requiresProgram?: boolean } | null | undefined,
  programId?: number | null
): boolean {
  if (item == null) return false
  const hasProgram = programId != null && Number.isFinite(programId)
  if (item.requiresProgram === true && !hasProgram) return true
  return item.enabled !== true
}
