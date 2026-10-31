import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import {
  UJAT_ATTENDANCE_SESSION_EXCEL_COLUMNS,
  buildUjatAttendanceSessionExcelRows,
  resolveUjatAttendanceSessionExcelFilename,
} from './attendance-excel'
import { UjatInlineDividedSegments } from '@/features/program/ujat/ui/detail-modal/shared/ujat-inline-divided-segments'
import {
  cloneAttendanceVolunteerRows,
  filterVisibleAttendanceVolunteers,
  parseSessionStartTime,
} from './attendance-display'
import {
  buildCorrectedVolunteerRow,
  UjatAttendanceCorrectionModal,
  type UjatAttendanceCorrectionPayload,
} from './attendance-correction-modal'
import { filterAttendanceVolunteersForDisplay } from './use-list'
import { UjatAttendanceTable } from './attendance-table'
import { formatMonthDayWithWeekday } from '@/shared/utils/date'
import type { UjatAttendanceFilters } from './types'
import type { UjatAttendanceSessionGroup, UjatAttendanceVolunteerRow } from './types'

function resolveEducationDateLabel(session: UjatAttendanceSessionGroup): string {
  const formatted = formatMonthDayWithWeekday(session.isoDate)
  if (formatted !== '-') return formatted
  return session.dateLabel
}

export function UjatAttendanceSessionGroupHeader({
  session,
  totalCount,
}: {
  session: UjatAttendanceSessionGroup
  totalCount: number
}) {
  return (
    <div className="table-header-title--wrapper">
      <span className="table-title">{session.dateLabel}</span>
      <span className="table-description--black">
        <UjatInlineDividedSegments
          segments={[session.institutionName, session.district, session.timeRange]}
        />
      </span>
      <span className="table-description">총 {totalCount}건</span>
    </div>
  )
}

export function UjatAttendanceSessionGroupPanel({
  session,
  appliedFilters,
  getSessionVolunteers,
  onSave,
  showHeader = true,
  onBindOpenCorrection,
}: {
  session: UjatAttendanceSessionGroup
  appliedFilters: UjatAttendanceFilters
  getSessionVolunteers: (sessionId: string) => UjatAttendanceVolunteerRow[]
  onSave: (sessionId: string, volunteers: UjatAttendanceVolunteerRow[]) => void
  showHeader?: boolean
  onBindOpenCorrection?: (openCorrection: () => void) => void
}) {
  const { showAlert } = useCmsAlert()
  const canWrite = useUjatCanWrite()
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false)
  const [workingRows, setWorkingRows] = useState<UjatAttendanceVolunteerRow[]>(() =>
    cloneAttendanceVolunteerRows(getSessionVolunteers(session.id))
  )

  const sessionStartTime = useMemo(
    () => parseSessionStartTime(session.timeRange),
    [session.timeRange]
  )

  const correctionVolunteers = useMemo(
    () => filterVisibleAttendanceVolunteers(workingRows),
    [workingRows]
  )

  const displayRows = useMemo(
    () => filterAttendanceVolunteersForDisplay(workingRows, appliedFilters),
    [appliedFilters, workingRows]
  )

  const excelRows = useMemo(() => buildUjatAttendanceSessionExcelRows(displayRows), [displayRows])

  const { exportExcel, isExporting } = useTableExcelExport({
    columns: UJAT_ATTENDANCE_SESSION_EXCEL_COLUMNS,
    data: excelRows,
    filename: resolveUjatAttendanceSessionExcelFilename(session),
  })

  useEffect(() => {
    const rows = cloneAttendanceVolunteerRows(getSessionVolunteers(session.id))
    setWorkingRows(rows)
    setCorrectionModalOpen(false)
  }, [getSessionVolunteers, session.id])

  const openCorrectionModal = useCallback(() => {
    setCorrectionModalOpen(true)
  }, [])

  useEffect(() => {
    onBindOpenCorrection?.(openCorrectionModal)
  }, [onBindOpenCorrection, openCorrectionModal])

  const handleCorrectionConfirm = useCallback(
    (payload: UjatAttendanceCorrectionPayload) => {
      setWorkingRows(prev => {
        const nextRows = prev.map(row =>
          row.id === payload.volunteerId
            ? buildCorrectedVolunteerRow(row, payload, sessionStartTime)
            : row
        )
        onSave(session.id, nextRows)
        return nextRows
      })
      setCorrectionModalOpen(false)
      showAlert({ title: '안내', content: '출결 정보가 저장되었습니다.' })
    },
    [onSave, session.id, sessionStartTime, showAlert]
  )

  return (
    <section className="ujat-attendance-session-group">
      {showHeader ? (
        <div className="table-header-actions ujat-attendance-session-group__header">
          <UjatAttendanceSessionGroupHeader session={session} totalCount={displayRows.length} />
          <div className="info-section-buttons--wrapper">
            {canWrite ? (
              <>
            <CmsButton type="button" variant="secondary" size="h40" onClick={openCorrectionModal}>
              출결 정정
            </CmsButton>
            <ExcelButton loading={isExporting} onClick={exportExcel} />
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="ujat-attendance-session-group__table-wrap">
        <UjatAttendanceTable rows={displayRows} />
      </div>

      <UjatAttendanceCorrectionModal
        open={correctionModalOpen}
        timeRange={session.timeRange}
        educationDateLabel={resolveEducationDateLabel(session)}
        volunteers={correctionVolunteers}
        onCancel={() => setCorrectionModalOpen(false)}
        onConfirm={handleCorrectionConfirm}
      />
    </section>
  )
}
