import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { useCmsAlert } from '@/shared/ui'
import { AssignmentSubmissionCellActionButton } from '@/features/program/general/ui/assignment-submission-history-table'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import type { Program } from '@/types/domain'
import { assignmentTeamRoleTagClassName, ASSIGNMENT_TEAM_ROLE_TAG_DROPDOWN_STYLE } from '@/features/program/general/lib/assignment-team-role-tag'
import {
  applyTeamNameFromSessionOrder,
  buildParticipatingIndividualParticipantAssignmentSummary,
  getParticipatingIndividualParticipantAssignmentBundle,
  sortParticipatingIndividualParticipantAssignmentRows,
} from '@/features/program/general/lib/participating-individual-participant-assignment-mock'
import { PARTICIPATING_INDIVIDUAL_PARTICIPANT_ASSIGNMENT_EXCEL_COLUMNS } from '@/features/program/general/lib/participating-individual-participant-assignment-export'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import type {
  ParticipatingIndividualParticipantAssignmentRow,
  ParticipatingIndividualParticipantAssignmentTeamRole,
} from '@/features/program/general/lib/participating-individual-participant-assignment-types'
import {
  ASSIGNMENT_TEAM_ROLE_LABELS,
  LECTURE_PROGRESS_DISPLAY_LABELS,
} from '@/features/program/general/model/school-detail-types'
import { ProgramAttendanceRateValue } from '@/features/program/shared/ui/program-attendance-rate-value'
import {
  ParticipatingIndividualParticipantTeamChangeModal,
  type ParticipatingIndividualParticipantTeamChangeConfirmPayload,
} from './participating-individual-participant-team-change-modal'
import '@/features/program/general/ui/assignment-submission-modal.css'
import './participating-individual-participant-assignment-section.css'

const TEAM_ASSIGNMENT_ROLE_OPTIONS: readonly ParticipatingIndividualParticipantAssignmentTeamRole[] =
  ['leader', 'member']

export type ParticipatingIndividualParticipantAssignmentSectionHandle = {
  openTeamChangeModal: () => void
  bulkDownloadAssignments: () => void
  exportExcel: () => void
}

function lectureProgressClassName(
  key: ParticipatingIndividualParticipantAssignmentRow['educationProgress']
) {
  return key === 'scheduled'
    ? 'assignment-submission-modal__status-text assignment-submission-modal__status-text--scheduled'
    : 'assignment-submission-modal__status-text assignment-submission-modal__status-text--completed'
}

export interface ParticipatingIndividualParticipantAssignmentSectionProps {
  program: Program
  participant: ParticipatingIndividualParticipantRow
}

export const ParticipatingIndividualParticipantAssignmentSection = forwardRef<
  ParticipatingIndividualParticipantAssignmentSectionHandle,
  ParticipatingIndividualParticipantAssignmentSectionProps
