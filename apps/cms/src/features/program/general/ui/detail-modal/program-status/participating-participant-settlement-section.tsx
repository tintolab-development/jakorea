/**
 * 참여자(개인) 상세 — 정산 현황 탭 (실비 영수증·지급)
 */

import { useMemo } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { useParticipatingParticipantSettlementList } from '@/features/program/general/hooks/use-participating-participant-settlement-list'
import type { ParticipatingParticipantSettlementRow } from '@/features/program/general/lib/map-participant-settlement-list-rows'
import './participating-instructor-settlement-section.css'

function formatAmount(amount: number | null): string {
  if (amount == null) return '-'
  return `${amount.toLocaleString('ko-KR')}원`
}

export interface ParticipatingParticipantSettlementSectionProps {
  program: Program
  participantId: string
}

export function ParticipatingParticipantSettlementSection({
  program,
  participantId,
}: ParticipatingParticipantSettlementSectionProps) {
  const programId = program.id != null ? String(program.id) : ''
  const { isLoading, rows, remoteEnabled } = useParticipatingParticipantSettlementList({
    programId,
    participantId,
  })

  const columns = useMemo(
    (): ColumnsType<ParticipatingParticipantSettlementRow> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 56 },
      { title: '신청일', dataIndex: 'submittedAtLabel', key: 'submittedAtLabel', width: 160 },
      { title: '항목', dataIndex: 'itemSummary', key: 'itemSummary', ellipsis: true },
      {
        title: '금액',
        key: 'amount',
        width: 120,
        render: (_: unknown, record) => formatAmount(record.amount),
      },
      {
        title: '영수증 검토',
        dataIndex: 'receiptStatusLabel',
        key: 'receiptStatusLabel',
        width: 100,
      },
      {
        title: '지급 상태',
        dataIndex: 'paymentStatusLabel',
        key: 'paymentStatusLabel',
        width: 100,
      },
    ],
    []
  )

  if (!remoteEnabled) {
    return (
      <p className="participating-instructor-settlement-section__empty">
        정산 API 연동 후 영수증·실비 지급 내역을 조회할 수 있습니다.
      </p>
    )
  }

  return (
    <div className="participating-instructor-settlement-section">
      <Spin spinning={isLoading}>
        <CmsDataTable<ParticipatingParticipantSettlementRow>
          className="cms-data-table participating-instructor-settlement-section__table"
          rowKey={row => String(row.receiptId || row.no)}
          columns={columns}
          dataSource={rows}
          pagination={false}
          locale={{ emptyText: '정산 신청 내역이 없습니다.' }}
        />
      </Spin>
    </div>
  )
}
