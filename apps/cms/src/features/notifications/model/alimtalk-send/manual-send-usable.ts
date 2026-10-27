import { collectTemplatePlaceholderKeys } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import {
  canUseNotificationSendTemplateForProgram,
  listNotificationSendTemplateDisabledKeysForProgram,
} from '@/features/notifications/model/shared/template-usable-for-program'
import { isNotificationCatalogVariableDisabled } from '@/features/notifications/model/shared/catalog-variable-disabled'
import {
  isAlimtalkEventOnlyVariableKey,
  resolveAlimtalkCatalogSourceMode,
  type AlimtalkVariableCatalogEntry,
} from './recipient-variables'

export {
  ALIMTALK_MANUAL_LINK_PLACEHOLDER_KEY,
  isUnsafeAlimtalkManualLinkValue,
} from './recipient-variables'

export type AlimtalkManualSendUnusableCode =
  | 'EVENT_ONLY'
  | 'UNREGISTERED'
  | 'PROGRAM_REQUIRED'
  | 'CATALOG_DISABLED'
  | 'SOURCE_MODE_UNKNOWN'

export type AlimtalkManualSendUnusableReason = {
  code: AlimtalkManualSendUnusableCode
  keys: string[]
  summary: string
  detail: string
}

export type AlimtalkManualSendUnusableKeys = {
  catalogDisabled: string[]
  eventOnly: string[]
  unknownSourceMode: string[]
  unregistered: string[]
  programRequired: string[]
  catalogConditionDisabled: string[]
}

const UNUSABLE_SUMMARY: Record<AlimtalkManualSendUnusableCode, string> = {
  EVENT_ONLY: '시스템 이벤트 전용 변수가 포함되어 수동 발송할 수 없습니다.',
  UNREGISTERED: '자동입력 항목에 등록되지 않은 변수가 포함되어 있습니다.',
  PROGRAM_REQUIRED: '이 템플릿을 사용하려면 프로그램을 먼저 선택해 주세요.',
  CATALOG_DISABLED: '현재 프로그램 또는 수신자 유형에서 사용할 수 없는 변수가 포함되어 있습니다.',
  SOURCE_MODE_UNKNOWN: '변수 사용 가능 여부를 확인할 수 없습니다.',
}

const UNUSABLE_CODE_ORDER: AlimtalkManualSendUnusableCode[] = [
  'EVENT_ONLY',
  'UNREGISTERED',
  'PROGRAM_REQUIRED',
  'CATALOG_DISABLED',
  'SOURCE_MODE_UNKNOWN',
]

function findCatalogItem(
  catalog: AlimtalkVariableCatalogEntry[],
  key: string
): AlimtalkVariableCatalogEntry | undefined {
  return catalog.find(entry => {
    if (entry.key.trim() === key) return true
    const tokenInner = entry.token?.replace(/^#\{/, '').replace(/\}$/, '').trim()
    return tokenInner === key
  })
}

function reasonFrom(code: AlimtalkManualSendUnusableCode, keys: string[]): AlimtalkManualSendUnusableReason {
  const summary = UNUSABLE_SUMMARY[code]
  const uniqueKeys = [...new Set(keys.filter(Boolean))]
  return {
    code,
    keys: uniqueKeys,
    summary,
    detail: uniqueKeys.length > 0 ? `${summary} (${uniqueKeys.join(', ')})` : summary,
  }
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
  if (input.catalog == null) {
    return {
      catalogDisabled: [],
      eventOnly: [],
      unknownSourceMode: [],
      unregistered: [],
      programRequired: [],
      catalogConditionDisabled: [],
    }
  }
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
  })
  const unregistered: string[] = []
  const programRequired: string[] = []
  const catalogConditionDisabled: string[] = []
  const hasProgram =
    input.programNumericId != null && Number.isFinite(input.programNumericId)
  for (const raw of usedKeys) {
    const key = raw.trim()
    if (!key || eventOnly.includes(key)) continue
    const item = findCatalogItem(input.catalog, key)
    if (!item) {
      unregistered.push(key)
      continue
    }
    if (item.requiresProgram === true && !hasProgram) {
      programRequired.push(key)
      continue
    }
    if (isNotificationCatalogVariableDisabled(item, input.programNumericId)) {
      catalogConditionDisabled.push(key)
    }
  }
  const unknownSourceMode: string[] = []
  for (const raw of usedKeys) {
    const key = raw.trim()
    if (
      !key ||
      catalogDisabled.includes(key) ||
      eventOnly.includes(key) ||
      unregistered.includes(key) ||
      programRequired.includes(key) ||
      catalogConditionDisabled.includes(key)
    ) {
      continue
    }
    const item = findCatalogItem(input.catalog, key)
    if (!item) continue
    if (resolveAlimtalkCatalogSourceMode(item) == null) unknownSourceMode.push(key)
  }
  return {
    catalogDisabled,
    eventOnly,
    unknownSourceMode,
    unregistered,
    programRequired,
    catalogConditionDisabled,
  }
}

export function diagnoseAlimtalkManualSendUnusable(input: {
  usedKeys?: Iterable<string>
  template?: Parameters<typeof collectTemplatePlaceholderKeys>[0]
  catalog: AlimtalkVariableCatalogEntry[] | null | undefined
  programNumericId?: number | null
}): AlimtalkManualSendUnusableReason[] {
  const unusable = listAlimtalkManualSendUnusableKeys(input)
  const byCode: Array<[AlimtalkManualSendUnusableCode, string[]]> = [
    ['EVENT_ONLY', unusable.eventOnly],
    ['UNREGISTERED', unusable.unregistered],
    ['PROGRAM_REQUIRED', unusable.programRequired],
    ['CATALOG_DISABLED', unusable.catalogConditionDisabled],
    ['SOURCE_MODE_UNKNOWN', unusable.unknownSourceMode],
  ]
  return UNUSABLE_CODE_ORDER.flatMap(code => {
    const keys = byCode.find(([item]) => item === code)?.[1] ?? []
    return keys.length > 0 ? [reasonFrom(code, keys)] : []
  })
}

export function formatAlimtalkManualSendUnusableReasonView(
  reasons: AlimtalkManualSendUnusableReason[]
): { summary: string; detail: string } | null {
  if (reasons.length === 0) return null
  return {
    summary: reasons.map(reason => reason.summary).join(' '),
    detail: reasons.map(reason => reason.detail).join('\n'),
  }
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
  const reasons: AlimtalkManualSendUnusableReason[] = []
  if (unusable.eventOnly.length > 0) {
    reasons.push(reasonFrom('EVENT_ONLY', unusable.eventOnly))
  }
  if (unusable.unregistered.length > 0) {
    reasons.push(reasonFrom('UNREGISTERED', unusable.unregistered))
  }
  if (unusable.programRequired.length > 0) {
    reasons.push(reasonFrom('PROGRAM_REQUIRED', unusable.programRequired))
  }
  if (unusable.catalogConditionDisabled.length > 0) {
    reasons.push(reasonFrom('CATALOG_DISABLED', unusable.catalogConditionDisabled))
  }
  if (unusable.unknownSourceMode.length > 0) {
    reasons.push(reasonFrom('SOURCE_MODE_UNKNOWN', unusable.unknownSourceMode))
  }
  if (reasons.length === 0 && unusable.catalogDisabled.length > 0) {
    reasons.push(reasonFrom('UNREGISTERED', unusable.catalogDisabled))
  }
  return formatAlimtalkManualSendUnusableReasonView(reasons)?.detail ?? null
}
