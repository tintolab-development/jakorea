/**
 * 정산 관리 > 지급조서 확인 페이지 — 프로그램별·강사별 정산 목록
 * 필터·테이블 툴바: FilterTableLayout (제목·건수·뷰 전환·엑셀 한 줄)
 */

import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { ViewModeToggle } from '@/shared/components/view-mode'
import '@/shared/components/list-page/list-page-layout.css'
import '@/features/program/general/ui/detail-modal/program-status/program-status-participating-shared.css'
import '@/features/program/general/ui/detail-modal/program-status/program-progress-tab.css'
import './payment-orders-page.css'
import { PaymentOrderDetailFullPageModal } from './payment-order-detail-fullpage-modal'
import { usePaymentOrdersListPage } from './use-payment-orders-list-page'

export default function PaymentOrdersPage() {
  const {
    viewMode,
    setViewMode,
    exposureMode,
    detailState,
    closeDetail,
    appliedFromUrl,
    pendingFilters,
    handleSearch,
    handleFilterChange,
    paymentOrdersFilterFields,
    paymentOrdersViewModeOptions,
    renderContent,
    excelExport,
    listTitle,
    total,
  } = usePaymentOrdersListPage()

  return (
    <div className="payment-orders-page">
      <FilterTableLayout
        className="payment-orders-page__filter-list-layout"
        fields={paymentOrdersFilterFields}
        filters={{
          exposureMode,
          programName: pendingFilters.programName,
          instructorName: pendingFilters.instructorName,
          pendingPaymentBucket:
            pendingFilters.pendingPaymentBucket === 'all'
              ? undefined
              : pendingFilters.pendingPaymentBucket,
          dateRange: pendingFilters.dateRange,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={listTitle}
        description={`총 ${total}건`}
        actions={
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            options={paymentOrdersViewModeOptions}
          />
        }
        excelExport={excelExport}
      >
        {renderContent(viewMode)}
      </FilterTableLayout>

      <PaymentOrderDetailFullPageModal
        type={detailState?.type ?? 'program'}
        isOpen={detailState !== null}
        onClose={closeDetail}
        data={detailState?.data ?? null}
        listPageDateRange={appliedFromUrl.dateRange}
      />
    </div>
  )
}
