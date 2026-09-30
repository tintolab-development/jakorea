import { useCallback, useRef, useSyncExternalStore } from 'react'
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
      if (store === 'recruit') {
        patchGeneralRecruitOverlay({ [recruitKey]: next })
        return
      }
      patchGeneralApplicationOverlay({ [applicationKey]: next })
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
  if (store === 'recruit') {
    updateGeneralRecruitOverlayKey<T>(key, updater)
    return
  }
  updateGeneralApplicationOverlayKey<T>(key, updater)
}
