import { useCallback, useEffect, useMemo, useRef, useState, type Key } from 'react'
import { useCmsAlert } from '@/shared/ui'
import { getUjatVolunteerAssignmentProgressBundle } from './assignment-mock'
import { UjatEducationProgressVolunteerAssignmentAttendanceInfo } from './assignment-attendance-info'
import { UjatEducationProgressVolunteerAssignmentTable } from './assignment-table'
import { UjatVolunteerAssignmentAssignModal } from './assign-modal'
import {
  applyVolunteerAssignmentConfirm,
  getUjatVolunteerAssignmentAssignModalData,
} from './assign-mock'
import { sortVolunteerAssignmentRows } from './assignment-mock'
import { isVolunteerAssignmentClassWithdrawn } from './assignment-types'
import './assignment.css'

export function UjatEducationProgressVolunteerAssignmentProgressTab({
  volunteerId,
  volunteerName,
  assignModalTrigger,
}: {
  volunteerId: string
  volunteerName: string
  /** 헤더 [파트너 및 교육 배정] 클릭 시 증가 */
  assignModalTrigger: number
}) {
  const { showAlert } = useCmsAlert()
  const bundle = useMemo(
    () => getUjatVolunteerAssignmentProgressBundle(volunteerId),
    [volunteerId]
  )

  const [rows, setRows] = useState(() => sortVolunteerAssignmentRows(bundle.rows))
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignTargetRowId, setAssignTargetRowId] = useState<string | null>(null)
  const lastAssignModalTriggerRef = useRef(0)

  useEffect(() => {
    setRows(sortVolunteerAssignmentRows(bundle.rows))
    setSelectedRowKeys([])
    setAssignModalOpen(false)
    setAssignTargetRowId(null)
    lastAssignModalTriggerRef.current = 0
  }, [bundle.rows, volunteerId])

  const assignTargetRow = useMemo(
    () => (assignTargetRowId ? rows.find(row => row.id === assignTargetRowId) ?? null : null),
    [assignTargetRowId, rows]
  )

  const assignModalData = useMemo(
    () => (assignTargetRow ? getUjatVolunteerAssignmentAssignModalData(assignTargetRow) : null),
    [assignTargetRow]
  )

  useEffect(() => {
    if (assignModalTrigger <= lastAssignModalTriggerRef.current) return
    lastAssignModalTriggerRef.current = assignModalTrigger

    if (selectedRowKeys.length !== 1) {
      showAlert({
        title: '안내',
        content: '교육 일정을 1개 선택해 주세요.',
      })
      return
    }

    const rowId = String(selectedRowKeys[0])
    const row = rows.find(item => item.id === rowId)
    if (!row) {
      showAlert({
        title: '안내',
        content: '선택한 교육 일정을 찾을 수 없습니다.',
      })
      return
    }

    if (isVolunteerAssignmentClassWithdrawn(row)) {
      showAlert({
        title: '안내',
        content: '활동 포기된 일정에는 배정할 수 없습니다.',
      })
      return
    }

    setAssignTargetRowId(row.id)
    setAssignModalOpen(true)
  }, [assignModalTrigger, rows, selectedRowKeys, showAlert])

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

  return (
    <div className="ujat-volunteer-assignment-progress-tab">
      <section className="ujat-volunteer-assignment-progress-tab__table-section">
        <h3 className="program-detail-info-tab__section-title">교육 배정 및 진행 현황</h3>
        <UjatEducationProgressVolunteerAssignmentTable
          initialRows={rows}
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
        />
      </section>

      <UjatEducationProgressVolunteerAssignmentAttendanceInfo
        assignmentRows={rows}
        attendanceSummary={bundle.attendanceSummary}
        absenceReasons={bundle.absenceReasons}
      />

      {assignModalData ? (
        <UjatVolunteerAssignmentAssignModal
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
}
