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
import type { PaymentOrdersDetailContextQueryResult } from '@/features/settlement-management/hooks/use-payment-orders-detail-query'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { PaymentOrderBatchConfirmModal } from './payment-order-batch-confirm-modal'
import { InstructorPaymentStatementBlockedModal } from '@/features/user/detail/ui/modal/instructor-payment-statement-blocked-modal'
import { PaymentStatementIssuanceViewModal } from '@/features/program/shared/ui/payment-statement-issuance-view-modal'
import { CmsButton } from '@/shared/ui'
import {
  usePaymentOrderDetailLinesController,
  type PaymentOrderDetailLineRow,
} from './use-payment-order-detail-lines'
import './payment-order-detail-filter-table.css'

export type { PaymentOrderDetailLineRow }

export type PaymentOrderDetailFilterTableProps = {
  paymentOrdersRemote?: boolean
  detailContextQuery?: PaymentOrdersDetailContextQueryResult
} & (
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
)

export function PaymentOrderDetailFilterTable(props: PaymentOrderDetailFilterTableProps) {
  const {
    filteredRows,
    batchConfirmOpen,
    setBatchConfirmOpen,
    paymentStatementIssueBlocked,
    setPaymentStatementIssueBlocked,
    handleBatchConfirm,
    handlePaymentStatementIssue,
    closeIssuanceView,
    issuanceViewOpen,
    currentIssuancePayload,
    selectedRowKeys,
    setSelectedRowKeys,
    filterFields,
    filterFilters,
    onFilterCardChange,
    handleSearch,
    columns,
    sectionTitle,
    filterClassName,
    excelExport,
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
      <PaymentStatementIssuanceViewModal
        open={issuanceViewOpen}
        onClose={closeIssuanceView}
        paragraphBodyOptions={currentIssuancePayload?.paragraphBodyOptions}
        fileName={currentIssuancePayload?.fileName}
        key={currentIssuancePayload?.fileName ?? 'payment-order-issuance'}
      />
      <FilterTableLayout
        className={filterClassName}
        bordered={false}
        filterResponsiveWrap={false}
        excelExport={excelExport}
        fields={filterFields}
        filters={filterFilters}
        onFilterChange={onFilterCardChange}
        onSearch={handleSearch}
        title={sectionTitle}
        description={`총 ${filteredRows.length}건`}
        actions={
          <>
            <CmsButton
              variant="secondary"
              size="large"
              width={160}
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
              size="large"
              style={{ minWidth: 180 }}
              icon={<DownloadOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={handlePaymentStatementIssue}
            >
              지급조서 발급
            </CmsButton>
          </>
        }
      >
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
      </FilterTableLayout>
    </div>
  )
}
