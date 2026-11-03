/**
 * 1사1교 등록 위저드 공통정보 RHF sink.
 * FormProvider가 있을 때만 활성. 일반 / TT 와 인스턴스를 공유하지 않는다.
 */
import dayjs from 'dayjs'
import {
  applyCompanySchoolRecruitmentOverlayRecord,
  isCompanySchoolInstitutionRecruitmentOverlayKey,
  readCompanySchoolRecruitmentOverlayValue,
  serializeCompanySchoolRecruitmentForFormVersion,
  splitCompanySchoolRecruitmentOverlay,
} from './registration-rhf-recruitment'
import {
  applyCompanySchoolInstructorRecruitmentOverlayRecord,
  isCompanySchoolInstructorRecruitmentOverlayKey,
  readCompanySchoolInstructorRecruitmentOverlayValue,
  serializeCompanySchoolInstructorRecruitmentForFormVersion,
  splitCompanySchoolInstructorRecruitmentOverlay,
} from './registration-rhf-instructor-recruitment'
import {
  applyCompanySchoolApplicationOverlayRecord,
  isCompanySchoolApplicationOverlayKey,
  persistCompanySchoolPreferredScheduleBlock,
  readCompanySchoolApplicationOverlayValue,
  serializeCompanySchoolApplicationForFormVersion,
  scheduleBlockToken,
  splitCompanySchoolApplicationOverlay,
} from './registration-rhf-application'
import type { CompanySchoolPreferredScheduleBlock } from './registration-canonical-types'
import type { CompanySchoolRegistrationRhfValues } from './registration-rhf-values'

export type CompanySchoolRegistrationRhfSetOptions = {
  shouldDirty?: boolean
}

export type CompanySchoolRegistrationRhfApi = {
  getValues: () => CompanySchoolRegistrationRhfValues
  getPath: (path: string) => unknown
  setPath: (path: string, value: unknown, options?: CompanySchoolRegistrationRhfSetOptions) => void
  reset: (
    values: CompanySchoolRegistrationRhfValues,
    options?: { keepDirty?: boolean; keepDefaultValues?: boolean }
  ) => void
  applyOverlayRecord: (
    overlay: Record<string, unknown>,
    options?: CompanySchoolRegistrationRhfSetOptions
  ) => void
  isDirty: () => boolean
  markBaseline: () => void
}

let api: CompanySchoolRegistrationRhfApi | null = null
const listeners = new Set<() => void>()
let notifying = false
let notifyScheduled = false

export function registerCompanySchoolRegistrationRhf(
  next: CompanySchoolRegistrationRhfApi | null
): void {
  api = next
  notifyCompanySchoolRegistrationRhf()
}

export function peekCompanySchoolRegistrationRhf(): CompanySchoolRegistrationRhfApi | null {
  return api
}

export function isCompanySchoolRegistrationRhfActive(): boolean {
  return api != null
}

