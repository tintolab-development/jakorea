import { extractPlaceholderKeysFromTexts } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { isNotificationCatalogVariableDisabled } from '@/features/notifications/model/shared/catalog-variable-disabled'

export type NotificationSendCatalogVariableLike = {
  key: string
  token?: string
  enabled?: boolean
  requiresProgram?: boolean
}

/**
 * 특정 프로그램 발송 맥락에서 템플릿 「사용하기」 가능 여부.
 * - programNumericId 없음(전체/미선택): 변수 제한 없음 → true
 * - 카탈로그에 있고 enabled=false(또는 requiresProgram 가드)인 키가 본문/제목에 있으면 false
 * - 카탈로그에 없는 키: FE에서 막지 않음(BE fail-closed)
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
    if (!item) continue
    if (isNotificationCatalogVariableDisabled(item, programId)) return false
  }
  return true
}
