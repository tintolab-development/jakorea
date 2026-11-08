import { getProgramAssignmentRowClass } from '@/features/program/general/lib/assignment-status-presentation'
import { ProgramAssignmentStatusText } from '@/features/program/shared/ui/program-assignment-status-text'
/**
 * 참여 강사 상세 — 교육 배정 현황 탭 (일반 프로그램 · 개인)
 */

import { useCallback, useEffect, useMemo, useRef, useState, type Key } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
} from '@/shared/constants/messages'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import { toScheduledOnlyNotifyTiming } from '@/features/program/general/lib/application-decision-notify-timing'
import { StatusDropdownCell, STATUS_DROPDOWN_CELL_CLASSNAME } from '@/shared/components'
import { getInstructorRoleTag } from '@/shared/lib/status-tag-specs'
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
import {
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_WAITING_STATUS_LABELS,
  type ParticipatingIndividualInstructorAssignedScheduleRow,
  type ParticipatingIndividualInstructorWaitingScheduleRow,
} from '@/features/program/general/lib/participating-individual-instructor-assignment-types'
import { useParticipatingInstructorInstitutionAssignment } from '@/features/program/general/hooks/use-participating-instructor-institution-assignment'
import { resolveRequiredAssignableInstructorCount } from '@/features/program/general/lib/institution-select-assign'
import {
  getGeneralProgramApiErrorMessage,
  getParticipationConsentRequiredMessage,
} from '@/features/program/general/api/get-general-program-api-error'
import { waitingAssignmentStatusLabel } from '@/features/program/general/lib/instructor-assignment-availability'
import { formatInstructorOrganizationScheduleScopeMessage } from '@/features/program/shared/lib/instructor-organization-schedule-scope'
import {
  cancelInstructorAssignmentRemote,
  createInstructorAssignmentRemote,
  putRepresentativeInstructorRemote,
} from '@/features/program/general/api/instructor-assignments-api-client'
import { toInstructorAssignmentCancelRequest } from '@/features/program/general/lib/instructor-cancel-fault-party'
import { resolveAssignableSchedulePayloadFromSession } from '@/features/program/general/lib/organization-instructor-assignable-schedule'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import {
  GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT_MESSAGE,
  programHasActiveInstructorRecruitment,
} from '@/features/program/general/lib/general-instructor-recruitment-required'
import { SchoolDetailUnassignCompleteModal } from './school-detail-unassign-complete-modal'
import { SchoolDetailUnassignConfirmModal } from './school-detail-unassign-confirm-modal'
import { InstitutionSelectAssignConfirmModal } from './institution-select-assign-confirm-modal'
import { INSTITUTION_SELECT_ASSIGN_DEFAULT_NOTIFY_PAYLOAD } from '@/features/program/general/lib/institution-select-assign'
import './participating-institutions-section.css'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { ScheduleLinesCell } from '@/features/program/shared/ui/schedule-lines-cell'
import { buildAddAssignWaitingScheduleChipOptions } from '@/features/program/general/lib/general-add-assign-session-chips'
import { GeneralParticipantAddAssignModal } from './general-participant-add-assign-modal'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

/** 추가 배정 — Figma CMS 9760:8214 ‘추가 배정 안내’ (D: 개인형 참여 강사) */
const ADD_ASSIGN_MODAL_TITLE = '추가 배정 안내'

const ASSIGNED_EMPTY_TEXT = '배정된 일정이 없습니다.'
const WAITING_EMPTY_TEXT = '배정 대기 중인 일정이 없습니다.'

