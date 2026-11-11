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

/** 변수 목록 조회에 넘긴 수신자 유형 (선택 수신자가 모두 같은 유형일 때만 값이 있다) */
export type NotificationRecipientTypeScope = {
  participantType?: string
  memberType?: string
}

type CatalogVariableWithTypeScope = {
  enabled?: boolean
  requiresProgram?: boolean
  programGroups?: string[]
  recruitmentTypes?: string[]
  participantTypes?: string[]
  memberTypes?: string[]
}

/**
 * 수신자 유형이 아직 정해지지 않아서만 비활성인 변수 (2026-11-11).
 *
 * BE는 참여 유형·회원 유형 한정 변수를 유형 없이 조회하면 `enabled=false`로 준다.
 * 템플릿은 수신자보다 먼저 고르므로, 템플릿 선택 단계에서는 이 변수로 막지 않는다.
 * 수신자를 고르면 그 유형으로 다시 조회하고, 발송 전 검사에서 값을 채울 수 없는 수신자를 뺀다.
 *
 * - 프로그램 필요 변수인데 프로그램이 없으면 해당 없음(그대로 막음)
 * - 프로그램 그룹·모집 유형 조건이 붙은 변수는 FE가 판정할 수 없어 해당 없음
 * - 이미 지정한 유형이 조건에 맞지 않으면 해당 없음
 */
export function isNotificationCatalogVariablePendingRecipientType(
  item: CatalogVariableWithTypeScope | null | undefined,
  programId: number | null | undefined,
  scope: NotificationRecipientTypeScope | null | undefined
): boolean {
  if (item == null || item.enabled === true || scope == null) return false
  const hasProgram = programId != null && Number.isFinite(programId)
  if (item.requiresProgram === true && !hasProgram) return false
  if ((item.programGroups?.length ?? 0) > 0 || (item.recruitmentTypes?.length ?? 0) > 0) {
    return false
  }
  const participantTypes = item.participantTypes ?? []
  const memberTypes = item.memberTypes ?? []
  let pending = false
  if (participantTypes.length > 0) {
    const value = scope.participantType?.trim()
    if (!value) pending = true
    else if (!participantTypes.includes(value)) return false
  }
  if (memberTypes.length > 0) {
    const value = scope.memberType?.trim()
    if (!value) pending = true
    else if (!memberTypes.includes(value)) return false
  }
  return pending
}
