import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CmsButton,
  ContentModal,
  ExcelButton,
  FilterTableToolbarButton,
  useCmsAlert,
} from '@/shared/ui'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import { UjatEducationProgressVolunteerAssignmentAttendanceInfo } from './assignment-attendance-info'
import { UjatEducationProgressVolunteerAssignmentTable } from './assignment-table'
import { UjatVolunteerAssignmentAssignModal } from './assign-modal'
import { ProgramAttendanceCorrectionModal } from '@/features/program/shared/ui/attendance-correction-modal'
import type { ProgramAttendanceCorrectionConfirmPayload } from '@/features/program/shared/lib/attendance-correction-types'
import { UJAT_ATTENDANCE_STATUS_LABEL, UJAT_ATTENDANCE_STATUS_ORDER } from '../../attendance/types'
import type { EducationProgressHalfKey } from '../../tabs'
import {
  formatScheduleShortDateLabel,
  getUjatVolunteerAssignmentAssignModalData,
} from './volunteer-assign-modal-data'
import { resolveVolunteerAssignGate } from './volunteer-assign-gate'
import { sortVolunteerAssignmentRows } from './volunteer-assignment-data'
import { useVolunteerAssignmentProgress } from './use-assignment-progress'
import { usePartnerRecommendationOptions } from './use-partner-recommendation'
import { formatUjatGradeClassDisplayLabel } from '@/features/program/ujat/lib/ujat-grade-class-display'
import {
  isVolunteerAssignmentClassWithdrawn,
  type UjatVolunteerAssignmentProgressRow,
} from './assignment-types'
import {
  ASSIGNMENT_CANCEL_NOT_ALLOWED_ALERT,
  ASSIGNMENT_SELECT_ONE_ALERT,
  ATTENDANCE_CORRECTION_NOT_ALLOWED_SCHEDULED_ALERT,
  ATTENDANCE_CORRECTION_SINGLE_ONLY_ALERT,
  buildAssignmentCancelBulkCompletedAlert,
  isAssignmentCancelableByProgress,
  isAttendanceCorrectableByProgress,
  resolveSelectedAssignmentRows,
} from './assignment-progress-action-guards'
import {
  ASSIGNMENT_CANCEL_MODAL_TITLE,
  ASSIGNMENT_CANCEL_PENDING_SUCCESS_MESSAGE,
  buildAssignmentCancelNotifiedMessage,
  buildAssignmentCancelNotifiedSuccessMessage,
  buildAssignmentCancelPendingNotifyMessage,
} from './assignment-cancel-copy'
import {
  ASSIGNMENT_CANCEL_REASON_MIN_LENGTH,
  ASSIGNMENT_CANCEL_REASON_TOO_SHORT_ALERT,
} from './assignment-cancel-errors'
import {
  assignmentCancelUsesReasonModal,
  toUjatAssignmentCancelRequest,
} from './assignment-cancel-request'
import './assignment.css'

type AssignmentProgressExportRow = {
  id: string
  no: number
  scheduleLabel: string
  role: string
  assignedInstitution: string
  partner: string
  classDisplay: string
  attendance: string
  educationPlanSubmitted: string
  educationLogSubmitted: string
  educationProgress: string
}

function resolveRoleLabel(role: UjatVolunteerAssignmentProgressRow['role']): string {
  if (role === 'attendance_manager') return '출결 담당'
  return '해당 없음'
}

function resolvePartnerLabel(partner: UjatVolunteerAssignmentProgressRow['partner']): string {
  if (partner.kind === 'dash') return '-'
  if (partner.kind === 'undecided') return '미정'
  return partner.value
}

function resolveClassLabel(
  classDisplay: UjatVolunteerAssignmentProgressRow['classDisplay']
): string {
  if (classDisplay.kind === 'dash') return '-'
  if (classDisplay.kind === 'withdrawn') return '활동 포기'
  return formatUjatGradeClassDisplayLabel(classDisplay.label)
}

function resolveAttendanceLabel(
  attendance: UjatVolunteerAssignmentProgressRow['attendance']
): string {
  if (attendance.kind === 'dash') return '-'
  if (attendance.kind === 'withdrawn') return '활동 포기'
  if (attendance.kind === 'late') return `지각 (${attendance.time})`
  if (attendance.kind === 'excused_absence') return '사유 불참'
  if (attendance.kind === 'absence') return '결석'
  return '출석'
}

