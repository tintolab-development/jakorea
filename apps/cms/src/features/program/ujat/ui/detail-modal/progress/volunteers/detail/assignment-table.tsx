import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton } from '@/shared/ui'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { useCmsAlert } from '@/shared/ui'
import { STATUS_DROPDOWN_CELL_TAG_160_HEADER_CLASSNAME } from '@/shared/components/status-dropdown-cell'
import {
  UjatVolunteerAssignmentRoleCell,
  UJAT_VOLUNTEER_ASSIGNMENT_ROLE_CELL_CLASSNAME,
} from './assignment-role-cell'
import { sortVolunteerAssignmentRows } from './assignment-mock'
import {
  isVolunteerAssignmentClassWithdrawn,
  type UjatVolunteerAssignmentProgressRow,
  type UjatVolunteerAttendanceDisplay,
  type UjatVolunteerClassDisplay,
  type UjatVolunteerAssignedInstitutionDisplay,
  type UjatVolunteerPartnerDisplay,
  type UjatVolunteerScheduleRole,
} from './assignment-types'
import './assignment.css'

const PLAN_LOG_CELL_CLASSNAME = 'ujat-volunteer-assignment-table__plan-log-cell'

function renderPlanLogViewButton(
  label: string,
  enabled: boolean,
  onView: () => void
) {
  return (
    <div className="ujat-volunteer-assignment-table__plan-log-cell-inner">
      <CmsButton
        type="button"
        variant="default"
        size="medium"
        width={140}
        disabled={!enabled}
        onClick={enabled ? onView : undefined}
      >
        {label}
      </CmsButton>
    </div>
  )
}

function isPlanLogViewEnabled(row: UjatVolunteerAssignmentProgressRow): boolean {
  if (row.isWithdrawn) return false
  if (row.classDisplay.kind === 'dash' || row.classDisplay.kind === 'withdrawn') return false
  if (row.educationProgress === 'scheduled' || row.educationProgress === 'dash') return false
  return true
}

function renderAssignedInstitution(institution: UjatVolunteerAssignedInstitutionDisplay) {
  if (institution.kind === 'dash') {
    return <span className="ujat-volunteer-assignment-table__dash">-</span>
  }
  return institution.value
}

function renderPartner(partner: UjatVolunteerPartnerDisplay) {
  if (partner.kind === 'dash') {
    return <span className="ujat-volunteer-assignment-table__dash">-</span>
  }
  if (partner.kind === 'undecided') {
    return <span className="ujat-volunteer-assignment-table__partner-undecided">미정</span>
  }
  return partner.value
}

function renderClass(classDisplay: UjatVolunteerClassDisplay) {
  if (classDisplay.kind === 'dash') {
    return <span className="ujat-volunteer-assignment-table__dash">-</span>
  }
  if (classDisplay.kind === 'withdrawn') {
    return <span className="ujat-volunteer-assignment-table__class-withdrawn">활동 포기</span>
  }
  return classDisplay.label
}

function renderAttendance(attendance: UjatVolunteerAttendanceDisplay) {
  if (attendance.kind === 'dash') {
    return <span className="ujat-volunteer-assignment-table__dash">-</span>
  }
  if (attendance.kind === 'late') {
    return (
      <span className="ujat-volunteer-assignment-table__attendance-late">
        지각 ({attendance.time})
      </span>
    )
  }
  if (attendance.kind === 'excused_absence') {
    return (
      <span className="ujat-volunteer-assignment-table__attendance-excused">사유 불참</span>
    )
  }
  return '출석'
}

function renderEducationProgress(status: UjatVolunteerAssignmentProgressRow['educationProgress']) {
  if (status === 'dash') return <span className="ujat-volunteer-assignment-table__dash">-</span>
  if (status === 'completed') return '교육 완료'
  return '교육 예정'
}