export function subscribeCompanySchoolRegistrationRhf(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifyCompanySchoolRegistrationRhf(): void {
  if (notifying) return
  notifying = true
  try {
    listeners.forEach(listener => listener())
  } finally {
    notifying = false
  }
}

export function scheduleCompanySchoolRegistrationRhfNotify(): void {
  if (notifyScheduled || notifying) return
  notifyScheduled = true
  queueMicrotask(() => {
    notifyScheduled = false
    notifyCompanySchoolRegistrationRhf()
  })
}

export function readActiveCompanySchoolRecruitmentOverlayValue(
  key: string,
  defaultValue: unknown
): unknown {
  const current = api
  if (current == null) return defaultValue
  if (isCompanySchoolInstructorRecruitmentOverlayKey(key)) {
    const raw = readCompanySchoolInstructorRecruitmentOverlayValue(
      current.getValues().instructorRecruit,
      key
    )
    return raw === undefined ? defaultValue : raw
  }
  if (!isCompanySchoolInstitutionRecruitmentOverlayKey(key)) return defaultValue
  const raw = readCompanySchoolRecruitmentOverlayValue(current.getValues().recruitment, key)
  return raw === undefined ? defaultValue : raw
}

export function peekActiveCompanySchoolInstitutionRecruitmentOverlayRecord(): Record<
  string,
  unknown
> | null {
  if (api == null) return null
  return serializeCompanySchoolRecruitmentForFormVersion(api.getValues().recruitment)
}

export function peekActiveCompanySchoolInstructorRecruitmentOverlayRecord(): Record<
  string,
  unknown
> | null {
  if (api == null) return null
  return serializeCompanySchoolInstructorRecruitmentForFormVersion(api.getValues().instructorRecruit)
}

export function peekActiveCompanySchoolRecruitmentOverlayRecord(): Record<string, unknown> | null {
  const institution = peekActiveCompanySchoolInstitutionRecruitmentOverlayRecord()
  const instructor = peekActiveCompanySchoolInstructorRecruitmentOverlayRecord()
  if (institution == null || instructor == null) return null
  return {
    ...institution,
    ...instructor,
  }
}

/** 기관·강사 모집 overlay 키를 RHF에만 기록. store에 쓰지 않는다. 소비되지 않은 키를 반환한다. */
export function patchActiveCompanySchoolRecruitmentOverlay(
  partial: Record<string, unknown>
): Record<string, unknown> {
  if (api == null) return partial
  const institution = splitCompanySchoolRecruitmentOverlay(partial)
  const instructorSplit = splitCompanySchoolInstructorRecruitmentOverlay(institution.rest)
  const rest = instructorSplit.rest
  const values = api.getValues()
  if (Object.keys(institution.recruitment).length > 0) {
    api.setPath(
      'recruitment',
      applyCompanySchoolRecruitmentOverlayRecord(values.recruitment, institution.recruitment),
      { shouldDirty: true }
    )
  }
  if (Object.keys(instructorSplit.instructorRecruit).length > 0) {
    api.setPath(
      'instructorRecruit',
      applyCompanySchoolInstructorRecruitmentOverlayRecord(
        api.getValues().instructorRecruit,
        instructorSplit.instructorRecruit
      ),
      { shouldDirty: true }
    )
  }
  if (
    Object.keys(institution.recruitment).length === 0 &&
    Object.keys(instructorSplit.instructorRecruit).length === 0
  ) {
    return partial
  }
  return rest
}

function hydrateScheduleBlockForUi(block: CompanySchoolPreferredScheduleBlock): Record<string, unknown> {
  return {
    date: block.date ? dayjs(block.date, 'YYYY-MM-DD') : null,
    session: block.session || undefined,
    firstClassPeriod: block.firstClassPeriod || undefined,
    firstStart: block.firstStart ? dayjs(block.firstStart, 'HH:mm') : null,
    firstEnd: block.firstEnd ? dayjs(block.firstEnd, 'HH:mm') : null,
    secondClassPeriod: block.secondClassPeriod || undefined,
    secondStart: block.secondStart ? dayjs(block.secondStart, 'HH:mm') : null,
    secondEnd: block.secondEnd ? dayjs(block.secondEnd, 'HH:mm') : null,
  }
}

const scheduleUiCache = new Map<string, { token: string; value: unknown }>()

export function readActiveCompanySchoolApplicationOverlayValue(
  key: string,
  defaultValue: unknown
): unknown {
  const current = api
  if (current == null || !isCompanySchoolApplicationOverlayKey(key)) return defaultValue
  const raw = readCompanySchoolApplicationOverlayValue(current.getValues().application, key)
  if (raw === undefined) return defaultValue
  if (key !== 'application.economy.schedule.first' && key !== 'application.economy.schedule.second') {
    return raw
  }
  const block = persistCompanySchoolPreferredScheduleBlock(raw)
  const token = scheduleBlockToken(block)
  const hit = scheduleUiCache.get(key)
  if (hit?.token === token) return hit.value
  const ui = hydrateScheduleBlockForUi(block)
  scheduleUiCache.set(key, { token, value: ui })
  return ui
}

export function peekActiveCompanySchoolApplicationOverlayRecord(): Record<string, unknown> | null {
  if (api == null) return null
  return serializeCompanySchoolApplicationForFormVersion(api.getValues().application)
}

/** 기관 신청 overlay 키를 RHF에만 기록. store에 쓰지 않는다. 소비되지 않은 키를 반환한다. */
export function patchActiveCompanySchoolApplicationOverlay(
  partial: Record<string, unknown>
): Record<string, unknown> {
  if (api == null) return partial
  const { application, rest } = splitCompanySchoolApplicationOverlay(partial)
  if (Object.keys(application).length === 0) return partial
  const values = api.getValues()
  scheduleUiCache.clear()
  api.setPath(
    'application',
    applyCompanySchoolApplicationOverlayRecord(values.application, application),
    { shouldDirty: true }
  )
  return rest
}