function resolveEducationProgressLabel(
  status: UjatVolunteerAssignmentProgressRow['educationProgress']
): string {
  if (status === 'dash') return '-'
  if (status === 'completed') return '진행 완료'
  return '진행 예정'
}

function buildAssignmentProgressExportRows(
  rows: readonly UjatVolunteerAssignmentProgressRow[]
): AssignmentProgressExportRow[] {
  return rows.map((row, index) => ({
    id: row.id,
    no: index + 1,
    scheduleLabel: row.scheduleLabel,
    role: resolveRoleLabel(row.role),
    assignedInstitution:
      row.assignedInstitution.kind === 'name' ? row.assignedInstitution.value : '-',
    partner: resolvePartnerLabel(row.partner),
    classDisplay: resolveClassLabel(row.classDisplay),
    attendance: resolveAttendanceLabel(row.attendance),
    educationPlanSubmitted: row.educationPlanSubmitted ? '제출' : '-',
    educationLogSubmitted: row.educationLogSubmitted ? '제출' : '-',
    educationProgress: resolveEducationProgressLabel(row.educationProgress),
  }))
}

const ASSIGNMENT_PROGRESS_EXPORT_COLUMNS: ColumnsType<AssignmentProgressExportRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '교육 진행 일정', dataIndex: 'scheduleLabel', key: 'scheduleLabel' },
  { title: '역할', dataIndex: 'role', key: 'role' },
  { title: '배정 기관', dataIndex: 'assignedInstitution', key: 'assignedInstitution' },
  { title: '파트너명', dataIndex: 'partner', key: 'partner' },
  { title: '배정 학급', dataIndex: 'classDisplay', key: 'classDisplay' },
  { title: '출결 현황', dataIndex: 'attendance', key: 'attendance' },
  {
    title: '교육계획서 제출 현황',
    dataIndex: 'educationPlanSubmitted',
    key: 'educationPlanSubmitted',
  },
  { title: '교육일지 제출 현황', dataIndex: 'educationLogSubmitted', key: 'educationLogSubmitted' },
  { title: '교육 진행 현황', dataIndex: 'educationProgress', key: 'educationProgress' },
]

