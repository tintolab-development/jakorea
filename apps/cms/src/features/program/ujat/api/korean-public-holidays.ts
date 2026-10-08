import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import type { KoreanPublicHolidayResponse } from '@/shared/api/generated/dashboard/schemas/koreanPublicHolidayResponse'

/** `year` 또는 `from`+`to`(포함, 최대 2년) 중 하나 */
export type KoreanPublicHolidayQuery = { year: number } | { from: string; to: string }

export async function fetchKoreanPublicHolidays(
  query: KoreanPublicHolidayQuery
): Promise<string[]> {
  const body = await unwrapApiBody<KoreanPublicHolidayResponse>(
    await customInstance({
      url: '/api/admin/calendar/korean-public-holidays',
      method: 'GET',
      params: query,
    })
  )
  return body?.dates ?? []
}

function resolveRangeQuery(
  from: string | Date | null | undefined,
  to: string | Date | null | undefined
): { from: string; to: string } | null {
  const start = from ? dayjs(from) : null
  if (!start?.isValid()) return null
  const parsedEnd = to ? dayjs(to) : start
  const end = parsedEnd.isValid() && !parsedEnd.isBefore(start, 'day') ? parsedEnd : start
  return { from: start.format('YYYY-MM-DD'), to: end.format('YYYY-MM-DD') }
}

/** 기간 내 공휴일 — 실패·미조회 시 빈 집합 */
export function useKoreanPublicHolidayDateKeys(input: {
  from?: string | Date | null
  to?: string | Date | null
  enabled: boolean
}): Set<string> {
  const range = resolveRangeQuery(input.from, input.to)
  const query = useQuery({
    queryKey: [...ujatQueryKeys.all, 'korean-public-holidays', range?.from ?? '', range?.to ?? ''] as const,
    queryFn: () => fetchKoreanPublicHolidays(range!),
    enabled: input.enabled && range != null,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })
  return useMemo(() => new Set(query.data ?? []), [query.data])
}
