import { useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { StatusBadge } from '@/shared/components'
import { PaymentOrdersTable } from '@/features/settlement/ui/payment-record'
import { usePaymentOrderIndividualListQuery } from '@/features/settlement-management/hooks/use-payment-order-individual-list-query'
import type { PaymentOrderIndividualRow } from '@/features/settlement-management/lib/map-payment-order-individual-rows'
import { individualSettlementReviewStatusAccent } from '@/features/program/general/lib/individual-settlement-review-status'
import { IndividualSettlementReviewDetailModal } from '@/features/program/general/ui/detail-modal/program-status/individual-settlement-review-detail-modal'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'

const SCROLL_X = 80 + 220 + 280 + 160 + 140 + 100

export function PaymentOrderIndividualPanel() {
  const query = usePaymentOrderIndividualListQuery()
  const rows = query.data ?? []
  const [detail, setDetail] = useState<PaymentOrderIndividualRow | null>(null)

  const columns = useMemo(
    (): ColumnsType<PaymentOrderIndividualRow> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '신청자명',
        dataIndex: 'applicantName',
        key: 'applicantName',
        ellipsis: { showTitle: true },
        width: 220,
        align: 'center',
      },
      {
        title: '교육 일정',
        dataIndex: 'educationScheduleLabel',
        key: 'educationScheduleLabel',
        width: 280,
        align: 'center',
      },
      {
        title: '정산 상태',
        dataIndex: 'statusLabel',
        key: 'statusLabel',
        width: 160,
        align: 'center',
        render: (_value, record) => (
          <StatusBadge
            domain="custom"
            variant="text"
            label={record.statusLabel}
            accentColor={individualSettlementReviewStatusAccent(record.status)}
          />
        ),
      },
      {
        title: '정산 금액',
        dataIndex: 'totalAmountLabel',
        key: 'totalAmountLabel',
        width: 140,
        align: 'center',
      },
      {
        title: 'Revision',
        dataIndex: 'latestRevisionNoLabel',
        key: 'latestRevisionNoLabel',
        width: 100,
        align: 'center',
      },
    ],
    []
  )

  if (query.isError) {
    return (
      <div className="page-content-error" role="alert">
        {readApiErrorAlertMessage(query.error, '개인 정산 목록을 불러오지 못했습니다.')}
      </div>
    )
  }

  return (
    <>
      <div className="participating-institutions-section__table-wrap list-page-layout__table-shell">
        <PaymentOrdersTable<PaymentOrderIndividualRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          scroll={{ x: SCROLL_X }}
          onRowClick={record => setDetail(record)}
        />
      </div>
      <IndividualSettlementReviewDetailModal
        open={detail != null}
        programId={detail?.programId != null ? String(detail.programId) : ''}
        participantId={detail?.participantId != null ? String(detail.participantId) : ''}
        settlementApplicationId={detail?.settlementApplicationId ?? null}
        onClose={() => setDetail(null)}
        onReviewed={async () => {
          await query.refetch()
        }}
      />
    </>
  )
}
