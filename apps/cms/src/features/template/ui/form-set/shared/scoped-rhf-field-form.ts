/**
 * 양식(templateCode)별 RHF 필드 폼 — overlay 스토어에서 키 묶음을 떼어 RHF로 옮길 때 쓰는 공용 백엔드.
 *
 * - 양식마다 `createFormControl` 하나. 값은 `fields[<encoded key>]` 에 둔다.
 *   (저장 키에 `.` 이 있어 RHF 경로로 그대로 쓰면 중첩·배열 해석이 생기므로 `.` → `~` 로 바꿔 평평하게 둔다.)
 * - 직렬화(`peekRecord`/`getRecord`)는 저장 키 그대로의 점 표기 레코드다. 없는 키는 없는 채로, null 은 null 로 둔다.
 * - 입력은 `setValue(..., { shouldDirty: true })`, 불러오기·초기화는 `reset`.
 */
import { createFormControl } from 'react-hook-form'

type FieldValues = { fields: Record<string, unknown> }
type FieldFormControl = ReturnType<typeof createFormControl<FieldValues>>

const DEFAULT_SCOPE = '__default__'

function normalizeScope(templateCode: string | undefined | null): string {
  const next = templateCode?.trim() ?? ''
  return next === '' ? DEFAULT_SCOPE : next
}

const encodeKey = (key: string) => key.replace(/\./g, '~')
const decodeKey = (name: string) => name.replace(/~/g, '.')

export type ScopedRhfFieldForm = {
  ownsKey: (key: string) => boolean
  /** 소유 키 / 나머지로 나눈다 */
  split: (record: Record<string, unknown>) => {
    owned: Record<string, unknown>
    rest: Record<string, unknown>
  }
  setScope: (templateCode: string | undefined | null) => void
  getScope: () => string
  getForm: (templateCode?: string | undefined | null) => FieldFormControl
  getRecord: () => Record<string, unknown>
  peekRecord: (templateCode: string | undefined | null) => Record<string, unknown>
  hasValues: (templateCode?: string | undefined | null) => boolean
  getVersion: () => number
  subscribe: (listener: () => void) => () => void
  subscribeKey: (key: string, listener: () => void) => () => void
  /** 활성 양식 입력(소유 키만 받는다) */
  patch: (partial: Record<string, unknown>) => void
  patchFor: (templateCode: string | undefined | null, partial: Record<string, unknown>) => void
  updateKey: <T>(key: string, updater: (prev: T | undefined) => T) => void
  /** 활성 양식 값을 통째로 교체(소유 키만 남는다) */
  replace: (next: Record<string, unknown>) => void
  replaceFor: (templateCode: string | undefined | null, next: Record<string, unknown>) => void
  reset: () => void
  resetFor: (templateCode: string | undefined | null) => void
  resetAll: () => void
}