>(function ParticipatingIndividualParticipantAssignmentSection({ program, participant }, ref) {
  const { showAlert } = useCmsAlert()
  const bundle = useMemo(
    () => getParticipatingIndividualParticipantAssignmentBundle(participant, program),
    [participant, program]
  )

  const [rows, setRows] = useState(() =>
    sortParticipatingIndividualParticipantAssignmentRows(bundle.rows)
  )
  const [teamChangeModalOpen, setTeamChangeModalOpen] = useState(false)
  const [openTeamRoleDropdownRowId, setOpenTeamRoleDropdownRowId] = useState<string | null>(null)

  useEffect(() => {
    setRows(sortParticipatingIndividualParticipantAssignmentRows(bundle.rows))
    setTeamChangeModalOpen(false)
    setOpenTeamRoleDropdownRowId(null)
  }, [bundle.rows, participant.id])

  const tableData = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        no: rows.length - index,
      })),
    [rows]
  )

  const summary = useMemo(
    () => buildParticipatingIndividualParticipantAssignmentSummary(rows),
    [rows]
  )

  const { exportExcel } = useTableExcelExport({
    columns: PARTICIPATING_INDIVIDUAL_PARTICIPANT_ASSIGNMENT_EXCEL_COLUMNS,
    data: tableData,
    filename: `참여자_과제내역_${participant.applicantName}`,
  })

  const teamChangeScheduleOptions = useMemo(
    () =>
      rows
        .filter(row => row.isTeamSchedule)
        .map(row => ({
          value: row.id,
          label: row.scheduleLabel,
          sessionOrder: row.sessionOrder,
        })),
    [rows]
  )

  const defaultTeamName = useMemo(() => {
    const teamRow = rows.find(row => row.isTeamSchedule && row.teamName.trim() !== '-')
    return teamRow?.teamName ?? participant.detail?.teamName ?? ''
  }, [participant.detail?.teamName, rows])

  const handleOpenTeamChangeModal = useCallback(() => {
    if (teamChangeScheduleOptions.length === 0) {
      showAlert({
        title: '안내',
        content: '팀으로 진행된 교육 일정이 없습니다.',
      })
      return
    }
    setTeamChangeModalOpen(true)
  }, [showAlert, teamChangeScheduleOptions.length])

  const handleBulkDownloadAssignments = useCallback(() => {
    const fileRows = rows.filter(row => row.submission.kind === 'file')
    if (fileRows.length === 0) {
      showAlert({
        title: '안내',
        content: '다운로드할 제출 파일이 없습니다.',
      })
      return
    }
    showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })
  }, [rows, showAlert])

  useImperativeHandle(
    ref,
    () => ({
      openTeamChangeModal: handleOpenTeamChangeModal,
      bulkDownloadAssignments: handleBulkDownloadAssignments,
      exportExcel,
    }),
    [exportExcel, handleBulkDownloadAssignments, handleOpenTeamChangeModal]
  )

  const handleTeamRoleChange = useCallback(
    (rowId: string, newRole: ParticipatingIndividualParticipantAssignmentTeamRole) => {
      setRows(prev => prev.map(row => (row.id === rowId ? { ...row, teamRole: newRole } : row)))
    },
    []
  )

  const handleTeamChangeConfirm = useCallback(
    (payload: ParticipatingIndividualParticipantTeamChangeConfirmPayload) => {
      setRows(prev =>
        sortParticipatingIndividualParticipantAssignmentRows(
          applyTeamNameFromSessionOrder(prev, payload.fromSessionOrder, payload.teamName)
        )
      )
      setTeamChangeModalOpen(false)
      showAlert({
        title: '안내',
        content: '팀명이 변경되었습니다.',
      })
    },
    [showAlert]
  )

  const showComingSoon = useCallback(() => {
    showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })
  }, [showAlert])

  const renderSubmissionCell = useCallback(
    (record: ParticipatingIndividualParticipantAssignmentRow) => {
      const { submission, educationProgress } = record

      if (educationProgress === 'scheduled' || submission.kind === 'none') {
        return '-'
      }

      if (submission.kind === 'not_submitted') {
        return (
          <span className="assignment-submission-modal__status-text assignment-submission-modal__status-text--undone">
            미제출
          </span>
        )
      }

      if (submission.kind === 'file') {
        return (
          <button
            type="button"
            className="participating-individual-participant-assignment-section__submission-link"
            onClick={showComingSoon}
          >
            {submission.fileName}
          </button>
        )
      }

      if (submission.kind === 'link') {
        return (
          <a
            className="participating-individual-participant-assignment-section__submission-link"
            href={submission.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {submission.label}
          </a>
        )
      }

      if (submission.kind === 'survey_view') {
        return (
          <AssignmentSubmissionCellActionButton onClick={showComingSoon}>
            설문조사 보기
          </AssignmentSubmissionCellActionButton>
        )
      }

      if (submission.kind === 'satisfaction_survey_view') {
        return (
          <AssignmentSubmissionCellActionButton onClick={showComingSoon}>
            만족도조사 보기
          </AssignmentSubmissionCellActionButton>
        )
      }

      return '-'
    },
    [showComingSoon]
  )

  const columns: ColumnsType<ParticipatingIndividualParticipantAssignmentRow & { no: number }> =
    useMemo(
      () => [
        {
          title: 'No.',
          dataIndex: 'no',
          key: 'no',
          width: 80,
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
            if (record.teamRole === 'individual') {
              return (
                <div className="participating-individual-participant-assignment-section__role-static">
                  <span className={assignmentTeamRoleTagClassName('individual')}>
                    {ASSIGNMENT_TEAM_ROLE_LABELS.individual}
                  </span>
                </div>
              )
            }

            return (
              <StatusDropdownCell<ParticipatingIndividualParticipantAssignmentTeamRole>
                status={record.teamRole}
                statusOptions={TEAM_ASSIGNMENT_ROLE_OPTIONS}
                renderBadge={role => (
                  <span className={assignmentTeamRoleTagClassName(role)}>
                    {ASSIGNMENT_TEAM_ROLE_LABELS[role]}
                  </span>
                )}
                isItemDisabled={(cur, opt) => cur === opt}
                onChange={newRole => handleTeamRoleChange(record.id, newRole)}
                isOpen={openTeamRoleDropdownRowId === record.id}
                onOpenChange={open => setOpenTeamRoleDropdownRowId(open ? record.id : null)}
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
          dataIndex: 'scheduleLabel',
          width: 300,
          key: 'scheduleLabel',
          align: 'center',
          render: (value: string | undefined) => renderProgramDetailPipeSeparated(value),
        },
        {
          title: '과제 제출 기간',
          key: 'assignmentPeriodLabel',
          width: 300,
          align: 'center',
          render: (_value, record) => record.assignmentPeriodLabel?.trim() || '-',
        },
        {
          title: '제출 파일',
          key: 'submission',
          width: 300,
          align: 'center',
          render: (_value, record) => renderSubmissionCell(record),
        },
        {
          title: '교육 진행 현황',
          key: 'educationProgress',
          width: 120,
          align: 'center',
          render: (_value, record) => (
            <span className={lectureProgressClassName(record.educationProgress)}>
              {LECTURE_PROGRESS_DISPLAY_LABELS[record.educationProgress]}
            </span>
          ),
        },
      ],
      [handleTeamRoleChange, openTeamRoleDropdownRowId, renderSubmissionCell]
    )

  return (
    <div className="program-attendance-detail">
      <FilterTableLayout
        bordered={false}
        showFilter={false}
        fields={[]}
        filters={{}}
        onFilterChange={() => {}}
        onSearch={() => {}}
        title="과제 및 설문 제출 내역"
        description={`총 ${rows.length}건`}
        hideExcelDownload
      >
        <div className="participating-individual-participant-assignment-section__table-outer assignment-submission-modal__table-outer">
          <Table<ParticipatingIndividualParticipantAssignmentRow & { no: number }>
            rowKey="id"
            className="cms-data-table cms-data-table--fluid"
            columns={columns}
            dataSource={tableData}
            pagination={false}
            tableLayout="fixed"
            scroll={{ x: 1200 }}
          />
        </div>
      </FilterTableLayout>

      <section className="program-detail-fullpage-modal__info-tab-block">
        <h3 className="program-detail-info-tab__section-title">과제 및 설문 제출 현황</h3>
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th scope="row">과제 제출률</th>
                <td>
                  <ProgramAttendanceRateValue
                    countLabel={`${summary.assignmentSubmittedCount} / ${summary.assignmentTotalCount}건`}
                  />
                </td>
                <th scope="row">설문 제출률</th>
                <td>{`${summary.surveySubmittedCount} / ${summary.surveyTotalCount}건`}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <ParticipatingIndividualParticipantTeamChangeModal
        open={teamChangeModalOpen}
        scheduleOptions={teamChangeScheduleOptions}
        defaultTeamName={defaultTeamName}
        onCancel={() => setTeamChangeModalOpen(false)}
        onConfirm={handleTeamChangeConfirm}
      />
    </div>
  )
})
