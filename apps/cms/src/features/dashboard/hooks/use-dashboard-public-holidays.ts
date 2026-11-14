import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchKoreanPublicHolidays } from '@/features/program/ujat/api/korean-public-holidays'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardRemoteQueryEnabled } from '@/features/dashboard/hooks/use-dashboard-query-scope'

const EMPTY_HOLIDAY_DATE_KEYS: ReadonlySet<string> = new Set()

/**
 * 대시보드 캘린더 표시 기간의 대한민국 공휴일(YYYY-MM-DD) — 서버 공휴일 API 재사용.
 * 조회 전·실패(권한 없음 등)·mock 모드면 빈 집합(일·토 색상만 적용).
 * 프로그램 일정 유틸용 전역 동기 집합은 건드리지 않는다.
 */
export function useDashboardPublicHolidayDateKeys(
  dateFrom: string | undefined,
  dateTo: string | undefined
): ReadonlySet<string> {
  const remoteEnabled = useDashboardRemoteQueryEnabled(Boolean(dateFrom && dateTo))
  const range = { from: dateFrom ?? '', to: dateTo ?? '' }
  const query = useQuery({
    queryKey: dashboardQueryKeys.koreanPublicHolidays('remote', range),
    queryFn: () => fetchKoreanPublicHolidays(range),
    enabled: remoteEnabled,
    // 정적 참조 데이터(공휴일 표) — 기존 공휴일 조회 훅과 같은 24시간
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })
  return useMemo(
    () => (query.data ? new Set(query.data) : EMPTY_HOLIDAY_DATE_KEYS),
    [query.data]
  )
}
