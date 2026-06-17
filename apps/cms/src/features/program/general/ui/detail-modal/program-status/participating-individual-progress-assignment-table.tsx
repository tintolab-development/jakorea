import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { useCmsAlert } from '@/shared/ui'
import { resolveProgressAssignmentRemark } from '@/features/program/general/lib/participating-individual-progress-assignment-display'
import type { ParticipatingIndividualProgressAssignmentParticipantRow } from '@/features/program/general/lib/participating-individual-progress-assignment-types'

export const PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_TABLE_SCROLL_X = 1100

function SubmissionCell({
  row,
}: {
  row: ParticipatingIndividualProgressAssignmentParticipantRow
}) {
  const { showAlert } = useCmsAlert()
  const { submission } = row

  if (submission.kind === 'not_submitted') {
    return <span className="participating-individual-progress-assignment-table__not-submitted">미제출</span>
  }

  if (submission.kind === 'scheduled') {
    return (
      <span className="participating-individual-progress-assignment-table__scheduled">
        교육 진행 예정
      </span>
    )
  }

  return (
    <div className="participating-individual-progress-assignment-table__submission-links">
      <button
        type="button"
        className="participating-individual-progress-assignment-table__submission-link"
        onClick={() => showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })}
      >
        {submission.fileName}
      </button>
      {submission.secondaryFileName ? (
        <button
          type="button"
          className="participating-individual-progress-assignment-table__submission-link"
          onClick={() => showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })}
        >
          {submission.secondaryFileName}
        </button>
      ) : null}
    </div>
  )
}

export function ParticipatingIndividualProgressAssignmentTable({
  rows,
}: {
  rows: ParticipatingIndividualProgressAssignmentParticipantRow[]
}) {
  const tableData = useMemo(() => {
    const total = rows.length
    return rows.map((row, index) => ({
      ...row,
      no: total - index,
    }))
  }, [rows])

  const columns: ColumnsType<
    ParticipatingIndividualProgressAssignmentParticipantRow & { no: number }
  > = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      {
        title: '참여자명',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        align: 'center',
      },
      {
        title: '성별 및 생년월일',
        dataIndex: 'genderBirthLabel',
        key: 'genderBirthLabel',
        width: 180,
        align: 'center',
      },
      {
        title: '소속 및 학년',
        dataIndex: 'affiliationGradeLabel',
        key: 'affiliationGradeLabel',
        width: 200,
        align: 'center',
      },
      {
        title: '제출 파일',
        key: 'submission',
        width: 260,
        align: 'center',
        render: (_value, record) => <SubmissionCell row={record} />,
      },
      {
        title: '비고',
        key: 'remark',
        width: 220,
        align: 'center',
        ellipsis: true,
        render: (_value, record) => resolveProgressAssignmentRemark(record),
      },
    ],
    []
  )

  return (
    <Table<ParticipatingIndividualProgressAssignmentParticipantRow & { no: number }>
      rowKey="id"
      className="cms-data-table participating-individual-progress-assignment-table"
      columns={columns}
      dataSource={tableData}
      pagination={false}
      tableLayout="fixed"
      scroll={{ x: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_TABLE_SCROLL_X }}
    />
  )
}
