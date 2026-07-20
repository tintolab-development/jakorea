import { useMemo } from 'react'
import { ExcelButton } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import {
  PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_EXCEL_COLUMNS,
  buildProgressAssignmentSessionExcelRows,
  resolveProgressAssignmentSessionExcelFilename,
} from '@/features/program/general/lib/participating-individual-progress-assignment-export'
import {
  cloneProgressAssignmentParticipantRows,
  filterProgressAssignmentParticipantsForDisplay,
} from '@/features/program/general/lib/participating-individual-progress-assignment-display'
import type {
  ParticipatingIndividualProgressAssignmentFilters,
  ParticipatingIndividualProgressAssignmentParticipantRow,
  ParticipatingIndividualProgressAssignmentSessionGroup,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'
import { ParticipatingIndividualProgressAssignmentTable } from './participating-individual-progress-assignment-table'

export function ParticipatingIndividualProgressAssignmentSessionPanel({
  session,
  appliedFilters,
  getSessionParticipants,
}: {
  session: ParticipatingIndividualProgressAssignmentSessionGroup
  appliedFilters: ParticipatingIndividualProgressAssignmentFilters
  getSessionParticipants: (sessionId: string) => ParticipatingIndividualProgressAssignmentParticipantRow[]
}) {
  const participants = useMemo(() => {
    const rows = cloneProgressAssignmentParticipantRows(getSessionParticipants(session.id))
    return filterProgressAssignmentParticipantsForDisplay(rows, appliedFilters)
  }, [appliedFilters, getSessionParticipants, session.id])

  const excelRows = useMemo(
    () =>
      buildProgressAssignmentSessionExcelRows(
        session.headerPrefix,
        participants.map((row, index) => ({
          ...row,
          no: participants.length - index,
        }))
      ),
    [participants, session.headerPrefix]
  )

  const { exportExcel, isExporting } = useTableExcelExport({
    columns: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_EXCEL_COLUMNS,
    data: excelRows,
    filename: resolveProgressAssignmentSessionExcelFilename(session.headerTitle),
  })

  return (
    <section className="school-detail-attendance-session">
      <div className="table-header-actions">
        <div className="table-header-title--wrapper school-detail-attendance-session__title-row">
          <span className="table-title">{session.headerTitle}</span>
          <div className="school-detail-attendance-session__header-meta">
            <span>{session.headerScheduleSummary}</span>
            <span className="detail-info-form-inputs-separator" aria-hidden />
            <span>{session.headerPeriodRangeLabel}</span>
            <span className="detail-info-form-inputs-separator" aria-hidden />
            <span>과제 제출 기한 : {session.assignmentPeriodLabel}</span>
          </div>
          <span className="table-description">총 {participants.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <ExcelButton loading={isExporting} onClick={exportExcel} />
        </div>
      </div>
      <div className="school-detail-attendance-session__table-wrap">
        <ParticipatingIndividualProgressAssignmentTable rows={participants} />
      </div>
    </section>
  )
}
