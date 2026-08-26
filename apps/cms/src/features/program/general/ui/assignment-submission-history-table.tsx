/**
 * 과제·설문 제출 내역 테이블 — 회원 상세 모달·프로그램 참여자 상세 공통 SSOT
 * (열 순서·라벨·제출 파일 셀·역할 tag100)
 */

import { useMemo, type ReactNode } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME,
} from '@/shared/components'
import { CmsButton } from '@/shared/ui'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { assignmentTeamRoleTagClassName, ASSIGNMENT_TEAM_ROLE_TAG_DROPDOWN_STYLE } from '@/features/program/general/lib/assignment-team-role-tag'
import {
  ASSIGNMENT_TEAM_ROLE_LABELS,
  ASSIGNMENT_TEAM_ROLE_OPTIONS,
  LECTURE_PROGRESS_DISPLAY_LABELS,
  type AssignmentSubmissionTableRow,
  type AssignmentTeamRoleKey,
  type LectureProgressDisplayKey,
} from '@/features/program/general/model/school-detail-types'
import './assignment-submission-history-table.css'

export type AssignmentSubmissionHistoryTableRow = AssignmentSubmissionTableRow & {
  no: number
}

type StatusTextKind = 'scheduled' | 'completed' | 'undone'

function statusTextClassNames(kind: StatusTextKind): string {
  return `assignment-submission-modal__status-text assignment-submission-modal__status-text--${kind}`
}

function lectureProgressClass(key: LectureProgressDisplayKey): string {
  return key === 'scheduled' ? statusTextClassNames('scheduled') : statusTextClassNames('completed')
}

export function AssignmentSubmissionCellActionButton({
  children,
  onClick,
  disabled,
  loading,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <div className="assignment-submission-history-table__cell-action">
      <CmsButton
        variant="default"
        size="medium"
        width="100%"
        className="assignment-submission-history-table__cell-action-btn"
        disabled={disabled}
        loading={loading}
        onClick={onClick}
      >
        {children}
      </CmsButton>
    </div>
  )
}

function renderSubmissionCell(
  record: AssignmentSubmissionTableRow,
  onOpenPreview: (row: AssignmentSubmissionTableRow) => void
) {
  if (record.lectureProgress === 'scheduled' || record.submissionStatus === 'none') {
    return '-'
  }

  if (record.submissionStatus === 'not_submitted') {
    return <span className={statusTextClassNames('undone')}>미제출</span>
  }

  if (record.submissionStatus === 'scheduled') {
    return <span className={statusTextClassNames('scheduled')}>진행 예정</span>
  }

  if (record.submissionStatus === 'submitted' && record.canViewAssignment) {
    return (
      <AssignmentSubmissionCellActionButton onClick={() => onOpenPreview(record)}>
        과제 보기
      </AssignmentSubmissionCellActionButton>
    )
  }

  if (record.submissionStatus === 'submitted') {
    return <span className={statusTextClassNames('completed')}>제출 완료</span>
  }

  return '-'
}

export function useAssignmentSubmissionHistoryColumns(options: {
  isRemoteDetail: boolean
  openTeamRoleDropdownRowId: string | null
  onTeamRoleDropdownOpenChange: (rowId: string, open: boolean) => void
  onTeamRoleChange: (rowId: string, role: AssignmentTeamRoleKey) => void
  onOpenPreview: (row: AssignmentSubmissionTableRow) => void
}): ColumnsType<AssignmentSubmissionHistoryTableRow> {
  const {
    isRemoteDetail,
    openTeamRoleDropdownRowId,
    onTeamRoleDropdownOpenChange,
    onTeamRoleChange,
    onOpenPreview,
  } = options

  return useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      {
        title: '역할',
        key: 'teamRole',
        width: 140,
        align: 'center',
        onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME }),
        onCell: () => ({
          className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME}`,
        }),
        render: (_value, record) => {
          if (record.teamRole === 'individual' || isRemoteDetail) {
            return (
              <div className="assignment-submission-modal__role-static">
                <span className={assignmentTeamRoleTagClassName(record.teamRole)}>
                  {ASSIGNMENT_TEAM_ROLE_LABELS[record.teamRole]}
                </span>
              </div>
            )
          }

          return (
            <StatusDropdownCell<AssignmentTeamRoleKey>
              status={record.teamRole}
              statusOptions={ASSIGNMENT_TEAM_ROLE_OPTIONS}
              renderBadge={role => (
                <span className={assignmentTeamRoleTagClassName(role)}>
                  {ASSIGNMENT_TEAM_ROLE_LABELS[role]}
                </span>
              )}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={newRole => onTeamRoleChange(record.id, newRole)}
              isOpen={openTeamRoleDropdownRowId === record.id}
              onOpenChange={open => onTeamRoleDropdownOpenChange(record.id, open)}
              emptyPlaceholder="-"
              tagLayout="tag100"
              style={ASSIGNMENT_TEAM_ROLE_TAG_DROPDOWN_STYLE}
            />
          )
        },
      },
      {
        title: '팀명',
        dataIndex: 'teamName',
        key: 'teamName',
        width: 140,
        align: 'center',
        render: (value: string) => value?.trim() || '-',
      },
      {
        title: '교육 진행 일정',
        dataIndex: 'educationDateLabel',
        key: 'educationDateLabel',
        width: 300,
        align: 'center',
        render: (value: string | undefined) => renderProgramDetailPipeSeparated(value),
      },
      {
        title: '과제 제출 기간',
        dataIndex: 'assignmentPeriodLabel',
        key: 'assignmentPeriodLabel',
        width: 300,
        align: 'center',
        render: (value: string | undefined) => value?.trim() || '-',
      },
      {
        title: '제출 파일',
        key: 'submission',
        width: 300,
        align: 'center',
        render: (_value, record) => renderSubmissionCell(record, onOpenPreview),
      },
      {
        title: '교육 진행 현황',
        key: 'educationProgress',
        width: 120,
        align: 'center',
        render: (_value, record) => (
          <span className={lectureProgressClass(record.lectureProgress)}>
            {LECTURE_PROGRESS_DISPLAY_LABELS[record.lectureProgress]}
          </span>
        ),
      },
    ],
    [
      isRemoteDetail,
      onOpenPreview,
      onTeamRoleChange,
      onTeamRoleDropdownOpenChange,
      openTeamRoleDropdownRowId,
    ]
  )
}

export function AssignmentSubmissionHistoryTable({
  rows,
  columns,
  loading = false,
}: {
  rows: AssignmentSubmissionHistoryTableRow[]
  columns: ColumnsType<AssignmentSubmissionHistoryTableRow>
  loading?: boolean
}) {
  return (
    <div className="assignment-submission-modal__table-outer">
      <Table<AssignmentSubmissionHistoryTableRow>
        rowKey="id"
        className="cms-data-table cms-data-table--fluid"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={false}
        tableLayout="fixed"
        scroll={{ x: 1200 }}
      />
    </div>
  )
}

export function mapAssignmentSubmissionRowsWithNo(
  rows: AssignmentSubmissionTableRow[]
): AssignmentSubmissionHistoryTableRow[] {
  return rows.map((row, index) => ({
    ...row,
    no: rows.length - index,
  }))
}
