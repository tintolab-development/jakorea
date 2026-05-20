import { useCallback, useMemo, useState } from 'react'
import { getUjatInstitutionApplicationMockRows } from '@/data/mock/ujat-institution-application-mock'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import {
  UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES,
  resolveEducationSemesterForIsoDate,
  type UjatInstitutionEducationSemesterKey,
} from '../education-schedule'
import {
  createEmptyRow,
  getUjatScheduleAssignRegionState,
  patchUjatScheduleAssignDay,
  patchUjatScheduleAssignEstimation,
} from './store'
import type { UjatScheduleAssignRow } from './types'
import {
  computeVolunteerEducationDays,
  listTempAssignedSchoolsForDate,
  sumSelectedGradeClassCount,
} from './utils'

export function useUjatInstitutionScheduleAssign(regionKey: UjatInstitutionApplicationRegionKey) {
  const [version, setVersion] = useState(0)

  const applicationRows = useMemo(() => {
    void version
    return getUjatInstitutionApplicationMockRows()
  }, [version])

  const regionState = useMemo(() => {
    void version
    return getUjatScheduleAssignRegionState(regionKey)
  }, [regionKey, version])

  const bump = useCallback(() => setVersion(v => v + 1), [])

  const assignDates = UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES

  const schoolsByDate = useMemo(() => {
    const map: Record<string, ReturnType<typeof listTempAssignedSchoolsForDate>> = {}
    for (const { isoDate } of assignDates) {
      map[isoDate] = listTempAssignedSchoolsForDate(applicationRows, regionKey, isoDate)
    }
    return map
  }, [applicationRows, regionKey, assignDates])

  const addAssignmentRow = useCallback(
    (isoDate: string) => {
      patchUjatScheduleAssignDay(regionKey, isoDate, day => ({
        ...day,
        rows: [...day.rows, createEmptyRow()],
      }))
      bump()
    },
    [regionKey, bump]
  )

  const updateAssignmentRow = useCallback(
    (isoDate: string, rowId: string, patch: Partial<UjatScheduleAssignRow>) => {
      patchUjatScheduleAssignDay(regionKey, isoDate, day => ({
        ...day,
        rows: day.rows.map(row => (row.id === rowId ? { ...row, ...patch } : row)),
      }))
      bump()
    },
    [regionKey, bump]
  )

  const setEstimationField = useCallback(
    (
      semester: UjatInstitutionEducationSemesterKey,
      field: 'maxClassesPerDay' | 'expectedVolunteerCount',
      value: string
    ) => {
      const digits = value.replace(/\D/g, '')
      patchUjatScheduleAssignEstimation(regionKey, semester, { [field]: digits })
      bump()
    },
    [regionKey, bump]
  )

  const semesterClassTotals = useMemo(() => {
    const totals: Record<UjatInstitutionEducationSemesterKey, number> = { h1: 0, h2: 0 }
    for (const { isoDate } of assignDates) {
      const day = regionState.days[isoDate]
      if (!day) continue
      const semester = resolveEducationSemesterForIsoDate(isoDate)
      const daySum = day.rows.reduce(
        (sum, row) => sum + sumSelectedGradeClassCount(row.gradeValues),
        0
      )
      totals[semester] += daySum
    }
    return totals
  }, [assignDates, regionState.days])

  const volunteerEducationDays = useMemo(() => {
    const out: Record<UjatInstitutionEducationSemesterKey, number | null> = { h1: null, h2: null }
    for (const semester of ['h1', 'h2'] as const) {
      const expectedClasses = semesterClassTotals[semester]
      const volunteers = Number.parseInt(regionState.estimation[semester].expectedVolunteerCount, 10)
      out[semester] = computeVolunteerEducationDays(
        expectedClasses,
        Number.isFinite(volunteers) ? volunteers : 0
      )
    }
    return out
  }, [regionState.estimation, semesterClassTotals])

  return {
    assignDates,
    regionState,
    schoolsByDate,
    addAssignmentRow,
    updateAssignmentRow,
    setEstimationField,
    semesterClassTotals,
    volunteerEducationDays,
  }
}
