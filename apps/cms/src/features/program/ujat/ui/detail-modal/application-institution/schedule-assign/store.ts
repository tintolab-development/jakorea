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

const regionState = new Map<UjatInstitutionApplicationRegionKey, UjatScheduleAssignRegionState>()

export function getUjatScheduleAssignRegionState(
  regionKey: UjatInstitutionApplicationRegionKey
): UjatScheduleAssignRegionState {
  let state = regionState.get(regionKey)
  if (!state) {
    state = createInitialRegionState()
    regionState.set(regionKey, state)
  }
  return state
}

export function updateUjatScheduleAssignRegionState(
  regionKey: UjatInstitutionApplicationRegionKey,
  next: UjatScheduleAssignRegionState
): void {
  regionState.set(regionKey, next)
}

export function patchUjatScheduleAssignDay(
  regionKey: UjatInstitutionApplicationRegionKey,
  isoDate: string,
  patch: (day: UjatScheduleAssignDayState) => UjatScheduleAssignDayState
): void {
  const current = getUjatScheduleAssignRegionState(regionKey)
  const day = current.days[isoDate] ?? createInitialDayState(isoDate)
  updateUjatScheduleAssignRegionState(regionKey, {
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
  const current = getUjatScheduleAssignRegionState(regionKey)
  updateUjatScheduleAssignRegionState(regionKey, {
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
  const current = getUjatScheduleAssignRegionState(regionKey)
  updateUjatScheduleAssignRegionState(regionKey, {
    ...current,
    maxClassesPerDay: value,
  })
}

export { createEmptyRow, createRowId }
