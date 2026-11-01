import { useMemo } from 'react'
import { PFCircleIconButton, PFSearchFilter, PFSearchInput } from '@/shared/ui'
import { filterSettlementCalendarItems, filterSettlementListItems } from '../lib/filter-items'
import { SETTLEMENT_STATUS_FILTER_OPTIONS } from '../lib/status-presentation'
import type {
  SettlementOverviewPageData,
  SettlementOverviewParams,
  SettlementOverviewStatusFilter,
  SettlementOverviewView,
} from '../model/types'
import { SettlementCalendarView } from './calendar-view'
import { SettlementListView } from './list-view'
import { SettlementSummaryCards } from './summary-cards'
import styles from './overview.module.css'

type SettlementOverviewProps = {
  params: SettlementOverviewParams
  data: SettlementOverviewPageData
  onParamsChange: (next: Partial<SettlementOverviewParams>) => void
  onRefresh?: () => void
  refreshing?: boolean
}

const SEARCH_PLACEHOLDER = '프로그램명 또는 참여 기관명 검색'

export function SettlementOverview({
  params,
  data,
  onParamsChange,
  onRefresh,
  refreshing = false,
}: SettlementOverviewProps) {
  const listItems = useMemo(
    () => filterSettlementListItems(data.items, params),
    [data.items, params],
  )
  const calendarItems = useMemo(
    () => filterSettlementCalendarItems(data.items, params),
    [data.items, params],
  )

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <PFSearchInput
          variant="underline"
          value={params.q}
          placeholder={SEARCH_PLACEHOLDER}
          aria-label={SEARCH_PLACEHOLDER}
          onValueChange={q => onParamsChange({ q })}
          className={styles.search}
        />
        <div className={styles.filterRow}>
          <PFSearchFilter
            label="정산 현황"
            ariaLabel="정산 현황 필터"
            value={params.status}
            options={SETTLEMENT_STATUS_FILTER_OPTIONS}
            onChange={status =>
              onParamsChange({ status: status as SettlementOverviewStatusFilter })
            }
          />
          <PFCircleIconButton
            icon="refresh"
            disabled={!onRefresh || refreshing || params.fixture}
            aria-label={
              params.fixture
                ? 'fixture 모드에서는 새로고침할 수 없습니다.'
                : '정산 현황 새로고침'
            }
            onClick={onRefresh}
          />
        </div>
      </div>

      <SettlementSummaryCards month={params.month} summary={data.summary} />

      {params.view === 'list' ? (
        <SettlementListView month={params.month} items={listItems} />
      ) : (
        <SettlementCalendarView
          month={params.month}
          date={params.date}
          items={calendarItems}
          onMonthChange={(month, date) => onParamsChange({ month, date })}
          onDateChange={date => {
            const month = date.slice(0, 7)
            onParamsChange(month === params.month ? { date } : { month, date })
          }}
        />
      )}
    </div>
  )
}

export const SETTLEMENT_OVERVIEW_VIEW_ITEMS: { key: SettlementOverviewView; label: string }[] = [
  { key: 'list', label: '리스트 뷰' },
  { key: 'calendar', label: '캘린더 뷰' },
]
