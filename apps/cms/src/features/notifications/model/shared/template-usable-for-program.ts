import { extractPlaceholderKeysFromTexts } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { isNotificationCatalogVariableDisabled } from '@/features/notifications/model/shared/catalog-variable-disabled'

export type NotificationSendCatalogVariableLike = {
  key: string
  token?: string
  enabled?: boolean
  requiresProgram?: boolean
}

/**
 * 특정 프로그램 발송 맥락에서 템플릿 「사용하기」 가능 여부 (Option A).
 * - programNumericId 없음(미선택): 변수 제한 없음 → true
 * - 프로그램 지정: 본문 #{키} ⊆ catalog 이고 모두 enabled=true
 * - 카탈로그 미등재 키 → false (BE SYSTEM/비enrich 키 포함)
 */
export function canUseNotificationSendTemplateForProgram(input: {
  texts: Array<string | null | undefined>
  catalog: NotificationSendCatalogVariableLike[] | null | undefined
  programNumericId?: number | null
}): boolean {
  const programId = input.programNumericId
  if (programId == null || !Number.isFinite(programId)) return true

  const usedKeys = extractPlaceholderKeysFromTexts(...input.texts)
  if (usedKeys.size === 0) return true

  const byKey = new Map<string, NotificationSendCatalogVariableLike>()
  for (const item of input.catalog ?? []) {
    const key = item.key?.trim()
    if (!key) continue
    byKey.set(key, item)
    const tokenInner = item.token?.replace(/^#\{/, '').replace(/\}$/, '').trim()
    if (tokenInner) byKey.set(tokenInner, item)
  }

  for (const key of usedKeys) {
    const item = byKey.get(key)
    if (!item) return false
    if (isNotificationCatalogVariableDisabled(item, programId)) return false
  }
  return true
}
