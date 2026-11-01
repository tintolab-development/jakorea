import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/shared/components/detail-info-form/detail-info-form.css'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import { FilterTableToolbarButton, useCmsAlert } from '@/shared/ui'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { handleError } from '@/shared/utils/error-handler'
import { AssignmentSubmissionCellActionButton } from '@/features/program/general/ui/assignment-submission-history-table'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { Program } from '@/types/domain'
import { assignmentTeamRoleTagClassName, ASSIGNMENT_TEAM_ROLE_TAG_DROPDOWN_STYLE } from '@/features/program/general/lib/assignment-team-role-tag'
import {
  applyTeamNameFromSessionOrder,
  buildParticipatingIndividualParticipantAssignmentRowsFromAssigned,
  buildParticipatingIndividualParticipantAssignmentSummary,
  collectParticipantAssignmentDownloadableFiles,
  getParticipatingIndividualParticipantAssignmentBundle,
  mergeParticipantDetailAssignmentRowsWithRemote,
  sortParticipatingIndividualParticipantAssignmentRows,
} from '@/features/program/general/lib/participating-individual-participant-assignment'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { fetchGeneralProgressAssignmentBundle } from '@/features/program/general/api/admin-program-progress-service'
import { fetchGeneralProgramSurveyResponseDetail } from '@/features/program/general/api/admin-general-programs-service'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import type { SurveyAnswerResponse } from '@/shared/api/generated/dashboard/schemas/surveyAnswerResponse'
import { buildProgressAssignmentSessionsFromRemote } from '@/features/program/general/api/adapters/progress-assignment-adapters'
import {
  PARTICIPATING_INDIVIDUAL_PARTICIPANT_ASSIGNMENT_EXCEL_COLUMNS,
  PARTICIPATING_INDIVIDUAL_PARTICIPANT_ASSIGNMENT_EXCEL_COLUMNS_WITHOUT_TEAM,
} from '@/features/program/general/lib/participating-individual-participant-assignment-export'
import {
  isSubmissionTeamApplicable,
  isSubmissionTeamNotApplicableError,
} from '@/features/program/general/lib/submission-team-applicable'
import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
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
import {
  createGeneralProgramSubmissionTeam,
  fetchGeneralParticipantSubmissionTeam,
  fetchGeneralProgramSubmissionTeams,
  saveGeneralParticipantSubmissionTeam,
} from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import type { ParticipantSubmissionTeamRole } from '@/features/program/general/api/program-progress-api-client'
import '@/features/program/general/ui/assignment-submission-modal.css'
import './participating-individual-participant-assignment-section.css'

const TEAM_ASSIGNMENT_ROLE_OPTIONS: readonly ParticipatingIndividualParticipantAssignmentTeamRole[] =
  ['leader', 'member']

function mapApiSubmissionTeamRole(
  role?: string | null
): ParticipatingIndividualParticipantAssignmentTeamRole {
  const normalized = role?.trim().toUpperCase()
  if (normalized === 'LEADER') return 'leader'
  if (normalized === 'MEMBER') return 'member'
  return 'individual'
}

function mapUiSubmissionTeamRole(
  role: ParticipatingIndividualParticipantAssignmentTeamRole
): ParticipantSubmissionTeamRole {
  if (role === 'leader') return 'LEADER'
  if (role === 'member') return 'MEMBER'
  return 'INDIVIDUAL'
}

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
  assignedSessions?: readonly ParticipatingSchoolSession[]
  assignedSessionsLoading?: boolean
  /** 서버가 `TEAM_FEATURE_NOT_APPLICABLE`을 돌려줘 팀 UI를 숨겨야 할 때 */
  onTeamFeatureNotApplicable?: () => void
}

export const ParticipatingIndividualParticipantAssignmentSection = forwardRef<
  ParticipatingIndividualParticipantAssignmentSectionHandle,
  ParticipatingIndividualParticipantAssignmentSectionProps