export function createScopedRhfFieldForm(options: {
  ownsKey: (key: string) => boolean
}): ScopedRhfFieldForm {
  const forms = new Map<string, FieldFormControl>()
  const recordCache = new Map<string, { version: number; record: Record<string, unknown> }>()
  let activeScope = DEFAULT_SCOPE
  let version = 0
  const listeners = new Set<() => void>()
  const keyListeners = new Map<string, Set<() => void>>()

  function notify(changedKeys?: Iterable<string>) {
    version += 1
    const notified = new Set<() => void>()
    if (changedKeys != null) {
      for (const key of changedKeys) keyListeners.get(key)?.forEach(l => notified.add(l))
    } else {
      keyListeners.forEach(set => set.forEach(l => notified.add(l)))
    }
    listeners.forEach(l => notified.add(l))
    notified.forEach(l => l())
  }

  function ensureForm(scope: string): FieldFormControl {
    let form = forms.get(scope)
    if (form == null) {
      form = createFormControl<FieldValues>({ defaultValues: { fields: {} } })
      // createFormControl 은 마운트 전 setValue 를 무시한다 — reset 으로 값 상태를 확정해 둔다.
      form.reset({ fields: {} })
      forms.set(scope, form)
    }
    return form
  }

  function fieldsOf(scope: string): Record<string, unknown> {
    return (ensureForm(scope).getValues('fields') ?? {}) as Record<string, unknown>
  }

  function serialize(scope: string): Record<string, unknown> {
    const cached = recordCache.get(scope)
    if (cached != null && cached.version === version) return cached.record
    const record: Record<string, unknown> = {}
    for (const [name, value] of Object.entries(fieldsOf(scope))) record[decodeKey(name)] = value
    recordCache.set(scope, { version, record })
    return record
  }

  function split(record: Record<string, unknown>) {
    const owned: Record<string, unknown> = {}
    const rest: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(record)) {
      if (options.ownsKey(key)) owned[key] = value
      else rest[key] = value
    }
    return { owned, rest }
  }

  function resetScope(scope: string, record: Record<string, unknown>) {
    const fields: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(record)) {
      if (options.ownsKey(key)) fields[encodeKey(key)] = value
    }
    ensureForm(scope).reset({ fields })
  }

  function patchScope(scope: string, partial: Record<string, unknown>) {
    const form = ensureForm(scope)
    const current = fieldsOf(scope)
    const changed: string[] = []
    for (const [key, value] of Object.entries(partial)) {
      if (!options.ownsKey(key)) continue
      const name = encodeKey(key)
      if (Object.prototype.hasOwnProperty.call(current, name) && Object.is(current[name], value)) {
        continue
      }
      form.setValue(`fields.${name}`, value, { shouldDirty: true })
      changed.push(key)
    }
    if (changed.length > 0) notify(changed)
  }

  ensureForm(activeScope)

  return {
    ownsKey: options.ownsKey,
    split,
    setScope(templateCode) {
      const next = normalizeScope(templateCode)
      ensureForm(next)
      if (next === activeScope) return
      activeScope = next
      notify()
    },
    getScope: () => activeScope,
    getForm: templateCode =>
      ensureForm(templateCode === undefined ? activeScope : normalizeScope(templateCode)),
    getRecord: () => serialize(activeScope),
    peekRecord: templateCode => serialize(normalizeScope(templateCode)),
    hasValues: templateCode =>
      Object.keys(fieldsOf(templateCode === undefined ? activeScope : normalizeScope(templateCode)))
        .length > 0,
    getVersion: () => version,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    subscribeKey(key, listener) {
      let set = keyListeners.get(key)
      if (set == null) {
        set = new Set()
        keyListeners.set(key, set)
      }
      set.add(listener)
      return () => {
        set?.delete(listener)
        if (set != null && set.size === 0) keyListeners.delete(key)
      }
    },
    patch: partial => patchScope(activeScope, partial),
    patchFor: (templateCode, partial) => patchScope(normalizeScope(templateCode), partial),
    updateKey(key, updater) {
      if (!options.ownsKey(key)) return
      const prev = fieldsOf(activeScope)[encodeKey(key)]
      const next = updater(prev as never)
      if (Object.is(prev, next)) return
      ensureForm(activeScope).setValue(`fields.${encodeKey(key)}`, next, { shouldDirty: true })
      notify([key])
    },
    replace(next) {
      resetScope(activeScope, next)
      notify()
    },
    replaceFor(templateCode, next) {
      const scope = normalizeScope(templateCode)
      resetScope(scope, next)
      notify()
    },
    reset() {
      if (Object.keys(fieldsOf(activeScope)).length === 0) return
      resetScope(activeScope, {})
      notify()
    },
    resetFor(templateCode) {
      const scope = normalizeScope(templateCode)
      if (Object.keys(fieldsOf(scope)).length === 0) return
      resetScope(scope, {})
      notify()
    },
    resetAll() {
      forms.clear()
      recordCache.clear()
      activeScope = DEFAULT_SCOPE
      ensureForm(activeScope)
      notify()
    },
  }
}

