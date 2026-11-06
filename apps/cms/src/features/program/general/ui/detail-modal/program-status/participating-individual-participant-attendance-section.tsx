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
import { FilterTableToolbarButton, useCmsAlert } from '@/shared/ui'
import '@/shared/components/detail-info-form/detail-info-form.css'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { Program } from '@/types/domain'
import {
  buildParticipatingIndividualParticipantAttendanceRowsFromAssigned,
  buildParticipatingIndividualParticipantAttendanceSummary,
  resolveVisibleParticipatingIndividualAbsenceReasons,
  type ParticipatingIndividualAdminAbsenceEvidence,
} from '@/features/program/general/lib/participating-individual-participant-attendance'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveParticipatingIndividualParticipantAbsenceDateLabel } from '@/features/program/general/lib/participating-individual-participant-attendance-display'
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
  resolveProgramAbsenceReasonEvidence,
} from '@/features/program/general/api/absence-reasons'
import { parseFileObjectId } from '@/shared/lib/admin-file-upload'
import { resolveProgressAttendanceScheduleDateRanges } from '@/features/program/general/lib/progress-attendance-schedule-date-ranges'
import { fetchAttendancesByScheduleIdsRemote } from '@/features/program/general/api/program-progress-api-client'
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
  resolveAttendanceWriteFileObjectIds,
} from '@/features/program/general/api/adapters/progress-attendance-adapters'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import { handleError } from '@/shared/utils/error-handler'
import { getApiErrorCode, readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { isGlobalApiErrorAlertShown } from '@/shared/lib/show-global-api-error-alert'
import {
  ATTENDANCE_CORRECTION_NOT_OPEN_ALERT,
  isAttendanceRecordingNotOpenError,
} from '@/features/program/general/lib/attendance-recording-not-open'
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
> & {
  evidenceFileObjectIds?: number[]
  evidenceOriginalFileNames?: string[]
} {
  if (payload.status === 'late') {
    return {
      attendanceStatus: 'late',
      lateTime: payload.lateTime?.trim() || existingRow.lateTime || '9:00',
      remark: undefined,
    }
  }
  if (payload.status === 'excused_absence') {
    return {
      attendanceStatus: 'excused_absence',
      lateTime: undefined,
      remark: payload.reason.trim(),
      evidenceFileObjectIds: payload.evidenceFileObjectIds ?? [],
      evidenceOriginalFileNames: payload.evidenceOriginalFileNames ?? [],
    }
  }
  if (payload.status === 'absence') {
    return {
      attendanceStatus: 'absent',
      lateTime: undefined,
      remark: undefined,
      evidenceFileObjectIds: [],
      evidenceOriginalFileNames: [],
    }
  }
  return {
    attendanceStatus: 'present',
    lateTime: undefined,
    remark: undefined,
    evidenceFileObjectIds: [],
    evidenceOriginalFileNames: [],
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

  const scheduleDateRanges = useMemo(
    () =>
      resolveProgressAttendanceScheduleDateRanges(
        program,
        assignedSessions.flatMap(session => [
          session.date,
          session.startAt,
          session.scheduleLabel,
          session.educationScheduleLabel,
        ])
      ),
    [assignedSessions, program]
  )

  const assignedScheduleIds = useMemo(
    () =>
      assignedSessions
        .map(session => session.resolvedScheduleId)
        .filter((id): id is number => typeof id === 'number' && Number.isFinite(id) && id > 0),
    [assignedSessions]
  )

  const assignedScheduleIdsKey = assignedScheduleIds.slice().sort((a, b) => a - b).join(',')

  const remoteQuery = useQuery({
    queryKey: [
      ...generalProgramProgressQueryKeys.schedules(String(program.id)),
      'schedule-date-ranges',
      scheduleDateRanges.map(range => `${range.dateFrom}~${range.dateTo}`).join(','),
    ],
    queryFn: () => fetchGeneralProgressAttendanceBundle(String(program.id), scheduleDateRanges),
    enabled: remoteEnabled,
    staleTime: 15_000,
    retry: false,
  })

  const assignedAttendancesQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.programAttendancesBulk(
      String(program.id),
      assignedScheduleIdsKey
    ),
    queryFn: () => fetchAttendancesByScheduleIdsRemote(String(program.id), assignedScheduleIds),
    enabled: remoteEnabled && assignedScheduleIds.length > 0 && !assignedSessionsLoading,
    staleTime: 15_000,
    retry: false,
  })

  const remoteSessions = useMemo(() => {
    if (!remoteEnabled || remoteQuery.data == null) return null
    return buildProgressAttendanceSessionsFromRemote({
      ...remoteQuery.data,
      program,
    })
  }, [program, remoteEnabled, remoteQuery.data])

  const attendancesByScheduleId = useMemo(
    () => ({
      ...(remoteQuery.data?.attendancesByScheduleId ?? {}),
      ...(assignedAttendancesQuery.data ?? {}),
    }),
    [assignedAttendancesQuery.data, remoteQuery.data?.attendancesByScheduleId]
  )

  const sourceRows = useMemo(() => {
    if (assignedSessionsLoading) return []
    return buildParticipatingIndividualParticipantAttendanceRowsFromAssigned({
      assignedSessions,
      attendanceSessions: remoteSessions,
      attendancesByScheduleId,
      participant,
      program,
    })
  }, [
    assignedSessions,
    assignedSessionsLoading,
    attendancesByScheduleId,
    participant,
    program,
    remoteSessions,
  ])

  const [rows, setRows] = useState(() => sourceRows)
  const [adminAbsenceEvidenceByScheduleId, setAdminAbsenceEvidenceByScheduleId] = useState<
    Record<string, ParticipatingIndividualAdminAbsenceEvidence>
  >({})
  const [attendanceCorrectionModalOpen, setAttendanceCorrectionModalOpen] = useState(false)
  const programNumericId = parseFileObjectId(program.id)
  const absenceReasonQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.absenceReasons(String(program.id)),
    queryFn: () => fetchProgramAbsenceReasons(programNumericId!),
    enabled: remoteEnabled && programNumericId != null,
    staleTime: 0,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
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
    setAttendanceCorrectionModalOpen(false)
  }, [participant.id, sourceRows])

  useEffect(() => {
    setAdminAbsenceEvidenceByScheduleId({})
  }, [participant.id])

  useEffect(() => {
    const items = absenceReasonQuery.data
    if (!items?.length) return
    setAdminAbsenceEvidenceByScheduleId(prev => {
      let next: Record<string, ParticipatingIndividualAdminAbsenceEvidence> | null = null
      for (const item of items) {
        if (String(item.participantId ?? '') !== String(participant.id)) continue
        const scheduleId = item.scheduleId != null ? String(item.scheduleId) : ''
        if (!scheduleId || !prev[scheduleId]) continue
        const evidence = resolveProgramAbsenceReasonEvidence(item)
        if (evidence.fileObjectIds.length === 0) continue
        if (!next) next = { ...prev }
        delete next[scheduleId]
      }
      return next ?? prev
    })
  }, [absenceReasonQuery.data, participant.id])

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      scheduleId: string
      patch: Pick<
        ParticipatingIndividualParticipantAttendanceRow,
        'attendanceStatus' | 'lateTime' | 'remark'
      > & {
        evidenceFileObjectIds?: number[]
        evidenceOriginalFileNames?: string[]
      }
    }) => {
      const attendanceStatus = mapDetailStatusToProgressStatus(payload.patch.attendanceStatus)
      const isAttended = attendanceStatus === 'present' || attendanceStatus === 'late'
      await saveGeneralScheduleAttendances(payload.scheduleId, [
        buildAttendanceItemRequest({
          participantId: participant.id,
          attendanceStatus,
          lateTime: payload.patch.lateTime,
          remark: isAttended ? undefined : payload.patch.remark,
          fileObjectIds: resolveAttendanceWriteFileObjectIds({
            attendanceStatus,
            evidenceFileObjectIds: isAttended ? [] : payload.patch.evidenceFileObjectIds,
          }),
        }),
      ])
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
      await queryClient.refetchQueries({
        queryKey: generalProgramProgressQueryKeys.programAttendancesBulk(
          programId,
          assignedScheduleIdsKey
        ),
      })
      await queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.absenceReasons(programId),
      })
      await queryClient.refetchQueries({
        queryKey: generalProgramProgressQueryKeys.absenceReasons(programId),
      })
    },
    onError: error => {
      if (isAttendanceRecordingNotOpenError(error)) {
        showAlert(ATTENDANCE_CORRECTION_NOT_OPEN_ALERT)
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
        no: index + 1,
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

      if (targetRow.educationProgress === 'scheduled') {
        showAlert(ATTENDANCE_CORRECTION_NOT_OPEN_ALERT)
        return
      }
      if (isParticipatingIndividualParticipantAttendanceRowWithdrawn(targetRow)) {
        showAlert({
          title: '안내',
          content: '활동 포기 이후 회차에는 출결을 저장할 수 없습니다.',
        })
        return
      }

      const patch = mapCorrectionPayloadToAttendanceStatus(payload, targetRow)
      const previousRows = rows
      setRows(current =>
        current.map(row =>
          row.id === payload.scheduleRowId
            ? {
                ...row,
                attendanceStatus: patch.attendanceStatus,
                attendanceRecorded: true,
                lateTime: patch.lateTime,
                remark: patch.remark,
              }
            : row
        )
      )
      void saveMutation.mutateAsync({ scheduleId, patch }).then(
        () => {
          if (
            patch.attendanceStatus === 'excused_absence' &&
            (patch.evidenceFileObjectIds?.length ?? 0) > 0
          ) {
            setAdminAbsenceEvidenceByScheduleId(prev => ({
              ...prev,
              [scheduleId]: {
                fileObjectIds: patch.evidenceFileObjectIds ?? [],
                originalFileNames: patch.evidenceOriginalFileNames ?? [],
              },
            }))
          } else if (patch.attendanceStatus !== 'excused_absence') {
            setAdminAbsenceEvidenceByScheduleId(prev => {
              if (!prev[scheduleId]) return prev
              const next = { ...prev }
              delete next[scheduleId]
              return next
            })
          }
          setAttendanceCorrectionModalOpen(false)
          showAlert({
            title: '정정 완료',
            content: '정정되었습니다.',
          })
        },
        error => {
          setRows(previousRows)
          if (isAttendanceRecordingNotOpenError(error)) {
            showAlert(ATTENDANCE_CORRECTION_NOT_OPEN_ALERT)
            return
          }
          if (isGlobalApiErrorAlertShown(error)) return
          if (isInvalidAttendanceArrivalTimeError(error)) return
          if (getApiErrorCode(error) === 'ATTENDANCE_AFTER_GIVE_UP') {
            showAlert({
              title: '안내',
              content: getGeneralProgramApiErrorMessage(
                error,
                '활동 포기 이후 회차에는 출결을 저장할 수 없습니다.'
              ),
            })
            return
          }
          showAlert({
            title: '안내',
            content: readApiErrorAlertMessage(error, '요청 처리에 실패했습니다.'),
          })
        }
      )
    },
    [remoteEnabled, rows, saveMutation, showAlert]
  )

  const remoteAbsenceReasons = useMemo(() => {
    const items = absenceReasonQuery.data
    if (!items) return []
    return items
      .filter(item => String(item.participantId ?? '') === String(participant.id))
      .map(item => {
        const { fileObjectIds, originalFileNames: names } = resolveProgramAbsenceReasonEvidence(item)
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
          fileName: names.find(name => name?.trim())?.trim() ?? null,
          fileObjectIds,
          originalFileNames: names,
        } satisfies ParticipatingIndividualParticipantAbsenceReason
      })
  }, [absenceReasonQuery.data, participant.id, rows])

  const handleAbsenceFileDownload = useCallback(
    (_item: ProgramAttendanceAbsenceReasonItem, fileObjectId: number, fileName: string) => {
      void downloadAbsenceEvidenceFile(fileObjectId, fileName).catch(() => {
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
        actions={
          <FilterTableToolbarButton
            variant="secondary"
            onClick={handleOpenAttendanceCorrectionModal}
          >
            출결 정정
          </FilterTableToolbarButton>
        }
        onExcelDownload={exportExcel}
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
        reasons={resolveVisibleParticipatingIndividualAbsenceReasons({
          remote: remoteAbsenceReasons,
          rows,
          adminEvidenceByScheduleId: adminAbsenceEvidenceByScheduleId,
        })}
        emptyMessage="해당 참여자 불참 사유 없음"
        onFileDownload={handleAbsenceFileDownload}
      />

      <ParticipatingIndividualParticipantAttendanceCorrectionModal
        open={attendanceCorrectionModalOpen}
        participantName={participant.applicantName}
        programId={program.id}
        participantId={participant.id}
        submittedAbsenceReasons={absenceReasonQuery.data}
        scheduleOptions={correctableScheduleOptions}
        onCancel={() => setAttendanceCorrectionModalOpen(false)}
        onConfirm={handleAttendanceCorrectionConfirm}
      />
    </div>
  )
})
