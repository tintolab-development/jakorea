/**
 * 등록 위저드 템플릿 변경 후, 스토어에 없는 시드 기본값이 입력란에 다시 채워지지 않게 한다.
 * 키를 지운 reset은 `?? default` 때문에 화면만 원래 숫자·라디오로 돌아갔다.
 */

export type OperationalSeedDefaultStore =
  | 'institution-recruit'
  | 'general-recruit'
  | 'general-application'
  | 'gemini-recruit'
  | 'ujat-recruit-institution'
  | 'ujat-recruit-volunteer'
  | 'ujat-application-institution'
  | 'ujat-application-volunteer'
  | 'program-registration'

const suppressedPrefixes = new Map<OperationalSeedDefaultStore, Set<string>>()
const EMPTY_LIST: readonly unknown[] = []
const EMPTY_RECORD: Readonly<Record<string, unknown>> = {}

export function suppressOperationalSeedDefaults(
  store: OperationalSeedDefaultStore,
  prefixes: readonly string[]
): void {
  if (prefixes.length === 0) return
  let set = suppressedPrefixes.get(store)
  if (set == null) {
    set = new Set()
    suppressedPrefixes.set(store, set)
  }
  for (const prefix of prefixes) set.add(prefix)
}

export function clearOperationalSeedDefaultSuppression(): void {
  suppressedPrefixes.clear()
}

export function isOperationalSeedDefaultSuppressed(
  store: OperationalSeedDefaultStore,
  key: string
): boolean {
  const set = suppressedPrefixes.get(store)
  if (set == null) return false
  if (set.has('*')) return true
  for (const prefix of set) {
    if (key === prefix) return true
    const needle = prefix.endsWith('.') ? prefix : `${prefix}.`
    if (key.startsWith(needle)) return true
  }
  return false
}

function isDayjsValue(value: object): boolean {
  return '$isDayjsObject' in value
}

/** 빈 칸만 있는 객체·배열은 시드 숫자가 아니라 입력 틀이다. 리셋 때 형태를 유지한다. */
function isVisuallyEmptyDefault(value: unknown, seen = new Set<object>()): boolean {
  if (value == null || value === '') return true
  if (value === false) return true
  if (typeof value !== 'object') return false
  if (seen.has(value)) return true
  seen.add(value)
  if (isDayjsValue(value)) return false
  if (Array.isArray(value)) {
    return value.every(item => isVisuallyEmptyDefault(item, seen))
  }
  return Object.values(value).every(item => isVisuallyEmptyDefault(item, seen))
}

function emptyStandIn<T>(defaultValue: T): T {
  if (typeof defaultValue === 'number') return undefined as T
  if (typeof defaultValue === 'string') return '' as T
  if (Array.isArray(defaultValue)) return EMPTY_LIST as T
  if (typeof defaultValue === 'boolean') return false as T
  if (defaultValue != null && typeof defaultValue === 'object') return EMPTY_RECORD as T
  return undefined as T
}

/**
 * 키가 있으면 그 값(명시적 빈 값 포함)을 쓴다.
 * 없고 템플릿 변경으로 이 스토어가 비워졌으면, 채워져 보이던 시드 기본값은 보여 주지 않는다.
 */
export function readOperationalOverlayKvValue<T>(
  store: OperationalSeedDefaultStore,
  record: Record<string, unknown>,
  key: string,
  defaultValue: T
): T {
  if (Object.prototype.hasOwnProperty.call(record, key)) {
    const stored = record[key]
    if (stored == null && defaultValue != null && typeof defaultValue === 'object') {
      return defaultValue
    }
    return stored as T
  }
  if (isOperationalSeedDefaultSuppressed(store, key) && !isVisuallyEmptyDefault(defaultValue)) {
    return emptyStandIn(defaultValue)
  }
  return defaultValue
}
