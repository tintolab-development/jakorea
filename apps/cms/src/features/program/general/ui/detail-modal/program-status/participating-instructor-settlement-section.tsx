/**
 * 참여 강사 상세 — 정산 현황 탭
 */

import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { InstructorAssignedSchoolRow } from '@/features/program/general/lib/instructor-institution-assignment-mock'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
interface ParticipatingInstructorSettlementRow {
  id: string
  schoolName: string
  assignedDate: string
  assignedSession: string
  settlementStatus: InstructorSettlementUiStatus
}

export interface ParticipatingInstructorSettlementSectionProps {
  instructor: ParticipatingInstructorRow
  assignedSchools: InstructorAssignedSchoolRow[]
}

export function ParticipatingInstructorSettlementSection({
  instructor,
  assignedSchools,
}: ParticipatingInstructorSettlementSectionProps) {
  const rows = useMemo(
    (): ParticipatingInstructorSettlementRow[] =>
      assignedSchools.map(row => {
        const firstLine = row.educationScheduleLines[0]
        const [datePart = '-', sessionPart = '-'] =
          firstLine?.split('|').map(part => part.trim()) ?? []
        return {
          id: row.id,
          schoolName: row.schoolName,
          assignedDate: datePart || '-',
          assignedSession: sessionPart || '-',
          settlementStatus: instructor.settlementStatus,
        }
      }),
    [assignedSchools, instructor.settlementStatus]
  )

  const columns = useMemo(
    (): ColumnsType<ParticipatingInstructorSettlementRow> => [
      { title: 'No.', dataIndex: 'id', key: 'no', width: 64, align: 'center', render: (_v, _r, i) => i + 1 },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName', width: 180 },
      {
        title: '교육 담당 날짜',
        dataIndex: 'assignedDate',
        key: 'assignedDate',
        width: 140,
        align: 'center',
      },
      {
        title: '교육 할당 차시',
        dataIndex: 'assignedSession',
        key: 'assignedSession',
        width: 120,
        align: 'center',
      },
      {
        title: '정산 현황',
        dataIndex: 'settlementStatus',
        key: 'settlementStatus',
        width: 160,
        align: 'center',
        render: (status: InstructorSettlementUiStatus) => (
          <InstructorSettlementStatusText status={status} />
        ),
      },
    ],
    []
  )

  return (
    <div className="school-detail-fullpage-view__instructor-section">
      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">정산 현황 목록</span>
          <span className="table-description">{rows.length}건</span>
        </div>
      </div>
      <div className="participating-institutions-section__table-wrap">
        {rows.length === 0 ? (
          <div
            className="school-detail-fullpage-view__instructor-list-empty"
            role="status"
            aria-label="정산 현황 없음"
          >
            정산 현황이 없습니다.
          </div>
        ) : (
          <Table<ParticipatingInstructorSettlementRow>
            className="participating-institutions-section__table cms-data-table"
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 760 }}
            columns={columns}
            dataSource={rows}
          />
        )}
      </div>
    </div>
  )
}
