import { useCallback, useRef, useSyncExternalStore } from 'react'
import dayjs from 'dayjs'
import {
  getGeneralApplicationOverlayRecord,
  getGeneralApplicationOverlayVersion,
  patchGeneralApplicationOverlay,
  subscribeGeneralApplicationOverlay,
  updateGeneralApplicationOverlayKey,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  getGeneralRecruitOverlayRecord,
  getGeneralRecruitOverlayVersion,
  patchGeneralRecruitOverlay,
  subscribeGeneralRecruitOverlay,
  updateGeneralRecruitOverlayKey,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

export type VolunteerInterviewOverlayStore = 'application' | 'recruit'

function getInterviewOverlayKeyPrefix(
  store: VolunteerInterviewOverlayStore,
  namespace?: string
): string {
  if (namespace?.trim()) return namespace.trim()
  return store === 'recruit' ? 'recruit.volunteer.interview' : 'application.volunteer.interview'
}

export function buildVolunteerInterviewOverlayKey(
  store: VolunteerInterviewOverlayStore,
  suffix: string,
  namespace?: string
): string {
  return `${getInterviewOverlayKeyPrefix(store, namespace)}.${suffix}`
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
}): void {
  const record =
    args.store === 'recruit' ? getGeneralRecruitOverlayRecord() : getGeneralApplicationOverlayRecord()
  const patch: Record<string, unknown> = {}
  for (const [suffix, value] of Object.entries(args.values)) {
    if (value === undefined) continue
    const key = buildVolunteerInterviewOverlayKey(args.store, suffix, args.namespace)
    if (record[key] !== undefined) continue
    patch[key] = serializeVolunteerInterviewOverlayValue(value)
  }
  if (Object.keys(patch).length === 0) return
  if (args.store === 'recruit') {
    patchGeneralRecruitOverlay(patch)
    return
  }
  patchGeneralApplicationOverlay(patch)
}

export function useVolunteerInterviewOverlayKv<T>(
  store: VolunteerInterviewOverlayStore,
  suffix: string,
  defaultValue: T,
  namespace?: string
): [T, (next: T) => void] {
  const applicationKey = buildVolunteerInterviewOverlayKey('application', suffix, namespace)
  const recruitKey = buildVolunteerInterviewOverlayKey('recruit', suffix, namespace)

  const defaultRef = useRef(defaultValue)
  const applicationVersion = useSyncExternalStore(
    subscribeGeneralApplicationOverlay,
    getGeneralApplicationOverlayVersion,
    getGeneralApplicationOverlayVersion
  )
  const recruitVersion = useSyncExternalStore(
    subscribeGeneralRecruitOverlay,
    getGeneralRecruitOverlayVersion,
    getGeneralRecruitOverlayVersion
  )

  void applicationVersion
  void recruitVersion

  const applicationRecord = getGeneralApplicationOverlayRecord()
  const recruitRecord = getGeneralRecruitOverlayRecord()
  const key = store === 'recruit' ? recruitKey : applicationKey
  const record = store === 'recruit' ? recruitRecord : applicationRecord
  const value = (record[key] as T | undefined) ?? defaultRef.current

  const setValue = useCallback(
    (next: T) => {
      const serialized = serializeVolunteerInterviewOverlayValue(next) as T
      if (store === 'recruit') {
        patchGeneralRecruitOverlay({ [recruitKey]: serialized })
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
    updateGeneralRecruitOverlayKey<T>(key, wrap)
    return
  }
  updateGeneralApplicationOverlayKey<T>(key, wrap)
}
