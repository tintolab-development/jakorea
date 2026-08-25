/**
 * 정산 관리 > 지급조서 확인 페이지 — 프로그램별·강사별 정산 목록
 * 필터·툴바(제목·뷰 전환·엑셀): FilterTableLayout
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
    detailState,
    closeDetail,
    appliedFromUrl,
    pendingFilters,
    handleSearch,
    handleFilterChange,
    paymentOrdersFilterFields,
    paymentOrdersViewModeOptions,
    listTitle,
    total,
    paymentOrdersExcelExport,
    renderContent,
    paymentOrdersRemote,
    remoteListQuery,
    remoteCalendarQuery,
  } = usePaymentOrdersListPage()

  const contentLoading =
    paymentOrdersRemote &&
    ((viewMode === 'list' && remoteListQuery.isLoading) ||
      (viewMode === 'calendar' &&
        (remoteListQuery.isLoading || remoteCalendarQuery.isLoading)))

  const contentError =
    paymentOrdersRemote &&
    (viewMode === 'list'
      ? remoteListQuery.isError
        ? remoteListQuery.error
        : null
      : remoteListQuery.isError
        ? remoteListQuery.error
        : remoteCalendarQuery.isError
          ? remoteCalendarQuery.error
          : null)

  return (
    <div className="payment-orders-page">
      <FilterTableLayout
        className="payment-orders-page__filter-list-layout"
        filterResponsiveWrap={false}
        contentVariant={viewMode === 'calendar' ? 'calendar' : 'table'}
        fields={paymentOrdersFilterFields}
        filters={{
          exposureMode: pendingFilters.exposureMode,
          programName: pendingFilters.programName,
          instructorName: pendingFilters.instructorName,
          processingStatus:
            pendingFilters.processingStatus === 'all'
              ? undefined
              : pendingFilters.processingStatus,
          dateRange: pendingFilters.dateRange,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={listTitle}
        description={`총 ${total}건`}
        contentLoading={Boolean(contentLoading)}
        actions={
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            options={paymentOrdersViewModeOptions}
          />
        }
        excelExport={paymentOrdersExcelExport}
      >
        {contentError ? (
          <div className="page-content-error" role="alert">
            {contentError instanceof Error ? contentError.message : '목록을 불러오지 못했습니다.'}
          </div>
        ) : (
          renderContent(viewMode)
        )}
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
