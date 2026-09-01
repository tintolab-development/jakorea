/**
 * 방문자 통계
 */

import { useCallback, useMemo, useState } from 'react'
import {
  VISITOR_STATS_UNIT_LABELS,
  VISITOR_STATS_UNITS,
  type VisitorStatsQuery,
  type VisitorStatsUnit,
} from '@/entities/visitor-stats/model/types'
import {
  useVisitorStats,
  useVisitorStatsFilterOptions,
} from '@/features/visitor-stats/api/hooks'
import {
  VisitorStatsFilterCard,
  type VisitorStatsPendingFilters,
} from '@/features/visitor-stats/ui/filter-card'
import { VisitorStatsSummaryBar } from '@/features/visitor-stats/ui/summary-bar'
import { VisitorStatsTable } from '@/features/visitor-stats/ui/stats-table'
import { CmsTextTabs } from '@/shared/ui'
import type { CmsSelectMultipleOption } from '@/shared/ui'

import './page.css'

const EMPTY_FILTER: VisitorStatsPendingFilters = {
  years: [],
  months: [],
  from: null,
  to: null,
}

const DEFAULT_APPLIED: VisitorStatsQuery = {
  unit: 'year',
  ...EMPTY_FILTER,
}

const TAB_ITEMS = VISITOR_STATS_UNITS.map(key => ({
  key,
  label: VISITOR_STATS_UNIT_LABELS[key],
}))

const MONTH_LABELS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
]

export function VisitorsStatsPage() {
  const filterOptions = useVisitorStatsFilterOptions()
  const [unit, setUnit] = useState<VisitorStatsUnit>('year')
  const [pending, setPending] = useState<VisitorStatsPendingFilters>(EMPTY_FILTER)
  const [applied, setApplied] = useState<VisitorStatsQuery>(DEFAULT_APPLIED)

  const statsQuery = useVisitorStats(applied)

  const yearOptions = useMemo<CmsSelectMultipleOption[]>(
    () => filterOptions.years.map(y => ({ value: y, label: y })),
    [filterOptions.years]
  )

  const monthOptions = useMemo<CmsSelectMultipleOption[]>(
    () =>
      filterOptions.months.map((m, i) => ({
        value: m,
        label: MONTH_LABELS[i] ?? m,
      })),
    [filterOptions.months]
  )

  const handleSearch = useCallback(() => {
    setApplied({
      unit,
      years: [...pending.years],
      months: [...pending.months],
      from: pending.from,
      to: pending.to,
    })
  }, [pending, unit])

  const handleTabChange = useCallback((next: VisitorStatsUnit) => {
    setUnit(next)
    setPending(EMPTY_FILTER)
    setApplied({
      unit: next,
      ...EMPTY_FILTER,
    })
  }, [])

  const rows = statsQuery.data?.rows ?? []
  const total = statsQuery.data?.totalVisitors ?? 0
  const loading = statsQuery.isLoading || statsQuery.isFetching

  return (
    <div className="visitor-stats-page">
      <VisitorStatsFilterCard
        unit={unit}
        pending={pending}
        yearOptions={yearOptions}
        monthOptions={monthOptions}
        onPendingChange={setPending}
        onSearch={handleSearch}
        loading={loading}
      />

      <div className="admin-list-card visitor-stats-page__result-card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">방문자 통계</span>
          </div>
        </div>

        {statsQuery.isError ? (
          <div className="visitor-stats-page__placeholder page-content-error" role="alert">
            통계를 불러오지 못했습니다. 다시 조회해 주세요.
          </div>
        ) : (
          <>
            <VisitorStatsSummaryBar total={total} loading={loading && !statsQuery.data} />

            <CmsTextTabs
              variant="list"
              activeKey={unit}
              onChange={handleTabChange}
              items={TAB_ITEMS}
              ariaLabel="방문자 통계 조회 단위"
              className="visitor-stats-page__tabs"
            />

            <VisitorStatsTable
              unit={applied.unit}
              rows={rows}
              loading={loading && !statsQuery.data}
            />
          </>
        )}
      </div>
    </div>
  )
}
