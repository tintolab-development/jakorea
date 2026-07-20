import { UJAT_INSTITUTION_SCHEDULE_ASSIGN_SEED } from '@/data/mock/ujat-institution-application-mock'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import {
  UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES,
  type UjatInstitutionEducationSemesterKey,
} from '../education-schedule'
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

function createInitialRegionState(): UjatScheduleAssignRegionState {
  const days: UjatScheduleAssignRegionState['days'] = {}
  for (const { isoDate } of UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES) {
    days[isoDate] = createInitialDayState(isoDate)
  }
  return {
    days,
    maxClassesPerDay: '',
    estimation: {
      h1: { expectedVolunteerCount: '' },
      h2: { expectedVolunteerCount: '' },
    },
  }
}

function cloneRegionState(state: UjatScheduleAssignRegionState): UjatScheduleAssignRegionState {
  return {
    maxClassesPerDay: state.maxClassesPerDay,
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
    state.maxClassesPerDay = seed.maxClassesPerDay
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
  value: string
): void {
  const current = ensureDraftRegionState(regionKey)
  updateUjatScheduleAssignDraftRegionState(regionKey, {
    ...current,
    maxClassesPerDay: value,
  })
}

export { createEmptyRow, createRowId }
