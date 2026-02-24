/**
 * 교사 회원 상세 모달 — 프로그램 강의 이력 탭
 */

import { useState, useCallback, useMemo } from 'react'
import { Table, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  type TeachingHistoryRow,
  type TeachingProgramStatus,
  type TeachingSettlementStatus,
} from '@/data/mock/school-detail'
import { ProgramEnrollmentStatusBadge } from '@/shared/components/program-enrollment-status-badge'
import { SettlementStatusBadge } from '@/shared/components/settlement-status-badge'
import { StatusDropdownCell } from '@/features/program/ui/status-dropdown-cell'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import type { SettlementStatusKey } from '@/data/mock/participating-instructors'

const PROGRAM_STATUS_KEYS: TeachingProgramStatus[] = [
  'WAITING_RESULT', 'REJECTED', 'EDUCATION_SCHEDULED', 'EDUCATION_IN_PROGRESS', 'PROGRAM_ENDED',
]
const SETTLEMENT_STATUS_KEYS: TeachingSettlementStatus[] = ['na', 'pending', 'partial', 'completed']

export interface TeacherTeachingHistoryTabProps {
  initialData: TeachingHistoryRow[]
}

export function TeacherTeachingHistoryTab({ initialData }: TeacherTeachingHistoryTabProps) {
  const [overrides, setOverrides] = useState<
    Record<string, { programStatus?: TeachingProgramStatus; settlementStatus?: TeachingSettlementStatus }>
  >({})

  const data = useMemo(() => {
    if (Object.keys(overrides).length === 0) return initialData
    return initialData.map(row => ({
      ...row,
      ...(overrides[row.id] ?? {}),
    }))
  }, [initialData, overrides])

  const handleProgramStatusChange = useCallback((rowId: string, status: TeachingProgramStatus) => {
    setOverrides(prev => ({
      ...prev,
      [rowId]: { ...prev[rowId], programStatus: status },
    }))
  }, [])

  const handleSettlementStatusChange = useCallback((rowId: string, status: TeachingSettlementStatus) => {
    setOverrides(prev => ({
      ...prev,
      [rowId]: { ...prev[rowId], settlementStatus: status },
    }))
  }, [])

  const columns: ColumnsType<TeachingHistoryRow> = [
    {
      title: 'No.',
      dataIndex: 'no',
      key: 'no',
      width: 70,
      align: 'center' as const,
    },
    {
      title: '프로그램명',
      dataIndex: 'programName',
      key: 'programName',
      ellipsis: true,
      align: 'center' as const,
    },
    {
      title: '프로그램 진행 현황',
      dataIndex: 'programStatus',
      key: 'programStatus',
      width: 180,
      align: 'center' as const,
      render: (_: unknown, record: TeachingHistoryRow) => (
        <StatusDropdownCell<TeachingProgramStatus>
          status={record.programStatus}
          statusKeys={PROGRAM_STATUS_KEYS}
          renderBadge={(s) => (
            <ProgramEnrollmentStatusBadge status={s as ProgramEnrollmentDisplayStatus} />
          )}
          onChange={(s) => handleProgramStatusChange(record.id, s)}
          cellClassName="teacher-detail-modal__status-cell"
          triggerClassName="teacher-detail-modal__status-trigger"
        />
      ),
    },
    {
      title: '정산 현황',
      dataIndex: 'settlementStatus',
      key: 'settlementStatus',
      width: 150,
      align: 'center' as const,
      render: (_: unknown, record: TeachingHistoryRow) => (
        <StatusDropdownCell<TeachingSettlementStatus>
          status={record.settlementStatus}
          statusKeys={SETTLEMENT_STATUS_KEYS}
          renderBadge={(s) => (
            <SettlementStatusBadge status={s as SettlementStatusKey} />
          )}
          onChange={(s) => handleSettlementStatusChange(record.id, s)}
          cellClassName="teacher-detail-modal__status-cell"
          triggerClassName="teacher-detail-modal__status-trigger"
        />
      ),
    },
    {
      title: '담당자',
      dataIndex: 'managerName',
      key: 'managerName',
      width: 130,
      align: 'center' as const,
    },
  ]

  return (
    <div className="teacher-detail-modal__teaching-tab">
      <div className="teacher-detail-modal__teaching-header">
        <h3 className="teacher-detail-modal__teaching-title">
          프로그램 강의 이력
          <span className="teacher-detail-modal__teaching-count">
            총 {data.length}건
          </span>
        </h3>
      </div>
      {data.length > 0 ? (
        <Table<TeachingHistoryRow>
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={false}
          size="middle"
          className="teacher-detail-modal__teaching-table"
        />
      ) : (
        <Empty description="프로그램 강의 이력이 없습니다." />
      )}
    </div>
  )
}
