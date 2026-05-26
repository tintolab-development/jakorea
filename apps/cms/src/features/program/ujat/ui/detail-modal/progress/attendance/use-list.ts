import { useCallback, useMemo, useState } from 'react'
import {
  getUjatEducationProgressAttendanceDateOptions,
  getUjatEducationProgressAttendanceSessions,
  patchUjatEducationProgressAttendanceSession,
} from '@/data/mock/ujat-education-progress-attendance-mock'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'
import { buildUjatAttendanceFilterFields } from './filter-fields'
import {
  cloneAttendanceVolunteerRows,
  filterVisibleAttendanceVolunteers,
} from './attendance-display'
import {
  EMPTY_UJAT_ATTENDANCE_FILTERS,
  UJAT_ATTENDANCE_FILTER_ALL,
  type UjatAttendanceFilters,
  type UjatAttendanceSessionGroup,
  type UjatAttendanceVolunteerRow,
} from './types'

function volunteerMatchesFilters(
  row: UjatAttendanceVolunteerRow,
  filters: UjatAttendanceFilters
): boolean {
  const nameQ = filters.volunteerName.trim().toLowerCase()
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
  if (
    filters.attendanceStatus !== UJAT_ATTENDANCE_FILTER_ALL &&
    row.status !== filters.attendanceStatus
  ) {
    return false
  }
  return true
}

export function filterAttendanceVolunteersForDisplay(
  volunteers: UjatAttendanceVolunteerRow[],
  filters: UjatAttendanceFilters
): UjatAttendanceVolunteerRow[] {
  const visible = filterVisibleAttendanceVolunteers(volunteers)
  const hasNameOrStatusFilter =
    filters.volunteerName.trim() !== '' ||
    filters.attendanceStatus !== UJAT_ATTENDANCE_FILTER_ALL
  if (!hasNameOrStatusFilter) return visible
  return visible.filter(row => volunteerMatchesFilters(row, filters))
}

function filterSessionGroups(
  sessions: UjatAttendanceSessionGroup[],
  filters: UjatAttendanceFilters
): UjatAttendanceSessionGroup[] {
  return sessions
    .filter(session => {
      if (
        filters.educationDate !== UJAT_ATTENDANCE_FILTER_ALL &&
        session.isoDate !== filters.educationDate
      ) {
        return false
      }
      const visibleVolunteers = filterVisibleAttendanceVolunteers(session.volunteers)
      const hasNameOrStatusFilter =
        filters.volunteerName.trim() !== '' ||
        filters.attendanceStatus !== UJAT_ATTENDANCE_FILTER_ALL
      if (!hasNameOrStatusFilter) return visibleVolunteers.length > 0
      return visibleVolunteers.some(row => volunteerMatchesFilters(row, filters))
    })
    .map(session => ({
      ...session,
      volunteers: filterVisibleAttendanceVolunteers(session.volunteers),
    }))
}

export function useUjatEducationProgressAttendance(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
) {
  const [dataVersion, setDataVersion] = useState(0)
  const [pendingFilters, setPendingFilters] = useState<UjatAttendanceFilters>(
    () => ({ ...EMPTY_UJAT_ATTENDANCE_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatAttendanceFilters>(
    () => ({ ...EMPTY_UJAT_ATTENDANCE_FILTERS })
  )

  const educationDateOptions = useMemo(() => {
    void dataVersion
    return getUjatEducationProgressAttendanceDateOptions(half, regionKey)
  }, [dataVersion, half, regionKey])

  const filterFields = useMemo(
    () => buildUjatAttendanceFilterFields(educationDateOptions),
    [educationDateOptions]
  )

  const sessionGroups = useMemo(() => {
    void dataVersion
    const sessions = getUjatEducationProgressAttendanceSessions(half, regionKey)
    return filterSessionGroups(sessions, appliedFilters)
  }, [appliedFilters, dataVersion, half, regionKey])

  const handleFilterChange = useCallback((key: string, value: string) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const resetRegionState = useCallback(() => {
    setPendingFilters({ ...EMPTY_UJAT_ATTENDANCE_FILTERS })
    setAppliedFilters({ ...EMPTY_UJAT_ATTENDANCE_FILTERS })
  }, [])

  const saveSessionVolunteers = useCallback(
    (sessionId: string, volunteers: UjatAttendanceVolunteerRow[]) => {
      patchUjatEducationProgressAttendanceSession(sessionId, volunteers)
      setDataVersion(v => v + 1)
    },
    []
  )

  const getSessionVolunteers = useCallback(
    (sessionId: string): UjatAttendanceVolunteerRow[] => {
      void dataVersion
      const sessions = getUjatEducationProgressAttendanceSessions(half, regionKey)
      const session = sessions.find(s => s.id === sessionId)
      if (!session) return []
      return cloneAttendanceVolunteerRows(filterVisibleAttendanceVolunteers(session.volunteers))
    },
    [dataVersion, half, regionKey]
  )

  return {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    resetRegionState,
    saveSessionVolunteers,
    getSessionVolunteers,
  }
}
