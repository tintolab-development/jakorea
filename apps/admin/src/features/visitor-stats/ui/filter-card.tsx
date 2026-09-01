/**
 * 방문자 통계 — 검색 필터
 */

import dayjs, { type Dayjs } from 'dayjs'
import type { VisitorStatsFilter, VisitorStatsUnit } from '@/entities/visitor-stats/model/types'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import {
  CmsButton,
  CmsDateRangePicker,
  CmsSelect,
} from '@/shared/ui'
import type { CmsSelectMultipleOption } from '@/shared/ui'

import './section-shared.css'

export type VisitorStatsPendingFilters = VisitorStatsFilter

type Props = {
  unit: VisitorStatsUnit
  pending: VisitorStatsPendingFilters
  yearOptions: CmsSelectMultipleOption[]
  monthOptions: CmsSelectMultipleOption[]
  onPendingChange: (next: VisitorStatsPendingFilters) => void
  onSearch: () => void
  loading?: boolean
}

function rangeAsPicker(
  from: string | null,
  to: string | null
): [Dayjs | null, Dayjs | null] {
  return [from ? dayjs(from) : null, to ? dayjs(to) : null]
}

export function VisitorStatsFilterCard({
  unit,
  pending,
  yearOptions,
  monthOptions,
  onPendingChange,
  onSearch,
  loading,
}: Props) {
  return (
    <div className="admin-list-card visitor-stats-filter-card">
      <div className="admin-filter-area">
        {unit === 'year' || unit === 'month' ? (
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <p className="admin-filter-area__label">연도</p>
            <CmsSelect
              mode="multiple"
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="전체"
              allowClear
              options={yearOptions}
              value={pending.years}
              onChange={v =>
                onPendingChange({
                  ...pending,
                  years: Array.isArray(v) ? v.map(String) : [],
                })
              }
            />
          </div>
        ) : null}

        {unit === 'month' ? (
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <p className="admin-filter-area__label">월</p>
            <CmsSelect
              mode="multiple"
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="전체"
              allowClear
              options={monthOptions}
              value={pending.months}
              onChange={v =>
                onPendingChange({
                  ...pending,
                  months: Array.isArray(v) ? v.map(String) : [],
                })
              }
            />
          </div>
        ) : null}

        {unit === 'day' ? (
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <p className="admin-filter-area__label">기간</p>
            <CmsDateRangePicker
              inputSize="large"
              width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
              value={rangeAsPicker(pending.from, pending.to)}
              placeholder={['시작일', '종료일']}
              allowClear
              onChange={dates => {
                if (!dates || (!dates[0] && !dates[1])) {
                  onPendingChange({ ...pending, from: null, to: null })
                  return
                }
                onPendingChange({
                  ...pending,
                  from: dates[0] ? dates[0].format('YYYY-MM-DD') : null,
                  to: dates[1] ? dates[1].format('YYYY-MM-DD') : null,
                })
              }}
            />
          </div>
        ) : null}

        <div className="admin-filter-area__actions">
          <CmsButton
            className="admin-filter-area__search-button"
            variant="primary"
            size="large"
            width={FILTER_SEARCH_BUTTON_WIDTH_PX}
            type="button"
            loading={loading}
            onClick={onSearch}
          >
            조회
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
