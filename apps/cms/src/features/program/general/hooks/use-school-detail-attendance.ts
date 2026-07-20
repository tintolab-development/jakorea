import { useCallback, useMemo, useState } from 'react'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import type { Program } from '@/types/domain'
import { buildSchoolDetailAttendanceFilterFields } from '../lib/school-detail-attendance-filter-fields'
import {
  cloneAttendanceStudentRows,
  filterAttendanceStudentsForDisplay,
} from '../lib/school-detail-attendance-display'
import {
  getSchoolDetailAttendanceEducationScheduleOptions,
  getSchoolDetailAttendanceSessionStudents,
  getSchoolDetailAttendanceSessions,
  patchSchoolDetailAttendanceSession,
} from '../lib/school-detail-attendance-mock'
import {
  SCHOOL_ATTENDANCE_FILTER_ALL,
  type SchoolDetailAttendanceFilters,
  type SchoolDetailAttendanceSessionGroup,
  type SchoolDetailAttendanceStudentRow,
} from '../model/school-detail-types'

export const EMPTY_SCHOOL_DETAIL_ATTENDANCE_FILTERS: SchoolDetailAttendanceFilters = {
  educationSchedule: SCHOOL_ATTENDANCE_FILTER_ALL,
  studentName: '',
  studentGender: SCHOOL_ATTENDANCE_FILTER_ALL,
  studentClass: SCHOOL_ATTENDANCE_FILTER_ALL,
  attendanceStatus: SCHOOL_ATTENDANCE_FILTER_ALL,
}

function filterSessionGroups(
  sessions: SchoolDetailAttendanceSessionGroup[],
  filters: SchoolDetailAttendanceFilters
): SchoolDetailAttendanceSessionGroup[] {
  const filteredBySchedule =
    filters.educationSchedule === SCHOOL_ATTENDANCE_FILTER_ALL
      ? sessions
      : sessions.filter(session => session.filterValue === filters.educationSchedule)

  return filteredBySchedule
    .map(session => ({
      ...session,
      students: filterAttendanceStudentsForDisplay(session.students, filters),
    }))
    .filter(session => session.students.length > 0)
}

export function useSchoolDetailAttendance(row: ParticipatingSchoolRow, program: Program) {
  const [dataVersion, setDataVersion] = useState(0)
  const [pendingFilters, setPendingFilters] = useState<SchoolDetailAttendanceFilters>(
    () => ({ ...EMPTY_SCHOOL_DETAIL_ATTENDANCE_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<SchoolDetailAttendanceFilters>(
    () => ({ ...EMPTY_SCHOOL_DETAIL_ATTENDANCE_FILTERS })
  )

  const educationScheduleOptions = useMemo(() => {
    void dataVersion
    return getSchoolDetailAttendanceEducationScheduleOptions(row, program)
  }, [dataVersion, program, row])

  const filterFields = useMemo(
    () => buildSchoolDetailAttendanceFilterFields(educationScheduleOptions),
    [educationScheduleOptions]
  )

  const sessionGroups = useMemo(() => {
    void dataVersion
    const sessions = getSchoolDetailAttendanceSessions(row, program)
    return filterSessionGroups(sessions, appliedFilters)
  }, [appliedFilters, dataVersion, program, row])

  const handleFilterChange = useCallback((key: string, value: string) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const saveSessionStudents = useCallback(
    (sessionId: string, students: SchoolDetailAttendanceStudentRow[]) => {
      patchSchoolDetailAttendanceSession(row.id, sessionId, students)
      setDataVersion(v => v + 1)
    },
    [row.id]
  )

  const getSessionStudents = useCallback(
    (sessionId: string): SchoolDetailAttendanceStudentRow[] => {
      void dataVersion
      return cloneAttendanceStudentRows(
        getSchoolDetailAttendanceSessionStudents(row, sessionId, program)
      )
    },
    [dataVersion, program, row]
  )

  return {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    saveSessionStudents,
    getSessionStudents,
  }
}
