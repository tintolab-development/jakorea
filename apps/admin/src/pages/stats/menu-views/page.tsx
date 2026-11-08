/**
 * 메뉴별 조회 통계
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import {
  MENU_VIEW_TAB_IDS,
  MENU_VIEW_TAB_LABELS,
  type MenuViewPeriod,
  type MenuViewTabId,
} from '@/entities/menu-view-stats/model/types'
import { useMenuViewStats } from '@/features/menu-view-stats/api/hooks'
import { MenuViewSummaryTable } from '@/features/menu-view-stats/ui/summary-table'
import { MenuViewTabPanel } from '@/features/menu-view-stats/ui/tab-panels'
import { FILTER_CONTROL_WIDE_FIELD_WIDTH_PX } from '@/shared/constants/filter-field-width'
import { useListFilterUrl } from '@/shared/lib/use-list-filter-url'
import type { TableSearchParamRule } from '@/shared/lib/use-table-search'
import {
  applyDateRangeToSearchParams,
  pendingDateRangeTupleEqual,
  resolvePendingDateRangeFromUrl,
  type PendingDateRange,
  type UrlDateRangePendingSyncRef,
  ymdFromParam,
} from '@/shared/lib/url-date-range-pending-sync'
import {
  CmsButton,
  CmsDateRangePicker,
  CmsTextTabs,
  FilterTableLayout,
  PageContentLoading,
  useCmsAlert,
} from '@/shared/ui'

import './page.css'

type PendingFilters = {
  periodRange: PendingDateRange
}

type AppliedPeriod = MenuViewPeriod | null

/** Asia/Seoul 달력 오늘 */
function seoulCalendarToday(): Dayjs {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return dayjs(ymd)
}

/**
 * 기본 조회 기간: 한 달 전 같은 날 ~ 오늘 (서울 달력일)
 * 예) 11/9 진입 → 10/9 ~ 11/9, 2/28 진입 → 1/28 ~ 2/28 (말일이 없는 달은 그 달 말일로 맞춤: 3/31 → 2/28 ~ 3/31)
 */
function currentSeoulMonthRange(): [Dayjs, Dayjs] {
  const today = seoulCalendarToday()
  return [today.subtract(1, 'month'), today]
}

const periodSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function periodAsPickerValue(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

function isCompletePeriod(range: PendingDateRange): boolean {
  return Boolean(range?.[0] && range?.[1])
}

function parseApplied(searchParams: URLSearchParams): AppliedPeriod {
  const from = ymdFromParam(searchParams.get('mv_from'))
  const to = ymdFromParam(searchParams.get('mv_to'))
  if (!from || !to) return null
  return { from, to }
}

const searchSyncRules: readonly TableSearchParamRule<PendingFilters>[] = [
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.periodRange, 'mv_from', 'mv_to')
    },
  },
]

function parseTab(raw: string | null): MenuViewTabId {
  if (raw && (MENU_VIEW_TAB_IDS as readonly string[]).includes(raw)) {
    return raw as MenuViewTabId
  }
  return 'ja-korea'
}

const TAB_ITEMS = MENU_VIEW_TAB_IDS.map(key => ({
  key,
  label: MENU_VIEW_TAB_LABELS[key],
}))

