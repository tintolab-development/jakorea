/**
 * 이름이 바뀐 자동입력 변수의 예전 key → 새 key (BE 44784cf36, 2026-11-15 시안 기준 개명).
 *
 * 카탈로그(`GET …/template-variables`)에는 새 key만 온다. 하지만 이미 저장된 템플릿·카카오 승인 알림톡
 * 본문의 예전 토큰(`#{담당자명}` 등)도 BE가 새 key와 같은 값으로 치환하고 같은 규칙으로 검증한다.
 * FE도 예전 토큰을 새 key 항목으로 판정해 "등록되지 않은 변수"로 막지 않는다.
 */
export const NOTIFICATION_LEGACY_VARIABLE_ALIASES: Readonly<Record<string, string>> = {
  담당자명: '프로그램 담당자명',
  '담당자 연락처': '프로그램 담당자 연락처',
}

type CatalogEntryLike = { key: string; token?: string | null }

export function notificationCatalogTokenInner(token: string | null | undefined): string {
  return (
    token
      ?.replace(/^#\{/, '')
      .replace(/\}$/, '')
      .trim() ?? ''
  )
}

function entryMatchesKey(entry: CatalogEntryLike, key: string): boolean {
  if (entry.key.trim() === key) return true
  return notificationCatalogTokenInner(entry.token) === key
}

/** 본문 `#{키}`에 해당하는 카탈로그 항목. 카탈로그에 없는 예전 key는 새 key 항목으로 찾는다. */
export function findNotificationCatalogEntry<T extends CatalogEntryLike>(
  catalog: readonly T[],
  key: string
): T | undefined {
  const trimmed = key.trim()
  const direct = catalog.find(entry => entryMatchesKey(entry, trimmed))
  if (direct) return direct
  const renamed = NOTIFICATION_LEGACY_VARIABLE_ALIASES[trimmed]
  return renamed ? catalog.find(entry => entryMatchesKey(entry, renamed)) : undefined
}

/** key·토큰으로 만든 조회 맵에, 맵에 없는 예전 key를 새 key 항목으로 덧붙인다. */
export function addNotificationLegacyVariableAliases<T>(byKey: Map<string, T>): void {
  for (const [legacy, renamed] of Object.entries(NOTIFICATION_LEGACY_VARIABLE_ALIASES)) {
    if (byKey.has(legacy)) continue
    const item = byKey.get(renamed)
    if (item !== undefined) byKey.set(legacy, item)
  }
}

/** 본문에서 쓴 key 집합에 예전 key의 새 이름을 더한다(카탈로그 key와 비교할 때). */
export function withNotificationRenamedVariableKeys(keys: Iterable<string>): Set<string> {
  const next = new Set<string>()
  for (const key of keys) {
    next.add(key)
    const renamed = NOTIFICATION_LEGACY_VARIABLE_ALIASES[key.trim()]
    if (renamed) next.add(renamed)
  }
  return next
}
