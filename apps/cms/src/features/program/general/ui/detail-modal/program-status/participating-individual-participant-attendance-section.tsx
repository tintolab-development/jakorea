import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { useCmsAlert } from '@/shared/ui'
import '@/shared/components/detail-info-form/detail-info-form.css'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { Program } from '@/types/domain'
import {
  buildParticipatingIndividualParticipantAttendanceRowsFromAssigned,
  buildParticipatingIndividualParticipantAttendanceSummary,
} from '@/features/program/general/lib/participating-individual-participant-attendance'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  formatParticipatingIndividualParticipantAttendanceShortDateLabel,
  resolveParticipatingIndividualParticipantAbsenceDateLabel,
} from '@/features/program/general/lib/participating-individual-participant-attendance-display'
import { PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_EXCEL_COLUMNS } from '@/features/program/general/lib/participating-individual-participant-attendance-export'
import type {
  ParticipatingIndividualParticipantAbsenceReason,
  ParticipatingIndividualParticipantAttendanceRow,
} from '@/features/program/general/lib/participating-individual-participant-attendance-types'
import {
  isParticipatingIndividualParticipantAttendanceRowWithdrawn,
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
import { CompletionStatusText } from '@/features/program/shared/ui/program-attendance-status-text'
import { ParticipatingIndividualParticipantAttendanceTable } from './participating-individual-participant-attendance-table'
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

export interface ParticipatingIndividualParticipantAttendanceSectionProps {
  program: Program
  participant: ParticipatingIndividualParticipantRow
  /** education-scope 배정 일정. 출석 내역은 이 목록만 노출한다. */
  assignedSessions?: readonly ParticipatingSchoolSession[]
  assignedSessionsLoading?: boolean
}

export const ParticipatingIndividualParticipantAttendanceSection = forwardRef<
  ParticipatingIndividualParticipantAttendanceSectionHandle,
  ParticipatingIndividualParticipantAttendanceSectionProps
>(function ParticipatingIndividualParticipantAttendanceSection(
  { program, participant, assignedSessions = [], assignedSessionsLoading = false },
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

  const sourceRows = useMemo(() => {
    if (assignedSessionsLoading) return []
    return buildParticipatingIndividualParticipantAttendanceRowsFromAssigned({
      assignedSessions,
      attendanceSessions: remoteSessions,
      participant,
      program,
    })
  }, [
    assignedSessions,
    assignedSessionsLoading,
    participant,
    program,
    remoteSessions,
  ])

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

  const assignedScheduleIdSet = useMemo(
    () =>
      new Set(
        rows
          .map(row => row.scheduleId?.trim())
          .filter((id): id is string => Boolean(id))
      ),
    [rows]
  )

  const remoteAbsenceReasons = useMemo(() => {
    const items = absenceReasonQuery.data
    if (!items) return null
    return items
      .filter(item => {
        const scheduleId =
          item.scheduleId != null && String(item.scheduleId).trim() !== ''
            ? String(item.scheduleId)
            : null
        if (scheduleId != null && !assignedScheduleIdSet.has(scheduleId)) return false
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
        const matchedRow =
          item.scheduleId != null
            ? rows.find(row => row.scheduleId === String(item.scheduleId))
            : undefined
        return {
          id: String(item.submissionId ?? item.scheduleId ?? item.reason ?? 'absence'),
          scheduleRowId: String(item.scheduleId ?? ''),
          dateLabel: resolveParticipatingIndividualParticipantAbsenceDateLabel({
            scheduleLabel: matchedRow?.scheduleLabel,
            scheduleStartAt: item.scheduleStartAt,
            scheduleName: item.scheduleName,
          }),
          reason: item.reason?.trim() || '-',
          fileName,
          fileObjectIds: item.fileObjectIds,
          originalFileNames: names,
        } satisfies ParticipatingIndividualParticipantAbsenceReason
      })
  }, [absenceReasonQuery.data, assignedScheduleIdSet, participant.id, participant.memberId, rows])

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
        description={`총 ${rows.length}건`}
        hideExcelDownload
      >
        <div className="program-attendance-detail__table-outer">
          <ParticipatingIndividualParticipantAttendanceTable rows={rows} />
        </div>
      </FilterTableLayout>

      <DetailInfoForm title="출결 현황" mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="수료 여부"
            view={<CompletionStatusText label={summary.completionStatusLabel} />}
            readOnlyDisplay
          />
          <DetailInfoForm.Field
            label="지각 횟수"
            view={summary.lateCountLabel}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="출석률"
            view={<ProgramAttendanceRateValue countLabel={summary.attendanceRateCountLabel} />}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

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
