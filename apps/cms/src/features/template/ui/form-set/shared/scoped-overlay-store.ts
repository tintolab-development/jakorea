/**
 * 운영 양식 overlay — templateCode별 인메모리 버킷.
 * persist 키(`recruitInstructor.detailInfo.*` 등)는 그대로 두고, 활성 스코프만 갈라진다.
 */

export const DEFAULT_OPERATIONAL_OVERLAY_SCOPE = '__default__'

export function normalizeOperationalOverlayScope(
  templateCode: string | undefined | null
): string {
  const next = templateCode?.trim() ?? ''
  return next === '' ? DEFAULT_OPERATIONAL_OVERLAY_SCOPE : next
}

export type ScopedOverlayStore = {
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
  /** 모든 양식 버킷 삭제 — 등록 위저드 종료·신규 시작 */
  resetAll: () => void
  resetAllForTests: () => void
}

export function createScopedOverlayStore(options?: {
  createEmpty?: () => Record<string, unknown>
  onRecordChange?: (record: Record<string, unknown>) => void
}): ScopedOverlayStore {
  const buckets = new Map<string, Record<string, unknown>>()
  let activeScope = DEFAULT_OPERATIONAL_OVERLAY_SCOPE
  let overlayVersion = 0
  const overlayListeners = new Set<() => void>()
  const overlayKeyListeners = new Map<string, Set<() => void>>()

  function emptyRecord(): Record<string, unknown> {
    return options?.createEmpty?.() ?? {}
  }

  function ensureBucket(scope: string): Record<string, unknown> {
    let bucket = buckets.get(scope)
    if (bucket == null) {
      bucket = emptyRecord()
      buckets.set(scope, bucket)
    }
    return bucket
  }

  function notify(changedKeys?: Iterable<string>) {
    overlayVersion += 1
    const notified = new Set<() => void>()
    if (changedKeys != null) {
      for (const key of changedKeys) {
        overlayKeyListeners.get(key)?.forEach(listener => notified.add(listener))
      }
    } else {
      overlayKeyListeners.forEach(listeners => listeners.forEach(listener => notified.add(listener)))
    }
    overlayListeners.forEach(listener => notified.add(listener))
    notified.forEach(listener => listener())
  }

  function commit(next: Record<string, unknown>, changedKeys?: Iterable<string>) {
    buckets.set(activeScope, next)
    options?.onRecordChange?.(next)
    notify(changedKeys)
  }

  ensureBucket(activeScope)

  function clearAllBuckets() {
    buckets.clear()
    activeScope = DEFAULT_OPERATIONAL_OVERLAY_SCOPE
    buckets.set(activeScope, emptyRecord())
    notify()
  }

  return {
    setScope(templateCode) {
      const next = normalizeOperationalOverlayScope(templateCode)
      if (next === activeScope) {
        ensureBucket(next)
        return
      }
      activeScope = next
      ensureBucket(next)
      notify()
    },
    getScope() {
      return activeScope
    },
    getRecord() {
      return ensureBucket(activeScope)
    },
    peekRecord(templateCode) {
      return ensureBucket(normalizeOperationalOverlayScope(templateCode))
    },
    getVersion() {
      return overlayVersion
    },
    subscribe(listener) {
      overlayListeners.add(listener)
      return () => overlayListeners.delete(listener)
    },
    subscribeKey(key, listener) {
      let listeners = overlayKeyListeners.get(key)
      if (listeners == null) {
        listeners = new Set()
        overlayKeyListeners.set(key, listeners)
      }
      listeners.add(listener)
      return () => {
        listeners?.delete(listener)
        if (listeners != null && listeners.size === 0) {
          overlayKeyListeners.delete(key)
        }
      }
    },
    patch(partial) {
      const overlayState = ensureBucket(activeScope)
      const changedKeys: string[] = []
      const next: Record<string, unknown> = { ...overlayState }
      for (const [key, value] of Object.entries(partial)) {
        if (Object.is(overlayState[key], value)) continue
        next[key] = value
        changedKeys.push(key)
      }
      if (changedKeys.length === 0) return
      commit(next, changedKeys)
    },
    updateKey(key, updater) {
      const overlayState = ensureBucket(activeScope)
      const prev = overlayState[key]
      const nextValue = updater(prev as never)
      if (Object.is(prev, nextValue)) return
      commit({ ...overlayState, [key]: nextValue }, [key])
    },
    replace(next) {
      commit({ ...next })
    },
    replaceFor(templateCode, next) {
      const scope = normalizeOperationalOverlayScope(templateCode)
      const record = { ...next }
      buckets.set(scope, record)
      if (scope === activeScope) {
        options?.onRecordChange?.(record)
        notify()
      }
    },
    reset() {
      const overlayState = ensureBucket(activeScope)
      const empty = emptyRecord()
      if (Object.keys(overlayState).length === 0 && Object.keys(empty).length === 0) return
      commit(empty)
    },
    resetFor(templateCode) {
      const scope = normalizeOperationalOverlayScope(templateCode)
      const empty = emptyRecord()
      const overlayState = ensureBucket(scope)
      if (Object.keys(overlayState).length === 0 && Object.keys(empty).length === 0) return
      buckets.set(scope, empty)
      if (scope === activeScope) {
        options?.onRecordChange?.(empty)
        notify()
      }
    },
    resetAll: clearAllBuckets,
    resetAllForTests: clearAllBuckets,
  }
}
