import { extractPlaceholderKeysFromTexts } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { isNotificationCatalogVariableDisabled } from '@/features/notifications/model/shared/catalog-variable-disabled'

export type NotificationSendCatalogVariableLike = {
  key: string
  token?: string
  enabled?: boolean
  requiresProgram?: boolean
}

function catalogByKey(
  catalog: NotificationSendCatalogVariableLike[] | null | undefined
): Map<string, NotificationSendCatalogVariableLike> {
  const byKey = new Map<string, NotificationSendCatalogVariableLike>()
  for (const item of catalog ?? []) {
    const key = item.key?.trim()
    if (!key) continue
    byKey.set(key, item)
    const tokenInner = item.token?.replace(/^#\{/, '').replace(/\}$/, '').trim()
    if (tokenInner) byKey.set(tokenInner, item)
  }
  return byKey
}

/**
 * 메일·문자·알림톡 템플릿 피커 usable (Option A).
 * - programNumericId 없음(미선택): 변수 제한 없음 → true
 * - catalog 미로드(null/undefined): true (로딩 중 false로 선택본을 지우지 않음)
 * - 프로그램 지정: 본문 #{키} ⊆ catalog 이고 모두 enabled=true (서버 SSOT, FE 재계산 금지)
 * - 알림톡은 호출부에서 APPROVED 추가 게이트
 */
export function canUseNotificationSendTemplateForProgram(input: {
  texts: Array<string | null | undefined>
  catalog: NotificationSendCatalogVariableLike[] | null | undefined
  programNumericId?: number | null
}): boolean {
  if (input.catalog == null) return true
  return listNotificationSendTemplateDisabledKeysForProgram(input).length === 0
}

/**
 * 현재 문맥에서 enabled=false(또는 카탈로그 미등재)인 본문 키 목록.
 * 피커 비활성 사유 카피용. enabled ≠ DB 값 존재.
 */
export function listNotificationSendTemplateDisabledKeysForProgram(input: {
  texts: Array<string | null | undefined>
  catalog: NotificationSendCatalogVariableLike[] | null | undefined
  programNumericId?: number | null
}): string[] {
  const programId = input.programNumericId
  if (programId == null || !Number.isFinite(programId)) return []

  const usedKeys = extractPlaceholderKeysFromTexts(...input.texts)
  if (usedKeys.size === 0) return []

  const byKey = catalogByKey(input.catalog)
  const disabled: string[] = []
  for (const key of usedKeys) {
    const item = byKey.get(key)
    if (!item || isNotificationCatalogVariableDisabled(item, programId)) {
      disabled.push(key)
    }
  }
  return disabled
}

export function formatNotificationSendTemplateDisabledKeysWarning(keys: string[]): string | null {
  const labels = keys.map(key => key.trim()).filter(Boolean)
  if (labels.length === 0) return null
  return [
    '이 템플릿에는 현재 프로그램·참여유형에서 비활성인 변수가 포함되어 있습니다.',
    `발송 시 값이 없으면 실패할 수 있습니다: ${labels.join(', ')}`,
  ].join('\n')
}
