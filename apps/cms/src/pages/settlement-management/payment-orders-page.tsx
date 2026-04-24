/**
 * 정산 관리 > 지급조서 확인 페이지 — 프로그램별·강사별 정산 목록
 * 필터: FilterTableLayout(TableFilterGroup) · 헤더·뷰 전환: ViewModeController (참여기관 섹션과 동일 패턴)
 */

import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { ViewModeController } from '@/shared/components/view-mode'
import '@/shared/components/list-page/list-page-layout.css'
import '@/features/program/ui/detail-modal/program-status/program-status-participating-shared.css'
import '@/features/program/ui/detail-modal/program-status/program-progress-tab.css'
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
    renderHeader,
    renderContent,
  } = usePaymentOrdersListPage()

  return (
    <>
      <FilterTableLayout
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
      >
        <ViewModeController
          value={viewMode}
          onChange={setViewMode}
          options={paymentOrdersViewModeOptions}
          renderHeader={renderHeader}
          renderContent={mode => <div>{renderContent(mode)}</div>}
        />
      </FilterTableLayout>

      <PaymentOrderDetailFullPageModal
        type={detailState?.type ?? 'program'}
        isOpen={detailState !== null}
        onClose={closeDetail}
        data={detailState?.data ?? null}
        listPageDateRange={appliedFromUrl.dateRange}
      />
    </>
  )
}