export function UjatEducationProgressVolunteerAssignmentProgressTab({
  programId,
  half,
  volunteerId,
  memberId,
  regionKey,
  volunteerName,
}: {
  programId: string
  half: EducationProgressHalfKey
  volunteerId: string
  memberId?: string | null
  regionKey?: string | null
  volunteerName: string
}) {
  const { showAlert } = useCmsAlert()
  const progress = useVolunteerAssignmentProgress({ programId, half, memberId, regionKey })
  const bundle = progress.bundle
  const rows = useMemo(() => sortVolunteerAssignmentRows(bundle.rows), [bundle.rows])
  const absenceReasons = bundle.absenceReasons
  const canWrite = useUjatCanWrite()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignTargetRowId, setAssignTargetRowId] = useState<string | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelTargetRowId, setCancelTargetRowId] = useState<string | null>(null)
  const [attendanceCorrectionModalOpen, setAttendanceCorrectionModalOpen] = useState(false)
  const [attendanceCorrectionTargetRowId, setAttendanceCorrectionTargetRowId] = useState<
    string | null
  >(null)

  useEffect(() => {
    if (!progress.isError) return
    showAlert({
      title: '목록 조회 실패',
      content: '교육 배정 및 출결 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    })
  }, [progress.isError, showAlert])

  useEffect(() => {
    setSelectedRowKeys([])
    setAssignModalOpen(false)
    setAssignTargetRowId(null)
    setCancelModalOpen(false)
    setCancelTargetRowId(null)
    setAttendanceCorrectionModalOpen(false)
    setAttendanceCorrectionTargetRowId(null)
  }, [volunteerId])

  const getSingleSelectedRow = useCallback(
    (options?: { multiSelectAlert?: { title: string; content: string } }) => {
      if (selectedRowKeys.length === 0) {
        showAlert(ASSIGNMENT_SELECT_ONE_ALERT)
        return null
      }
      if (selectedRowKeys.length !== 1) {
        showAlert(options?.multiSelectAlert ?? ASSIGNMENT_SELECT_ONE_ALERT)
        return null
      }

      const rowId = String(selectedRowKeys[0])
      const row = rows.find(item => item.id === rowId)
      if (!row) {
        showAlert({
          title: '안내',
          content: '선택한 교육 일정을 찾을 수 없습니다.',
        })
        return null
      }

      return row
    },
    [rows, selectedRowKeys, showAlert]
  )

  const openAssignModal = useCallback(() => {
    const selectedId =
      selectedRowKeys.length === 1 ? String(selectedRowKeys[0]) : null
    const vacantClassOptionCount =
      selectedId != null
        ? (progress.assignOptionsByRowId[selectedId]?.classOptions.length ?? 0)
        : undefined
    const gate = resolveVolunteerAssignGate({
      selectedRowKeys: selectedRowKeys.map(key => String(key)),
      rows,
      vacantClassOptionCount,
    })
    if (!gate.ok) {
      showAlert({
        title: gate.title,
        content: gate.content,
      })
      return
    }

    setAssignTargetRowId(gate.row.id)
    setAssignModalOpen(true)
  }, [progress.assignOptionsByRowId, rows, selectedRowKeys, showAlert])

  const openCancelModal = useCallback(() => {
    const selected = resolveSelectedAssignmentRows(rows, selectedRowKeys)
    if (selected.length === 0) {
      showAlert(ASSIGNMENT_SELECT_ONE_ALERT)
      return
    }

    const completedInSelection = selected.filter(row => row.educationProgress === 'completed')
    if (completedInSelection.length > 0) {
      showAlert(
        selected.length > 1
          ? buildAssignmentCancelBulkCompletedAlert(selected.length)
          : ASSIGNMENT_CANCEL_NOT_ALLOWED_ALERT
      )
      return
    }

    if (selected.length !== 1) {
      showAlert(ASSIGNMENT_SELECT_ONE_ALERT)
      return
    }

    const row = selected[0]
    if (!row) return

    if (isVolunteerAssignmentClassWithdrawn(row)) {
      showAlert({
        title: '안내',
        content: '활동 포기된 일정은 배정 취소할 수 없습니다.',
      })
      return
    }

    if (!isAssignmentCancelableByProgress(row)) {
      showAlert(ASSIGNMENT_CANCEL_NOT_ALLOWED_ALERT)
      return
    }

    if (row.scheduleId == null || !row.assignmentGroupId) {
      showAlert({
        title: '안내',
        content: '배정 정보를 확인할 수 없어 취소할 수 없습니다.',
      })
      return
    }

    if (row.classDisplay.kind !== 'class' && row.assignedInstitution.kind === 'dash') {
      showAlert({
        title: '안내',
        content: '아직 배정되지 않은 일정입니다.',
      })
      return
    }

    setCancelTargetRowId(row.id)
    setCancelModalOpen(true)
  }, [rows, selectedRowKeys, showAlert])

  const openAttendanceCorrectionModal = useCallback(() => {
    if (selectedRowKeys.length > 1) {
      showAlert(ATTENDANCE_CORRECTION_SINGLE_ONLY_ALERT)
      return
    }

    const row = getSingleSelectedRow({
      multiSelectAlert: ATTENDANCE_CORRECTION_SINGLE_ONLY_ALERT,
    })
    if (!row) return

    if (isVolunteerAssignmentClassWithdrawn(row)) {
      showAlert({
        title: '안내',
        content: '활동 포기된 일정은 출결 정정할 수 없습니다.',
      })
      return
    }

    if (!isAttendanceCorrectableByProgress(row)) {
      showAlert(ATTENDANCE_CORRECTION_NOT_ALLOWED_SCHEDULED_ALERT)
      return
    }

    setAttendanceCorrectionTargetRowId(row.id)
    setAttendanceCorrectionModalOpen(true)
  }, [getSingleSelectedRow, selectedRowKeys.length, showAlert])

  const exportRows = useMemo(() => buildAssignmentProgressExportRows(rows), [rows])

  const { exportExcel, isExporting } = useTableExcelExport({
    columns: ASSIGNMENT_PROGRESS_EXPORT_COLUMNS,
    data: exportRows,
    filename: '교육_배정_및_진행_현황',
    selectedRowKeys,
  })

  const assignTargetRow = useMemo(
    () => (assignTargetRowId ? (rows.find(row => row.id === assignTargetRowId) ?? null) : null),
    [assignTargetRowId, rows]
  )

  const partnerRecommendation = usePartnerRecommendationOptions({
    programId,
    scheduleId: assignTargetRow?.scheduleId,
    organizationApplicationId: assignTargetRow?.organizationApplicationId,
    enabled: assignModalOpen && assignTargetRow != null,
  })

  const assignModalData = useMemo(() => {
    if (!assignTargetRow) return null
    const classOptions = progress.assignOptionsByRowId[assignTargetRow.id]?.classOptions
    const selfParticipantId =
      assignTargetRow.participantId != null ? String(assignTargetRow.participantId) : null
    // 파트너 후보는 partner-recommendation API만. matrix invent 폴백 금지.
    const partnerOptions = partnerRecommendation.partnerOptions.filter(
      option => selfParticipantId == null || option.value !== selfParticipantId
    )
    return getUjatVolunteerAssignmentAssignModalData(assignTargetRow, {
      classOptions,
      partnerOptions,
    })
  }, [assignTargetRow, partnerRecommendation.partnerOptions, progress.assignOptionsByRowId])

  const cancelTargetRow = useMemo(
    () => (cancelTargetRowId ? (rows.find(row => row.id === cancelTargetRowId) ?? null) : null),
    [cancelTargetRowId, rows]
  )

  const attendanceCorrectionTargetRow = useMemo(
    () =>
      attendanceCorrectionTargetRowId
        ? (rows.find(row => row.id === attendanceCorrectionTargetRowId) ?? null)
        : null,
    [attendanceCorrectionTargetRowId, rows]
  )

  const cancelRequiresMemberNotify = assignmentCancelUsesReasonModal(
    cancelTargetRow?.assignmentNotificationSent
  )

  const closeCancelModal = useCallback(() => {
    setCancelModalOpen(false)
    setCancelTargetRowId(null)
  }, [])

  const runCancelAssignment = useCallback(
    (payload: {
      reason?: string | null
      notifyTiming?: PermissionModalPayload['notifyTiming']
      manualNotifyAt?: PermissionModalPayload['manualNotifyAt']
      includeCancelNotification: boolean
    }) => {
      if (!cancelTargetRow) return
      if (cancelTargetRow.scheduleId == null || !cancelTargetRow.assignmentGroupId) {
        showAlert({
          title: '안내',
          content: '배정 정보를 확인할 수 없어 취소할 수 없습니다.',
        })
        return
      }

      const body = toUjatAssignmentCancelRequest({
        reason: payload.reason,
        notifyTiming: payload.notifyTiming,
        manualNotifyAt: payload.manualNotifyAt,
        includeCancelNotification: payload.includeCancelNotification,
      })

      void progress.cancelAssignment(cancelTargetRow, body).then(
        () => {
          closeCancelModal()
          setSelectedRowKeys([])
          showAlert({
            title: '안내',
            content: payload.includeCancelNotification
              ? buildAssignmentCancelNotifiedSuccessMessage(body.timing)
              : ASSIGNMENT_CANCEL_PENDING_SUCCESS_MESSAGE,
          })
        },
        () => {
          // 실패 토스트는 mutation onError. 조회 데이터는 그대로 둔다.
        }
      )
    },
    [cancelTargetRow, closeCancelModal, progress, showAlert]
  )

  const handleCancelAssignmentConfirm = useCallback(
    (payload: PermissionModalPayload) => {
      if (payload.reason.trim().length < ASSIGNMENT_CANCEL_REASON_MIN_LENGTH) {
        showAlert(ASSIGNMENT_CANCEL_REASON_TOO_SHORT_ALERT)
        return
      }
      runCancelAssignment({
        reason: payload.reason,
        notifyTiming: payload.notifyTiming,
        manualNotifyAt: payload.manualNotifyAt,
        includeCancelNotification: true,
      })
    },
    [runCancelAssignment, showAlert]
  )

  const handleCancelAssignmentSimpleConfirm = useCallback(() => {
    runCancelAssignment({
      includeCancelNotification: false,
    })
  }, [runCancelAssignment])

  const handleAssignConfirm = useCallback(
    (payload: { classValue: string; partnerId: string }) => {
      if (!assignTargetRow || !assignModalData) return
      const classLabel =
        assignModalData.mode === 'partner'
          ? assignModalData.fixedClassLabel
          : (assignModalData.classOptions.find(option => option.value === payload.classValue)
              ?.label ?? null)

      void progress
        .confirmAssignment({
          row: assignTargetRow,
          mode: assignModalData.mode,
          classValue: payload.classValue,
          partnerId: payload.partnerId,
          classLabel,
        })
        .then(
          () => {
            setAssignModalOpen(false)
            setAssignTargetRowId(null)
            showAlert({
              title: '안내',
              content:
                assignModalData.mode === 'education'
                  ? '교육 배정이 완료되었습니다.'
                  : '파트너 배정이 완료되었습니다.',
            })
          },
          () => {
            // 실패 토스트는 mutation onError. 이전 배정 행을 유지한다.
          }
        )
    },
    [assignModalData, assignTargetRow, progress, showAlert]
  )

  const ujatAttendanceCorrectionStatusOptions = useMemo(
    () =>
      UJAT_ATTENDANCE_STATUS_ORDER.map(value => ({
        value: value === 'absent' ? ('absence' as const) : value,
        label: UJAT_ATTENDANCE_STATUS_LABEL[value],
      })),
    []
  )

  const handleAttendanceCorrectionConfirm = useCallback(
    (payload: ProgramAttendanceCorrectionConfirmPayload) => {
      if (!attendanceCorrectionTargetRow) return
      if (
        attendanceCorrectionTargetRow.scheduleId == null ||
        attendanceCorrectionTargetRow.participantId == null
      ) {
        showAlert({
          title: '안내',
          content: '출결을 정정할 일정 정보를 확인할 수 없습니다.',
        })
        return
      }

      void progress.correctAttendance(attendanceCorrectionTargetRow, payload).then(
        () => {
          setAttendanceCorrectionModalOpen(false)
          setAttendanceCorrectionTargetRowId(null)
          showAlert({
            title: '안내',
            content: '출결이 정정되었습니다.',
          })
        },
        () => {
          // 실패 토스트는 mutation onError. 이전 출결을 유지한다.
        }
      )
    },
    [attendanceCorrectionTargetRow, progress, showAlert]
  )

  const handleRoleChange = useCallback(
    (
      row: UjatVolunteerAssignmentProgressRow,
      nextRole: UjatVolunteerAssignmentProgressRow['role']
    ) => {
      if (row.scheduleId == null || row.participantId == null) {
        showAlert({
          title: '안내',
          content: '역할을 변경할 일정 정보를 확인할 수 없습니다.',
        })
        return
      }
      if (nextRole === 'attendance_manager' && row.canAssignAttendanceManager !== true) {
        return
      }
      void progress.changeScheduleRole(row, nextRole).then(
        () => {
          showAlert({
            title: '안내',
            content:
              nextRole === 'attendance_manager'
                ? '출결 담당으로 지정되었습니다.'
                : '역할이 해당 없음으로 변경되었습니다.',
          })
        },
        () => {
          // 실패 토스트는 mutation onError. 이전 역할을 유지한다.
        }
      )
    },
    [progress, showAlert]
  )

  if (progress.isLoading) {
    return (
      <div className="flex min-h-[240px] w-full items-center justify-center" role="status">
        <Spin />
      </div>
    )
  }

  return (
    <div className="ujat-volunteer-assignment-progress-tab">
      {progress.isParticipantUnresolved ? (
        <p role="status">봉사자 참가 정보를 확인하지 못해 배정 현황을 표시할 수 없습니다.</p>
      ) : null}
      <section className="ujat-volunteer-assignment-progress-tab__table-section">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">교육 배정 및 진행 현황</span>
            <span className="table-description">총 {rows.length}건</span>
          </div>
          <div className="table-header-actions--wrapper">
            {canWrite ? (
              <>
                <FilterTableToolbarButton
                  type="button"
                  variant="delete"
                  disabled={
                    progress.isMutating ||
                    progress.isError ||
                    progress.isParticipantUnresolved
                  }
                  onClick={openCancelModal}
                >
                  배정 취소
                </FilterTableToolbarButton>
                <FilterTableToolbarButton
                  type="button"
                  variant="secondary"
                  disabled={
                    progress.isMutating ||
                    progress.isError ||
                    progress.isParticipantUnresolved
                  }
                  onClick={openAttendanceCorrectionModal}
                >
                  출결 정정
                </FilterTableToolbarButton>
                <FilterTableToolbarButton
                  type="button"
                  variant="primary"
                  disabled={
                    progress.isMutating ||
                    progress.isError ||
                    progress.isParticipantUnresolved
                  }
                  onClick={openAssignModal}
                >
                  파트너 및 교육 배정
                </FilterTableToolbarButton>
                <ExcelButton onClick={exportExcel} loading={isExporting} />
              </>
            ) : null}
          </div>
        </div>
        <UjatEducationProgressVolunteerAssignmentTable
          initialRows={rows}
          volunteerName={volunteerName}
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          onRoleChange={handleRoleChange}
        />
      </section>

      <UjatEducationProgressVolunteerAssignmentAttendanceInfo
        assignmentRows={rows}
        attendanceSummary={bundle.attendanceSummary}
        absenceReasons={absenceReasons}
      />

      {cancelTargetRow && cancelRequiresMemberNotify ? (
        <PermissionModal
          open={cancelModalOpen}
          onCancel={closeCancelModal}
          onConfirm={handleCancelAssignmentConfirm}
          confirmLoading={progress.isMutating}
          variant="reject"
          title={ASSIGNMENT_CANCEL_MODAL_TITLE}
          message={buildAssignmentCancelNotifiedMessage(
            volunteerName,
            cancelTargetRow.scheduleLabel
          )}
          confirmLabel="배정 취소"
          confirmVariant="delete"
          reasonLabel="취소 사유"
          reasonPlaceholder="취소 사유를 입력해 주세요"
          reasonRequiredMessage="취소 사유는 2자 이상 입력해 주세요."
          notifyTimingOptions="two"
          notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.scheduledOnly}
        />
      ) : null}

      {cancelTargetRow && !cancelRequiresMemberNotify ? (
        <ContentModal
          open={cancelModalOpen}
          onCancel={closeCancelModal}
          title={ASSIGNMENT_CANCEL_MODAL_TITLE}
          width={600}
          description={buildAssignmentCancelPendingNotifyMessage(
            volunteerName,
            cancelTargetRow.scheduleLabel
          )}
          footer={
            <>
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                disabled={progress.isMutating}
                onClick={closeCancelModal}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="delete"
                size="large"
                type="button"
                loading={progress.isMutating}
                onClick={handleCancelAssignmentSimpleConfirm}
              >
                배정 취소
              </CmsButton>
            </>
          }
        >
          {null}
        </ContentModal>
      ) : null}

      {attendanceCorrectionTargetRow ? (
        <ProgramAttendanceCorrectionModal
          open={attendanceCorrectionModalOpen}
          subjectName={volunteerName}
          scheduleDateLabel={formatScheduleShortDateLabel(
            attendanceCorrectionTargetRow.scheduleLabel
          )}
          description={`[**${volunteerName}**] 님의 **${formatScheduleShortDateLabel(attendanceCorrectionTargetRow.scheduleLabel)}** 교육의 출결 상태를 정정해 주세요.`}
          fieldLabel="출결 정정"
          confirmLabel="정정"
          initialAttendance={
            attendanceCorrectionTargetRow.attendance.kind === 'withdrawn'
              ? { kind: 'dash' }
              : attendanceCorrectionTargetRow.attendance
          }
          statusOptions={ujatAttendanceCorrectionStatusOptions}
          evidenceScheduleId={attendanceCorrectionTargetRow.scheduleId}
          onCancel={() => {
            setAttendanceCorrectionModalOpen(false)
            setAttendanceCorrectionTargetRowId(null)
          }}
          onConfirm={handleAttendanceCorrectionConfirm}
        />
      ) : null}

      {assignModalData ? (
        <UjatVolunteerAssignmentAssignModal
          variant="volunteer"
          open={assignModalOpen}
          mode={assignModalData.mode}
          volunteerName={volunteerName}
          scheduleDateLabel={assignModalData.scheduleDateLabel}
          classOptions={assignModalData.classOptions}
          partnerOptions={assignModalData.partnerOptions}
          partnerOptionsLoading={partnerRecommendation.isLoading}
          fixedClassLabel={assignModalData.fixedClassLabel}
          onCancel={() => {
            setAssignModalOpen(false)
            setAssignTargetRowId(null)
          }}
          onConfirm={handleAssignConfirm}
        />
      ) : null}
    </div>
  )
}
