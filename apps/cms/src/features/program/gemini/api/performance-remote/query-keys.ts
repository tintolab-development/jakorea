import type { GeminiTrainingReportDeliveryTypeWire } from './client'

/** 실적 목록 서버 검색 조건(모두 `GET /training-reports` 쿼리) */
export type GeminiPerformanceListQueryFilters = {
  instructorName?: string
  trainingLocation?: string
  /** `YYYY-MM-DD` 연수일 시작(포함) */
  dateFrom?: string
  /** `YYYY-MM-DD` 연수일 끝(포함) */
  dateTo?: string
  deliveryType?: GeminiTrainingReportDeliveryTypeWire
}

export const geminiPerformanceQueryKeys = {
  all: ['cms', 'programs', 'gemini', 'performance'] as const,
  list: (filters: GeminiPerformanceListQueryFilters | string = {}) =>
    [
      ...geminiPerformanceQueryKeys.all,
      'list',
      typeof filters === 'string' ? filters : JSON.stringify(filters),
    ] as const,
}
