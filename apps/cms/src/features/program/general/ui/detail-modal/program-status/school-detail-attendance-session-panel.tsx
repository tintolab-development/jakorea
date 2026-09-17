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
  saving = false,
}: {
  session: SchoolDetailAttendanceSessionGroup
  appliedFilters: SchoolDetailAttendanceFilters
  getSessionStudents: (sessionId: string) => SchoolDetailAttendanceStudentRow[]
  onSave: (sessionId: string, students: SchoolDetailAttendanceStudentRow[]) => Promise<void>
  saving?: boolean
}) {
  const { showAlert } = useCmsAlert()
  const [savedRows, setSavedRows] = useState<SchoolDetailAttendanceStudentRow[]>(() =>
    cloneAttendanceStudentRows(getSessionStudents(session.id))
  )
  const [workingRows, setWorkingRows] = useState<SchoolDetailAttendanceStudentRow[]>(() =>
    cloneAttendanceStudentRows(getSessionStudents(session.id))
  )
  const [isSavingLocal, setIsSavingLocal] = useState(false)

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

  const canSave =
    hasChanges &&
    !saving &&
    !isSavingLocal &&
    typeof session.scheduleId === 'number' &&
    session.scheduleId > 0

  const handleStatusChange = useCallback(
    (studentId: string, status: SchoolSessionAttendanceStatusKey) => {
      setWorkingRows(prev => prev.map(row => (row.id === studentId ? { ...row, status } : row)))
    },
    []
  )

  const handleSave = useCallback(async () => {
    if (!canSave) return
    setIsSavingLocal(true)
    try {
      await onSave(session.id, workingRows)
      setSavedRows(cloneAttendanceStudentRows(workingRows))
      showAlert({ title: '안내', content: '출결 정보가 저장되었습니다.' })
    } catch {
      // handleError already surfaced in hook
    } finally {
      setIsSavingLocal(false)
    }
  }, [canSave, onSave, session.id, showAlert, workingRows])

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
            disabled={!canSave}
            loading={isSavingLocal || saving}
            onClick={() => {
              void handleSave()
            }}
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
