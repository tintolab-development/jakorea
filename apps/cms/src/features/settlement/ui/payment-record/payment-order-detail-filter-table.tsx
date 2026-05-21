/**
 * 지급 현황 상세 — 프로그램 기준 강사별 / 강사 기준 프로그램별 정산 목록(필터·테이블)
 */

import { DownloadOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { Table } from 'antd'
import type {
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramDetailInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderDetailAggregateStatus } from '@/shared/constants/payment-order-aggregate-status'
import type { PaymentOrderCalculationStatementCommitPayload } from '@/pages/settlement-management/payment-order-detail-fullpage-shared'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { PaymentOrderBatchConfirmModal } from './payment-order-batch-confirm-modal'
import { Divider } from '@/shared/components/divider'
import { InstructorPaymentStatementBlockedModal } from '@/features/user/detail/ui/modal/instructor-payment-statement-blocked-modal'
import { CmsButton } from '@/shared/ui'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import {
  usePaymentOrderDetailLinesController,
  type PaymentOrderDetailLineRow,
} from './use-payment-order-detail-lines'
import './payment-order-detail-filter-table.css'

export type { PaymentOrderDetailLineRow }

export type PaymentOrderDetailFilterTableProps =
  | {
      mode: 'program'
      programRow: PaymentOrderAdminProgramRow
      isOpen: boolean
      listPageDateRange: [Dayjs, Dayjs] | null
      onAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
      onOpenCalculationStatement: (row: PaymentOrderAdminProgramDetailInstructorRow) => void
      registerStatementCommitSink?: (
        sink: (payload: PaymentOrderCalculationStatementCommitPayload) => void
      ) => void
    }
  | {
      mode: 'instructor'
      instructorRow: PaymentOrderAdminInstructorRow
      isOpen: boolean
      listPageDateRange: [Dayjs, Dayjs] | null
      onAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
      onOpenCalculationStatement: (row: PaymentOrderAdminInstructorDetailProgramRow) => void
      registerStatementCommitSink?: (
        sink: (payload: PaymentOrderCalculationStatementCommitPayload) => void
      ) => void
    }

export function PaymentOrderDetailFilterTable(props: PaymentOrderDetailFilterTableProps) {
  const {
    filteredRows,
    batchConfirmOpen,
    setBatchConfirmOpen,
    paymentStatementIssueBlocked,
    setPaymentStatementIssueBlocked,
    handleBatchConfirm,
    handlePaymentStatementIssue,
    selectedRowKeys,
    setSelectedRowKeys,
    filterFields,
    filterFilters,
    onFilterCardChange,
    handleSearch,
    columns,
    sectionTitle,
    filterClassName,
  } = usePaymentOrderDetailLinesController(props)

  return (
    <div className="payment-order-detail-filter-table">
      <PaymentOrderBatchConfirmModal
        open={batchConfirmOpen}
        onCancel={() => setBatchConfirmOpen(false)}
        selectedCount={selectedRowKeys.length}
        onConfirm={handleBatchConfirm}
      />
      <InstructorPaymentStatementBlockedModal
        open={paymentStatementIssueBlocked.open}
        onClose={() => setPaymentStatementIssueBlocked(prev => ({ ...prev, open: false }))}
        variant={paymentStatementIssueBlocked.variant}
        selectedCount={paymentStatementIssueBlocked.selectedCount}
        layout="detailFullpage"
      />
      <div className={filterClassName}>
        <UnifiedFilterCard
          bordered={false}
          cardStyle={{ marginBottom: 0 }}
          fields={filterFields}
          filters={filterFilters}
          onFilterChange={onFilterCardChange}
          onSearch={handleSearch}
        />
      </div>

      <div
        className="payment-order-detail-filter-table__section-divider-wrap"
        aria-hidden
      >
        <Divider />
      </div>

      <div className="payment-order-detail-filter-table__below-divider participating-institutions-section__below-divider">
        <div className="participating-institutions-section__table-header">
          <div className="participating-institutions-section__table-heading">
            <span className="participating-institutions-section__table-title">{sectionTitle}</span>
            <span className="participating-institutions-section__table-description">
              총 {filteredRows.length}건
            </span>
          </div>
          <div className="participating-institutions-section__table-actions">
            <CmsButton
              variant="secondary"
              size="large" width={160}
              disabled={selectedRowKeys.length === 0}
              onClick={() => {
                if (selectedRowKeys.length === 0) return
                setBatchConfirmOpen(true)
              }}
            >
              일괄 확인
            </CmsButton>
            <CmsButton
              variant="primary"
              size="large" style={{ minWidth: 180 }}
              icon={<DownloadOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={handlePaymentStatementIssue}
            >
              지급조서 발급
            </CmsButton>
          </div>
        </div>

        <Table<PaymentOrderDetailLineRow>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={filteredRows}
          pagination={false}
          rowSelection={{
            columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys),
          }}
        />
      </div>
    </div>
  )
}
