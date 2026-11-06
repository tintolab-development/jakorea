/**
 * 교육받은 교사 등록 위저드 공통정보 RHF sink.
 * FormProvider가 있을 때만 활성. 일반 / economy 와 인스턴스를 공유하지 않는다.
 */
import dayjs from 'dayjs'
import {
  applyTrainedTeachersApplicationOverlayRecord,
  isTrainedTeachersApplicationOverlayKey,
  persistableTrainedTeachersPreferredSchedules,
  readTrainedTeachersApplicationOverlayValue,
  serializeTrainedTeachersApplicationForFormVersion,
  splitTrainedTeachersApplicationOverlay,
} from './registration-rhf-application'
import {
  applyTrainedTeachersRecruitmentOverlayRecord,
  isTrainedTeachersRecruitmentOverlayKey,
  readTrainedTeachersRecruitmentOverlayValue,
  serializeTrainedTeachersRecruitmentForFormVersion,
  splitTrainedTeachersRecruitmentOverlay,
} from './registration-rhf-recruitment'
import type { TrainedTeachersRegistrationRhfValues } from './registration-rhf-values'

export type TrainedTeachersRegistrationRhfSetOptions = {
  shouldDirty?: boolean
}

export type TrainedTeachersRegistrationRhfApi = {
  getValues: () => TrainedTeachersRegistrationRhfValues
  getPath: (path: string) => unknown
  setPath: (path: string, value: unknown, options?: TrainedTeachersRegistrationRhfSetOptions) => void
  reset: (
    values: TrainedTeachersRegistrationRhfValues,
    options?: { keepDirty?: boolean; keepDefaultValues?: boolean }
  ) => void
  applyOverlayRecord: (
    overlay: Record<string, unknown>,
    options?: TrainedTeachersRegistrationRhfSetOptions
  ) => void
  isDirty: () => boolean
  markBaseline: () => void
}

let api: TrainedTeachersRegistrationRhfApi | null = null
const listeners = new Set<() => void>()
let notifying = false
let notifyScheduled = false

export function registerTrainedTeachersRegistrationRhf(
  next: TrainedTeachersRegistrationRhfApi | null
): void {
  api = next
  notifyTrainedTeachersRegistrationRhf()
}

export function peekTrainedTeachersRegistrationRhf(): TrainedTeachersRegistrationRhfApi | null {
  return api
}

export function isTrainedTeachersRegistrationRhfActive(): boolean {
  return api != null
}

export function subscribeTrainedTeachersRegistrationRhf(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifyTrainedTeachersRegistrationRhf(): void {
  if (notifying) return
  notifying = true
  try {
    listeners.forEach(listener => listener())
  } finally {
    notifying = false
  }
}

export function scheduleTrainedTeachersRegistrationRhfNotify(): void {
  if (notifyScheduled || notifying) return
  notifyScheduled = true
  queueMicrotask(() => {
    notifyScheduled = false
    notifyTrainedTeachersRegistrationRhf()
  })
}

export function readActiveTrainedTeachersRecruitmentOverlayValue(
  key: string,
  defaultValue: unknown
): unknown {
  const current = api
  if (current == null || !isTrainedTeachersRecruitmentOverlayKey(key)) return defaultValue
  const raw = readTrainedTeachersRecruitmentOverlayValue(current.getValues().recruitment, key)
  if (raw === undefined) {
    if (typeof defaultValue === 'number') return undefined
    return defaultValue
  }
  return raw
}

export function peekActiveTrainedTeachersRecruitmentOverlayRecord(): Record<string, unknown> | null {
  if (api == null) return null
  return serializeTrainedTeachersRecruitmentForFormVersion(api.getValues().recruitment)
}

/** TT 모집 overlay 키를 RHF에만 기록. store에 쓰지 않는다. 소비되지 않은 키를 반환한다. */
export function patchActiveTrainedTeachersRecruitmentOverlay(
  partial: Record<string, unknown>
): Record<string, unknown> {
  if (api == null) return partial
  const { recruitment, rest } = splitTrainedTeachersRecruitmentOverlay(partial)
  if (Object.keys(recruitment).length === 0) return partial
  const values = api.getValues()
  api.setPath(
    'recruitment',
    applyTrainedTeachersRecruitmentOverlayRecord(values.recruitment, recruitment),
    { shouldDirty: true }
  )
  return rest
}

function hydratePreferredSchedulesForUi(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw
  return raw.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { date: null, times: [] }
    }
    const rec = item as Record<string, unknown>
    const times = Array.isArray(rec.times)
      ? rec.times.map(time => {
          const row = time && typeof time === 'object' ? (time as Record<string, unknown>) : {}
          return {
            classPeriod: typeof row.classPeriod === 'string' ? row.classPeriod : '',
            start:
              typeof row.start === 'string' && row.start
                ? dayjs(row.start, 'HH:mm')
                : row.start ?? null,
            end:
              typeof row.end === 'string' && row.end ? dayjs(row.end, 'HH:mm') : row.end ?? null,
          }
        })
      : []
    return {
      date:
        typeof rec.date === 'string' && rec.date ? dayjs(rec.date, 'YYYY-MM-DD') : rec.date ?? null,
      session: typeof rec.session === 'string' ? rec.session : undefined,
      times,
    }
  })
}

let preferredSchedulesUiCache: { token: string; value: unknown } | null = null

export function readActiveTrainedTeachersApplicationOverlayValue(
  key: string,
  defaultValue: unknown
): unknown {
  const current = api
  if (current == null || !isTrainedTeachersApplicationOverlayKey(key)) return defaultValue
  const raw = readTrainedTeachersApplicationOverlayValue(current.getValues().application, key)
  if (raw === undefined) return defaultValue
  if (key !== 'application.trainedTeachers.preferredSchedules') return raw
  const token = JSON.stringify(persistableTrainedTeachersPreferredSchedules(raw))
  if (preferredSchedulesUiCache?.token === token) return preferredSchedulesUiCache.value
  const ui = hydratePreferredSchedulesForUi(raw)
  preferredSchedulesUiCache = { token, value: ui }
  return ui
}

export function peekActiveTrainedTeachersApplicationOverlayRecord(): Record<string, unknown> | null {
  if (api == null) return null
  return serializeTrainedTeachersApplicationForFormVersion(api.getValues().application)
}

/** TT 신청 overlay 키를 RHF에만 기록. store에 쓰지 않는다. 소비되지 않은 키를 반환한다. */
export function patchActiveTrainedTeachersApplicationOverlay(
  partial: Record<string, unknown>
): Record<string, unknown> {
  if (api == null) return partial
  const { application, rest } = splitTrainedTeachersApplicationOverlay(partial)
  if (Object.keys(application).length === 0) return partial
  const values = api.getValues()
  preferredSchedulesUiCache = null
  api.reset(
    {
      ...values,
      application: applyTrainedTeachersApplicationOverlayRecord(values.application, application),
    },
    { keepDefaultValues: true }
  )
  return rest
}
