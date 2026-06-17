import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type Key,
} from 'react'
import { useCmsAlert } from '@/shared/ui'
import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import { getUjatVolunteerAssignmentProgressBundle } from './assignment-mock'
import { UjatEducationProgressVolunteerAssignmentAttendanceInfo } from './assignment-attendance-info'
import { UjatEducationProgressVolunteerAssignmentTable } from './assignment-table'
import { UjatVolunteerAssignmentAssignModal } from './assign-modal'
import { ProgramAttendanceCorrectionModal } from '@/features/program/shared/ui/attendance-correction-modal'
import type { ProgramAttendanceCorrectionConfirmPayload } from '@/features/program/shared/lib/attendance-correction-types'
import {
  UJAT_ATTENDANCE_STATUS_LABEL,
  UJAT_ATTENDANCE_STATUS_ORDER,
} from '../../attendance/types'
import {
  applyVolunteerAssignmentConfirm,
  formatScheduleShortDateLabel,
  getUjatVolunteerAssignmentAssignModalData,
} from './assign-mock'
import {
  mergeVolunteerActivityWithdrawnRows,
  sortVolunteerAssignmentRows,
} from './assignment-mock'
import {
  isVolunteerAssignmentClassWithdrawn,
  type UjatVolunteerAssignmentAbsenceReason,
} from './assignment-types'
import './assignment.css'

export type UjatVolunteerAssignmentProgressTabHandle = {
  openAssignModal: () => void
  openCancelModal: () => void
  openAttendanceCorrectionModal: () => void
}

export const UjatEducationProgressVolunteerAssignmentProgressTab = forwardRef<
  UjatVolunteerAssignmentProgressTabHandle,
  {
    volunteerId: string
    volunteerName: string
    withdrawnScheduleRowIds?: ReadonlyArray<string>
  }
