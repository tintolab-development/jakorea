import { useCallback, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton } from '@/shared/ui'
import {
  assignmentSubmissionStatusClassName,
  assignmentSubmissionStatusLabel,
  formatAssignmentRemarks,
  isAssignmentLogViewEnabled,
  isAssignmentPlanViewEnabled,
  resolveAssignmentSubmissionStatus,
} from './assignment-display'
import type { UjatAssignmentVolunteerRow } from './types'
import { UjatAssignmentDocumentViewerModal } from './document-viewer/ujat-assignment-document-viewer-modal'
import type { UjatDocumentViewerTarget } from './document-viewer/ujat-document-viewer-types'
import { parseSubmittedDate } from './document-viewer/ujat-document-viewer-types'
import '../volunteers/detail/assignment.css'
import './section.css'

const PLAN_LOG_CELL_CLASSNAME = 'ujat-volunteer-assignment-table__plan-log-cell'

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
        size="medium"
        width={140}
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
  const text = formatAssignmentRemarks(row)
  if (text === '-') {
    return <span className="ujat-education-progress-assignments__remarks-dash">-</span>
  }
  return (
    <span className="ujat-education-progress-assignments__remarks">{text}</span>
  )
}

export const UJAT_ASSIGNMENT_TABLE_MIN_SCROLL_X = 1180

export function UjatEducationProgressAssignmentTable({
  rows,
  regionLabel,
}: {
  rows: UjatAssignmentVolunteerRow[]
  regionLabel: string
}) {
  const [viewerTarget, setViewerTarget] = useState<UjatDocumentViewerTarget | null>(null)

  const openPlanViewer = useCallback(
    (record: UjatAssignmentVolunteerRow) => {
      setViewerTarget({
        docType: 'plan',
        volunteerName: record.name,
        regionLabel,
        institutionName: record.institutionName,
        assignedClass: record.assignedClass,
        submittedDateLabel: parseSubmittedDate(record.plan.submittedDateLabel),
      })
    },
    [regionLabel]
  )

  const openLogViewer = useCallback(
    (record: UjatAssignmentVolunteerRow) => {
      setViewerTarget({
        docType: 'log',
        volunteerName: record.name,
        regionLabel,
        institutionName: record.institutionName,
        assignedClass: record.assignedClass,
        submittedDateLabel: parseSubmittedDate(record.log.submittedDateLabel),
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
        width: 64,
        align: 'center',
      },
      {
        title: '봉사자명',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        align: 'center',
      },
      {
        title: '배정 기관',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: 140,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '배정 학급',
        dataIndex: 'assignedClass',
        key: 'assignedClass',
        width: 120,
        align: 'center',
      },
      {
        title: '제출 현황',
        key: 'submissionStatus',
        width: 168,
        align: 'center',
        render: (_: unknown, record: UjatAssignmentVolunteerRow) =>
          renderSubmissionStatus(record),
      },
      {
        title: '교육 계획서',
        key: 'educationPlan',
        width: 168,
        align: 'center',
        onHeaderCell: () => ({ className: PLAN_LOG_CELL_CLASSNAME }),
        onCell: () => ({ className: PLAN_LOG_CELL_CLASSNAME }),
        render: (_: unknown, record: UjatAssignmentVolunteerRow) =>
          renderPlanLogViewButton(
            '교육 계획서 보기',
            isAssignmentPlanViewEnabled(record.plan),
            () => openPlanViewer(record)
          ),
      },
      {
        title: '교육 일지',
        key: 'educationLog',
        width: 168,
        align: 'center',
        onHeaderCell: () => ({ className: PLAN_LOG_CELL_CLASSNAME }),
        onCell: () => ({ className: PLAN_LOG_CELL_CLASSNAME }),
        render: (_: unknown, record: UjatAssignmentVolunteerRow) =>
          renderPlanLogViewButton(
            '교육일지 보기',
            isAssignmentLogViewEnabled(record.log),
            () => openLogViewer(record)
          ),
      },
      {
        title: '비고',
        key: 'remarks',
        width: 220,
        align: 'center',
        render: (_: unknown, record: UjatAssignmentVolunteerRow) => renderRemarks(record),
      },
    ],
    [openPlanViewer, openLogViewer]
  )

  return (
    <>
      <Table<UjatAssignmentVolunteerRow & { no: number }>
        rowKey="id"
        className="cms-data-table ujat-education-progress-assignments__table"
        columns={columns}
        dataSource={tableData}
        pagination={false}
        tableLayout="fixed"
        scroll={{ x: UJAT_ASSIGNMENT_TABLE_MIN_SCROLL_X }}
        onRow={record => ({
          className: record.isDropout
            ? 'ujat-education-progress-assignments__row--dropout'
            : undefined,
        })}
      />

      <UjatAssignmentDocumentViewerModal
        open={viewerTarget != null}
        onCancel={() => setViewerTarget(null)}
        target={viewerTarget}
      />
    </>
  )
}
