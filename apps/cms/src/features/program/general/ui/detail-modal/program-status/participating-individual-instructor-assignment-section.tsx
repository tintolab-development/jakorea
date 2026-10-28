/**
 * 참여 강사 상세 — 교육 배정 현황 탭 (일반 프로그램 · 개인)
 */

import { useCallback, useEffect, useMemo, useRef, useState, type Key } from 'react'
import { Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  INSTRUCTOR_ASSIGN_SELECT_SCHOOL_ALERT_MESSAGE,
  INSTRUCTOR_ASSIGN_UNASSIGN_SELECT_SCHOOL_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { ContentModal } from '@/shared/ui/content-modal'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import { toScheduledOnlyNotifyTiming } from '@/features/program/general/lib/application-decision-notify-timing'
import {
  EditableStatusBadge,
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME,
} from '@/shared/components'
import { getInstructorRoleBadgeTone } from '@/shared/constants/editable-status-badge-tones'
import {
  INSTRUCTOR_ROLE_LABELS,
  type InstructorRoleKey,
} from '@/features/program/general/model/school-detail-types'
import {
  PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
  participatingScheduleTableColumnLayout,
} from '@/features/program/general/lib/participating-institutions-table'
import {
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_ASSIGNED_SCHEDULE_EXCEL_COLUMNS,
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_WAITING_SCHEDULE_EXCEL_COLUMNS,
} from '@/features/program/general/lib/participating-individual-instructor-assignment-export'
import type {
  ParticipatingIndividualInstructorAssignedScheduleRow,
  ParticipatingIndividualInstructorWaitingScheduleRow,
} from '@/features/program/general/lib/participating-individual-instructor-assignment-types'
import { useParticipatingInstructorInstitutionAssignment } from '@/features/program/general/hooks/use-participating-instructor-institution-assignment'
import { getParticipationConsentRequiredMessage } from '@/features/program/general/api/get-general-program-api-error'
import { formatInstructorOrganizationScheduleScopeMessage } from '@/features/program/shared/lib/instructor-organization-schedule-scope'
import {
  cancelInstructorAssignmentRemote,
  createInstructorAssignmentRemote,
  putRepresentativeInstructorRemote,
} from '@/features/program/general/api/instructor-assignments-api-client'
import { toInstructorAssignmentCancelRequest } from '@/features/program/general/lib/instructor-cancel-fault-party'
import { resolveAssignableSchedulePayloadFromSession } from '@/features/program/general/lib/organization-instructor-assignable-schedule'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from '@/features/program/general/lib/waiting-instructor-assignment'
import { SchoolDetailUnassignCompleteModal } from './school-detail-unassign-complete-modal'
import { SchoolDetailUnassignConfirmModal } from './school-detail-unassign-confirm-modal'
import './instructor-assignment-status-text.css'
import './participating-institutions-section.css'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'

const ASSIGNED_EMPTY_TEXT = '배정된 일정이 없습니다.'
const WAITING_EMPTY_TEXT = '배정 대기 중인 일정이 없습니다.'

function renderScheduleCell(label: string) {
  return (
    <div className="participating-institutions-section__sessions-cell">
      <div className="participating-institutions-section__session-line">
        {renderProgramDetailPipeSeparated(formatCmsScheduleDisplayLabel(label))}
      </div>
    </div>
  )
}

export interface ParticipatingIndividualInstructorAssignmentSectionProps {
  program: Program
  instructor: ParticipatingInstructorRow
  schoolRows?: ParticipatingSchoolRow[]
  instructorList?: ParticipatingInstructorRow[]
}

export function ParticipatingIndividualInstructorAssignmentSection({
  program,
  instructor,
  schoolRows = [],
  instructorList = [],
}: ParticipatingIndividualInstructorAssignmentSectionProps) {
  const { showAlert } = useCmsAlert()
  const [assignedSchedules, setAssignedSchedules] = useState<
    ParticipatingIndividualInstructorAssignedScheduleRow[]
  >([])
  const [waitingSchedules, setWaitingSchedules] = useState<
    ParticipatingIndividualInstructorWaitingScheduleRow[]
  >([])
  const [selectedAssignedKeys, setSelectedAssignedKeys] = useState<Key[]>([])
  const [selectedWaitingKeys, setSelectedWaitingKeys] = useState<Key[]>([])
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null)
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false)
  const [unassignCompleteModal, setUnassignCompleteModal] = useState<{
    instructorNames: string[]
    targetNames: string[]
    reason: string
  } | null>(null)
  const [selectAssignConfirmOpen, setSelectAssignConfirmOpen] = useState(false)
  const [addAssignModalOpen, setAddAssignModalOpen] = useState(false)
  const [addAssignNotifyOpen, setAddAssignNotifyOpen] = useState(false)
  const [addAssignWaitingRowId, setAddAssignWaitingRowId] = useState<string | null>(null)
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const assignInFlightRef = useRef(false)

  const assignment = useParticipatingInstructorInstitutionAssignment({
    programId: program.id,
    instructor,
    schoolRows,
    instructorList,
    isCompanySchool: false,
    enabled: true,
  })

  useEffect(() => {
    setAssignedSchedules(assignment.assignedSchedules)
    setWaitingSchedules(assignment.waitingSchedules)
    setSelectedAssignedKeys([])
    setSelectedWaitingKeys([])
    setOpenRoleDropdownId(null)
  }, [instructor.id, assignment.assignedSchedules, assignment.waitingSchedules])

  const handleRoleChange = useCallback(
    async (rowId: string, newRole: InstructorRoleKey) => {
      setOpenRoleDropdownId(null)
      if (newRole !== 'lead') {
        notifyProgramApiUnavailable(
          'general-individual-instructor-role-demote',
          '참여 강사 · 일반 강사 변경'
        )
        return
      }
      if (!assignment.remoteEnabled) {
        notifyProgramApiUnavailable(
          'general-individual-instructor-role-change',
          '참여 강사 · 대표 강사 변경'
        )
        return
      }
      const target = assignedSchedules.find(row => row.id === rowId)
      const memberId = Number(target?.instructorMemberId ?? instructor.memberId)
      const orgAppId = Number(target?.organizationApplicationId)
      const scheduleId = Number(target?.scheduleId)
      if (
        !Number.isFinite(memberId) ||
        memberId <= 0 ||
        !Number.isFinite(orgAppId) ||
        orgAppId <= 0
      ) {
        showAlert({
          title: '안내',
          content:
            '대표 강사 변경에 필요한 instructorMemberId / organizationApplicationId가 없습니다.',
        })
        return
      }
      try {
        await putRepresentativeInstructorRemote(program.id, {
          instructorMemberId: memberId,
          organizationApplicationId: orgAppId,
          ...(Number.isFinite(scheduleId) && scheduleId > 0 ? { scheduleId } : {}),
        })
        await assignment.invalidate()
      } catch {
        showAlert({
          title: '대표 강사 변경 실패',
          content: '대표 강사 지정에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
    },
    [assignedSchedules, assignment, instructor.memberId, program.id, showAlert]
  )

  const assignedColumns: ColumnsType<ParticipatingIndividualInstructorAssignedScheduleRow> =
    useMemo(
      () => [
        { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
        {
          title: '역할',
          dataIndex: 'role',
          key: 'role',
          width: 116,
          align: 'center',
          onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME }),
          onCell: () => ({
            className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME}`,
          }),
          render: (role: InstructorRoleKey, record) => (
            <StatusDropdownCell<InstructorRoleKey>
              status={role}
              statusOptions={['lead', 'assistant']}
              renderBadge={r => (
                <EditableStatusBadge
                  label={INSTRUCTOR_ROLE_LABELS[r]}
                  tone={getInstructorRoleBadgeTone(r)}
                />
              )}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={key => handleRoleChange(record.id, key as InstructorRoleKey)}
              isOpen={openRoleDropdownId === record.id}
              onOpenChange={open => setOpenRoleDropdownId(open ? record.id : null)}
              emptyPlaceholder="-"
              tagLayout="tag100"
            />
          ),
        },
        {
          title: '출강지',
          dataIndex: 'lectureLocation',
          key: 'lectureLocation',
          width: 180,
        },
        {
          title: '자택과의 거리',
          dataIndex: 'distanceFromHome',
          key: 'distanceFromHome',
          width: 110,
          align: 'center',
        },
        {
          title: '담당 교육 진행 일정',
          dataIndex: 'scheduleLabel',
          key: 'scheduleLabel',
          width: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
          minWidth: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
          ...participatingScheduleTableColumnLayout(),
          render: (label: string) => renderScheduleCell(label),
        },
      ],
      [handleRoleChange, openRoleDropdownId]
    )

  const waitingColumns: ColumnsType<ParticipatingIndividualInstructorWaitingScheduleRow> =
    useMemo(
      () => [
        { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
        {
          title: '출강지',
          dataIndex: 'lectureLocation',
          key: 'lectureLocation',
          width: 180,
        },
        {
          title: '자택과의 거리',
          dataIndex: 'distanceFromHome',
          key: 'distanceFromHome',
          width: 110,
          align: 'center',
        },
        {
          title: '교육 진행 희망 일정',
          dataIndex: 'scheduleLabel',
          key: 'scheduleLabel',
          width: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
          minWidth: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
          ...participatingScheduleTableColumnLayout(),
          render: (label: string) => renderScheduleCell(label),
        },
        {
          title: '배정 현황',
          dataIndex: 'assignmentStatus',
          key: 'assignmentStatus',
          width: 100,
          align: 'center',
          render: (status: ParticipatingIndividualInstructorWaitingScheduleRow['assignmentStatus']) => (
            <span
              className={`school-detail-fullpage-view__assignment-status school-detail-fullpage-view__assignment-status--${status === 'unavailable' ? 'cancelled' : status}`}
            >
              {WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[status]}
            </span>
          ),
        },
        {
          title: '배정 강사 수',
          dataIndex: 'assignedInstructorCountLabel',
          key: 'assignedInstructorCountLabel',
          width: 110,
          align: 'center',
        },
      ],
      []
    )

  const assignedExportRows = useMemo(
    () =>
      assignedSchedules.map(row => ({
        id: row.id,
        no: row.no,
        role: INSTRUCTOR_ROLE_LABELS[row.role],
        lectureLocation: row.lectureLocation,
        distanceFromHome: row.distanceFromHome,
        scheduleLabel: row.scheduleLabel,
      })),
    [assignedSchedules]
  )

  const waitingExportRows = useMemo(
    () =>
      waitingSchedules.map(row => ({
        id: row.id,
        no: row.no,
        lectureLocation: row.lectureLocation,
        distanceFromHome: row.distanceFromHome,
        scheduleLabel: row.scheduleLabel,
        assignmentStatus: WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[row.assignmentStatus],
        assignedInstructorCountLabel: row.assignedInstructorCountLabel,
      })),
    [waitingSchedules]
  )

  const { exportExcel: exportAssignedExcel, isExporting: isAssignedExcelExporting } =
    useTableExcelExport({
      columns: PARTICIPATING_INDIVIDUAL_INSTRUCTOR_ASSIGNED_SCHEDULE_EXCEL_COLUMNS,
      data: assignedExportRows,
      filename: '배정된 교육 일정',
      selectedRowKeys: selectedAssignedKeys,
    })

  const { exportExcel: exportWaitingExcel, isExporting: isWaitingExcelExporting } =
    useTableExcelExport({
      columns: PARTICIPATING_INDIVIDUAL_INSTRUCTOR_WAITING_SCHEDULE_EXCEL_COLUMNS,
      data: waitingExportRows,
      filename: '배정 대기 교육 일정',
      selectedRowKeys: selectedWaitingKeys,
    })

  const handleUnassignClick = useCallback(() => {
    if (selectedAssignedKeys.length === 0) {
      showAlert({ title: '안내', content: INSTRUCTOR_ASSIGN_UNASSIGN_SELECT_SCHOOL_ALERT_MESSAGE })
      return
    }
    setUnassignConfirmOpen(true)
  }, [selectedAssignedKeys.length, showAlert])

  const handleSelectAssignClick = useCallback(() => {
    if (selectedWaitingKeys.length === 0) {
      showAlert({ title: '안내', content: INSTRUCTOR_ASSIGN_SELECT_SCHOOL_ALERT_MESSAGE })
      return
    }
    const movable = waitingSchedules.some(
      w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (!movable) return
    setSelectAssignConfirmOpen(true)
  }, [selectedWaitingKeys, waitingSchedules, showAlert])

  const createAssignmentsFromWaiting = useCallback(
    async (
      selectedRows: ParticipatingIndividualInstructorWaitingScheduleRow[],
      notifyPayload?: PermissionModalPayload
    ) => {
      if (!assignment.remoteEnabled) {
        notifyProgramApiUnavailable(
          'general-individual-instructor-assign',
          '참여 강사 · 교육 일정 배정'
        )
        return false
      }
      const memberId = Number(instructor.memberId)
      if (!Number.isFinite(memberId) || memberId <= 0) {
        showAlert({
          title: '안내',
          content: '강사 memberId가 없어 배정할 수 없습니다.',
        })
        return false
      }
      if (assignInFlightRef.current) return false
      assignInFlightRef.current = true
      setAssignSubmitting(true)
      const assignmentNotify = notifyPayload
        ? toScheduledOnlyNotifyTiming(notifyPayload.notifyTiming, notifyPayload.manualNotifyAt)
        : undefined
      try {
        let leadAssigned = assignedSchedules.some(row => row.role === 'lead')
        for (const waitingRow of selectedRows) {
          if (waitingRow.assignmentStatus !== 'waiting') {
            showAlert({
              title: '안내',
              content: `${waitingRow.lectureLocation} — 배정 가능한 교육 일정이 없습니다. 기관의 교육 일정 확정 후 다시 시도해 주세요.`,
            })
            return false
          }
          const orgAppId = Number(waitingRow.organizationApplicationId)
          if (!Number.isFinite(orgAppId) || orgAppId <= 0) {
            showAlert({
              title: '안내',
              content: `${waitingRow.lectureLocation} — organizationApplicationId가 없어 배정할 수 없습니다.`,
            })
            return false
          }
          const session =
            waitingRow.sessions?.find(
              item => resolveAssignableSchedulePayloadFromSession(item) != null
            ) ?? null
          const schedulePayload =
            resolveAssignableSchedulePayloadFromSession(session) ??
            (typeof waitingRow.resolvedScheduleId === 'number' && waitingRow.resolvedScheduleId > 0
              ? { scheduleId: waitingRow.resolvedScheduleId }
              : waitingRow.requestedScheduleId != null && waitingRow.requestedScheduleId > 0
                ? { requestedScheduleId: waitingRow.requestedScheduleId }
                : null)
          if (!schedulePayload) {
            showAlert({
              title: '안내',
              content: `${waitingRow.lectureLocation} — 배정 가능한 교육 일정이 없습니다. 기관의 교육 일정 확정 후 다시 시도해 주세요.`,
            })
            return false
          }
          await createInstructorAssignmentRemote(program.id, {
            instructorMemberId: memberId,
            ...schedulePayload,
            organizationApplicationId: orgAppId,
            instructorApplicationId: waitingRow.instructorApplicationId
              ? Number(waitingRow.instructorApplicationId)
              : instructor.instructorApplicationId
                ? Number(instructor.instructorApplicationId)
                : undefined,
            scheduleLead: !leadAssigned,
            ...assignmentNotify,
          })
          leadAssigned = true
        }
        await assignment.invalidate()
        return true
      } catch (error) {
        const scopeMessage = formatInstructorOrganizationScheduleScopeMessage(error)
        if (scopeMessage) {
          await assignment.invalidate()
          showAlert({ title: '배정 실패', content: scopeMessage })
          return false
        }
        const message =
          getParticipationConsentRequiredMessage(error) ??
          (error instanceof Error && error.message.trim()
            ? error.message
            : '배정에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        showAlert({ title: '배정 실패', content: message })
        return false
      } finally {
        assignInFlightRef.current = false
        setAssignSubmitting(false)
      }
    },
    [
      assignedSchedules,
      assignment,
      instructor.instructorApplicationId,
      instructor.memberId,
      program.id,
      showAlert,
    ]
  )

  const handleUnassignConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (selectedAssignedKeys.length === 0) return
      if (payload.faultParty !== 'USER' && payload.faultParty !== 'ADMIN') return
      const removedRows = assignedSchedules.filter(r => selectedAssignedKeys.includes(r.id))
      const removedLabels = removedRows.map(r => r.scheduleLabel)
      const cancelBody = toInstructorAssignmentCancelRequest({
        reason: payload.reason,
        notifyTiming: payload.notifyTiming,
        manualNotifyAt: payload.manualNotifyAt,
        faultParty: payload.faultParty,
      })

      if (!assignment.remoteEnabled) {
        notifyProgramApiUnavailable(
          'general-individual-instructor-unassign',
          '참여 강사 · 배정 취소'
        )
        return
      }
      try {
        for (const row of removedRows) {
          const assignmentId = row.assignmentId ?? row.id
          if (!assignmentId) continue
          await cancelInstructorAssignmentRemote(String(assignmentId), cancelBody)
        }
        await assignment.invalidate()
        setUnassignConfirmOpen(false)
        setSelectedAssignedKeys([])
        setUnassignCompleteModal({
          instructorNames: [instructor.instructorName],
          targetNames: removedLabels,
          reason: payload.reason,
        })
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : '배정 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.'
        showAlert({ title: '배정 취소 실패', content: message })
      }
    },
    [
      selectedAssignedKeys,
      assignedSchedules,
      assignment,
      instructor.instructorName,
      showAlert,
    ]
  )

  const handleSelectAssignConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      const selectedRows = waitingSchedules.filter(
        w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
      )
      if (selectedRows.length === 0) return
      const ok = await createAssignmentsFromWaiting(selectedRows, payload)
      if (!ok) return
      setSelectAssignConfirmOpen(false)
      setSelectedWaitingKeys([])
    },
    [selectedWaitingKeys, waitingSchedules, createAssignmentsFromWaiting]
  )

  const handleAddAssignSchedulePicked = useCallback(() => {
    if (!addAssignWaitingRowId) return
    const waitingRow = waitingSchedules.find(w => w.id === addAssignWaitingRowId)
    if (!waitingRow || waitingRow.assignmentStatus !== 'waiting') return
    setAddAssignModalOpen(false)
    setAddAssignNotifyOpen(true)
  }, [addAssignWaitingRowId, waitingSchedules])

  const handleAddAssignConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!addAssignWaitingRowId) return
      const waitingRow = waitingSchedules.find(w => w.id === addAssignWaitingRowId)
      if (!waitingRow || waitingRow.assignmentStatus !== 'waiting') return
      const ok = await createAssignmentsFromWaiting([waitingRow], payload)
      if (!ok) return
      setAddAssignNotifyOpen(false)
      setAddAssignWaitingRowId(null)
    },
    [addAssignWaitingRowId, waitingSchedules, createAssignmentsFromWaiting]
  )

  const addAssignOptions = useMemo(
    () =>
      waitingSchedules
        .filter(w => w.assignmentStatus === 'waiting')
        .map(w => ({
          value: w.id,
          label: `${w.lectureLocation} · ${w.scheduleLabel}`,
        })),
    [waitingSchedules]
  )

  const unassignScheduleLabels = useMemo(
    () =>
      assignedSchedules
        .filter(r => selectedAssignedKeys.includes(r.id))
        .map(r => r.scheduleLabel),
    [assignedSchedules, selectedAssignedKeys]
  )

  const selectAssignLabels = useMemo(
    () =>
      waitingSchedules
        .filter(w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting')
        .map(w => w.scheduleLabel),
    [waitingSchedules, selectedWaitingKeys]
  )

  const addAssignNotifyLabel = useMemo(() => {
    const waitingRow = waitingSchedules.find(w => w.id === addAssignWaitingRowId)
    return waitingRow?.scheduleLabel ?? ''
  }, [addAssignWaitingRowId, waitingSchedules])

  return (
    <div className="school-detail-fullpage-view__instructor-tab">
      <div className="school-detail-fullpage-view__instructor-section">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">배정된 교육 일정</span>
            <span className="table-description">{assignedSchedules.length}건</span>
          </div>
          <div className="info-section-buttons--wrapper">
            <CmsButton variant="delete" size="h40" onClick={handleUnassignClick}>
              배정 취소
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="h40"
              disabled={addAssignOptions.length === 0}
              onClick={() => {
                if (addAssignOptions.length === 0) return
                setAddAssignWaitingRowId(addAssignOptions[0]?.value ?? null)
                setAddAssignModalOpen(true)
              }}
            >
              추가 배정
            </CmsButton>
            <ExcelButton onClick={exportAssignedExcel} loading={isAssignedExcelExporting} />
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap">
          <CmsDataTable<ParticipatingIndividualInstructorAssignedScheduleRow>
            className="participating-institutions-section__table cms-data-table"
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 1100 }}
            rowSelection={{
              columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
              selectedRowKeys: selectedAssignedKeys,
              onChange: keys => setSelectedAssignedKeys(keys),
            }}
            columns={assignedColumns}
            dataSource={assignedSchedules}
            emptyTitle={ASSIGNED_EMPTY_TEXT}
            emptyDescription={null}
          />
        </div>
      </div>

      <div className="school-detail-fullpage-view__instructor-section school-detail-fullpage-view__instructor-section--waiting">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">배정 대기 교육 일정</span>
            <span className="table-description">{waitingSchedules.length}건</span>
          </div>
          <div className="info-section-buttons--wrapper">
            <CmsButton variant="secondary" size="h40" onClick={handleSelectAssignClick}>
              선택 배정
            </CmsButton>
            <ExcelButton onClick={exportWaitingExcel} loading={isWaitingExcelExporting} />
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap school-detail-fullpage-view__waiting-table-scroll">
          <CmsDataTable<ParticipatingIndividualInstructorWaitingScheduleRow>
            className="participating-institutions-section__table cms-data-table"
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 1200 }}
            rowSelection={{
              columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
              selectedRowKeys: selectedWaitingKeys,
              onChange: keys => setSelectedWaitingKeys(keys),
              getCheckboxProps: record => ({
                disabled: record.assignmentStatus !== 'waiting',
              }),
            }}
            columns={waitingColumns}
            dataSource={waitingSchedules}
            emptyTitle={WAITING_EMPTY_TEXT}
            emptyDescription={null}
            rowClassName={record =>
              record.assignmentStatus === 'unavailable'
                ? 'school-detail-fullpage-view__waiting-row--unavailable'
                : ''
            }
          />
        </div>
      </div>

      <SchoolDetailUnassignConfirmModal
        open={unassignConfirmOpen}
        onCancel={() => setUnassignConfirmOpen(false)}
        instructorNames={[instructor.instructorName]}
        targetNames={unassignScheduleLabels}
        onConfirm={handleUnassignConfirm}
      />
      <SchoolDetailUnassignCompleteModal
        open={unassignCompleteModal != null}
        onClose={() => setUnassignCompleteModal(null)}
        instructorNames={unassignCompleteModal?.instructorNames ?? []}
        targetNames={unassignCompleteModal?.targetNames ?? []}
        reason={unassignCompleteModal?.reason ?? ''}
      />

      <PermissionModal
        open={selectAssignConfirmOpen}
        onCancel={() => {
          if (assignSubmitting) return
          setSelectAssignConfirmOpen(false)
        }}
        onConfirm={handleSelectAssignConfirm}
        confirmLoading={assignSubmitting}
        variant="approve"
        title="교육 일정 배정 안내"
        width={600}
        message={`[**${instructor.instructorName}**] 강사님을 다음 교육 일정에 배정하시겠습니까? ${selectAssignLabels.map(label => `[**${label}**]`).join(', ')}`}
        confirmLabel="배정"
        confirmVariant="primary"
        requireReason={false}
        notifyTimingOptions="two"
        notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.scheduledOnly}
      />

      <ContentModal
        open={addAssignModalOpen}
        onCancel={() => {
          setAddAssignModalOpen(false)
          setAddAssignWaitingRowId(null)
        }}
        title="추가 배정"
        width={600}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="large"
              onClick={() => {
                setAddAssignModalOpen(false)
                setAddAssignWaitingRowId(null)
              }}
            >
              취소
            </CmsButton>
            <CmsButton variant="primary" size="large" onClick={handleAddAssignSchedulePicked}>
              배정
            </CmsButton>
          </>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{ display: 'block', marginBottom: 8 }}>교육 일정 선택</span>
          <Select
            style={{ width: '100%' }}
            placeholder="교육 일정을 선택하세요"
            options={addAssignOptions}
            value={addAssignWaitingRowId ?? undefined}
            onChange={v => setAddAssignWaitingRowId(v)}
            allowClear
            getPopupContainer={() => document.body}
          />
        </div>
      </ContentModal>
      <PermissionModal
        open={addAssignNotifyOpen}
        onCancel={() => {
          if (assignSubmitting) return
          setAddAssignNotifyOpen(false)
        }}
        onConfirm={handleAddAssignConfirm}
        confirmLoading={assignSubmitting}
        variant="approve"
        title="강사 배정 안내"
        width={600}
        message={`[**${instructor.instructorName}**] 강사님을 다음 교육 일정에 배정하시겠습니까? ${addAssignNotifyLabel ? `[**${addAssignNotifyLabel}**]` : ''}`}
        confirmLabel="강사 배정"
        confirmVariant="primary"
        requireReason={false}
        notifyTimingOptions="two"
        notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.scheduledOnly}
      />
    </div>
  )
}
