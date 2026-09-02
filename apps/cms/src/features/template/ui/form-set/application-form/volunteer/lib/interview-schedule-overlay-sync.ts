import { useCallback, useSyncExternalStore } from 'react'
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

function getInterviewOverlayKeyPrefix(store: VolunteerInterviewOverlayStore): string {
  return store === 'recruit' ? 'recruit.volunteer.interview' : 'application.volunteer.interview'
}

export function buildVolunteerInterviewOverlayKey(
  store: VolunteerInterviewOverlayStore,
  suffix: string
): string {
  return `${getInterviewOverlayKeyPrefix(store)}.${suffix}`
}

export function useVolunteerInterviewOverlayKv<T>(
  store: VolunteerInterviewOverlayStore,
  suffix: string,
  defaultValue: T
): [T, (next: T) => void] {
  const applicationKey = buildVolunteerInterviewOverlayKey('application', suffix)
  const recruitKey = buildVolunteerInterviewOverlayKey('recruit', suffix)

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
  const value = (record[key] as T | undefined) ?? defaultValue

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
  updater: (prev: T | undefined) => T
): void {
  const key = buildVolunteerInterviewOverlayKey(store, suffix)
  if (store === 'recruit') {
    updateGeneralRecruitOverlayKey<T>(key, updater)
    return
  }
  updateGeneralApplicationOverlayKey<T>(key, updater)
}
