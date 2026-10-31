/**
 * 지급 현황 상세 — 프로그램 기준 강사별 / 강사 기준 프로그램별 정산 목록(필터·테이블)
 */

import type { Dayjs } from 'dayjs'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type {
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramDetailInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/features/settlement-management/model/payment-order-admin-list'
import type { PaymentOrderDetailAggregateStatus } from '@/shared/constants/payment-order-aggregate-status'
import type { PaymentOrderCalculationStatementCommitPayload } from '@/pages/settlement-management/payment-order-detail-fullpage-shared'
import type { PaymentOrdersDetailContextQueryResult } from '@/features/settlement-management/hooks/use-payment-orders-detail-query'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { PaymentOrderBatchConfirmModal } from './payment-order-batch-confirm-modal'
import { InstructorPaymentStatementBlockedModal } from '@/features/user/detail/ui/modal/instructor-payment-statement-blocked-modal'
import { PaymentStatementIssuanceViewModal } from '@/features/program/shared/ui/payment-statement-issuance-view-modal'
import {
  FilterTableToolbarButton
} from '@/shared/ui'
import {
  usePaymentOrderDetailLinesController,
  type PaymentOrderDetailLineRow,
} from './use-payment-order-detail-lines'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
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
      listPageDateRange: [Dayjs | null, Dayjs | null] | null
      onAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
      onCountableAmountChange?: (amount: number) => void
      onOpenCalculationStatement: (row: PaymentOrderAdminProgramDetailInstructorRow) => void
      registerStatementCommitSink?: (
        sink: (payload: PaymentOrderCalculationStatementCommitPayload) => void
      ) => void
    }
  | {
      mode: 'instructor'
      instructorRow: PaymentOrderAdminInstructorRow
      isOpen: boolean
      listPageDateRange: [Dayjs | null, Dayjs | null] | null
      onAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
      onCountableAmountChange?: (amount: number) => void
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
    canBatchConfirm,
    isLineCheckboxDisabled,
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
    filterFetching,
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
        open={issuanceViewOpen && Boolean(currentIssuancePayload)}
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
        loading={filterFetching}
        title={sectionTitle}
        description={`총 ${filteredRows.length}건`}
        actions={
          <>
            <FilterTableToolbarButton
              variant="secondary"
              disabled={!canBatchConfirm}
              onClick={() => {
                if (!canBatchConfirm) return
                setBatchConfirmOpen(true)
              }} >
              일괄 확인
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              variant="primary"
              style={{ minWidth: 180 }}
              icon={<ButtonDownloadIcon />}
              disabled={selectedRowKeys.length === 0}
              onClick={handlePaymentStatementIssue} >
              지급조서 발급
            </FilterTableToolbarButton>
          </>
        }
      >
        <CmsDataTable<PaymentOrderDetailLineRow>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={filteredRows}
          pagination={false}
          rowSelection={{
            columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys),
            getCheckboxProps: record => ({
              disabled: isLineCheckboxDisabled(record),
            }),
          }}
        />
      </FilterTableLayout>
    </div>
  )
}