export function UjatEducationProgressVolunteerAssignmentTable({
  initialRows,
  selectedRowKeys: selectedRowKeysProp,
  onSelectedRowKeysChange,
}: {
  initialRows: UjatVolunteerAssignmentProgressRow[]
  selectedRowKeys?: Key[]
  onSelectedRowKeysChange?: (keys: Key[]) => void
}) {
  const { showAlert } = useCmsAlert()
  const [rows, setRows] = useState(() => sortVolunteerAssignmentRows(initialRows))
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<Key[]>([])
  const [openRoleDropdownRowId, setOpenRoleDropdownRowId] = useState<string | null>(null)

  const selectedRowKeys = selectedRowKeysProp ?? internalSelectedRowKeys
  const setSelectedRowKeys = onSelectedRowKeysChange ?? setInternalSelectedRowKeys

  useEffect(() => {
    setRows(sortVolunteerAssignmentRows(initialRows))
    setSelectedRowKeys([])
    setOpenRoleDropdownRowId(null)
  }, [initialRows, setSelectedRowKeys])

  const tableData = useMemo(
    () => rows.map((row, index) => ({ ...row, no: index + 1 })),
    [rows]
  )

  const showComingSoon = useCallback(() => {
    showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })
  }, [showAlert])

  const handleRoleChange = useCallback((rowId: string, nextRole: UjatVolunteerScheduleRole) => {
    setRows(prev => {
      const sorted = sortVolunteerAssignmentRows(
        prev.map(row => {
          if (row.isWithdrawn) return row
          if (nextRole === 'attendance_manager') {
            return { ...row, role: row.id === rowId ? 'attendance_manager' : 'none' }
          }
          if (row.id === rowId) {
            return { ...row, role: nextRole }
          }
          return row
        })
      )
      return sorted
    })
    setOpenRoleDropdownRowId(null)
  }, [])

  const columns: ColumnsType<UjatVolunteerAssignmentProgressRow & { no: number }> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      {
        title: '교육 진행 일정',
        dataIndex: 'scheduleLabel',
        key: 'scheduleLabel',
        width: 160,
        align: 'center',
      },
      {
        title: '역할',
        dataIndex: 'role',
        key: 'role',
        width: 160,
        align: 'center',
        onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_160_HEADER_CLASSNAME }),
        onCell: () => ({
          className: UJAT_VOLUNTEER_ASSIGNMENT_ROLE_CELL_CLASSNAME,
        }),
        render: (role: UjatVolunteerScheduleRole, record: UjatVolunteerAssignmentProgressRow) => (
          <div className="ujat-volunteer-assignment-role-cell__center">
            <UjatVolunteerAssignmentRoleCell
              role={role}
              disabled={isVolunteerAssignmentClassWithdrawn(record)}
              isOpen={openRoleDropdownRowId === record.id}
              onOpenChange={open => setOpenRoleDropdownRowId(open ? record.id : null)}
              onChange={next => handleRoleChange(record.id, next)}
            />
          </div>
        ),
      },
      {
        title: '배정 기관',
        dataIndex: 'assignedInstitution',
        key: 'assignedInstitution',
        width: 140,
        align: 'center',
        render: (institution: UjatVolunteerAssignedInstitutionDisplay) =>
          renderAssignedInstitution(institution),
      },
      {
        title: '파트너명',
        dataIndex: 'partner',
        key: 'partner',
        width: 120,
        align: 'center',
        render: (partner: UjatVolunteerPartnerDisplay) => renderPartner(partner),
      },
      {
        title: '배정 학급',
        dataIndex: 'classDisplay',
        key: 'classDisplay',
        width: 120,
        align: 'center',
        render: (classDisplay: UjatVolunteerClassDisplay) => renderClass(classDisplay),
      },
      {
        title: '출결 현황',
        dataIndex: 'attendance',
        key: 'attendance',
        width: 140,
        align: 'center',
        render: (attendance: UjatVolunteerAttendanceDisplay) => renderAttendance(attendance),
      },
      {
        title: '교육계획서 제출 현황',
        key: 'educationPlan',
        width: 168,
        align: 'center',
        onHeaderCell: () => ({ className: PLAN_LOG_CELL_CLASSNAME }),
        onCell: () => ({ className: PLAN_LOG_CELL_CLASSNAME }),
        render: (_: unknown, record: UjatVolunteerAssignmentProgressRow) => {
          const enabled = isPlanLogViewEnabled(record) && record.educationPlanSubmitted
          return renderPlanLogViewButton('교육계획서 보기', enabled, showComingSoon)
        },
      },
      {
        title: '교육일지 제출 현황',
        key: 'educationLog',
        width: 168,
        align: 'center',
        onHeaderCell: () => ({ className: PLAN_LOG_CELL_CLASSNAME }),
        onCell: () => ({ className: PLAN_LOG_CELL_CLASSNAME }),
        render: (_: unknown, record: UjatVolunteerAssignmentProgressRow) => {
          const enabled = isPlanLogViewEnabled(record) && record.educationLogSubmitted
          return renderPlanLogViewButton('교육일지 보기', enabled, showComingSoon)
        },
      },
      {
        title: '교육 진행 현황',
        dataIndex: 'educationProgress',
        key: 'educationProgress',
        width: 120,
        align: 'center',
        render: (status: UjatVolunteerAssignmentProgressRow['educationProgress']) =>
          renderEducationProgress(status),
      },
    ],
    [handleRoleChange, openRoleDropdownRowId, showComingSoon]
  )

  return (
    <div className="ujat-volunteer-assignment-table">
      <Table<UjatVolunteerAssignmentProgressRow & { no: number }>
        rowKey="id"
        className="cms-data-table ujat-volunteer-assignment-table__table"
        columns={columns}
        dataSource={tableData}
        pagination={false}
        tableLayout="fixed"
        scroll={{ x: 1340 }}
        rowSelection={{
          selectedRowKeys,
          onChange: keys => setSelectedRowKeys(keys),
          getCheckboxProps: record => ({
            disabled: isVolunteerAssignmentClassWithdrawn(record),
          }),
        }}
        onRow={record => ({
          className: isVolunteerAssignmentClassWithdrawn(record)
            ? 'ujat-volunteer-assignment-table__row--class-withdrawn'
            : undefined,
        })}
      />
    </div>
  )
}
