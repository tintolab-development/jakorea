/**
 * 정산 관리 > 지급조서 확인 페이지 — 프로그램별·강사별 정산 목록
 * 필터: FilterTableLayout(TableFilterGroup) · 헤더·뷰 전환: ViewModeController (참여기관 섹션과 동일 패턴)
 */

import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import type { FilterFieldConfig } from '@/shared/components/table-filter-group'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { ViewModeController } from '@/shared/components/view-mode'
import '@/shared/components/list-page/list-page-layout.css'
import '@/features/program/ui/detail-modal/program-status/program-status-participating-shared.css'
import '@/features/program/ui/detail-modal/program-status/program-progress-tab.css'
import './payment-order-admin-status-tag.css'
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
    renderHeader,
    renderContent,
  } = usePaymentOrdersListPage()

  return (
    <div className="payment-orders-page">
      <div className="payment-orders-page__content-wrapper">
        <FilterTableLayout
          className="payment-orders-page__filter-list-layout"
          bordered={false}
          cardStyle={{ marginBottom: 0 }}
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
          <div className="participating-institutions-section__below-divider">
            <ViewModeController
              value={viewMode}
              onChange={setViewMode}
              options={paymentOrdersViewModeOptions}
              renderHeader={renderHeader}
              renderContent={mode => (
                <div className="list-page-layout__table-shell">{renderContent(mode)}</div>
              )}
            />
          </div>
        </FilterTableLayout>
      </div>

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
