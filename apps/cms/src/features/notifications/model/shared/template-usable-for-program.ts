import { extractPlaceholderKeysFromTexts } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import {
  isNotificationCatalogVariableDisabled,
  isNotificationCatalogVariablePendingRecipientType,
  type NotificationRecipientTypeScope,
} from '@/features/notifications/model/shared/catalog-variable-disabled'

export type NotificationSendCatalogVariableLike = {
  key: string
  token?: string
  enabled?: boolean
  requiresProgram?: boolean
  programGroups?: string[]
  recruitmentTypes?: string[]
  participantTypes?: string[]
  memberTypes?: string[]
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

function usedKeysFromInput(input: {
  texts?: Array<string | null | undefined>
  usedKeys?: Iterable<string>
}): Set<string> {
  if (input.usedKeys) {
    return new Set([...input.usedKeys].map(key => key.trim()).filter(Boolean))
  }
  return extractPlaceholderKeysFromTexts(...(input.texts ?? []))
}

/**
 * 메일·문자·알림톡 템플릿 피커 usable (카탈로그 소속·enabled).
 * - catalog 미로드: false (로딩을 정상 활성으로 표시하지 않음)
 * - 미등록 키: 프로그램 유무와 관계없이 비활성
 * - 프로그램 미선택: requiresProgram 키는 비활성 (BE 발송 가드와 동일)
 * - 프로그램 지정: #{키} ⊆ catalog 이고 모두 enabled=true
 * - `recipientTypeScope`(템플릿 선택 단계): 수신자 유형이 안 정해져서만 비활성인 키는 막지 않는다
 * 알림톡 EVENT_ONLY/SYSTEM 차단은 채널 어댑터에서 추가한다.
 */
export function canUseNotificationSendTemplateForProgram(input: {
  texts?: Array<string | null | undefined>
  usedKeys?: Iterable<string>
  catalog: NotificationSendCatalogVariableLike[] | null | undefined
  programNumericId?: number | null
  recipientTypeScope?: NotificationRecipientTypeScope | null
}): boolean {
  if (input.catalog == null) return false
  return listNotificationSendTemplateDisabledKeysForProgram(input).length === 0
}

/**
 * 현재 문맥에서 enabled=false(또는 프로그램 지정 시 카탈로그 미등재)인 키 목록.
 * 피커 비활성 사유 카피용. enabled ≠ DB 값 존재.
 */
export function listNotificationSendTemplateDisabledKeysForProgram(input: {
  texts?: Array<string | null | undefined>
  usedKeys?: Iterable<string>
  catalog: NotificationSendCatalogVariableLike[] | null | undefined
  programNumericId?: number | null
  /** 템플릿 선택 단계에서만 넘긴다. 변수 목록 조회에 쓴 수신자 유형 */
  recipientTypeScope?: NotificationRecipientTypeScope | null
}): string[] {
  if (input.catalog == null) return []

  const usedKeys = usedKeysFromInput(input)
  if (usedKeys.size === 0) return []

  const programId = input.programNumericId
  const byKey = catalogByKey(input.catalog)
  const disabled: string[] = []
  for (const key of usedKeys) {
    const item = byKey.get(key)
    if (!item || isNotificationCatalogVariableDisabled(item, programId)) {
      if (
        item &&
        isNotificationCatalogVariablePendingRecipientType(item, programId, input.recipientTypeScope)
      ) {
        continue
      }
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
