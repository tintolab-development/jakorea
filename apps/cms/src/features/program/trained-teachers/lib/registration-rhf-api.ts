/**
 * 교육받은 교사 등록 위저드 공통정보 RHF sink.
 * FormProvider가 있을 때만 활성. 일반 / economy 와 인스턴스를 공유하지 않는다.
 */
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
  listeners.forEach(listener => listener())
}

export function readActiveTrainedTeachersRecruitmentOverlayValue(
  key: string,
  defaultValue: unknown
): unknown {
  const current = api
  if (current == null || !isTrainedTeachersRecruitmentOverlayKey(key)) return defaultValue
  const raw = readTrainedTeachersRecruitmentOverlayValue(current.getValues().recruitment, key)
  return raw === undefined ? defaultValue : raw
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
  api.reset(
    {
      ...values,
      recruitment: applyTrainedTeachersRecruitmentOverlayRecord(values.recruitment, recruitment),
    },
    { keepDefaultValues: true }
  )
  return rest
}