>(function ParticipatingIndividualParticipantAssignmentSection(
  { program, participant, assignedSessions = [], assignedSessionsLoading = false, onTeamFeatureNotApplicable },
  ref
) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(program.id)
  const [teamFeatureRejected, setTeamFeatureRejected] = useState(false)
  const teamFeatureApplicable =
    isSubmissionTeamApplicable(program.businessArea) && !teamFeatureRejected

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'general-participant-detail-assignment',
    '참여자 상세 · 과제 팀 변경'
  )

  const offlineBundle = useMemo(
    () => getParticipatingIndividualParticipantAssignmentBundle(participant, program),
    [participant, program]
  )

  const submissionTeamQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.submissionTeam(program.id, participant.id),
    queryFn: () => fetchGeneralParticipantSubmissionTeam(program.id, participant.id),
    enabled: remoteEnabled && teamFeatureApplicable,
    staleTime: 15_000,
    retry: false,
  })

  const markTeamFeatureNotApplicable = useCallback(() => {
    setTeamFeatureRejected(true)
    setTeamChangeModalOpen(false)
    onTeamFeatureNotApplicable?.()
  }, [onTeamFeatureNotApplicable])

  useEffect(() => {
    if (isSubmissionTeamNotApplicableError(submissionTeamQuery.error)) {
      markTeamFeatureNotApplicable()
    }
  }, [markTeamFeatureNotApplicable, submissionTeamQuery.error])

  const assignmentSubmissionsQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.assignmentSubmissions(program.id),
    queryFn: () => fetchGeneralProgressAssignmentBundle(program.id),
    enabled: remoteEnabled,
    staleTime: 15_000,
    retry: false,
  })

  const overlayRows = useMemo(() => {
    const remoteSessions = assignmentSubmissionsQuery.data
      ? buildProgressAssignmentSessionsFromRemote(assignmentSubmissionsQuery.data, {
          program,
          giveUpParticipants: assignmentSubmissionsQuery.data.giveUpParticipants,
          participants: assignmentSubmissionsQuery.data.giveUpParticipants,
        })
      : []
    const assignedRows = assignedSessionsLoading
      ? []
      : buildParticipatingIndividualParticipantAssignmentRowsFromAssigned({
          assignedSessions,
          participant,
          program,
        })
    const localRows =
      assignedRows.length > 0
        ? assignedRows
        : remoteEnabled
          ? []
          : offlineBundle.rows
    const withSubmissions = mergeParticipantDetailAssignmentRowsWithRemote({
      participantId: participant.id,
      localRows,
      remoteSessions,
      surveyResponse: participant.surveyResponse,
      satisfactionResponse: participant.satisfactionResponse,
    })
    const team = submissionTeamQuery.data
    if (!team) return withSubmissions
    const teamName = team.teamName?.trim() || team.name?.trim()
    const teamRole = mapApiSubmissionTeamRole(team.role)
    return withSubmissions.map(row => ({
      ...row,
      teamName: teamName || row.teamName,
      teamRole: row.isTeamSchedule ? teamRole : row.teamRole,
    }))
  }, [
    assignedSessions,
    assignedSessionsLoading,
    assignmentSubmissionsQuery.data,
    offlineBundle.rows,
    participant,
    remoteEnabled,
    submissionTeamQuery.data,
    participant.satisfactionResponse,
    participant.surveyResponse,
    program,
  ])

  const [rows, setRows] = useState(() => overlayRows)
  const [teamChangeModalOpen, setTeamChangeModalOpen] = useState(false)
  const [openTeamRoleDropdownRowId, setOpenTeamRoleDropdownRowId] = useState<string | null>(null)
  const [surveyViewTitle, setSurveyViewTitle] = useState('설문조사 보기')
  const [surveyViewAnswers, setSurveyViewAnswers] = useState<SurveyAnswerResponse[] | null>(null)
  const [surveyViewLoading, setSurveyViewLoading] = useState(false)

  useEffect(() => {
    setRows(overlayRows)
    setTeamChangeModalOpen(false)
    setOpenTeamRoleDropdownRowId(null)
  }, [overlayRows, participant.id])

  const tableData = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        no: index + 1,
      })),
    [rows]
  )

  const summary = useMemo(
    () => buildParticipatingIndividualParticipantAssignmentSummary(rows),
    [rows]
  )

  const { exportExcel } = useTableExcelExport({
    columns: teamFeatureApplicable
      ? PARTICIPATING_INDIVIDUAL_PARTICIPANT_ASSIGNMENT_EXCEL_COLUMNS
      : PARTICIPATING_INDIVIDUAL_PARTICIPANT_ASSIGNMENT_EXCEL_COLUMNS_WITHOUT_TEAM,
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
    if (!teamFeatureApplicable) return
    if (teamChangeScheduleOptions.length === 0) {
      showAlert({
        title: '안내',
        content: '팀으로 진행된 교육 일정이 없습니다.',
      })
      return
    }
    setTeamChangeModalOpen(true)
  }, [showAlert, teamChangeScheduleOptions.length, teamFeatureApplicable])

  const handleTeamFeatureNotApplicableError = useCallback(
    (error: unknown) => {
      if (!isSubmissionTeamNotApplicableError(error)) return false
      markTeamFeatureNotApplicable()
      const data = (error as { response?: { data?: unknown } }).response?.data
      showAlert({
        title: '안내',
        content: extractApiErrorMessage(data, {
          fallback: '이 프로그램은 팀 제출 기능을 사용하지 않습니다.',
        }),
      })
      return true
    },
    [markTeamFeatureNotApplicable, showAlert]
  )

  const downloadAssignmentFile = useCallback(
    async (fileObjectId?: number, fileName?: string, downloadable?: boolean) => {
      if (fileObjectId == null || downloadable !== true) {
        showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })
        return
      }
      try {
        await downloadAdminFile({
          fileObjectId,
          fileName: fileName?.trim() || `과제_${fileObjectId}`,
        })
      } catch (error) {
        handleError(error, { context: 'downloadParticipantDetailAssignmentFile' })
      }
    },
    [showAlert]
  )

  const handleBulkDownloadAssignments = useCallback(() => {
    const files = collectParticipantAssignmentDownloadableFiles(rows)
    if (files.length === 0) {
      showAlert({
        title: '안내',
        content: '다운로드할 제출 파일이 없습니다.',
      })
      return
    }
    void (async () => {
      for (const file of files) {
        await downloadAssignmentFile(file.fileObjectId, file.fileName, true)
      }
    })()
  }, [downloadAssignmentFile, rows, showAlert])

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
    (_rowId: string, newRole: ParticipatingIndividualParticipantAssignmentTeamRole) => {
      if (!remoteEnabled) {
        notifyProgramApiUnavailable(
          'general-participant-detail-assignment-role',
          '참여자 상세 · 과제 팀 역할'
        )
        return
      }
      const current = submissionTeamQuery.data
      const expectedRevision = current?.revision ?? current?.expectedRevision ?? 0
      const teamId = current?.teamId ?? null
      void saveGeneralParticipantSubmissionTeam(program.id, participant.id, {
        teamId,
        role: mapUiSubmissionTeamRole(newRole),
        expectedRevision,
        reason: '팀 역할 변경',
      })
        .then(async () => {
          await queryClient.invalidateQueries({
            queryKey: generalProgramProgressQueryKeys.submissionTeam(program.id, participant.id),
          })
        })
        .catch(error => {
          if (handleTeamFeatureNotApplicableError(error)) return
          showAlert({
            title: '안내',
            content: '팀 역할 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          })
        })
    },
    [
      handleTeamFeatureNotApplicableError,
      participant.id,
      program.id,
      queryClient,
      remoteEnabled,
      showAlert,
      submissionTeamQuery.data,
    ]
  )

  const handleTeamChangeConfirm = useCallback(
    async (payload: ParticipatingIndividualParticipantTeamChangeConfirmPayload) => {
      if (!remoteEnabled) {
        notifyProgramApiUnavailable(
          'general-participant-detail-assignment-team',
          '참여자 상세 · 과제 팀 변경'
        )
        return
      }
      try {
        const teams = await fetchGeneralProgramSubmissionTeams(program.id)
        const matched = teams.find(item => {
          const name = item.teamName?.trim() || item.name?.trim()
          return name === payload.teamName
        })
        const team =
          matched ??
          (await createGeneralProgramSubmissionTeam(program.id, payload.teamName))
        const teamId = team.teamId ?? team.id
        if (teamId == null) {
          throw new Error('팀 ID를 확인할 수 없습니다.')
        }
        const current = submissionTeamQuery.data
        await saveGeneralParticipantSubmissionTeam(program.id, participant.id, {
          teamId,
          role: current?.role === 'LEADER' ? 'LEADER' : 'MEMBER',
          expectedRevision: current?.revision ?? current?.expectedRevision ?? 0,
          reason: '팀 변경',
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.submissionTeam(program.id, participant.id),
        })
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
      } catch (error) {
        if (handleTeamFeatureNotApplicableError(error)) return
        showAlert({
          title: '안내',
          content: '팀 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
    },
    [
      handleTeamFeatureNotApplicableError,
      participant.id,
      program.id,
      queryClient,
      remoteEnabled,
      showAlert,
      submissionTeamQuery.data,
    ]
  )

  const showComingSoon = useCallback(() => {
    showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })
  }, [showAlert])

  const openSurveyResponseView = useCallback(
    async (
      title: string,
      keys: { templateVersionId?: number; formResponseId?: number }
    ) => {
      const templateVersionId = keys.templateVersionId
      const formResponseId = keys.formResponseId
      if (
        templateVersionId == null ||
        formResponseId == null ||
        !Number.isFinite(templateVersionId) ||
        !Number.isFinite(formResponseId)
      ) {
        showComingSoon()
        return
      }
      setSurveyViewLoading(true)
      setSurveyViewTitle(title)
      try {
        const detail = await fetchGeneralProgramSurveyResponseDetail(
          program.id,
          String(templateVersionId),
          String(formResponseId)
        )
        if (detail == null) {
          showComingSoon()
          return
        }
        setSurveyViewAnswers(detail.answers ?? [])
      } catch (error) {
        handleError(error, { context: 'openParticipantDetailSurveyResponse' })
      } finally {
        setSurveyViewLoading(false)
      }
    },
    [program.id, showComingSoon]
  )

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
          <div className="assignment-submission-modal__status-text">
            <button
              type="button"
              className="participating-individual-participant-assignment-section__submission-link"
              onClick={() =>
                void downloadAssignmentFile(
                  submission.fileObjectId,
                  submission.fileName,
                  submission.downloadable
                )
              }
            >
              {submission.fileName}
            </button>
            {submission.secondaryFileName ? (
              <button
                type="button"
                className="participating-individual-participant-assignment-section__submission-link"
                onClick={() =>
                  void downloadAssignmentFile(
                    submission.secondaryFileObjectId,
                    submission.secondaryFileName,
                    submission.secondaryDownloadable
                  )
                }
              >
                {submission.secondaryFileName}
              </button>
            ) : null}
          </div>
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
          <AssignmentSubmissionCellActionButton
            loading={surveyViewLoading}
            onClick={() =>
              void openSurveyResponseView('설문조사 보기', {
                templateVersionId: submission.templateVersionId,
                formResponseId: submission.formResponseId,
              })
            }
          >
            설문조사 보기
          </AssignmentSubmissionCellActionButton>
        )
      }

      if (submission.kind === 'satisfaction_survey_view') {
        return (
          <AssignmentSubmissionCellActionButton
            loading={surveyViewLoading}
            onClick={() =>
              void openSurveyResponseView('만족도조사 보기', {
                templateVersionId: submission.templateVersionId,
                formResponseId: submission.formResponseId,
              })
            }
          >
            만족도조사 보기
          </AssignmentSubmissionCellActionButton>
        )
      }

      return '-'
    },
    [downloadAssignmentFile, openSurveyResponseView, surveyViewLoading]
  )

  const teamColumns: ColumnsType<ParticipatingIndividualParticipantAssignmentRow & { no: number }> =
    useMemo(
      () => [
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
      ],
      [handleTeamRoleChange, openTeamRoleDropdownRowId]
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
        ...(teamFeatureApplicable ? teamColumns : []),
        {
          title: '교육 진행 일정',
          dataIndex: 'scheduleLabel',
          width: 300,
          key: 'scheduleLabel',
          align: 'center',
          render: (value: string | undefined) =>
            renderProgramDetailPipeSeparated(value ? formatCmsScheduleDisplayLabel(value) : value),
        },
        {
          title: '과제 제출 기간',
          key: 'assignmentPeriodLabel',
          width: 300,
          align: 'center',
          render: (_value, record) => {
            const period = record.assignmentPeriodLabel?.trim()
            return period ? formatCmsScheduleDisplayLabel(period) : '-'
          },
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
      [renderSubmissionCell, teamColumns, teamFeatureApplicable]
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
        actions={
          <FilterTableToolbarButton
            variant="secondary"
            icon={<ButtonDownloadIcon />}
            adminAction="download"
            onClick={handleBulkDownloadAssignments}
          >
            과제 일괄 다운로드
          </FilterTableToolbarButton>
        }
        onExcelDownload={exportExcel}
      >
        <div className="participating-individual-participant-assignment-section__table-outer assignment-submission-modal__table-outer">
          <CmsDataTable<ParticipatingIndividualParticipantAssignmentRow & { no: number }>
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

      <DetailInfoForm title="과제 및 설문 제출 현황" mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="과제 제출률"
            view={
              <ProgramAttendanceRateValue
                countLabel={`${summary.assignmentSubmittedCount} / ${summary.assignmentTotalCount}건`}
              />
            }
            readOnlyDisplay
          />
          <DetailInfoForm.Field
            label="설문 제출률"
            view={`${summary.surveySubmittedCount} / ${summary.surveyTotalCount}건`}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <ParticipatingIndividualParticipantTeamChangeModal
        open={teamChangeModalOpen}
        scheduleOptions={teamChangeScheduleOptions}
        defaultTeamName={defaultTeamName}
        onCancel={() => setTeamChangeModalOpen(false)}
        onConfirm={handleTeamChangeConfirm}
      />
      <TealHeaderModal
        open={surveyViewAnswers != null}
        onCancel={() => setSurveyViewAnswers(null)}
        title={surveyViewTitle}
        size="compact"
      >
        {surveyViewAnswers != null && surveyViewAnswers.length === 0 ? (
          <p className="participating-individual-participant-assignment-section__survey-empty">
            제출된 답변이 없습니다.
          </p>
        ) : (
          <dl className="participating-individual-participant-assignment-section__survey-answers">
            {(surveyViewAnswers ?? []).map((answer, index) => (
              <div
                key={answer.answerId ?? `${answer.questionId ?? index}-${index}`}
                className="participating-individual-participant-assignment-section__survey-row"
              >
                <dt>
                  {answer.questionLabel?.trim() || answer.questionKey?.trim() || `문항 ${index + 1}`}
                </dt>
                <dd>{answer.answerDisplayText?.trim() || answer.answerValueJson?.trim() || '-'}</dd>
              </div>
            ))}
          </dl>
        )}
      </TealHeaderModal>
    </div>
  )
})
