import { UJAT_INSTITUTION_SCHEDULE_ASSIGN_SEED } from '@/features/program/ujat/model/ujat-institution-application'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import type { UjatInstitutionEducationSemesterKey } from '../education-schedule'
import type {
  UjatScheduleAssignDayState,
  UjatScheduleAssignRegionState,
  UjatScheduleAssignRow,
} from './types'

function createRowId(): string {
  return `assign-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createEmptyRow(): UjatScheduleAssignRow {
  return {
    id: createRowId(),
    institutionRowId: null,
    gradeValues: [],
  }
}

function createInitialDayState(isoDate: string): UjatScheduleAssignDayState {
  return {
    isoDate,
    rows: [createEmptyRow()],
  }
}

function createEmptyEstimationSemester(): UjatScheduleAssignRegionState['estimation']['h1'] {
  return { maxClassesPerDay: '', expectedVolunteerCount: '' }
}

function createInitialRegionState(): UjatScheduleAssignRegionState {
  const days: UjatScheduleAssignRegionState['days'] = {}
  return {
    days,
    estimation: {
      h1: createEmptyEstimationSemester(),
      h2: createEmptyEstimationSemester(),
    },
  }
}

function cloneRegionState(state: UjatScheduleAssignRegionState): UjatScheduleAssignRegionState {
  return {
    estimation: {
      h1: { ...state.estimation.h1 },
      h2: { ...state.estimation.h2 },
    },
    days: Object.fromEntries(
      Object.entries(state.days).map(([isoDate, day]) => [
        isoDate,
        {
          ...day,
          rows: day.rows.map(row => ({
            ...row,
            gradeValues: [...row.gradeValues],
          })),
        },
      ])
    ),
  }
}

/** 저장된 임시 배정 — 일정표 미리보기·엑셀 다운로드에 반영 */
const savedRegionState = new Map<UjatInstitutionApplicationRegionKey, UjatScheduleAssignRegionState>()
/** 편집 중인 임시 배정 — 저장 전까지 미리보기에 미반영 */
const draftRegionState = new Map<UjatInstitutionApplicationRegionKey, UjatScheduleAssignRegionState>()
let scheduleAssignMockSeeded = false

function applyScheduleAssignMockSeed(regionKey: UjatInstitutionApplicationRegionKey): void {
  const seed = UJAT_INSTITUTION_SCHEDULE_ASSIGN_SEED[regionKey]
  if (!seed?.assignments.length) return

  const state = createInitialRegionState()
  if (seed.maxClassesPerDay) {
    // legacy seed — 양 학기에 동일 시드값
    state.estimation.h1.maxClassesPerDay = seed.maxClassesPerDay
    state.estimation.h2.maxClassesPerDay = seed.maxClassesPerDay
  }

  for (const { institutionId, isoDate, gradeValues } of seed.assignments) {
    const day = state.days[isoDate]
    if (!day || gradeValues.length === 0) continue

    const filledRows = day.rows.filter(
      row => row.institutionRowId != null && row.gradeValues.length > 0
    )
    filledRows.push({
      id: `assign-seed-${institutionId}-${isoDate}`,
      institutionRowId: institutionId,
      gradeValues: [...gradeValues],
    })
    day.rows = [...filledRows, createEmptyRow()]
  }

  savedRegionState.set(regionKey, state)
  draftRegionState.delete(regionKey)
}

function ensureScheduleAssignMockSeeded(): void {
  if (scheduleAssignMockSeeded) return
  scheduleAssignMockSeeded = true
  if (shouldUseUjatApplicationsRemoteApi()) return
  for (const regionKey of Object.keys(
    UJAT_INSTITUTION_SCHEDULE_ASSIGN_SEED
  ) as UjatInstitutionApplicationRegionKey[]) {
    applyScheduleAssignMockSeed(regionKey)
  }
}

function ensureSavedRegionState(
  regionKey: UjatInstitutionApplicationRegionKey
): UjatScheduleAssignRegionState {
  ensureScheduleAssignMockSeeded()
  let state = savedRegionState.get(regionKey)
  if (!state) {
    state = createInitialRegionState()
    savedRegionState.set(regionKey, state)
  }
  return state
}

function ensureDraftRegionState(
  regionKey: UjatInstitutionApplicationRegionKey
): UjatScheduleAssignRegionState {
  let draft = draftRegionState.get(regionKey)
  if (!draft) {
    draft = cloneRegionState(ensureSavedRegionState(regionKey))
    draftRegionState.set(regionKey, draft)
  }
  return draft
}

/** 저장된 임시 배정 — 미리보기·엑셀 */
export function getUjatScheduleAssignRegionState(
  regionKey: UjatInstitutionApplicationRegionKey
): UjatScheduleAssignRegionState {
  return ensureSavedRegionState(regionKey)
}

/** 편집 중 임시 배정 */
export function getUjatScheduleAssignDraftRegionState(
  regionKey: UjatInstitutionApplicationRegionKey
): UjatScheduleAssignRegionState {
  return ensureDraftRegionState(regionKey)
}

export function updateUjatScheduleAssignDraftRegionState(
  regionKey: UjatInstitutionApplicationRegionKey,
  next: UjatScheduleAssignRegionState
): void {
  draftRegionState.set(regionKey, next)
}

export function commitUjatScheduleAssignDraft(
  regionKey: UjatInstitutionApplicationRegionKey
): void {
  const draft = ensureDraftRegionState(regionKey)
  savedRegionState.set(regionKey, cloneRegionState(draft))
}

/** remote hydrate — draft·saved 동시 교체 */
export function replaceUjatScheduleAssignRegionState(
  regionKey: UjatInstitutionApplicationRegionKey,
  next: UjatScheduleAssignRegionState
): void {
  const cloned = cloneRegionState(next)
  savedRegionState.set(regionKey, cloned)
  draftRegionState.set(regionKey, cloneRegionState(cloned))
}

/** remote 일정 날짜를 draft에 비어 있는 날로 추가한다. 기존 배정 행은 유지. */
export function ensureUjatScheduleAssignDays(
  regionKey: UjatInstitutionApplicationRegionKey,
  isoDates: readonly string[]
): void {
  const current = ensureDraftRegionState(regionKey)
  let changed = false
  const days = { ...current.days }
  for (const isoDate of isoDates) {
    if (days[isoDate]) continue
    days[isoDate] = createInitialDayState(isoDate)
    changed = true
  }
  if (!changed) return
  updateUjatScheduleAssignDraftRegionState(regionKey, { ...current, days })
}

export function patchUjatScheduleAssignDay(
  regionKey: UjatInstitutionApplicationRegionKey,
  isoDate: string,
  patch: (day: UjatScheduleAssignDayState) => UjatScheduleAssignDayState
): void {
  const current = ensureDraftRegionState(regionKey)
  const day = current.days[isoDate] ?? createInitialDayState(isoDate)
  updateUjatScheduleAssignDraftRegionState(regionKey, {
    ...current,
    days: {
      ...current.days,
      [isoDate]: patch(day),
    },
  })
}

export function patchUjatScheduleAssignEstimation(
  regionKey: UjatInstitutionApplicationRegionKey,
  semester: UjatInstitutionEducationSemesterKey,
  patch: Partial<UjatScheduleAssignRegionState['estimation']['h1']>
): void {
  const current = ensureDraftRegionState(regionKey)
  updateUjatScheduleAssignDraftRegionState(regionKey, {
    ...current,
    estimation: {
      ...current.estimation,
      [semester]: { ...current.estimation[semester], ...patch },
    },
  })
}

export function patchUjatScheduleAssignMaxClassesPerDay(
  regionKey: UjatInstitutionApplicationRegionKey,
  semester: UjatInstitutionEducationSemesterKey,
  value: string
): void {
  patchUjatScheduleAssignEstimation(regionKey, semester, { maxClassesPerDay: value })
}

function withoutInstitutionRows(
  state: UjatScheduleAssignRegionState,
  institutionIds: ReadonlySet<string>
): UjatScheduleAssignRegionState {
  const days: UjatScheduleAssignRegionState['days'] = {}
  for (const [isoDate, day] of Object.entries(state.days)) {
    const rows = day.rows.filter(
      row => !row.institutionRowId || !institutionIds.has(row.institutionRowId)
    )
    days[isoDate] = { ...day, rows: rows.length > 0 ? rows : [createEmptyRow()] }
  }
  return { ...state, days }
}

/**
 * 임시 일정 해제(PUT slots=[]) 성공 기관의 배정 행을 저장·편집 상태에서 제거한다.
 * remote hydrate는 슬롯이 있는 날짜만 덮어쓰므로 해제된 기관 행이 남지 않게 한다.
 */
export function removeUjatScheduleAssignInstitutionRows(institutionIds: readonly string[]): void {
  if (institutionIds.length === 0) return
  const ids = new Set(institutionIds)
  for (const [regionKey, state] of savedRegionState) {
    savedRegionState.set(regionKey, withoutInstitutionRows(state, ids))
  }
  for (const [regionKey, state] of draftRegionState) {
    draftRegionState.set(regionKey, withoutInstitutionRows(state, ids))
  }
}

export { createEmptyRow, createRowId }
