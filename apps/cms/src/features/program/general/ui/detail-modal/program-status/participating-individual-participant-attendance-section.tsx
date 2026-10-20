import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { CMS_DATA_TABLE_ROW_DISABLED_CLASS } from '@/shared/constants/table'
import { useCmsAlert } from '@/shared/ui'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { Program } from '@/types/domain'
import {
  sortParticipatingIndividualParticipantAttendanceRows,
  buildParticipatingIndividualParticipantAttendanceSummary,
} from '@/features/program/general/lib/participating-individual-participant-attendance'
import {
  formatParticipatingIndividualParticipantAttendanceShortDateLabel,
} from '@/features/program/general/lib/participating-individual-participant-attendance-display'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_EXCEL_COLUMNS } from '@/features/program/general/lib/participating-individual-participant-attendance-export'
import type {
  ParticipatingIndividualParticipantAbsenceReason,
  ParticipatingIndividualParticipantAttendanceRow,
} from '@/features/program/general/lib/participating-individual-participant-attendance-types'
import {
  isParticipatingIndividualParticipantAttendanceRowWithdrawn,
  PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_STATUS_LABELS,
  PARTICIPATING_INDIVIDUAL_PARTICIPANT_SESSION_PROGRESS_LABELS,
} from '@/features/program/general/lib/participating-individual-participant-attendance-types'
import {
  ProgramAttendanceAbsenceReasons,
  type ProgramAttendanceAbsenceReasonItem,
} from '@/features/program/shared/ui/program-attendance-absence-reasons'
import {
  downloadAbsenceEvidenceFile,
  fetchProgramAbsenceReasons,
} from '@/features/program/general/api/absence-reasons'
import { parseFileObjectId } from '@/shared/lib/admin-file-upload'
import { ProgramAttendanceRateValue } from '@/features/program/shared/ui/program-attendance-rate-value'
import {
  CompletionStatusText,
  ProgramAttendanceStatusText,
  type ProgramAttendanceStatusTextKind,
} from '@/features/program/shared/ui/program-attendance-status-text'
import {
  ParticipatingIndividualParticipantAttendanceCorrectionModal,
  type ParticipatingIndividualParticipantAttendanceCorrectionConfirmPayload,
} from './participating-individual-participant-attendance-correction-modal'
import {
  fetchGeneralProgressAttendanceBundle,
  saveGeneralScheduleAttendances,
} from '@/features/program/general/api/admin-program-progress-service'
import {
  buildAttendanceItemRequest,
  buildProgressAttendanceSessionsFromRemote,
  mapDashboardScheduleStatusToEducationProgress,
} from '@/features/program/general/api/adapters/progress-attendance-adapters'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import { handleError } from '@/shared/utils/error-handler'
import { formatAttendanceRecordingNotOpenMessage } from '@/features/program/general/lib/attendance-recording-not-open'
import {
  ATTENDANCE_ARRIVAL_TIME_FORMAT_ERROR_MESSAGE,
  isInvalidAttendanceArrivalTimeError,
} from '@/shared/lib/attendance-arrival-time'
import type { ParticipatingIndividualProgressAttendanceStatus } from '@/features/program/general/lib/participating-individual-progress-attendance-types'

export type ParticipatingIndividualParticipantAttendanceSectionHandle = {
  openAttendanceCorrectionModal: () => void
  exportExcel: () => void
}

function toAttendanceStatusTextKind(
  status: ParticipatingIndividualParticipantAttendanceRow['attendanceStatus']
): ProgramAttendanceStatusTextKind {
  if (status === 'pending') return 'pending'
  if (status === 'withdrawn') return 'withdrawn'
  return status
}

function mapCorrectionPayloadToAttendanceStatus(
  payload: ParticipatingIndividualParticipantAttendanceCorrectionConfirmPayload,
  existingRow: ParticipatingIndividualParticipantAttendanceRow
): Pick<
  ParticipatingIndividualParticipantAttendanceRow,
  'attendanceStatus' | 'lateTime' | 'remark'
> & { evidenceFileObjectIds?: number[] } {
  if (payload.status === 'late') {
    return {
      attendanceStatus: 'late',
      lateTime: existingRow.lateTime ?? '9:00',
      remark: undefined,
    }
  }
  if (payload.status === 'excused_absence') {
    return {
      attendanceStatus: 'excused_absence',
      lateTime: undefined,
      remark: payload.reason.trim(),
      evidenceFileObjectIds: payload.evidenceFileObjectIds ?? [],
    }
  }
  if (payload.status === 'absence') {
    return {
      attendanceStatus: 'absent',
      lateTime: undefined,
      remark: undefined,
    }
  }
  return {
    attendanceStatus: 'present',
    lateTime: undefined,
    remark: undefined,
  }
}

