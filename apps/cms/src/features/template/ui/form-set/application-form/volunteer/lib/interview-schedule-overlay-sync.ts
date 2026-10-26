import { useCallback, useRef, useSyncExternalStore } from 'react'
import dayjs from 'dayjs'
import {
  getGeneralApplicationOverlayRecord,
  patchGeneralApplicationOverlay,
  replaceGeneralApplicationOverlay,
  subscribeGeneralApplicationOverlay,
  updateGeneralApplicationOverlayKey,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  getGeneralRecruitOverlayScope,
  patchGeneralRecruitOverlay,
  patchGeneralRecruitOverlayForScope,
  readLiveGeneralRecruitOverlayRecord,
  replaceGeneralRecruitOverlay,
  subscribeGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { readOperationalOverlayKvValue } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import {
  peekGeneralRegistrationWizardRhf,
  subscribeGeneralRegistrationWizardRhf,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import {
  getRecruitTypedInterviewRecord,
  patchRecruitTypedInterviewBridgeRecord,
  subscribeRecruitTypedInterviewBridge,
} from '@/features/program/shared/lib/recruit-typed-interview-record-bridge'
import {
  buildVolunteerInterviewOverlayKey,
  getInterviewOverlayKeyPrefix,
  type VolunteerInterviewOverlayStore,
} from './interview-schedule-overlay-keys'
import { exceptionBlockKeyPrefix } from './interview-exception-overlay-blocks'

export {
  buildVolunteerInterviewOverlayKey,
  type VolunteerInterviewOverlayStore,
} from './interview-schedule-overlay-keys'

export {
  listFilledVolunteerInterviewExceptionBlockIds,
  listVolunteerInterviewExceptionBlockIds,
  readVolunteerInterviewExceptionOverlayBlocks,
  reconcileVolunteerInterviewExceptionBlockKeys,
  type VolunteerInterviewExceptionOverlayBlock,
} from './interview-exception-overlay-blocks'

const VOLUNTEER_RECRUIT_CATALOG = 'recruitment-volunteer'

/** 모집 면접 슬롯 — 활성 편집은 typed 브리지, Template authoring은 typed 상태로 반영한다. */

function sameInterviewBridgeValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (left == null || right == null || typeof left !== 'object' || typeof right !== 'object') {
    return false
  }
  return JSON.stringify(left) === JSON.stringify(right)
}

function patchRecruitVolunteerInterviewOverlay(partial: Record<string, unknown>): void {
  if (patchRecruitTypedInterviewBridgeRecord(partial, sameInterviewBridgeValue)) {
    return
  }
  patchGeneralRecruitOverlay(partial)
  const activeScope = getGeneralRecruitOverlayScope()
  if (activeScope !== VOLUNTEER_RECRUIT_CATALOG) {
    patchGeneralRecruitOverlayForScope(VOLUNTEER_RECRUIT_CATALOG, partial)
  }
  if (
    activeScope.startsWith('recruitment-volunteer') &&
    activeScope !== VOLUNTEER_RECRUIT_CATALOG
  ) {
    patchGeneralRecruitOverlayForScope(activeScope, partial)
  }
}

export {
  getRecruitTypedInterviewRecord,
  setRecruitTypedInterviewRecordBridge,
} from '@/features/program/shared/lib/recruit-typed-interview-record-bridge'

function liveInterviewRecord(store: VolunteerInterviewOverlayStore): Record<string, unknown> {
  const recruitTypedInterviewBridgeRecord = getRecruitTypedInterviewRecord()
  if (store === 'recruit' && recruitTypedInterviewBridgeRecord) {
    return recruitTypedInterviewBridgeRecord
  }
  return store === 'recruit'
    ? readLiveGeneralRecruitOverlayRecord()
    : getGeneralApplicationOverlayRecord()
}

export function serializeVolunteerInterviewOverlayValue(value: unknown): unknown {
  if (value == null) return value
  if (dayjs.isDayjs(value)) return value.isValid() ? value.toISOString() : null
  if (Array.isArray(value)) return value.map(item => serializeVolunteerInterviewOverlayValue(item))
  return value
}

export function persistMissingVolunteerInterviewOverlayDefaults(args: {
  store: VolunteerInterviewOverlayStore
  namespace?: string
  values: Record<string, unknown>
  typedTemplateAuthoring?: boolean
}): void {
  const record = liveInterviewRecord(args.store)
  const patch: Record<string, unknown> = {}
  for (const [suffix, value] of Object.entries(args.values)) {
    if (value === undefined) continue
    // The typed recruitment contract persists the range, not the transient start instant.
    // Keeping this out of the bridge also prevents the authoring effect from re-patching it.
    if (args.typedTemplateAuthoring && suffix === 'interviewTime') continue
    const key = buildVolunteerInterviewOverlayKey(args.store, suffix, args.namespace)
    if (record[key] !== undefined) continue
    patch[key] = serializeVolunteerInterviewOverlayValue(value)
  }
  if (Object.keys(patch).length === 0) return
  if (args.store === 'recruit') {
    patchRecruitVolunteerInterviewOverlay(patch)
    return
  }
  patchGeneralApplicationOverlay(patch)
}

export function readVolunteerInterviewLiveRecord(
  store: VolunteerInterviewOverlayStore
): Record<string, unknown> {
  return liveInterviewRecord(store)
}

export function useVolunteerInterviewOverlayKv<T>(
  store: VolunteerInterviewOverlayStore,
  suffix: string,
  defaultValue: T,
  namespace?: string
): [T, (next: T) => void] {
  const applicationKey = buildVolunteerInterviewOverlayKey('application', suffix, namespace)
  const recruitKey = buildVolunteerInterviewOverlayKey('recruit', suffix, namespace)
  const key = store === 'recruit' ? recruitKey : applicationKey

  const defaultRef = useRef(defaultValue)
  const snapshotRef = useRef<T>(defaultValue)
  const getSnapshot = useCallback(() => {
    const next = readOperationalOverlayKvValue(
      store === 'recruit' ? 'general-recruit' : 'general-application',
      liveInterviewRecord(store),
      key,
      defaultRef.current
    )
    if (Object.is(snapshotRef.current, next)) return snapshotRef.current
    if (Array.isArray(snapshotRef.current) && Array.isArray(next)) {
      const prevItems = snapshotRef.current
      if (
        prevItems.length === next.length &&
        prevItems.every((item, index) => Object.is(item, next[index]))
      ) {
        return snapshotRef.current
      }
    }
    snapshotRef.current = next
    return next
  }, [key, store])

  const value = useSyncExternalStore(
    listener => {
      const unsubStore =
        store === 'recruit'
          ? subscribeGeneralRecruitOverlay(listener)
          : subscribeGeneralApplicationOverlay(listener)
      const unsubRhf = subscribeGeneralRegistrationWizardRhf(listener)
      const unsubBridge =
        store === 'recruit' ? subscribeRecruitTypedInterviewBridge(listener) : () => {}
      return () => {
        unsubStore()
        unsubRhf()
        unsubBridge()
      }
    },
    getSnapshot,
    getSnapshot
  )

  const setValue = useCallback(
    (next: T) => {
      const serialized = serializeVolunteerInterviewOverlayValue(next) as T
      if (store === 'recruit') {
        patchRecruitVolunteerInterviewOverlay({ [recruitKey]: serialized })
        return
      }
      patchGeneralApplicationOverlay({ [applicationKey]: serialized })
    },
    [applicationKey, recruitKey, store]
  )

  return [value, setValue]
}

export function updateVolunteerInterviewOverlayKey<T>(
  store: VolunteerInterviewOverlayStore,
  suffix: string,
  updater: (prev: T | undefined) => T,
  namespace?: string
): void {
  const key = buildVolunteerInterviewOverlayKey(store, suffix, namespace)
  const wrap = (prev: T | undefined) => serializeVolunteerInterviewOverlayValue(updater(prev)) as T
  if (store === 'recruit') {
    const live = liveInterviewRecord('recruit')
    const next = wrap(live[key] as T | undefined)
    patchRecruitVolunteerInterviewOverlay({ [key]: next })
    return
  }
  updateGeneralApplicationOverlayKey<T>(key, wrap)
}

/** Part3 5단계: 면접 기간 키는 봉사자 모집 RHF 필드 폼이 소유한다. */
export {
  VOLUNTEER_INTERVIEW_RANGE_SEAL_KEY,
  syncVolunteerInterviewRangeSealOverlay,
} from '@/features/template/ui/form-set/recruit-form/volunteer/volunteer-recruit-form-rhf'

export function removeVolunteerInterviewExceptionBlock(args: {
  store: VolunteerInterviewOverlayStore
  namespace?: string
  blockKey: number
}): void {
  const prefix = exceptionBlockKeyPrefix(args.store, args.namespace, args.blockKey)
  const record = liveInterviewRecord(args.store)
  const next: Record<string, unknown> = {}
  let changed = false
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith(prefix)) {
      changed = true
      continue
    }
    next[key] = value
  }
  if (args.store === 'recruit') {
    const rhf = peekGeneralRegistrationWizardRhf()
    if (rhf != null) {
      const recruitmentKv = { ...rhf.getValues().recruitmentKv }
      let rhfChanged = false
      for (const key of Object.keys(recruitmentKv)) {
        if (!key.startsWith(prefix)) continue
        delete recruitmentKv[key]
        rhfChanged = true
      }
      if (rhfChanged) {
        rhf.setPath('recruitmentKv', recruitmentKv, { shouldDirty: true })
        changed = true
      }
    }
    if (!changed) return
    replaceGeneralRecruitOverlay(next)
    return
  }
  if (!changed) return
  replaceGeneralApplicationOverlay(next)
}

/** 저장된 overlay 중 live에 없는 면접 일정 키만 채운다. 편집 중인 값은 덮지 않는다. */
export function hydrateMissingVolunteerInterviewOverlay(args: {
  source: Record<string, unknown> | undefined
  store: VolunteerInterviewOverlayStore
  namespace?: string
  /**
   * 네임스페이스의 형제 키처럼 prefix에 포함되지 않지만 같은 화면이
   * 직접 읽는 canonical overlay 키. 이미 live 값이 있으면 덮어쓰지 않는다.
   */
  additionalKeys?: readonly string[]
}): void {
  if (args.source == null) return
  const prefix = `${getInterviewOverlayKeyPrefix(args.store, args.namespace)}.`
  const additionalKeys = new Set(args.additionalKeys ?? [])
  const live = liveInterviewRecord(args.store)
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(args.source)) {
    if (!key.startsWith(prefix) && !additionalKeys.has(key)) continue
    if (live[key] !== undefined) continue
    patch[key] = value
  }
  if (Object.keys(patch).length === 0) return
  if (args.store === 'recruit') {
    patchRecruitVolunteerInterviewOverlay(patch)
    return
  }
  patchGeneralApplicationOverlay(patch)
}
