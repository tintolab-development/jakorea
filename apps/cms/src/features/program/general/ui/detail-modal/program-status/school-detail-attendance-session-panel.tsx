import { useCallback, useEffect, useMemo, useState } from 'react'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import {
  attendanceStudentRowsEqual,
  cloneAttendanceStudentRows,
  filterAttendanceStudentsForDisplay,
} from '../../../lib/school-detail-attendance-display'
import type {
  SchoolDetailAttendanceFilters,
  SchoolDetailAttendanceSessionGroup,
  SchoolDetailAttendanceStudentRow,
  SchoolSessionAttendanceStatusKey,
} from '../../../model/school-detail-types'
import { SchoolDetailAttendanceTable } from './school-detail-attendance-table'

export function SchoolDetailAttendanceSessionPanel({
  session,
  appliedFilters,
  getSessionStudents,
  onSave,
}: {
  session: SchoolDetailAttendanceSessionGroup
  appliedFilters: SchoolDetailAttendanceFilters
  getSessionStudents: (sessionId: string) => SchoolDetailAttendanceStudentRow[]
  onSave: (sessionId: string, students: SchoolDetailAttendanceStudentRow[]) => void
}) {
  const { showAlert } = useCmsAlert()
  const [savedRows, setSavedRows] = useState<SchoolDetailAttendanceStudentRow[]>(() =>
    cloneAttendanceStudentRows(getSessionStudents(session.id))
  )
  const [workingRows, setWorkingRows] = useState<SchoolDetailAttendanceStudentRow[]>(() =>
    cloneAttendanceStudentRows(getSessionStudents(session.id))
  )

  useEffect(() => {
    const rows = cloneAttendanceStudentRows(getSessionStudents(session.id))
    setSavedRows(rows)
    setWorkingRows(rows)
  }, [getSessionStudents, session.id])

  const displayRows = useMemo(
    () => filterAttendanceStudentsForDisplay(workingRows, appliedFilters),
    [appliedFilters, workingRows]
  )

  const hasChanges = useMemo(
    () => !attendanceStudentRowsEqual(workingRows, savedRows),
    [savedRows, workingRows]
  )

  const handleStatusChange = useCallback((studentId: string, status: SchoolSessionAttendanceStatusKey) => {
    setWorkingRows(prev =>
      prev.map(row => (row.id === studentId ? { ...row, status } : row))
    )
  }, [])

  const handleSave = useCallback(() => {
    if (!hasChanges) return
    onSave(session.id, workingRows)
    setSavedRows(cloneAttendanceStudentRows(workingRows))
    showAlert({ title: '안내', content: '출결 정보가 저장되었습니다.' })
  }, [hasChanges, onSave, session.id, showAlert, workingRows])

  const headerText = `${session.headerPrefix} 총 ${displayRows.length}건`

  return (
    <section className="school-detail-attendance-session">
      <div className="school-detail-attendance-session__header">
        <h3 className="school-detail-attendance-session__title">{headerText}</h3>
        <CmsButton
          type="button"
          variant="primary"
          size="large"
          width={100}
          disabled={!hasChanges}
          onClick={handleSave}
        >
          저장
        </CmsButton>
      </div>
      <div className="school-detail-attendance-session__table-wrap">
        <SchoolDetailAttendanceTable rows={displayRows} onStatusChange={handleStatusChange} />
      </div>
    </section>
  )
}
