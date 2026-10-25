/**
 * 정산 관리 > 지급조서 확인 페이지 — 프로그램별·강사별 정산 목록
 * 필터·툴바(제목·뷰 전환·엑셀): FilterTableLayout
 * 개인 정산은 강사 원장과 별도 서브뷰 (`sourceType=INDIVIDUAL_SETTLEMENT_APPLICATION`)
 */

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Spin } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { ViewModeToggle } from '@/shared/components/view-mode'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import '@/shared/components/list-page/list-page-layout.css'
import '@/features/program/general/ui/detail-modal/program-status/program-status-participating-shared.css'
import '@/features/program/general/ui/detail-modal/program-status/program-progress-tab.css'
import './payment-orders-page.css'
import { PaymentOrderDetailFullPageModal } from './payment-order-detail-fullpage-modal'
import { usePaymentOrdersListPage } from './use-payment-orders-list-page'
import { PaymentOrderIndividualPanel } from './payment-order-individual-panel'
import { usePaymentOrderIndividualListQuery } from '@/features/settlement-management/hooks/use-payment-order-individual-list-query'

const SOURCE_PARAM = 'po_src'

type PaymentOrderSourceTab = 'instructor' | 'individual'

function parseSourceTab(value: string | null): PaymentOrderSourceTab {
  return value === 'individual' ? 'individual' : 'instructor'
}

export default function PaymentOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sourceTab = parseSourceTab(searchParams.get(SOURCE_PARAM))
  const individualListQuery = usePaymentOrderIndividualListQuery(sourceTab === 'individual')

  const setSourceTab = useCallback(
    (next: PaymentOrderSourceTab) => {
      setSearchParams(
        prev => {
          const params = new URLSearchParams(prev)
          if (next === 'instructor') params.delete(SOURCE_PARAM)
          else params.set(SOURCE_PARAM, next)
          return params
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

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
    listDateRangeReady,
  } = usePaymentOrdersListPage()

  const listQueryLoading = !listDateRangeReady || remoteListQuery.isLoading
  const contentLoading =
    sourceTab === 'individual'
      ? individualListQuery.isPending
      : paymentOrdersRemote &&
        ((viewMode === 'list' && listQueryLoading) ||
          (viewMode === 'calendar' && (listQueryLoading || remoteCalendarQuery.isLoading)))

  const contentError =
    sourceTab === 'individual'
      ? null
      : paymentOrdersRemote &&
        (viewMode === 'list'
          ? remoteListQuery.isError
            ? remoteListQuery.error
            : null
          : remoteListQuery.isError
            ? remoteListQuery.error
            : remoteCalendarQuery.isError
              ? remoteCalendarQuery.error
              : null)

  const individualTotal = individualListQuery.data?.length ?? 0

  const sourceTabs = useMemo(
    () =>
      [
        { key: 'instructor' as const, label: '강사 지급조서' },
        { key: 'individual' as const, label: '개인 정산' },
      ] as const,
    []
  )

  return (
    <div className="payment-orders-page">
      <div className="payment-orders-page__content-wrapper">
          <CmsTextTabs<PaymentOrderSourceTab>
          className="payment-orders-page__source-tabs"
          variant="detail"
          ariaLabel="지급조서 확인 대상"
          activeKey={sourceTab}
          onChange={setSourceTab}
          items={sourceTabs}
        />

        {sourceTab === 'individual' ? (
          <div className="payment-orders-page__individual">
            <div className="table-header-actions">
              <div className="table-header-title--wrapper">
                <span className="table-title">개인 정산 목록</span>
                <span className="table-description">총 {individualTotal}건</span>
              </div>
            </div>
            {contentLoading ? (
              <div className="page-content-loading" role="status">
                <Spin size="large" />
              </div>
            ) : (
              <PaymentOrderIndividualPanel />
            )}
          </div>
        ) : (
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
        )}
      </div>

      {sourceTab === 'instructor' ? (
        <PaymentOrderDetailFullPageModal
          type={detailState?.type ?? 'program'}
          isOpen={detailState !== null}
          onClose={closeDetail}
          data={detailState?.data ?? null}
          listPageDateRange={appliedFromUrl.dateRange}
        />
      ) : null}
    </div>
  )
}
