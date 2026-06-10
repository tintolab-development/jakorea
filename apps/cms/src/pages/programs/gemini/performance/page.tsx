/**
 * 프로그램 관리 > Gemini 프로그램 > 실적 관리
 * FilterTableLayout + 공통 필터 규격(240/500px)
 */

import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { GEMINI_PERFORMANCE_FILTER_FIELDS } from '@/features/program/gemini/model/performance/filter-fields'
import '@/pages/programs/program-list-page.css'

type PendingFilters = {
  instructorName: string
  trainingMethod: 'ALL' | 'OFFLINE' | 'ONLINE' | 'HYBRID'
  trainingLocation: string
  trainingDateRange: [Dayjs | null, Dayjs | null] | null
}

const INITIAL_PENDING_FILTERS: PendingFilters = {
  instructorName: '',
  trainingMethod: 'ALL',
  trainingLocation: '',
  trainingDateRange: null,
}

export function GeminiPerformancePage() {
  const [pendingFilters, setPendingFilters] =
    useState<PendingFilters>(INITIAL_PENDING_FILTERS)

  const filters = useMemo(
    () => ({
      instructorName: pendingFilters.instructorName,
      trainingMethod: pendingFilters.trainingMethod,
      trainingLocation: pendingFilters.trainingLocation,
      trainingDateRange: pendingFilters.trainingDateRange ?? undefined,
    }),
    [pendingFilters]
  )

  return (
    <div className="program-list-page">
      <FilterTableLayout
        bordered={false}
        filterResponsiveWrap={false}
        fields={GEMINI_PERFORMANCE_FILTER_FIELDS}
        filters={filters}
        onFilterChange={(key, value) => {
          if (key === 'trainingMethod') {
            setPendingFilters(prev => ({
              ...prev,
              trainingMethod: (value == null ? 'ALL' : String(value)) as PendingFilters['trainingMethod'],
            }))
            return
          }
          if (key === 'trainingDateRange') {
            setPendingFilters(prev => ({
              ...prev,
              trainingDateRange: value as [Dayjs | null, Dayjs | null] | null,
            }))
            return
          }
          setPendingFilters(prev => ({
            ...prev,
            [key]: value == null ? '' : String(value),
          }))
        }}
        onSearch={() => {
          // TODO: API 연동 후 검색 적용
        }}
        title="전체 프로그램"
        description="총 0건"
        hideExcelDownload
      >
        {/* TODO: 연수 실적 테이블·목업 연동 */}
        <div />
      </FilterTableLayout>
    </div>
  )
}