function renderScheduleCell(label: string) {
  return <ScheduleLinesCell lines={[formatCmsScheduleDisplayLabel(label)]} />
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
  const [addAssignRole, setAddAssignRole] = useState<InstructorRoleKey>('assistant')
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const assignInFlightRef = useRef(false)

  const canAssignInstructor = programHasActiveInstructorRecruitment(program)
  const assignment = useParticipatingInstructorInstitutionAssignment({
    programId: program.id,
    instructor,
    schoolRows,
    instructorList,
    isCompanySchool: false,
    enabled: canAssignInstructor,

    maxAssignableInstructors: resolveRequiredAssignableInstructorCount(program),
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
      const scheduleId = Number(target?.scheduleId)
      // 개인형은 기관 맥락 미지원(BE: orgAppId 전송 시 400) — scheduleId 범위로만 대표 강사 지정
      if (
        !Number.isFinite(memberId) ||
        memberId <= 0 ||
        !Number.isFinite(scheduleId) ||
        scheduleId <= 0
      ) {
        showAlert({
          title: '안내',
          content: '대표 강사 변경에 필요한 instructorMemberId / scheduleId가 없습니다.',
        })
        return
      }
      try {
        await putRepresentativeInstructorRemote(program.id, {
          instructorMemberId: memberId,
          scheduleId,
        })
        await assignment.invalidate()
      } catch (error) {
        showAlert({
          title: '대표 강사 변경 실패',
          content: getGeneralProgramApiErrorMessage(
            error,
            '대표 강사 지정에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          ),
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
          onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
          render: (role: InstructorRoleKey, record) => (
            <StatusDropdownCell<InstructorRoleKey>
              status={role}
              statusOptions={['lead', 'assistant']}
              getTag={getInstructorRoleTag}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={key => handleRoleChange(record.id, key as InstructorRoleKey)}
              isOpen={openRoleDropdownId === record.id}
              onOpenChange={open => setOpenRoleDropdownId(open ? record.id : null)}
              emptyPlaceholder="-"
            />
          ),
        },
        {
          title: '출강지',
          dataIndex: 'lectureLocation',
          key: 'lectureLocation',
          width: 160,
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

  const waitingColumns: ColumnsType<ParticipatingIndividualInstructorWaitingScheduleRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '출강지',
        dataIndex: 'lectureLocation',
        key: 'lectureLocation',
        width: 160,
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
        width: 120,
        align: 'center',
        render: (
          _status: ParticipatingIndividualInstructorWaitingScheduleRow['assignmentStatus'],
          record: ParticipatingIndividualInstructorWaitingScheduleRow
        ) => (
          <ProgramAssignmentStatusText status={record.assignmentStatus} context="instructor-individual" assignmentStatusLabel={record.assignmentStatusLabel} />
        ),
      },
      {
        title: '배정 강사 수',
        dataIndex: 'assignedInstructorCountLabel',
        key: 'assignedInstructorCountLabel',
        width: 100,
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
        assignmentStatus: waitingAssignmentStatusLabel(
          row.assignmentStatus,
          PARTICIPATING_INDIVIDUAL_INSTRUCTOR_WAITING_STATUS_LABELS,
          row.assignmentStatusLabel
        ),
        assignedInstructorCountLabel: row.assignedInstructorCountLabel,
      })),
    [waitingSchedules]
  )

  const { exportExcel: exportAssignedExcel, isExporting: isAssignedExcelExporting } =
    useTableExcelExport({
      accessLog: { downloadKind: 'PROGRAM_PERSON_ASSIGNMENT_EXPORT', containedPiiTypes: [] },
      columns: PARTICIPATING_INDIVIDUAL_INSTRUCTOR_ASSIGNED_SCHEDULE_EXCEL_COLUMNS,
      data: assignedExportRows,
      filename: '배정된 교육 일정',
      selectedRowKeys: selectedAssignedKeys,
    })

  const { exportExcel: exportWaitingExcel, isExporting: isWaitingExcelExporting } =
    useTableExcelExport({
      accessLog: { downloadKind: 'PROGRAM_PERSON_ASSIGNMENT_EXPORT', containedPiiTypes: [] },
      columns: PARTICIPATING_INDIVIDUAL_INSTRUCTOR_WAITING_SCHEDULE_EXCEL_COLUMNS,
      data: waitingExportRows,
      filename: '배정 대기 교육 일정',
      selectedRowKeys: selectedWaitingKeys,
    })

  const handleUnassignClick = useCallback(() => {
    if (selectedAssignedKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setUnassignConfirmOpen(true)
  }, [selectedAssignedKeys.length, showAlert])

  const handleSelectAssignClick = useCallback(() => {
    if (!canAssignInstructor) {
      showAlert({
        title: '배정 실패',
        content: GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT_MESSAGE,
      })
      return
    }
    if (selectedWaitingKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    const movable = waitingSchedules.some(
      w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (!movable) return
    setSelectAssignConfirmOpen(true)
  }, [canAssignInstructor, selectedWaitingKeys, waitingSchedules, showAlert])

  const createAssignmentsFromWaiting = useCallback(
    async (
      selectedRows: ParticipatingIndividualInstructorWaitingScheduleRow[],
      notifyPayload?: PermissionModalPayload,
      /** 추가 배정 모달의 대표 강사 지정 — 미지정(선택 배정)이면 기존처럼 대표 미배정 시 대표로 */
      options?: { role?: InstructorRoleKey }
    ) => {
      if (!canAssignInstructor) {
        showAlert({
          title: '배정 실패',
          content: GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT_MESSAGE,
        })
        return false
      }
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
            instructorApplicationId: waitingRow.instructorApplicationId
              ? Number(waitingRow.instructorApplicationId)
              : instructor.instructorApplicationId
                ? Number(instructor.instructorApplicationId)
                : undefined,
            // 기관형 추가 배정(B)과 같은 규칙: 대표 강사 지정 + 기존 대표 없음일 때만 대표
            scheduleLead: options?.role ? !leadAssigned && options.role === 'lead' : !leadAssigned,
            ...assignmentNotify,
          })
          if (!options?.role || options.role === 'lead') leadAssigned = true
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
          getGeneralProgramApiErrorMessage(
            error,
            '배정에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          )
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
      canAssignInstructor,
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
    [selectedAssignedKeys, assignedSchedules, assignment, instructor.instructorName, showAlert]
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
    if (!addAssignWaitingRowId) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    const waitingRow = waitingSchedules.find(w => w.id === addAssignWaitingRowId)
    if (!waitingRow || waitingRow.assignmentStatus !== 'waiting') return
    setAddAssignModalOpen(false)
    setAddAssignNotifyOpen(true)
  }, [addAssignWaitingRowId, showAlert, waitingSchedules])

  const handleAddAssignConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!addAssignWaitingRowId) return
      const waitingRow = waitingSchedules.find(w => w.id === addAssignWaitingRowId)
      if (!waitingRow || waitingRow.assignmentStatus !== 'waiting') return
      const ok = await createAssignmentsFromWaiting([waitingRow], payload, { role: addAssignRole })
      if (!ok) return
      setAddAssignNotifyOpen(false)
      setAddAssignWaitingRowId(null)
    },
    [addAssignRole, addAssignWaitingRowId, waitingSchedules, createAssignmentsFromWaiting]
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

  /** 추가 배정 일정 칩 — 대기 테이블 전체(선택 불가 행은 비활성 칩) */
  const addAssignSessionOptions = useMemo(
    () =>
      buildAddAssignWaitingScheduleChipOptions(
        waitingSchedules.map(w => ({
          id: w.id,
          scheduleLabel: w.scheduleLabel,
          assignmentStatus: w.assignmentStatus,
          countLabel: w.assignedInstructorCountLabel,
          locationLabel: w.lectureLocation,
        }))
      ),
    [waitingSchedules]
  )
  const addAssignSelectedSessionIds = useMemo(
    () => (addAssignWaitingRowId ? [addAssignWaitingRowId] : []),
    [addAssignWaitingRowId]
  )
  const handleAddAssignSessionIdsChange = useCallback((ids: string[]) => {
    setAddAssignWaitingRowId(ids[0] ?? null)
  }, [])

  const unassignScheduleLabels = useMemo(
    () =>
      assignedSchedules.filter(r => selectedAssignedKeys.includes(r.id)).map(r => r.scheduleLabel),
    [assignedSchedules, selectedAssignedKeys]
  )

  /** 선택 배정 안내 — 첫 일정 + 외 N개 */
  const selectAssignTargets = useMemo(
    () =>
      waitingSchedules.filter(
        w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
      ),
    [waitingSchedules, selectedWaitingKeys]
  )

  const addAssignNotifyLabel = useMemo(() => {
    const waitingRow = waitingSchedules.find(w => w.id === addAssignWaitingRowId)
    return waitingRow?.scheduleLabel ?? ''
  }, [addAssignWaitingRowId, waitingSchedules])

  return (
    <div className="school-detail-fullpage-view__instructor-tab">
      {assignment.error ? (
        <div role="alert" className="school-detail-fullpage-view__assignment-error">
          {getGeneralProgramApiErrorMessage(
            assignment.error,
            '강사 배정 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          )}
        </div>
      ) : null}
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
              disabled={!canAssignInstructor || addAssignOptions.length === 0}
              onClick={() => {
                if (!canAssignInstructor) {
                  showAlert({
                    title: '배정 실패',
                    content: GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT_MESSAGE,
                  })
                  return
                }
                if (addAssignOptions.length === 0) return
                setAddAssignWaitingRowId(addAssignOptions[0]?.value ?? null)
                // 기존 자동 규칙(대표 없으면 대표)을 기본값으로 — 기관형 추가 배정과 동일
                setAddAssignRole(
                  assignedSchedules.some(row => row.role === 'lead') ? 'assistant' : 'lead'
                )
                setAddAssignModalOpen(true)
              }}
            >
              추가 배정
            </CmsButton>
            <ExcelButton onClick={exportAssignedExcel} loading={isAssignedExcelExporting} />
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap school-detail-fullpage-view__assignment-table-scroll">
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
            <CmsButton
              variant="secondary"
              size="h40"
              disabled={!canAssignInstructor}
              onClick={handleSelectAssignClick}
            >
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
            rowClassName={record => getProgramAssignmentRowClass(record.assignmentStatus, "instructor-individual")}
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

      {/* 선택 배정 안내 — 공통 모달(알림은 기관형 선택 배정과 같은 기본값) */}
      <InstitutionSelectAssignConfirmModal
        open={selectAssignConfirmOpen}
        onCancel={() => {
          if (assignSubmitting) return
          setSelectAssignConfirmOpen(false)
        }}
        onConfirm={() => {
          void handleSelectAssignConfirm(INSTITUTION_SELECT_ASSIGN_DEFAULT_NOTIFY_PAYLOAD)
        }}
        confirmLoading={assignSubmitting}
        targetNoun="일정"
        institutionName={
          selectAssignTargets[0]
            ? formatCmsScheduleDisplayLabel(selectAssignTargets[0].scheduleLabel)
            : ''
        }
        extraTargetCount={Math.max(0, selectAssignTargets.length - 1)}
        instructorName={instructor.instructorName}
        currentCount={null}
        requiredCount={null}
        countLabel={selectAssignTargets[0]?.assignedInstructorCountLabel ?? null}
      />

      <GeneralParticipantAddAssignModal
        open={addAssignModalOpen}
        onCancel={() => {
          setAddAssignModalOpen(false)
          setAddAssignWaitingRowId(null)
        }}
        title={ADD_ASSIGN_MODAL_TITLE}
        description={`**[${instructor.instructorName}]** 님을 추가 배정할 일정을 선택해 주세요.`}
        onConfirm={handleAddAssignSchedulePicked}
        role={{ value: addAssignRole, onChange: setAddAssignRole }}
        sessions={{
          label: '교육 배정일 선택',
          options: addAssignSessionOptions,
          value: addAssignSelectedSessionIds,
          onChange: handleAddAssignSessionIdsChange,
          selectionMode: 'single',
        }}
      />
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
