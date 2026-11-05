import { useCallback, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CMS_TABLE_NO_COL_CLASS } from '@/shared/constants/table'
import { useContainerFitTableScrollX } from '@/shared/lib/resolve-table-min-scroll-x'
import { CmsButton } from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  assignmentSubmissionStatusClassName,
  assignmentSubmissionStatusLabel,
  formatAssignmentRemarks,
  isAssignmentLogViewEnabled,
  isAssignmentPlanViewEnabled,
  resolveAssignmentSubmissionStatus,
} from './assignment-display'
import type { UjatAssignmentReportState, UjatAssignmentVolunteerRow } from './types'
import { UjatAssignmentDocumentViewerModal } from './document-viewer/ujat-assignment-document-viewer-modal'
import type {
  UjatDocumentViewerDocType,
  UjatDocumentViewerTarget,
} from './document-viewer/ujat-document-viewer-types'
import { formatUjatGradeClassDisplayLabel } from '@/features/program/ujat/lib/ujat-grade-class-display'
import './section.css'

/** Figma 4082:114026 — 고정 열. 비고는 flex(프레임 1546에서 406, min 80). */
const UJAT_ASSIGNMENT_COL_WIDTH = {
  no: 80,
  name: 140,
  institution: 180,
  assignedClass: 140,
  status: 240,
  plan: 180,
  log: 180,
  remarksMin: 80,
} as const

const COL_CLASS = {
  name: 'ujat-education-progress-assignments__col-name',
  institution: 'ujat-education-progress-assignments__col-institution',
  assignedClass: 'ujat-education-progress-assignments__col-assigned-class',
  status: 'ujat-education-progress-assignments__col-status',
  plan: 'ujat-volunteer-assignment-table__plan-log-cell ujat-education-progress-assignments__col-plan',
  log: 'ujat-volunteer-assignment-table__plan-log-cell ujat-education-progress-assignments__col-log',
  remarks: 'ujat-education-progress-assignments__col-remarks',
} as const

function columnCellClass(className: string) {
  return {
    onHeaderCell: () => ({ className }),
    onCell: () => ({ className }),
  }
}

function renderPlanLogViewButton(
  label: string,
  enabled: boolean,
  onView: () => void
) {
  return (
    <div className="ujat-volunteer-assignment-table__plan-log-cell-inner">
      <CmsButton
        type="button"
        variant="default"
        size="h32"
        disabled={!enabled}
        onClick={enabled ? onView : undefined}
      >
        {label}
      </CmsButton>
    </div>
  )
}

function renderSubmissionStatus(row: UjatAssignmentVolunteerRow) {
  const key = resolveAssignmentSubmissionStatus(row)
  const label = assignmentSubmissionStatusLabel(key)
  const statusClassName = assignmentSubmissionStatusClassName(key)
  return (
    <span className={`ujat-education-progress-assignments__status ${statusClassName}`}>
      {label}
    </span>
  )
}

function renderRemarks(row: UjatAssignmentVolunteerRow) {
  return (
    <span className="ujat-education-progress-assignments__remarks">
      {formatAssignmentRemarks(row)}
    </span>
  )
}

