import dayjs, { type Dayjs } from 'dayjs'
import { getSeoulCalendarDate } from '@/shared/utils/date'
import type { GeminiPerformanceListQueryFilters } from '../../api/performance-remote/query-keys'
import type { GeminiPerformanceTrainingMethod } from '../../model/performance/types'

/** 실적 목록 화면 필터(조회 버튼으로 적용된 값) */
export type GeminiPerformanceListUiFilters = {
  instructorName: string
  trainingMethod: 'ALL' | GeminiPerformanceTrainingMethod
  trainingLocation: string
  trainingDateRange: [Dayjs | null, Dayjs | null] | null
}

/** 연수일 기본값 — 올해 1월 1일 ~ 오늘(Asia/Seoul 달력일) */
export function getGeminiPerformanceDefaultDateRange(now: Date = new Date()): [Dayjs, Dayjs] {
  const today = dayjs(getSeoulCalendarDate(now))
  return [today.startOf('year'), today]
}

function toDateKey(value: Dayjs | null | undefined): string | undefined {
  return value && value.isValid() ? value.format('YYYY-MM-DD') : undefined
}

/**
 * 화면 필터 → `GET /training-reports` 서버 검색 조건.
 * 연수방식·연수일도 서버가 걸러야 `totalElements`(총 N건)와 표 행 수가 맞는다.
 */
export function toGeminiPerformanceRemoteFilters(
  filters: GeminiPerformanceListUiFilters
): GeminiPerformanceListQueryFilters {
  return {
    instructorName: filters.instructorName.trim() || undefined,
    trainingLocation: filters.trainingLocation.trim() || undefined,
    dateFrom: toDateKey(filters.trainingDateRange?.[0]),
    dateTo: toDateKey(filters.trainingDateRange?.[1]),
    deliveryType: filters.trainingMethod === 'ALL' ? undefined : filters.trainingMethod,
  }
}
