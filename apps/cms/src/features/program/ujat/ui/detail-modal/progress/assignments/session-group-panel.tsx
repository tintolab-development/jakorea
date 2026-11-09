import { useMemo } from 'react'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { ExcelButton } from '@/shared/ui'
import { UjatInlineDividedSegments } from '@/features/program/ujat/ui/detail-modal/shared/ujat-inline-divided-segments'
import { UjatEducationProgressAssignmentTable } from './assignment-table'
import {
  UJAT_ASSIGNMENT_SESSION_EXCEL_COLUMNS,
  buildUjatAssignmentSessionExcelRows,
  resolveUjatAssignmentSessionExcelFilename,
} from './assignment-excel'
import type { UjatAssignmentSessionGroup } from './types'

export function UjatAssignmentSessionGroupHeader({
  session,
}: {
  session: UjatAssignmentSessionGroup
}) {
  return (
    <div className="table-header-title--wrapper">
      <span className="table-title">{session.dateLabel}</span>
      <span className="table-description">
        <UjatInlineDividedSegments
          segments={[
            `교육 계획서 제출 기간 : ${session.planSubmissionPeriodLabel}`,
            `교육일지 제출 기간 : ${session.logSubmissionPeriodLabel}`,
            `총 ${session.volunteers.length}건`,
          ]}
        />
      </span>
    </div>
  )
}

export function UjatAssignmentSessionExcelButton({
  session,
  regionLabel,
}: {
  session: UjatAssignmentSessionGroup
  regionLabel: string
}) {
  const excelRows = useMemo(
    () => buildUjatAssignmentSessionExcelRows(session.volunteers),
    [session.volunteers]
  )
  const { exportExcel, isExporting } = useTableExcelExport({
    accessLog: { downloadKind: 'PROGRAM_ASSIGNMENT_EXPORT', containedPiiTypes: ['NAME'] },
    columns: UJAT_ASSIGNMENT_SESSION_EXCEL_COLUMNS,
    data: excelRows,
    filename: resolveUjatAssignmentSessionExcelFilename(session, regionLabel),
  })

  return <ExcelButton loading={isExporting} onClick={exportExcel} />
}

export function UjatAssignmentSessionGroupPanel({
  session,
  regionLabel,
  showHeader = true,
}: {
  session: UjatAssignmentSessionGroup
  regionLabel: string
  showHeader?: boolean
}) {

  return (
    <section className="ujat-education-progress-assignments__session-group">
      {showHeader ? (
        <div className="table-header-actions ujat-education-progress-assignments__session-header">
          <UjatAssignmentSessionGroupHeader session={session} />
          <div className="info-section-buttons--wrapper">
              <UjatAssignmentSessionExcelButton session={session} regionLabel={regionLabel} />
            </div>
        </div>
      ) : null}
      <UjatEducationProgressAssignmentTable rows={session.volunteers} regionLabel={regionLabel} />
    </section>
  )
}