function mapDetailStatusToProgressStatus(
  status: ParticipatingIndividualParticipantAttendanceRow['attendanceStatus']
): ParticipatingIndividualProgressAttendanceStatus {
  if (status === 'late') return 'late'
  if (status === 'excused_absence') return 'excused_absence'
  if (status === 'present') return 'present'
  return 'absent'
}

function mapProgressStatusToDetailStatus(
  status: ParticipatingIndividualProgressAttendanceStatus
): ParticipatingIndividualParticipantAttendanceRow['attendanceStatus'] {
  if (status === 'late') return 'late'
  if (status === 'excused_absence') return 'excused_absence'
  if (status === 'present') return 'present'
  return 'absent'
}

function renderAttendanceStatus(row: ParticipatingIndividualParticipantAttendanceRow) {
  return (
    <ProgramAttendanceStatusText
      kind={toAttendanceStatusTextKind(row.attendanceStatus)}
      label={PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_STATUS_LABELS[row.attendanceStatus]}
      lateTime={row.lateTime}
    />
  )
}

export interface ParticipatingIndividualParticipantAttendanceSectionProps {
  program: Program
  participant: ParticipatingIndividualParticipantRow
}

export const ParticipatingIndividualParticipantAttendanceSection = forwardRef<
  ParticipatingIndividualParticipantAttendanceSectionHandle,
  ParticipatingIndividualParticipantAttendanceSectionProps
