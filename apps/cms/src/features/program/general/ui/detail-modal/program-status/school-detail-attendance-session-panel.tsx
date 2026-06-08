import { useCallback, useEffect, useMemo, useState } from 'react'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import {
  SCHOOL_DETAIL_ATTENDANCE_EXCEL_COLUMNS,
  buildSchoolDetailAttendanceSessionExcelRows,
  resolveSchoolDetailAttendanceSessionExcelFilename,
} from '../../../lib/school-detail-attendance-export'
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

  const excelRows = useMemo(
    () => buildSchoolDetailAttendanceSessionExcelRows(session.headerPrefix, displayRows),
    [displayRows, session.headerPrefix]
  )

  const { exportExcel, isExporting } = useTableExcelExport({
    columns: SCHOOL_DETAIL_ATTENDANCE_EXCEL_COLUMNS,
    data: excelRows,
    filename: resolveSchoolDetailAttendanceSessionExcelFilename(session),
  })

  const hasChanges = useMemo(
    () => !attendanceStudentRowsEqual(workingRows, savedRows),
    [savedRows, workingRows]
  )

  const handleStatusChange = useCallback(
    (studentId: string, status: SchoolSessionAttendanceStatusKey) => {
      setWorkingRows(prev => prev.map(row => (row.id === studentId ? { ...row, status } : row)))
    },
    []
  )

  const handleSave = useCallback(() => {
    if (!hasChanges) return
    onSave(session.id, workingRows)
    setSavedRows(cloneAttendanceStudentRows(workingRows))
    showAlert({ title: '안내', content: '출결 정보가 저장되었습니다.' })
  }, [hasChanges, onSave, session.id, showAlert, workingRows])

  return (
    <section className="school-detail-attendance-session">
      <div className="table-header-actions">
        <div className="table-header-title--wrapper school-detail-attendance-session__title-row">
          <span className="table-title">{session.headerTitle}</span>
          <div className="school-detail-attendance-session__header-meta">
            <span>{session.headerScheduleSummary}</span>
            <span className="detail-info-form-inputs-separator" aria-hidden />
            <span>{session.headerPeriodRangeLabel}</span>
          </div>
          <span className="table-description">총 {displayRows.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            width={120}
            disabled={!hasChanges}
            onClick={handleSave}
          >
            저장
          </CmsButton>
          <ExcelButton loading={isExporting} onClick={exportExcel} />
        </div>
      </div>
      <div className="school-detail-attendance-session__table-wrap">
        <SchoolDetailAttendanceTable rows={displayRows} onStatusChange={handleStatusChange} />
      </div>
    </section>
  )
}
