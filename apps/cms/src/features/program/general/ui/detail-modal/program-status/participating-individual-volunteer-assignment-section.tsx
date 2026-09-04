/**
 * 참여 봉사자 상세 — 봉사 배정 현황 탭 (일반 프로그램 · 개인)
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { Table, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import {
  VOLUNTEER_ASSIGN_SELECT_SCHOOL_ALERT_MESSAGE,
  VOLUNTEER_ASSIGN_UNASSIGN_SELECT_SCHOOL_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { ContentModal } from '@/shared/ui/content-modal'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH } from '@/features/program/general/lib/participating-institutions-table'
import {
  PARTICIPATING_INDIVIDUAL_VOLUNTEER_ASSIGNED_SCHEDULE_EXCEL_COLUMNS,
  PARTICIPATING_INDIVIDUAL_VOLUNTEER_WAITING_SCHEDULE_EXCEL_COLUMNS,
} from '@/features/program/general/lib/participating-individual-volunteer-assignment-export'
import {
  buildIndividualVolunteerWaitingScheduleRows,
  buildInitialIndividualVolunteerAssignedScheduleRows,
  buildOccupiedVolunteerHopeSlotKeys,
  createIndividualVolunteerWaitingRowFromAssigned,
  individualVolunteerWaitingRowToAssignedRow,
  renumberIndividualVolunteerAssignedScheduleRows,
  renumberIndividualVolunteerWaitingScheduleRows,
} from '@/features/program/general/lib/participating-individual-volunteer-assignment-mock'
import type {
  ParticipatingIndividualVolunteerAssignedScheduleRow,
  ParticipatingIndividualVolunteerWaitingScheduleRow,
} from '@/features/program/general/lib/participating-individual-volunteer-assignment-types'
import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from '@/features/program/general/lib/waiting-instructor-assignment'
import { ParticipatingVolunteerUnassignConfirmModal } from './participating-volunteer-unassign-confirm-modal'
import { ParticipatingVolunteerUnassignCompleteModal } from './participating-volunteer-unassign-complete-modal'
import './instructor-assignment-status-text.css'
import './participating-individual-volunteer-assignment-section.css'

const ASSIGNED_EMPTY_TEXT = '배정된 봉사 일정이 없습니다.'
const WAITING_EMPTY_TEXT = '배정 대기 중인 봉사 일정이 없습니다.'

function renderScheduleCell(label: string) {
  return (
    <div className="participating-individual-volunteer-assignment-section__schedule-cell">
      {renderProgramDetailPipeSeparated(label)}
    </div>
  )
}

function renderTableEmpty(text: string) {
  return (
    <div
      className="participating-individual-volunteer-assignment-section__table-empty"
      role="status"
    >
      {text}
    </div>
  )
}

export interface ParticipatingIndividualVolunteerAssignmentSectionProps {
  program: Program
  volunteer: ParticipatingVolunteerRow
}

export function ParticipatingIndividualVolunteerAssignmentSection({
  program,
  volunteer,
}: ParticipatingIndividualVolunteerAssignmentSectionProps) {
  const { showAlert } = useCmsAlert()
  const [assignedSchedules, setAssignedSchedules] = useState<
    ParticipatingIndividualVolunteerAssignedScheduleRow[]
  >([])
  const [waitingSchedules, setWaitingSchedules] = useState<
    ParticipatingIndividualVolunteerWaitingScheduleRow[]
  >([])
  const [selectedAssignedKeys, setSelectedAssignedKeys] = useState<Key[]>([])
  const [selectedWaitingKeys, setSelectedWaitingKeys] = useState<Key[]>([])
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false)
  const [unassignCompleteModal, setUnassignCompleteModal] = useState<{
    volunteerNames: string[]
    targetNames: string[]
    reason: string
  } | null>(null)
  const [selectAssignConfirmOpen, setSelectAssignConfirmOpen] = useState(false)
  const [addAssignModalOpen, setAddAssignModalOpen] = useState(false)
  const [addAssignWaitingRowId, setAddAssignWaitingRowId] = useState<string | null>(null)

  useEffect(() => {
    const assigned = buildInitialIndividualVolunteerAssignedScheduleRows(volunteer, program)
    setAssignedSchedules(assigned)
    setWaitingSchedules(buildIndividualVolunteerWaitingScheduleRows(volunteer, program, assigned))
    setSelectedAssignedKeys([])
    setSelectedWaitingKeys([])
  }, [volunteer.id, program.id, program, volunteer])

  const assignedColumns: ColumnsType<ParticipatingIndividualVolunteerAssignedScheduleRow> =
    useMemo(
      () => [
        { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
        {
          title: '담당 봉사 진행 일정',
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
      []
    )

  const waitingColumns: ColumnsType<ParticipatingIndividualVolunteerWaitingScheduleRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '봉사 진행 희망 일정',
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
        render: (status: ParticipatingIndividualVolunteerWaitingScheduleRow['assignmentStatus']) => (
          <span
            className={`school-detail-fullpage-view__assignment-status school-detail-fullpage-view__assignment-status--${status === 'unavailable' ? 'cancelled' : status}`}
          >
            {WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[status]}
          </span>
        ),
      },
      {
        title: '배정 봉사자 수',
        dataIndex: 'assignedVolunteerCountLabel',
        key: 'assignedVolunteerCountLabel',
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
        scheduleLabel: row.scheduleLabel,
      })),
    [assignedSchedules]
  )

  const waitingExportRows = useMemo(
    () =>
      waitingSchedules.map(row => ({
        no: row.no,
        scheduleLabel: row.scheduleLabel,
        assignmentStatus: WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[row.assignmentStatus],
        assignedVolunteerCountLabel: row.assignedVolunteerCountLabel,
      })),
    [waitingSchedules]
  )

  const { exportExcel: exportAssignedExcel, isExporting: isAssignedExcelExporting } =
    useTableExcelExport({
      columns: PARTICIPATING_INDIVIDUAL_VOLUNTEER_ASSIGNED_SCHEDULE_EXCEL_COLUMNS,
      data: assignedExportRows,
      filename: '배정된 봉사 일정',
    })

  const { exportExcel: exportWaitingExcel, isExporting: isWaitingExcelExporting } =
    useTableExcelExport({
      columns: PARTICIPATING_INDIVIDUAL_VOLUNTEER_WAITING_SCHEDULE_EXCEL_COLUMNS,
      data: waitingExportRows,
      filename: '배정 대기 봉사 일정',
    })

  const handleUnassignClick = useCallback(() => {
    if (selectedAssignedKeys.length === 0) {
      showAlert({ title: '안내', content: VOLUNTEER_ASSIGN_UNASSIGN_SELECT_SCHOOL_ALERT_MESSAGE })
      return
    }
    setUnassignConfirmOpen(true)
  }, [selectedAssignedKeys.length, showAlert])

  const handleSelectAssignClick = useCallback(() => {
    if (selectedWaitingKeys.length === 0) {
      showAlert({ title: '안내', content: VOLUNTEER_ASSIGN_SELECT_SCHOOL_ALERT_MESSAGE })
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
      const removedSlotKeys = new Set(removedRows.map(r => r.slotKey))
      const toRemove = new Set(selectedAssignedKeys.map(String))

      setAssignedSchedules(prev =>
        renumberIndividualVolunteerAssignedScheduleRows(prev.filter(r => !toRemove.has(r.id)))
      )
      setWaitingSchedules(prev => {
        const occupiedHopeSlots = buildOccupiedVolunteerHopeSlotKeys(
          assignedSchedules.filter(r => !toRemove.has(r.id))
        )
        const restored = removedRows.map((row, idx) =>
          createIndividualVolunteerWaitingRowFromAssigned(row, idx + 1, occupiedHopeSlots)
        )
        const next = prev.filter(w => !removedSlotKeys.has(w.slotKey))
        return renumberIndividualVolunteerWaitingScheduleRows([...restored, ...next])
      })
      setUnassignConfirmOpen(false)
      setSelectedAssignedKeys([])
      setUnassignCompleteModal({
        volunteerNames: [volunteer.volunteerName],
        targetNames: removedLabels,
        reason: payload.reason,
      })
    },
    [selectedAssignedKeys, assignedSchedules, volunteer.volunteerName]
  )

  const handleSelectAssignConfirm = useCallback(() => {
    const selectedRows = waitingSchedules.filter(
      w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (selectedRows.length === 0) return

    const ids = new Set(selectedRows.map(r => r.id))
    setWaitingSchedules(prev =>
      renumberIndividualVolunteerWaitingScheduleRows(prev.filter(w => !ids.has(w.id)))
    )

    setAssignedSchedules(prev => {
      const existingSlotKeys = new Set(prev.map(r => r.slotKey))
      const next = [...prev]
      let idx = next.length
      for (const waitingRow of selectedRows) {
        if (existingSlotKeys.has(waitingRow.slotKey)) continue
        next.push(individualVolunteerWaitingRowToAssignedRow(waitingRow, 0))
        existingSlotKeys.add(waitingRow.slotKey)
        idx += 1
      }
      return renumberIndividualVolunteerAssignedScheduleRows(next)
    })

    setSelectAssignConfirmOpen(false)
    setSelectedWaitingKeys([])
  }, [selectedWaitingKeys, waitingSchedules])

  const handleAddAssignConfirm = useCallback(() => {
    if (!addAssignWaitingRowId) return
    const waitingRow = waitingSchedules.find(w => w.id === addAssignWaitingRowId)
    if (!waitingRow || waitingRow.assignmentStatus !== 'waiting') return

    setWaitingSchedules(prev =>
      renumberIndividualVolunteerWaitingScheduleRows(prev.filter(w => w.id !== addAssignWaitingRowId))
    )
    setAssignedSchedules(prev => {
      if (prev.some(r => r.slotKey === waitingRow.slotKey)) return prev
      const next = [
        ...prev,
        individualVolunteerWaitingRowToAssignedRow(waitingRow, 0),
      ]
      return renumberIndividualVolunteerAssignedScheduleRows(next)
    })
    setAddAssignModalOpen(false)
    setAddAssignWaitingRowId(null)
  }, [addAssignWaitingRowId, waitingSchedules])

  const addAssignOptions = useMemo(
    () =>
      waitingSchedules
        .filter(w => w.assignmentStatus === 'waiting')
        .map(w => ({
          value: w.id,
          label: w.scheduleLabel,
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
    <div className="participating-individual-volunteer-assignment-section school-detail-fullpage-view__instructor-tab">
      <div className="school-detail-fullpage-view__instructor-section">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">배정된 봉사 일정</span>
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
          <Table<ParticipatingIndividualVolunteerAssignedScheduleRow>
            className="participating-institutions-section__table cms-data-table"
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 720 }}
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
            <span className="table-title">배정 대기 봉사 일정</span>
            <span className="table-description">{waitingSchedules.length}건</span>
          </div>
          <div className="info-section-buttons--wrapper">
            <CmsButton variant="secondary" size="large" onClick={handleSelectAssignClick}>
              선택 배정
            </CmsButton>
            <ExcelButton onClick={exportWaitingExcel} loading={isWaitingExcelExporting} />
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap participating-individual-volunteer-assignment-section__table-scroll">
          <Table<ParticipatingIndividualVolunteerWaitingScheduleRow>
            className="participating-institutions-section__table cms-data-table"
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 900 }}
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

      <ParticipatingVolunteerUnassignConfirmModal
        open={unassignConfirmOpen}
        onCancel={() => setUnassignConfirmOpen(false)}
        volunteerNames={[volunteer.volunteerName]}
        targetNames={unassignScheduleLabels}
        onConfirm={handleUnassignConfirm}
      />
      <ParticipatingVolunteerUnassignCompleteModal
        open={unassignCompleteModal != null}
        onClose={() => setUnassignCompleteModal(null)}
        volunteerNames={unassignCompleteModal?.volunteerNames ?? []}
        targetNames={unassignCompleteModal?.targetNames ?? []}
        reason={unassignCompleteModal?.reason ?? ''}
      />

      <ContentModal
        open={selectAssignConfirmOpen}
        onCancel={() => setSelectAssignConfirmOpen(false)}
        title="봉사 일정 배정 안내"
        width={600}
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
          [<strong>{volunteer.volunteerName}</strong>] 봉사자님을 다음 봉사 일정에 배정하시겠습니까?{' '}
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
            <CmsButton variant="primary" size="large" onClick={handleAddAssignConfirm}>
              배정
            </CmsButton>
          </>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{ display: 'block', marginBottom: 8 }}>봉사 일정 선택</span>
          <Select
            style={{ width: '100%' }}
            placeholder="배정할 봉사 일정을 선택하세요"
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