>(function ParticipatingIndividualParticipantAttendanceSection(
  { program, participant },
  ref
) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(program.id)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'general-participant-detail-attendance',
    '참여자 상세 · 출석 관리'
  )

  const remoteQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.schedules(String(program.id)),
    queryFn: () => fetchGeneralProgressAttendanceBundle(String(program.id)),
    enabled: remoteEnabled,
    staleTime: 15_000,
    retry: false,
  })

  const remoteSessions = useMemo(() => {
    if (!remoteEnabled || remoteQuery.data == null) return null
    return buildProgressAttendanceSessionsFromRemote(remoteQuery.data)
  }, [remoteEnabled, remoteQuery.data])

  const remoteRows = useMemo(() => {
    if (remoteSessions == null) return null
    return sortParticipatingIndividualParticipantAttendanceRows(
      remoteSessions.map(session => {
        const self = session.participants.find(row => row.participantId === participant.id)
        const status =
          self?.attendanceRecorded && self.attendanceStatus != null
            ? mapProgressStatusToDetailStatus(self.attendanceStatus)
            : 'pending'
        const educationProgress =
          session.scheduleEducationProgress ??
          mapDashboardScheduleStatusToEducationProgress(undefined)
        return {
          id: session.id,
          scheduleId: session.id,
          scheduleLabel: session.headerScheduleSummary,
          attendanceStatus: participant.activityWithdrawn ? 'withdrawn' : status,
          lateTime: self?.lateTime,
          remark: self?.remark,
          educationProgress,
        } satisfies ParticipatingIndividualParticipantAttendanceRow
      })
    )
  }, [participant.activityWithdrawn, participant.id, remoteSessions])

  const sourceRows = useMemo(() => {
    if (!remoteEnabled) return []
    return remoteRows ?? []
  }, [remoteEnabled, remoteRows])

  const [rows, setRows] = useState(() => sourceRows)
  const [absenceReasons, setAbsenceReasons] = useState<
    ParticipatingIndividualParticipantAbsenceReason[]
  >([])
  const [attendanceCorrectionModalOpen, setAttendanceCorrectionModalOpen] = useState(false)
  const programNumericId = parseFileObjectId(program.id)
  const absenceReasonQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.absenceReasons(String(program.id)),
    queryFn: () => fetchProgramAbsenceReasons(programNumericId!),
    enabled: remoteEnabled && programNumericId != null,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })

  const correctableScheduleOptions = useMemo(
    () =>
      rows
        .filter(
          row =>
            !isParticipatingIndividualParticipantAttendanceRowWithdrawn(row) &&
            Boolean(row.scheduleId?.trim())
        )
        .map(row => ({
          value: row.id,
          label: row.scheduleLabel,
          row,
        })),
    [rows]
  )

  useEffect(() => {
    setRows(sourceRows)
    setAbsenceReasons(
      sourceRows
        .filter(row => row.attendanceStatus === 'excused_absence' && row.remark?.trim())
        .map(row => ({
          id: `abs-${row.id}`,
          scheduleRowId: row.id,
          dateLabel: formatParticipatingIndividualParticipantAttendanceShortDateLabel(
            row.scheduleLabel
          ),
          reason: row.remark!.trim(),
        }))
    )
    setAttendanceCorrectionModalOpen(false)
  }, [participant.id, sourceRows])

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      scheduleId: string
      patch: Pick<
        ParticipatingIndividualParticipantAttendanceRow,
        'attendanceStatus' | 'lateTime' | 'remark'
      > & { evidenceFileObjectIds?: number[] }
    }) => {
      const session = remoteSessions?.find(item => item.id === payload.scheduleId)
      const requests = (session?.participants ?? []).flatMap(row => {
        const isTarget = row.participantId === participant.id
        if (!isTarget && !row.attendanceRecorded) return []
        const attendanceStatus = isTarget
          ? mapDetailStatusToProgressStatus(payload.patch.attendanceStatus)
          : row.attendanceStatus
        if (attendanceStatus == null) return []
        return [
          buildAttendanceItemRequest({
            participantId: row.participantId,
            attendanceStatus,
            lateTime: isTarget ? payload.patch.lateTime : row.lateTime,
            remark: isTarget ? payload.patch.remark : row.remark,
            fileObjectIds: isTarget ? payload.patch.evidenceFileObjectIds : undefined,
          }),
        ]
      })
      const hasSelf = requests.some(item => String(item.participantId) === participant.id)
      if (!hasSelf) {
        requests.push(
          buildAttendanceItemRequest({
            participantId: participant.id,
            attendanceStatus: mapDetailStatusToProgressStatus(payload.patch.attendanceStatus),
            lateTime: payload.patch.lateTime,
            remark: payload.patch.remark,
            fileObjectIds: payload.patch.evidenceFileObjectIds,
          })
        )
      }
      await saveGeneralScheduleAttendances(payload.scheduleId, requests)
    },
    onSuccess: async () => {
      const programId = String(program.id)
      await queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.schedules(programId),
      })
      await queryClient.invalidateQueries({
        queryKey: [...generalProgramProgressQueryKeys.all, 'attendances', programId],
      })
      await queryClient.invalidateQueries({
        queryKey: [...generalProgramProgressQueryKeys.all, 'program-attendances-bulk', programId],
      })
      await queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.absenceReasons(programId),
      })
    },
    onError: error => {
      const notOpenMessage = formatAttendanceRecordingNotOpenMessage(error)
      if (notOpenMessage) {
        showAlert({ title: '안내', content: notOpenMessage })
        return
      }
      if (isInvalidAttendanceArrivalTimeError(error)) {
        showAlert({ title: '안내', content: ATTENDANCE_ARRIVAL_TIME_FORMAT_ERROR_MESSAGE })
        return
      }
      handleError(error, { context: 'saveGeneralScheduleAttendances.participantDetail' })
    },
  })

  const tableData = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        no: rows.length - index,
      })),
    [rows]
  )

  const summary = useMemo(
    () => buildParticipatingIndividualParticipantAttendanceSummary(rows, participant, program),
    [participant, program, rows]
  )

  const { exportExcel } = useTableExcelExport({
    columns: PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_EXCEL_COLUMNS,
    data: tableData,
    filename: `참여자_출석내역_${participant.applicantName}`,
  })

  const handleOpenAttendanceCorrectionModal = useCallback(() => {
    if (correctableScheduleOptions.length === 0) {
      showAlert({
        title: '안내',
        content: '출결 정정할 수 있는 교육 일정이 없습니다.',
      })
      return
    }

    setAttendanceCorrectionModalOpen(true)
  }, [correctableScheduleOptions.length, showAlert])

  useImperativeHandle(
    ref,
    () => ({
      openAttendanceCorrectionModal: handleOpenAttendanceCorrectionModal,
      exportExcel,
    }),
    [exportExcel, handleOpenAttendanceCorrectionModal]
  )

  const handleAttendanceCorrectionConfirm = useCallback(
    (payload: ParticipatingIndividualParticipantAttendanceCorrectionConfirmPayload) => {
      const targetRow = rows.find(row => row.id === payload.scheduleRowId)
      if (!targetRow) return
      const scheduleId = targetRow.scheduleId?.trim()
      if (!remoteEnabled || !scheduleId) {
        notifyProgramApiUnavailable(
          'general-participant-detail-attendance-save',
          '참여자 상세 · 출석 정정'
        )
        return
      }

      const patch = mapCorrectionPayloadToAttendanceStatus(payload, targetRow)
      void saveMutation.mutateAsync({ scheduleId, patch }).then(
        () => {
          setAttendanceCorrectionModalOpen(false)
          showAlert({
            title: '안내',
            content: '출결이 정정되었습니다.',
          })
        },
        () => {
          showAlert({
            title: '안내',
            content: '출결 정정에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          })
        }
      )
    },
    [remoteEnabled, rows, saveMutation, showAlert]
  )

  const remoteAbsenceReasons = useMemo(() => {
    const items = absenceReasonQuery.data
    if (!items) return null
    return items
      .filter(item => {
        if (item.participantId != null && String(item.participantId) === participant.id) return true
        if (
          participant.memberId &&
          item.memberId != null &&
          String(item.memberId) === participant.memberId
        ) {
          return true
        }
        return false
      })
      .map(item => {
        const names = item.originalFileNames ?? []
        const fileName = names.find(name => name?.trim())?.trim() ?? null
        const dateSource = item.scheduleStartAt?.trim() || item.scheduleName?.trim() || ''
        return {
          id: String(item.submissionId ?? item.scheduleId ?? item.reason ?? 'absence'),
          scheduleRowId: String(item.scheduleId ?? ''),
          dateLabel: dateSource
            ? formatParticipatingIndividualParticipantAttendanceShortDateLabel(dateSource)
            : '-',
          reason: item.reason?.trim() || '-',
          fileName,
          fileObjectIds: item.fileObjectIds,
          originalFileNames: names,
        } satisfies ParticipatingIndividualParticipantAbsenceReason
      })
  }, [absenceReasonQuery.data, participant.id, participant.memberId])

  const handleAbsenceFileDownload = useCallback(
    (item: ProgramAttendanceAbsenceReasonItem) => {
      const ids = item.fileObjectIds ?? []
      if (ids.length === 0) return
      void (async () => {
        for (let index = 0; index < ids.length; index += 1) {
          const fileObjectId = ids[index]
          if (fileObjectId == null) continue
          const fileName =
            item.originalFileNames?.[index]?.trim() || item.fileName || `증빙서류-${fileObjectId}`
          await downloadAbsenceEvidenceFile(fileObjectId, fileName)
        }
      })().catch(() => {
        showAlert({
          title: '안내',
          content: '증빙 서류 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      })
    },
    [showAlert]
  )

  const columns: ColumnsType<
    ParticipatingIndividualParticipantAttendanceRow & { no: number }
  > = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 80,
        align: 'center',
      },
      {
        title: '교육 진행 일정',
        dataIndex: 'scheduleLabel',
        key: 'scheduleLabel',
        align: 'center',
        render: (value: string | undefined) =>
          renderProgramDetailPipeSeparated(value ? formatCmsScheduleDisplayLabel(value) : value),
      },
      {
        title: '출결 현황',
        key: 'attendanceStatus',
        width: 140,
        align: 'center',
        render: (_value, record) => renderAttendanceStatus(record),
      },
      {
        title: '교육 진행 현황',
        dataIndex: 'educationProgress',
        key: 'educationProgress',
        width: 120,
        align: 'center',
        render: (value: ParticipatingIndividualParticipantAttendanceRow['educationProgress']) =>
          PARTICIPATING_INDIVIDUAL_PARTICIPANT_SESSION_PROGRESS_LABELS[value],
      },
      {
        title: '비고',
        key: 'remark',
        width: 220,
        align: 'center',
        render: (_value, record) => record.remark?.trim() || '-',
      },
    ],
    []
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
        title="출석 내역"
        description={`${rows.length}건`}
        hideExcelDownload
      >
        <CmsDataTable<ParticipatingIndividualParticipantAttendanceRow & { no: number }>
          rowKey="id"
          className="cms-data-table"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          tableLayout="fixed"
          scroll={{ x: 960 }}
          onRow={record => ({
            className: isParticipatingIndividualParticipantAttendanceRowWithdrawn(record)
              ? CMS_DATA_TABLE_ROW_DISABLED_CLASS
              : undefined,
          })}
        />
      </FilterTableLayout>

      <section className="program-detail-fullpage-modal__info-tab-block">
        <h3 className="program-detail-info-tab__section-title">출결 현황</h3>
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
                <th scope="row">수료 여부</th>
                <td>
                  <CompletionStatusText label={summary.completionStatusLabel} />
                </td>
                <th scope="row">지각 횟수</th>
                <td>{summary.lateCountLabel}</td>
              </tr>
              <tr>
                <th scope="row">출석률</th>
                <td colSpan={3}>
                  <ProgramAttendanceRateValue countLabel={summary.attendanceRateCountLabel} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <ProgramAttendanceAbsenceReasons
        reasons={remoteAbsenceReasons ?? absenceReasons}
        onFileDownload={handleAbsenceFileDownload}
      />

      <ParticipatingIndividualParticipantAttendanceCorrectionModal
        open={attendanceCorrectionModalOpen}
        scheduleOptions={correctableScheduleOptions}
        onCancel={() => setAttendanceCorrectionModalOpen(false)}
        onConfirm={handleAttendanceCorrectionConfirm}
      />
    </div>
  )
})
