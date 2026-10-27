import { collectTemplatePlaceholderKeys } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import {
  canUseNotificationSendTemplateForProgram,
  listNotificationSendTemplateDisabledKeysForProgram,
} from '@/features/notifications/model/shared/template-usable-for-program'
import {
  isAlimtalkEventOnlyVariableKey,
  resolveAlimtalkCatalogSourceMode,
  type AlimtalkVariableCatalogEntry,
} from './recipient-variables'

export {
  ALIMTALK_MANUAL_LINK_PLACEHOLDER_KEY,
  isUnsafeAlimtalkManualLinkValue,
} from './recipient-variables'

export type AlimtalkManualSendUnusableKeys = {
  catalogDisabled: string[]
  eventOnly: string[]
  unknownSourceMode: string[]
}

export function listAlimtalkManualSendEventOnlyKeys(input: {
  usedKeys: Iterable<string>
  catalog: AlimtalkVariableCatalogEntry[]
}): string[] {
  const eventOnly: string[] = []
  for (const raw of input.usedKeys) {
    const key = raw.trim()
    if (!key) continue
    if (isAlimtalkEventOnlyVariableKey(key, input.catalog)) eventOnly.push(key)
  }
  return eventOnly
}

/** CMS 수동 발송 피커: 카탈로그 소속·enabled + EVENT_ONLY/SYSTEM 차단. QA enabled=true만으로 통과시키지 않는다. */
export function listAlimtalkManualSendUnusableKeys(input: {
  usedKeys?: Iterable<string>
  template?: Parameters<typeof collectTemplatePlaceholderKeys>[0]
  catalog: AlimtalkVariableCatalogEntry[] | null | undefined
  programNumericId?: number | null
}): AlimtalkManualSendUnusableKeys {
  if (input.catalog == null) return { catalogDisabled: [], eventOnly: [], unknownSourceMode: [] }
  const usedKeys = input.usedKeys
    ? [...input.usedKeys]
    : [...collectTemplatePlaceholderKeys(input.template)]
  const catalogDisabled = listNotificationSendTemplateDisabledKeysForProgram({
    usedKeys,
    catalog: input.catalog,
    programNumericId: input.programNumericId,
  })
  const eventOnly = listAlimtalkManualSendEventOnlyKeys({
    usedKeys,
    catalog: input.catalog,
  }).filter(key => !catalogDisabled.includes(key))
  const unknownSourceMode: string[] = []
  for (const raw of usedKeys) {
    const key = raw.trim()
    if (!key || catalogDisabled.includes(key) || eventOnly.includes(key)) continue
    const item = input.catalog.find(entry => {
      if (entry.key.trim() === key) return true
      const tokenInner = entry.token?.replace(/^#\{/, '').replace(/\}$/, '').trim()
      return tokenInner === key
    })
    if (!item) continue
    if (resolveAlimtalkCatalogSourceMode(item) == null) unknownSourceMode.push(key)
  }
  return { catalogDisabled, eventOnly, unknownSourceMode }
}

export function canUseAlimtalkSendTemplateForManualSend(input: {
  usedKeys?: Iterable<string>
  template?: Parameters<typeof collectTemplatePlaceholderKeys>[0]
  catalog: AlimtalkVariableCatalogEntry[] | null | undefined
  programNumericId?: number | null
}): boolean {
  if (input.catalog == null) return false
  const usedKeys = input.usedKeys
    ? input.usedKeys
    : collectTemplatePlaceholderKeys(input.template)
  if (
    !canUseNotificationSendTemplateForProgram({
      usedKeys,
      catalog: input.catalog,
      programNumericId: input.programNumericId,
    })
  ) {
    return false
  }
  const unusable = listAlimtalkManualSendUnusableKeys({
    usedKeys,
    catalog: input.catalog,
    programNumericId: input.programNumericId,
  })
  return (
    unusable.eventOnly.length === 0 &&
    unusable.unknownSourceMode.length === 0 &&
    unusable.catalogDisabled.length === 0
  )
}

export function formatAlimtalkManualSendUnusableMessage(
  unusable: AlimtalkManualSendUnusableKeys
): string | null {
  const lines: string[] = []
  if (unusable.eventOnly.length > 0) {
    lines.push('이 템플릿에는 CMS 수동 발송에서 생성할 수 없는 이벤트 전용 변수가 있습니다.')
    lines.push(unusable.eventOnly.join(', '))
  }
  if (unusable.unknownSourceMode.length > 0) {
    lines.push('이 템플릿에는 값 소스(sourceMode)가 확인되지 않은 변수가 있어 수동 발송할 수 없습니다.')
    lines.push(unusable.unknownSourceMode.join(', '))
  }
  if (unusable.catalogDisabled.length > 0) {
    lines.push('이 템플릿에는 현재 프로그램·카탈로그에서 사용할 수 없는 변수가 포함되어 있습니다.')
    lines.push(unusable.catalogDisabled.join(', '))
  }
  return lines.length > 0 ? lines.join('\n') : null
}
