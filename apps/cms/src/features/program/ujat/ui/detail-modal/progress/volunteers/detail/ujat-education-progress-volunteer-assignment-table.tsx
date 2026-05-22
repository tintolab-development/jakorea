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
} from './ujat-education-progress-volunteer-assignment-role-cell'
import { sortVolunteerAssignmentRows } from './ujat-education-progress-volunteer-assignment-mock'
import type {
  UjatVolunteerAssignmentProgressRow,
  UjatVolunteerAttendanceDisplay,
  UjatVolunteerClassDisplay,
  UjatVolunteerPartnerDisplay,
  UjatVolunteerScheduleRole,
} from './ujat-education-progress-volunteer-assignment-types'
import './ujat-education-progress-volunteer-assignment.css'

function isPlanLogViewEnabled(row: UjatVolunteerAssignmentProgressRow): boolean {
  if (row.isWithdrawn) return false
  if (row.classDisplay.kind === 'dash' || row.classDisplay.kind === 'withdrawn') return false
  if (row.educationProgress === 'scheduled' || row.educationProgress === 'dash') return false
  return true
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
}: {
  initialRows: UjatVolunteerAssignmentProgressRow[]
}) {
  const { showAlert } = useCmsAlert()
  const [rows, setRows] = useState(() => sortVolunteerAssignmentRows(initialRows))
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [openRoleDropdownRowId, setOpenRoleDropdownRowId] = useState<string | null>(null)

  useEffect(() => {
    setRows(sortVolunteerAssignmentRows(initialRows))
    setSelectedRowKeys([])
    setOpenRoleDropdownRowId(null)
  }, [initialRows])

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
          <UjatVolunteerAssignmentRoleCell
            role={role}
            disabled={record.isWithdrawn}
            isOpen={openRoleDropdownRowId === record.id}
            onOpenChange={open => setOpenRoleDropdownRowId(open ? record.id : null)}
            onChange={next => handleRoleChange(record.id, next)}
          />
        ),
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
        width: 160,
        align: 'center',
        render: (_: unknown, record: UjatVolunteerAssignmentProgressRow) => {
          const enabled = isPlanLogViewEnabled(record) && record.educationPlanSubmitted
          return (
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={120}
              disabled={!enabled}
              onClick={enabled ? showComingSoon : undefined}
            >
              교육계획서 보기
            </CmsButton>
          )
        },
      },
      {
        title: '교육일지 제출 현황',
        key: 'educationLog',
        width: 160,
        align: 'center',
        render: (_: unknown, record: UjatVolunteerAssignmentProgressRow) => {
          const enabled = isPlanLogViewEnabled(record) && record.educationLogSubmitted
          return (
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={120}
              disabled={!enabled}
              onClick={enabled ? showComingSoon : undefined}
            >
              교육일지 보기
            </CmsButton>
          )
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
        scroll={{ x: 1200 }}
        rowSelection={{
          selectedRowKeys,
          onChange: keys => setSelectedRowKeys(keys),
          getCheckboxProps: record => ({
            disabled: record.isWithdrawn,
          }),
        }}
        onRow={record => ({
          className: record.isWithdrawn
            ? 'ujat-volunteer-assignment-table__row--withdrawn'
            : undefined,
        })}
      />
    </div>
  )
}
