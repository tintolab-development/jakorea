/**
 * 메뉴별 조회 통계
 */

import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
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
import {
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
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
  useCmsAlert,
} from '@/shared/ui'

import './page.css'

type PendingFilters = {
  periodRange: PendingDateRange
}

type AppliedPeriod = MenuViewPeriod | null

const INITIAL_PENDING: PendingFilters = {
  periodRange: null,
}

const periodSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function periodAsPickerValue(
  period: PendingDateRange
): [Dayjs | null, Dayjs | null] {
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
  const activeTab = useMemo(
    () => parseTab(searchParams.get('tab')),
    [searchParams]
  )

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedPeriod,
    applySearch,
  } = useListFilterUrl<PendingFilters, AppliedPeriod>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams: sp, setPendingFilters: setPending }) => {
      const from = sp.get('mv_from')
      const to = sp.get('mv_to')
      setPending(prev => {
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
      <div className="admin-list-card menu-views-stats-page__filter-card">
        <div className="admin-filter-area">
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <span className="admin-filter-area__label">기간</span>
            <CmsDateRangePicker
              inputSize="large"
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
              size="large"
              width={FILTER_SEARCH_BUTTON_WIDTH_PX}
              type="button"
              onClick={handleSearch}
            >
              조회
            </CmsButton>
          </div>
        </div>
      </div>

      <div className="admin-list-card menu-views-stats-page__result-card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">메뉴별 조회 통계</span>
          </div>
        </div>

        {!hasApplied ? (
          <div className="menu-views-stats-page__placeholder" role="status">
            기간을 선택한 뒤 조회하면 메뉴별 조회 통계가 표시됩니다.
          </div>
        ) : statsQuery.isError ? (
          <div
            className="menu-views-stats-page__placeholder page-content-error"
            role="alert"
          >
            통계를 불러오지 못했습니다. 다시 조회해 주세요.
          </div>
        ) : (
          <>
            {summary ? (
              <MenuViewSummaryTable
                summary={summary}
                loading={statsQuery.isLoading || statsQuery.isFetching}
              />
            ) : statsQuery.isLoading ? (
              <div className="menu-views-stats-page__placeholder" role="status">
                통계를 불러오는 중…
              </div>
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
              {statsQuery.isLoading && !statsQuery.data ? (
                <div className="menu-views-stats-page__placeholder" role="status">
                  통계를 불러오는 중…
                </div>
              ) : (
                <MenuViewTabPanel tabId={activeTab} sections={sections} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
