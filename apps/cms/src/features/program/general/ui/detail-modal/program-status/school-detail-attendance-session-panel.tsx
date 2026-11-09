import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { collectChangedSchoolDetailAttendances } from '../../../api/school-detail-attendance-api'
import { SCHOOL_DETAIL_ATTENDANCE_EMPTY_MESSAGES } from '@/features/program/general/lib/school-detail-attendance'
import {
  attendanceStudentRowsEqual,
  cloneAttendanceStudentRows,
  filterAttendanceStudentsForDisplay,
  hasSchoolDetailAttendanceStudentFilters,
} from '../../../lib/school-detail-attendance-display'
import type {
  SchoolDetailAttendanceFilters,
  SchoolDetailAttendanceSessionGroup,
  SchoolDetailAttendanceStudentRow,
  SchoolSessionAttendanceEditableStatusKey,
} from '../../../model/school-detail-types'
import { SchoolDetailAttendanceTable } from './school-detail-attendance-table'

export function SchoolDetailAttendanceSessionPanel({
  session,
  appliedFilters,
  getSessionStudents,
  onSave,
  saving = false,
  scopeBlocked = false,
  onExportAll,
  exporting = false,
  exportDisabled = false,
}: {
  session: SchoolDetailAttendanceSessionGroup
  appliedFilters: SchoolDetailAttendanceFilters
  getSessionStudents: (sessionId: string) => SchoolDetailAttendanceStudentRow[]
  onSave: (sessionId: string, students: SchoolDetailAttendanceStudentRow[]) => Promise<void>
  saving?: boolean
  scopeBlocked?: boolean
  onExportAll: () => void
  exporting?: boolean
  exportDisabled?: boolean
}) {
  const { showAlert } = useCmsAlert()
  const [savedRows, setSavedRows] = useState<SchoolDetailAttendanceStudentRow[]>(() =>
    cloneAttendanceStudentRows(getSessionStudents(session.id))
  )
  const [workingRows, setWorkingRows] = useState<SchoolDetailAttendanceStudentRow[]>(() =>
    cloneAttendanceStudentRows(getSessionStudents(session.id))
  )
  const [isSavingLocal, setIsSavingLocal] = useState(false)
  const savedRowsRef = useRef(savedRows)
  const workingRowsRef = useRef(workingRows)
  savedRowsRef.current = savedRows
  workingRowsRef.current = workingRows

  useEffect(() => {
    const next = cloneAttendanceStudentRows(getSessionStudents(session.id))
    const dirty = !attendanceStudentRowsEqual(workingRowsRef.current, savedRowsRef.current)
    setSavedRows(next)
    if (!dirty) {
      setWorkingRows(next)
    }
  }, [getSessionStudents, session.id])

  const displayRows = useMemo(
    () => filterAttendanceStudentsForDisplay(workingRows, appliedFilters),
    [appliedFilters, workingRows]
  )

  const changedRows = useMemo(
    () => collectChangedSchoolDetailAttendances(workingRows, savedRows),
    [savedRows, workingRows]
  )

  const canSave =
    changedRows.length > 0 &&
    !saving &&
    !isSavingLocal &&
    !scopeBlocked &&
    !session.scheduleIdUnresolved &&
    typeof session.scheduleId === 'number' &&
    session.scheduleId > 0

  const handleStatusChange = useCallback(
    (studentId: string, status: SchoolSessionAttendanceEditableStatusKey) => {
      setWorkingRows(prev => prev.map(row => (row.id === studentId ? { ...row, status } : row)))
    },
    []
  )

  const handleSave = useCallback(async () => {
    if (saving || isSavingLocal) return
    // 저장 버튼은 항상 활성화한다. 저장할 수 없으면 누를 때 사유를 안내한다.
    if (
      scopeBlocked ||
      session.scheduleIdUnresolved ||
      typeof session.scheduleId !== 'number' ||
      session.scheduleId <= 0
    ) {
      showAlert({
        title: '안내',
        content: scopeBlocked
          ? '학급 일정 배정 정보를 확인하는 중이거나 불러오지 못해 출석을 저장할 수 없습니다. 잠시 후 다시 시도해 주세요.'
          : '교육 일정 ID를 확인할 수 없어 이 회차의 출석을 저장할 수 없습니다.',
      })
      return
    }
    if (changedRows.length === 0) {
      showAlert({ title: '안내', content: '변경된 출석 정보가 없습니다.' })
      return
    }
    if (!canSave) return
    setIsSavingLocal(true)
    try {
      await onSave(session.id, changedRows)
      setSavedRows(cloneAttendanceStudentRows(workingRows))
    } catch {
      // handleError already surfaced in hook. Keep workingRows.
    } finally {
      setIsSavingLocal(false)
    }
  }, [
    canSave,
    changedRows,
    isSavingLocal,
    onSave,
    saving,
    scopeBlocked,
    session.id,
    session.scheduleId,
    session.scheduleIdUnresolved,
    showAlert,
    workingRows,
  ])

  const handleExport = useCallback(() => {
    if (exportDisabled) {
      showAlert({
        title: '다운로드 안내',
        content: '전체 교육 일정 출석 정보를 확인한 뒤 다시 시도해 주세요.',
      })
      return
    }
    onExportAll()
  }, [exportDisabled, onExportAll, showAlert])

  const emptyTitle = hasSchoolDetailAttendanceStudentFilters(appliedFilters)
    ? SCHOOL_DETAIL_ATTENDANCE_EMPTY_MESSAGES.noFilterMatch
    : SCHOOL_DETAIL_ATTENDANCE_EMPTY_MESSAGES.noStudents

  return (
    <section className="school-detail-attendance-session">
      <div className="table-header-actions">
        <div className="table-header-title--wrapper school-detail-attendance-session__title-row">
          <span className="table-title">{session.headerTitle}</span>
          {session.headerScheduleSummary || session.headerPeriodRangeLabel ? (
            <div className="school-detail-attendance-session__header-meta">
              {session.headerScheduleSummary ? <span>{session.headerScheduleSummary}</span> : null}
              {session.headerScheduleSummary && session.headerPeriodRangeLabel ? (
                <span className="detail-info-form-inputs-separator" aria-hidden />
              ) : null}
              {session.headerPeriodRangeLabel ? (
                <span>{session.headerPeriodRangeLabel}</span>
              ) : null}
            </div>
          ) : null}
          <span className="table-description">총 {workingRows.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            type="button"
            variant="secondary"
            size="h40"
            loading={isSavingLocal || saving}
            onClick={() => {
              void handleSave()
            }} >
            저장
          </CmsButton>
          <ExcelButton loading={exporting} disabled={exportDisabled} onClick={handleExport} />
        </div>
      </div>
      {session.scheduleIdUnresolved ? (
        <p className="school-detail-attendance-session__notice">
          교육 일정 ID를 확인할 수 없어 이 회차의 출석을 저장할 수 없습니다.
        </p>
      ) : null}
      <div className="school-detail-attendance-session__table-wrap">
        <SchoolDetailAttendanceTable
          rows={displayRows}
          emptyTitle={emptyTitle}
          onStatusChange={handleStatusChange}
        />
      </div>
    </section>
  )
}