export function UjatEducationProgressAssignmentTable({
  rows,
  regionLabel,
}: {
  rows: UjatAssignmentVolunteerRow[]
  regionLabel: string
}) {
  const [viewerTarget, setViewerTarget] = useState<UjatDocumentViewerTarget | null>(null)

  const openViewer = useCallback(
    (
      record: UjatAssignmentVolunteerRow,
      docType: UjatDocumentViewerDocType,
      report: UjatAssignmentReportState
    ) => {
      setViewerTarget({
        docType,
        volunteerName: record.name,
        regionLabel,
        institutionName: record.institutionName,
        assignedClass: formatUjatGradeClassDisplayLabel(record.assignedClass),
        submittedDateLabel: report.submittedDateLabel ?? '',
        formResponseId: report.formResponseId,
      })
    },
    [regionLabel]
  )

  const tableData = useMemo(() => {
    const total = rows.length
    return rows.map((row, index) => ({
      ...row,
      no: total - index,
    }))
  }, [rows])

  const columns: ColumnsType<UjatAssignmentVolunteerRow & { no: number }> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: UJAT_ASSIGNMENT_COL_WIDTH.no,
        align: 'center',
        className: CMS_TABLE_NO_COL_CLASS,
        ...columnCellClass(CMS_TABLE_NO_COL_CLASS),
      },
      {
        title: '봉사자명',
        dataIndex: 'name',
        key: 'name',
        width: UJAT_ASSIGNMENT_COL_WIDTH.name,
        align: 'center',
        ellipsis: true,
        ...columnCellClass(COL_CLASS.name),
      },
      {
        title: '배정 기관',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: UJAT_ASSIGNMENT_COL_WIDTH.institution,
        align: 'center',
        ellipsis: true,
        ...columnCellClass(COL_CLASS.institution),
      },
      {
        title: '배정 학급',
        dataIndex: 'assignedClass',
        key: 'assignedClass',
        width: UJAT_ASSIGNMENT_COL_WIDTH.assignedClass,
        align: 'center',
        ellipsis: true,
        ...columnCellClass(COL_CLASS.assignedClass),
        render: (assignedClass: string) => formatUjatGradeClassDisplayLabel(assignedClass),
      },
      {
        title: '제출 현황',
        key: 'submissionStatus',
        width: UJAT_ASSIGNMENT_COL_WIDTH.status,
        align: 'center',
        ...columnCellClass(COL_CLASS.status),
        render: (_: unknown, record: UjatAssignmentVolunteerRow) =>
          renderSubmissionStatus(record),
      },
      {
        title: '교육 계획서',
        key: 'educationPlan',
        width: UJAT_ASSIGNMENT_COL_WIDTH.plan,
        align: 'center',
        ...columnCellClass(COL_CLASS.plan),
        render: (_: unknown, record: UjatAssignmentVolunteerRow) =>
          renderPlanLogViewButton(
            '교육 계획서 보기',
            isAssignmentPlanViewEnabled(record.plan),
            () => openViewer(record, 'plan', record.plan)
          ),
      },
      {
        title: '교육 일지',
        key: 'educationLog',
        width: UJAT_ASSIGNMENT_COL_WIDTH.log,
        align: 'center',
        ...columnCellClass(COL_CLASS.log),
        render: (_: unknown, record: UjatAssignmentVolunteerRow) =>
          renderPlanLogViewButton(
            '교육일지 보기',
            isAssignmentLogViewEnabled(record.log),
            () => openViewer(record, 'log', record.log)
          ),
      },
      {
        title: '비고',
        key: 'remarks',
        minWidth: UJAT_ASSIGNMENT_COL_WIDTH.remarksMin,
        align: 'center',
        ...columnCellClass(COL_CLASS.remarks),
        render: (_: unknown, record: UjatAssignmentVolunteerRow) => renderRemarks(record),
      },
    ],
    [openViewer]
  )

  const { tableWrapRef, tableScrollX } = useContainerFitTableScrollX(
    columns as ColumnsType<unknown>,
    { includeSelection: false }
  )

  return (
    <>
      <div
        ref={tableWrapRef}
        className="ujat-education-progress-assignments__table-wrap cms-data-table-fit-scroll-wrap"
      >
        <CmsDataTable<UjatAssignmentVolunteerRow & { no: number }>
          rowKey="id"
          className="cms-data-table cms-data-table--skip-auto-no-col ujat-education-progress-assignments__table"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          tableLayout="fixed"
          scroll={tableScrollX != null ? { x: tableScrollX } : undefined}
          onRow={record => ({
            className: record.isDropout
              ? 'ujat-education-progress-assignments__row--dropout'
              : undefined,
          })}
        />
      </div>

      <UjatAssignmentDocumentViewerModal
        open={viewerTarget != null}
        onCancel={() => setViewerTarget(null)}
        target={viewerTarget}
      />
    </>
  )
}
