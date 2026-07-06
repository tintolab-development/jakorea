/**
 * 참여 강사 상세 — 교육 배정 현황 탭 (일반 프로그램 · 개인)
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { Table, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import { MOCK_PARTICIPATING_INSTRUCTORS } from '@/data/mock/participating-instructors'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import { MOCK_PARTICIPATING_SCHOOLS } from '@/data/mock/participating-schools'
import {
  INSTRUCTOR_ASSIGN_SELECT_SCHOOL_ALERT_MESSAGE,
  INSTRUCTOR_ASSIGN_UNASSIGN_SELECT_SCHOOL_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { ContentModal } from '@/shared/ui/content-modal'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
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
import { PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH } from '@/features/program/general/lib/participating-institutions-table'
import {
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_ASSIGNED_SCHEDULE_EXCEL_COLUMNS,
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_WAITING_SCHEDULE_EXCEL_COLUMNS,
} from '@/features/program/general/lib/participating-individual-instructor-assignment-export'
import {
  buildIndividualInstructorWaitingScheduleRows,
  buildInitialIndividualInstructorAssignedScheduleRows,
  buildOccupiedHopeSlotKeys,
  createIndividualWaitingRowFromAssigned,
  individualWaitingRowToAssignedRow,
  renumberIndividualAssignedScheduleRows,
  renumberIndividualWaitingScheduleRows,
} from '@/features/program/general/lib/participating-individual-instructor-assignment-mock'
import type {
  ParticipatingIndividualInstructorAssignedScheduleRow,
  ParticipatingIndividualInstructorWaitingScheduleRow,
} from '@/features/program/general/lib/participating-individual-instructor-assignment-types'
import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from '@/features/program/general/lib/waiting-instructor-assignment'
import { SchoolDetailUnassignCompleteModal } from './school-detail-unassign-complete-modal'
import { SchoolDetailUnassignConfirmModal } from './school-detail-unassign-confirm-modal'
import './instructor-assignment-status-text.css'
import './participating-individual-instructor-assignment-section.css'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'

const ASSIGNED_EMPTY_TEXT = '배정된 일정이 없습니다.'
const WAITING_EMPTY_TEXT = '배정 대기 중인 일정이 없습니다.'

function renderScheduleCell(label: string) {
  return (
    <div className="participating-individual-instructor-assignment-section__schedule-cell">
      {renderProgramDetailPipeSeparated(label)}
    </div>
  )
}

function renderTableEmpty(text: string) {
  return (
    <div
      className="participating-individual-instructor-assignment-section__table-empty"
      role="status"
    >
      {text}
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
  schoolRows: _schoolRows = MOCK_PARTICIPATING_SCHOOLS,
  instructorList: _instructorList = MOCK_PARTICIPATING_INSTRUCTORS,
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
  const [addAssignWaitingRowId, setAddAssignWaitingRowId] = useState<string | null>(null)

  useEffect(() => {
    const assigned = buildInitialIndividualInstructorAssignedScheduleRows(instructor, program)
    setAssignedSchedules(assigned)
    setWaitingSchedules(buildIndividualInstructorWaitingScheduleRows(instructor, program, assigned))
    setSelectedAssignedKeys([])
    setSelectedWaitingKeys([])
    setOpenRoleDropdownId(null)
  }, [instructor.id, program.id, program])

  const handleRoleChange = useCallback((rowId: string, newRole: InstructorRoleKey) => {
    setAssignedSchedules(prev => {
      const target = prev.find(row => row.id === rowId)
      if (!target) return prev

      const updated = prev.map(row => {
        if (row.id === rowId) {
          return { ...row, role: newRole }
        }
        if (newRole === 'lead' && row.slotKey === target.slotKey && row.role === 'lead') {
          return { ...row, role: 'assistant' as InstructorRoleKey }
        }
        return row
      })
      return renumberIndividualAssignedScheduleRows(updated)
    })
    setOpenRoleDropdownId(null)
  }, [])

  const assignedColumns: ColumnsType<ParticipatingIndividualInstructorAssignedScheduleRow> =
    useMemo(
      () => [
        { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
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
          className: 'participating-institutions-section__th-sessions',
          onHeaderCell: () => ({
            className: 'participating-institutions-section__th-sessions',
          }),
          onCell: () => ({ className: 'participating-institutions-section__td-sessions' }),
          render: (label: string) => renderScheduleCell(label),
        },
      ],
      [handleRoleChange, openRoleDropdownId]
    )

  const waitingColumns: ColumnsType<ParticipatingIndividualInstructorWaitingScheduleRow> =
    useMemo(
      () => [
        { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
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
          className: 'participating-institutions-section__th-sessions',
          onHeaderCell: () => ({
            className: 'participating-institutions-section__th-sessions',
          }),
          onCell: () => ({ className: 'participating-institutions-section__td-sessions' }),
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
    })

  const { exportExcel: exportWaitingExcel, isExporting: isWaitingExcelExporting } =
    useTableExcelExport({
      columns: PARTICIPATING_INDIVIDUAL_INSTRUCTOR_WAITING_SCHEDULE_EXCEL_COLUMNS,
      data: waitingExportRows,
      filename: '배정 대기 교육 일정',
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

  const handleUnassignConfirm = useCallback(
    (payload: PermissionModalPayload) => {
      if (selectedAssignedKeys.length === 0) return

      const removedRows = assignedSchedules.filter(r => selectedAssignedKeys.includes(r.id))
      const removedLabels = removedRows.map(r => r.scheduleLabel)
      const toRemove = new Set(selectedAssignedKeys.map(String))

      setAssignedSchedules(prev =>
        renumberIndividualAssignedScheduleRows(prev.filter(r => !toRemove.has(r.id)))
      )

      setWaitingSchedules(prev => {
        const remainingAssigned = assignedSchedules.filter(r => !toRemove.has(r.id))
        const occupiedHopeSlots = buildOccupiedHopeSlotKeys(remainingAssigned)
        const added = removedRows.map((row, idx) =>
          createIndividualWaitingRowFromAssigned(row, prev.length + idx + 1, program, occupiedHopeSlots)
        )
        return renumberIndividualWaitingScheduleRows([...prev, ...added])
      })

      setUnassignConfirmOpen(false)
      setSelectedAssignedKeys([])
      setUnassignCompleteModal({
        instructorNames: [instructor.instructorName],
        targetNames: removedLabels,
        reason: payload.reason,
      })
    },
    [selectedAssignedKeys, assignedSchedules, instructor.instructorName, program]
  )

  const handleSelectAssignConfirm = useCallback(() => {
    const selectedRows = waitingSchedules.filter(
      w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (selectedRows.length === 0) return

    const ids = new Set(selectedRows.map(r => r.id))
    setWaitingSchedules(prev => renumberIndividualWaitingScheduleRows(prev.filter(w => !ids.has(w.id))))

    setAssignedSchedules(prev => {
      const next = [...prev]
      let idx = next.length
      for (const waitingRow of selectedRows) {
        const hasLeadAtSlot = next.some(r => r.slotKey === waitingRow.slotKey && r.role === 'lead')
        const role: InstructorRoleKey = hasLeadAtSlot ? 'assistant' : 'lead'
        next.push(individualWaitingRowToAssignedRow(waitingRow, role, 0, program))
        idx += 1
      }
      return renumberIndividualAssignedScheduleRows(next)
    })

    setSelectAssignConfirmOpen(false)
    setSelectedWaitingKeys([])
  }, [selectedWaitingKeys, waitingSchedules, program])

  const handleAddAssignConfirm = useCallback(() => {
    if (!addAssignWaitingRowId) return
    const waitingRow = waitingSchedules.find(w => w.id === addAssignWaitingRowId)
    if (!waitingRow || waitingRow.assignmentStatus !== 'waiting') return

    setWaitingSchedules(prev =>
      renumberIndividualWaitingScheduleRows(prev.filter(w => w.id !== addAssignWaitingRowId))
    )

    setAssignedSchedules(prev => {
      if (prev.some(r => r.slotKey === waitingRow.slotKey)) return prev
      const hasLeadAtSlot = prev.some(r => r.slotKey === waitingRow.slotKey && r.role === 'lead')
      const role: InstructorRoleKey = hasLeadAtSlot ? 'assistant' : 'lead'
      const next = [
        ...prev,
        individualWaitingRowToAssignedRow(waitingRow, role, prev.length, program),
      ]
      return renumberIndividualAssignedScheduleRows(next)
    })

    setAddAssignModalOpen(false)
    setAddAssignWaitingRowId(null)
  }, [addAssignWaitingRowId, waitingSchedules, program])

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

  return (
    <div className="participating-individual-instructor-assignment-section school-detail-fullpage-view__instructor-tab">
      <div className="school-detail-fullpage-view__instructor-section">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">배정된 교육 일정</span>
            <span className="table-description">{assignedSchedules.length}건</span>
          </div>
          <div className="info-section-buttons--wrapper">
            <CmsButton variant="delete" size="large" onClick={handleUnassignClick}>
              배정 취소
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="large"
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
          <Table<ParticipatingIndividualInstructorAssignedScheduleRow>
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
            locale={{ emptyText: renderTableEmpty(ASSIGNED_EMPTY_TEXT) }}
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
            <CmsButton variant="secondary" size="large" onClick={handleSelectAssignClick}>
              선택 배정
            </CmsButton>
            <ExcelButton onClick={exportWaitingExcel} loading={isWaitingExcelExporting} />
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap participating-individual-instructor-assignment-section__table-scroll">
          <Table<ParticipatingIndividualInstructorWaitingScheduleRow>
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
            locale={{ emptyText: renderTableEmpty(WAITING_EMPTY_TEXT) }}
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

      <ContentModal
        open={selectAssignConfirmOpen}
        onCancel={() => setSelectAssignConfirmOpen(false)}
        title="교육 일정 배정 안내"
        width={560}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="large"
              onClick={() => setSelectAssignConfirmOpen(false)}
            >
              취소
            </CmsButton>
            <CmsButton variant="primary" size="large" onClick={handleSelectAssignConfirm}>
              배정
            </CmsButton>
          </>
        }
      >
        <p>
          [<strong>{instructor.instructorName}</strong>] 강사님을 다음 교육 일정에 배정하시겠습니까?{' '}
          {selectAssignLabels.map((label, i) => (
            <span key={`${label}-${i}`}>
              [<strong>{label}</strong>]{i < selectAssignLabels.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      </ContentModal>

      <ContentModal
        open={addAssignModalOpen}
        onCancel={() => {
          setAddAssignModalOpen(false)
          setAddAssignWaitingRowId(null)
        }}
        title="추가 배정"
        width={480}
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
            <CmsButton variant="primary" size="large" onClick={handleAddAssignConfirm}>
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
    </div>
  )
}