/** overlay 스토어(구조 타입) — 소유 키를 RHF 필드 폼으로 넘기는 합성 대상 */
export type OverlayStoreLike = {
  setScope: (templateCode: string | undefined | null) => void
  getScope: () => string
  getRecord: () => Record<string, unknown>
  peekRecord: (templateCode: string | undefined | null) => Record<string, unknown>
  getVersion: () => number
  subscribe: (listener: () => void) => () => void
  subscribeKey: (key: string, listener: () => void) => () => void
  patch: (partial: Record<string, unknown>) => void
  updateKey: <T>(key: string, updater: (prev: T | undefined) => T) => void
  replace: (next: Record<string, unknown>) => void
  replaceFor: (templateCode: string | undefined | null, next: Record<string, unknown>) => void
  reset: () => void
  resetFor: (templateCode: string | undefined | null) => void
  resetAll: () => void
}

/**
 * overlay 스토어 + RHF 필드 폼 합성.
 * 소유 키 입력·불러오기는 RHF 필드 폼으로만 가고, 스토어 버킷에는 남지 않는다.
 * 읽기는 스토어 레코드 뒤에 RHF 직렬화 값을 덧붙인다(소유 키가 하나도 없으면 스토어 레코드를 그대로 돌려줘 참조가 바뀌지 않는다).
 */
