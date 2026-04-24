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
import { StatusBadge } from '@/shared/components/status-badge'
import { SettlementStatusBadge } from '@/shared/components/settlement-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER } from '@/shared/constants/status'
import type { SettlementStatusKey } from '@/data/mock/participating-instructors'

const PROGRAM_STATUS_KEYS: TeachingProgramStatus[] = PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER
const SETTLEMENT_STATUS_KEYS: TeachingSettlementStatus[] = ['na', 'pending', 'partial', 'completed']

export interface TeacherTeachingHistoryTabProps {
  initialData: TeachingHistoryRow[]
}

export function TeacherTeachingHistoryTab({ initialData }: TeacherTeachingHistoryTabProps) {
  const [openProgramDropdownId, setOpenProgramDropdownId] = useState<string | null>(null)
  const [openSettlementDropdownId, setOpenSettlementDropdownId] = useState<string | null>(null)
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

  const columns: ColumnsType<TeachingHistoryRow> = useMemo(
    () => [
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
        title: '모집 신청 현황',
        dataIndex: 'programStatus',
        key: 'programStatus',
        width: 180,
        align: 'center' as const,
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (_: unknown, record: TeachingHistoryRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<TeachingProgramStatus>
              status={record.programStatus}
              statusOptions={PROGRAM_STATUS_KEYS}
              renderBadge={s => (
                <StatusBadge domain="programEnrollment" status={s} variant="badge" />
              )}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={s => handleProgramStatusChange(record.id, s)}
              isOpen={openProgramDropdownId === record.id}
              onOpenChange={open => setOpenProgramDropdownId(open ? record.id : null)}
            />
          </div>
        ),
      },
      {
        title: '정산 현황',
        dataIndex: 'settlementStatus',
        key: 'settlementStatus',
        width: 150,
        align: 'center' as const,
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (_: unknown, record: TeachingHistoryRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<TeachingSettlementStatus>
              status={record.settlementStatus}
              statusOptions={SETTLEMENT_STATUS_KEYS}
              renderBadge={s => <SettlementStatusBadge status={s as SettlementStatusKey} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={s => handleSettlementStatusChange(record.id, s)}
              isOpen={openSettlementDropdownId === record.id}
              onOpenChange={open => setOpenSettlementDropdownId(open ? record.id : null)}
            />
          </div>
        ),
      },
      {
        title: '담당자',
        dataIndex: 'managerName',
        key: 'managerName',
        width: 130,
        align: 'center' as const,
      },
    ],
    [
      handleProgramStatusChange,
      handleSettlementStatusChange,
      openProgramDropdownId,
      openSettlementDropdownId,
    ]
  )

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
          className="teacher-detail-modal__teaching-table cms-data-table"
        />
      ) : (
        <Empty description="프로그램 강의 이력이 없습니다." />
      )}
    </div>
  )
}