>(function UjatEducationProgressVolunteerAssignmentProgressTab(
  { volunteerId, volunteerName, withdrawnScheduleRowIds = [] },
  ref
) {
  const { showAlert } = useCmsAlert()
  const bundle = useMemo(() => getUjatVolunteerAssignmentProgressBundle(volunteerId), [volunteerId])

  const [rows, setRows] = useState(() =>
    mergeVolunteerActivityWithdrawnRows(bundle.rows, withdrawnScheduleRowIds)
  )
  const [absenceReasons, setAbsenceReasons] = useState<UjatVolunteerAssignmentAbsenceReason[]>(
    () => bundle.absenceReasons
  )
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
    setRows(mergeVolunteerActivityWithdrawnRows(bundle.rows, withdrawnScheduleRowIds))
    setAbsenceReasons(bundle.absenceReasons)
    setSelectedRowKeys([])
    setAssignModalOpen(false)
    setAssignTargetRowId(null)
    setCancelModalOpen(false)
    setCancelTargetRowId(null)
    setAttendanceCorrectionModalOpen(false)
    setAttendanceCorrectionTargetRowId(null)
  }, [bundle.absenceReasons, bundle.rows, volunteerId, withdrawnScheduleRowIds])

  const getSingleSelectedRow = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      showAlert({
        title: '안내',
        content: '교육 일정을 1개 선택해 주세요.',
      })
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
  }, [rows, selectedRowKeys, showAlert])

  const openAssignModal = useCallback(() => {
    const row = getSingleSelectedRow()
    if (!row) return

    if (isVolunteerAssignmentClassWithdrawn(row)) {
      showAlert({
        title: '안내',
        content: '활동 포기된 일정에는 배정할 수 없습니다.',
      })
      return
    }

    setAssignTargetRowId(row.id)
    setAssignModalOpen(true)
  }, [getSingleSelectedRow, showAlert])

  const openCancelModal = useCallback(() => {
    const row = getSingleSelectedRow()
    if (!row) return

    if (isVolunteerAssignmentClassWithdrawn(row)) {
      showAlert({
        title: '안내',
        content: '활동 포기된 일정은 배정 취소할 수 없습니다.',
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
  }, [getSingleSelectedRow, showAlert])

  const openAttendanceCorrectionModal = useCallback(() => {
    const row = getSingleSelectedRow()
    if (!row) return

    if (isVolunteerAssignmentClassWithdrawn(row)) {
      showAlert({
        title: '안내',
        content: '활동 포기된 일정은 출결 정정할 수 없습니다.',
      })
      return
    }

    setAttendanceCorrectionTargetRowId(row.id)
    setAttendanceCorrectionModalOpen(true)
  }, [getSingleSelectedRow, showAlert])

  useImperativeHandle(
    ref,
    () => ({
      openAssignModal,
      openCancelModal,
      openAttendanceCorrectionModal,
    }),
    [openAssignModal, openCancelModal, openAttendanceCorrectionModal]
  )

  const assignTargetRow = useMemo(
    () => (assignTargetRowId ? (rows.find(row => row.id === assignTargetRowId) ?? null) : null),
    [assignTargetRowId, rows]
  )

  const assignModalData = useMemo(
    () => (assignTargetRow ? getUjatVolunteerAssignmentAssignModalData(assignTargetRow) : null),
    [assignTargetRow]
  )

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

  const handleCancelAssignmentConfirm = useCallback(
    (_payload: PermissionModalPayload) => {
      if (!cancelTargetRow) return

      setRows(prev =>
        sortVolunteerAssignmentRows(
          prev.map(row => {
            if (row.id !== cancelTargetRow.id) return row
            return {
              ...row,
              assignedInstitution: { kind: 'dash' as const },
              partner: { kind: 'dash' as const },
              classDisplay: { kind: 'dash' as const },
              attendance: { kind: 'dash' as const },
              educationPlanSubmitted: false,
              educationLogSubmitted: false,
              educationProgress: 'scheduled' as const,
            }
          })
        )
      )
      setCancelModalOpen(false)
      setCancelTargetRowId(null)
      setSelectedRowKeys([])
      showAlert({
        title: '안내',
        content: '교육 배정이 취소되었습니다.',
      })
    },
    [cancelTargetRow, showAlert]
  )

  const handleAssignConfirm = useCallback(
    (payload: { classValue: string; partnerId: string }) => {
      if (!assignTargetRow || !assignModalData) return

      setRows(prev =>
        sortVolunteerAssignmentRows(
          applyVolunteerAssignmentConfirm(prev, {
            scheduleRowId: assignTargetRow.id,
            mode: assignModalData.mode,
            classValue: payload.classValue,
            partnerId: payload.partnerId,
          })
        )
      )
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
    [assignModalData, assignTargetRow, showAlert]
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

      setRows(prev =>
        sortVolunteerAssignmentRows(
          prev.map(row => {
            if (row.id !== attendanceCorrectionTargetRow.id) return row

            if (payload.status === 'late') {
              return {
                ...row,
                attendance: { kind: 'late', time: payload.attendanceTime ?? '8:30' },
              }
            }
            if (payload.status === 'absence') {
              return {
                ...row,
                attendance: { kind: 'absence' },
              }
            }
            if (payload.status === 'excused_absence') {
              return {
                ...row,
                attendance: { kind: 'excused_absence' },
              }
            }
            return {
              ...row,
              attendance: { kind: 'present' },
            }
          })
        )
      )

      setAbsenceReasons(prev => {
        const nextWithoutCurrent = prev.filter(
          item =>
            item.scheduleRowId !== attendanceCorrectionTargetRow.id &&
            item.id !== `abs-${attendanceCorrectionTargetRow.id}`
        )

        if (payload.status !== 'excused_absence') {
          return nextWithoutCurrent
        }

        return [
          ...nextWithoutCurrent,
          {
            id: `abs-${attendanceCorrectionTargetRow.id}`,
            scheduleRowId: attendanceCorrectionTargetRow.id,
            dateLabel: formatScheduleShortDateLabel(attendanceCorrectionTargetRow.scheduleLabel),
            reason: payload.reason,
            fileName: payload.evidenceFileName,
          },
        ]
      })

      setAttendanceCorrectionModalOpen(false)
      setAttendanceCorrectionTargetRowId(null)
      showAlert({
        title: '안내',
        content: '출결이 정정되었습니다.',
      })
    },
    [attendanceCorrectionTargetRow, showAlert]
  )

  return (
    <div className="ujat-volunteer-assignment-progress-tab">
      <section className="ujat-volunteer-assignment-progress-tab__table-section">
        <h3 className="program-detail-info-tab__section-title">교육 배정 및 진행 현황</h3>
        <UjatEducationProgressVolunteerAssignmentTable
          initialRows={rows}
          volunteerName={volunteerName}
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
        />
      </section>

      <UjatEducationProgressVolunteerAssignmentAttendanceInfo
        assignmentRows={rows}
        attendanceSummary={bundle.attendanceSummary}
        absenceReasons={absenceReasons}
      />

      {cancelTargetRow ? (
        <PermissionModal
          open={cancelModalOpen}
          onCancel={() => {
            setCancelModalOpen(false)
            setCancelTargetRowId(null)
          }}
          onConfirm={handleCancelAssignmentConfirm}
          variant="reject"
          title="교육 배정 취소"
          message={`**[${volunteerName}]** 봉사자의 **[${formatScheduleShortDateLabel(cancelTargetRow.scheduleLabel)}]** 배정을 취소하시겠습니까?\n취소 시 입력하신 취소 사유가 봉사자에게 전달되며, 알림이 발송됩니다.`}
          confirmLabel="배정 취소"
          confirmVariant="delete"
          reasonLabel="취소 사유"
          reasonPlaceholder="취소 사유를 입력해 주세요."
          reasonRequiredMessage="취소 사유를 입력해 주세요."
          notifyTimingOptions="two"
        />
      ) : null}

      {attendanceCorrectionTargetRow ? (
        <ProgramAttendanceCorrectionModal
          open={attendanceCorrectionModalOpen}
          subjectName={volunteerName}
          scheduleDateLabel={formatScheduleShortDateLabel(
            attendanceCorrectionTargetRow.scheduleLabel
          )}
          initialAttendance={attendanceCorrectionTargetRow.attendance}
          statusOptions={ujatAttendanceCorrectionStatusOptions}
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
})