export function composeOverlayStoreWithFieldForms(
  store: OverlayStoreLike,
  forms: readonly ScopedRhfFieldForm[]
): OverlayStoreLike {
  const mergedCache = new WeakMap<
    Record<string, unknown>,
    { parts: Record<string, unknown>[]; merged: Record<string, unknown> }
  >()

  function merge(base: Record<string, unknown>, parts: Record<string, unknown>[]) {
    const nonEmpty = parts.filter(part => Object.keys(part).length > 0)
    if (nonEmpty.length === 0) return base
    const cached = mergedCache.get(base)
    if (
      cached != null &&
      cached.parts.length === nonEmpty.length &&
      cached.parts.every((part, index) => part === nonEmpty[index])
    ) {
      return cached.merged
    }
    const merged: Record<string, unknown> = { ...base }
    for (const part of nonEmpty) Object.assign(merged, part)
    mergedCache.set(base, { parts: nonEmpty, merged })
    return merged
  }

  function splitAll(record: Record<string, unknown>) {
    let rest = record
    const owned = forms.map(form => {
      const result = form.split(rest)
      rest = result.rest
      return result.owned
    })
    return { owned, rest }
  }

  const ownerOf = (key: string) => forms.find(form => form.ownsKey(key))

  /*
   * 키 순서 보존: 예전 단일 스토어는 replace 때 넘긴 순서, patch·updateKey 때는 새 키를 뒤에 붙였다.
   * 합성 뒤에도 직렬화(extensionJson 문자열) 순서가 같도록 양식(scope)별 키 순서를 따로 기억한다.
   */
  const orderByScope = new Map<string, string[]>()
  let orderVersion = 0
  const orderedCache = new WeakMap<Record<string, unknown>, { version: number; result: Record<string, unknown> }>()

  function rawPeek(scope: string): Record<string, unknown> {
    return merge(
      store.peekRecord(scope),
      forms.map(form => form.peekRecord(scope))
    )
  }

  function foldExtras(scope: string): void {
    const merged = rawPeek(scope)
    const list = (orderByScope.get(scope) ?? []).filter(key =>
      Object.prototype.hasOwnProperty.call(merged, key)
    )
    const known = new Set(list)
    for (const key of Object.keys(merged)) {
      if (!known.has(key)) list.push(key)
    }
    commitOrder(scope, list)
  }

  function commitOrder(scope: string, list: string[]): void {
    const prev = orderByScope.get(scope) ?? []
    if (prev.length === list.length && prev.every((key, index) => key === list[index])) return
    orderByScope.set(scope, list)
    orderVersion += 1
  }

  function appendPresent(scope: string, keys: readonly string[]): void {
    const merged = rawPeek(scope)
    const list = [...(orderByScope.get(scope) ?? [])]
    const known = new Set(list)
    for (const key of keys) {
      if (known.has(key) || !Object.prototype.hasOwnProperty.call(merged, key)) continue
      list.push(key)
      known.add(key)
    }
    commitOrder(scope, list)
  }

  function setOrder(scope: string, keys: readonly string[]): void {
    commitOrder(scope, [...keys])
  }

  function ordered(scope: string, merged: Record<string, unknown>): Record<string, unknown> {
    const list = orderByScope.get(scope)
    if (list == null || list.length === 0) return merged
    const cached = orderedCache.get(merged)
    if (cached != null && cached.version === orderVersion) return cached.result
    const keys = list.filter(key => Object.prototype.hasOwnProperty.call(merged, key))
    const known = new Set(keys)
    for (const key of Object.keys(merged)) {
      if (!known.has(key)) keys.push(key)
    }
    const current = Object.keys(merged)
    const same = current.length === keys.length && current.every((key, index) => key === keys[index])
    const result = same ? merged : Object.fromEntries(keys.map(key => [key, merged[key]]))
    orderedCache.set(merged, { version: orderVersion, result })
    return result
  }

  return {
    setScope(templateCode) {
      store.setScope(templateCode)
      forms.forEach(form => form.setScope(templateCode))
    },
    getScope: () => store.getScope(),
    getRecord: () =>
      ordered(
        store.getScope(),
        merge(
          store.getRecord(),
          forms.map(form => form.getRecord())
        )
      ),
    peekRecord: templateCode =>
      ordered(normalizeScope(templateCode), rawPeek(normalizeScope(templateCode))),
    getVersion: () => forms.reduce((sum, form) => sum + form.getVersion(), store.getVersion()),
    subscribe(listener) {
      const unsubs = [store.subscribe(listener), ...forms.map(form => form.subscribe(listener))]
      return () => unsubs.forEach(unsub => unsub())
    },
    subscribeKey(key, listener) {
      const owner = ownerOf(key)
      return owner != null ? owner.subscribeKey(key, listener) : store.subscribeKey(key, listener)
    },
    patch(partial) {
      const scope = store.getScope()
      foldExtras(scope)
      const { owned, rest } = splitAll(partial)
      if (Object.keys(rest).length > 0) store.patch(rest)
      forms.forEach((form, index) => form.patch(owned[index] ?? {}))
      appendPresent(scope, Object.keys(partial))
    },
    updateKey(key, updater) {
      const scope = store.getScope()
      foldExtras(scope)
      const owner = ownerOf(key)
      if (owner != null) owner.updateKey(key, updater)
      else store.updateKey(key, updater)
      appendPresent(scope, [key])
    },
    replace(next) {
      const { owned, rest } = splitAll(next)
      store.replace(rest)
      forms.forEach((form, index) => form.replace(owned[index] ?? {}))
      setOrder(store.getScope(), Object.keys(next))
    },
    replaceFor(templateCode, next) {
      const { owned, rest } = splitAll(next)
      store.replaceFor(templateCode, rest)
      forms.forEach((form, index) => form.replaceFor(templateCode, owned[index] ?? {}))
      setOrder(normalizeScope(templateCode), Object.keys(next))
    },
    reset() {
      store.reset()
      forms.forEach(form => form.reset())
      setOrder(store.getScope(), [])
    },
    resetFor(templateCode) {
      store.resetFor(templateCode)
      forms.forEach(form => form.resetFor(templateCode))
      setOrder(normalizeScope(templateCode), [])
    },
    resetAll() {
      store.resetAll()
      forms.forEach(form => form.resetAll())
      orderByScope.clear()
      orderVersion += 1
    },
  }
}