export function MenuViewsStatsPage() {
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = useMemo(() => parseTab(searchParams.get('tab')), [searchParams])
  const [initialPending] = useState<PendingFilters>(() => ({
    periodRange: currentSeoulMonthRange(),
  }))

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedPeriod,
    applySearch,
    hasActiveFilters,
  } = useListFilterUrl<PendingFilters, AppliedPeriod>({
    initialPending,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams: sp, setPendingFilters: setPending }) => {
      const from = sp.get('mv_from')
      const to = sp.get('mv_to')
      setPending(prev => {
        // URL에 기간이 없으면(메뉴 재진입 등) 항상 이번 달로 채워 자동 조회되게 한다
        if (!from && !to) {
          periodSyncRef.hadCompleteInUrl = false
          const periodRange = currentSeoulMonthRange()
          if (pendingDateRangeTupleEqual(prev.periodRange, periodRange)) return prev
          return { periodRange }
        }
        const periodRange = resolvePendingDateRangeFromUrl({
          ref: periodSyncRef,
          from,
          to,
          prev: prev.periodRange,
        }) as PendingDateRange
        if (pendingDateRangeTupleEqual(prev.periodRange, periodRange)) return prev
        return { periodRange }
      })
    },
  })

  const statsQuery = useMenuViewStats(appliedPeriod)

  const canSearch = isCompletePeriod(pendingFilters.periodRange)

  const hasAnyPeriodParam = searchParams.has('mv_from') || searchParams.has('mv_to')

  useEffect(() => {
    if (appliedPeriod) return
    if (!hasAnyPeriodParam) {
      // 기간 쿼리 없이 진입하면 이번 달(1일~말일)을 URL에 기본 적용한다
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev.toString())
          applyDateRangeToSearchParams(next, currentSeoulMonthRange(), 'mv_from', 'mv_to')
          return next
        },
        { replace: true }
      )
      return
    }
    if (!isCompletePeriod(pendingFilters.periodRange)) return
    applySearch()
  }, [appliedPeriod, applySearch, hasAnyPeriodParam, pendingFilters.periodRange, setSearchParams])

  const handleSearch = useCallback(() => {
    if (!canSearch) {
      showAlert({
        title: '기간 선택',
        content: '시작일과 종료일을 모두 선택한 뒤 조회해 주세요.',
      })
      return
    }
    applySearch()
  }, [applySearch, canSearch, showAlert])

  const handleTabChange = useCallback(
    (key: MenuViewTabId) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev.toString())
          if (key === 'ja-korea') {
            next.delete('tab')
          } else {
            next.set('tab', key)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const sections = statsQuery.data?.sectionsByTab[activeTab] ?? []
  const summary = statsQuery.data?.summary
  const hasApplied = Boolean(appliedPeriod)

  return (
    <div className="menu-views-stats-page">
      <FilterTableLayout
        hasActiveFilters={hasActiveFilters}
        filter={
          <div className="admin-filter-area">
            <div className="admin-filter-area__field admin-filter-area__field--date-range">
              <span className="admin-filter-area__label">기간</span>
              <CmsDateRangePicker
                inputSize="medium"
                width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                value={periodAsPickerValue(pendingFilters.periodRange)}
                onChange={dates =>
                  setPendingFilters({
                    periodRange: dates ?? null,
                  })
                }
                placeholder={['시작일', '종료일']}
              />
            </div>
            <div className="admin-filter-area__actions">
              <CmsButton
                className="admin-filter-area__search-button"
                variant="primary"
                size="medium"
                type="button"
                onClick={handleSearch}
              >
                조회
              </CmsButton>
            </div>
          </div>
        }
        title="메뉴별 조회 통계"
      >
        {!hasApplied ? (
          <div
            className="menu-views-stats-page__placeholder"
            style={{ fontSize: '18px' }}
            role="status"
          >
            기간을 선택한 뒤 조회하면 메뉴별 조회 통계가 표시됩니다.
          </div>
        ) : statsQuery.isError ? (
          <div className="menu-views-stats-page__placeholder page-content-error" role="alert">
            통계를 불러오지 못했습니다. 다시 조회해 주세요.
          </div>
        ) : (
          <>
            {statsQuery.isLoading && !statsQuery.data ? (
              <PageContentLoading variant="table-slot" />
            ) : (
              <>
                {summary ? (
                  <MenuViewSummaryTable
                    summary={summary}
                    loading={statsQuery.isFetching}
                  />
                ) : null}

                <CmsTextTabs
                  variant="list"
                  activeKey={activeTab}
                  onChange={handleTabChange}
                  items={TAB_ITEMS}
                  ariaLabel="메뉴 탭"
                  className="menu-views-stats-page__tabs"
                />

                <div className="menu-views-stats-page__detail">
                  <MenuViewTabPanel tabId={activeTab} sections={sections} />
                </div>
              </>
            )}
          </>
        )}
      </FilterTableLayout>
    </div>
  )
}
