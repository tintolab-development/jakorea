import { useCallback, useMemo, useState, type Key } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSponsorProgramHistories } from '@/features/sponsor/api/admin-sponsors-service'
import { programHistoriesParamsFromFilters } from '@/features/sponsor/api/program-histories-filter-params'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import type {
  SponsorProgramHistoryFilters,
  SponsorProgramHistoryRow,
} from '@/features/sponsor/model/sponsor-management.types'
import {
  matchesProgramHistoryFilter,
  SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
} from '@/features/sponsor/utils/match-program-history-filter'
import type { UseProgramHistoryFilterReturn } from '@/features/sponsor/hooks/use-program-history-filter'

const INITIAL_PROGRAM_HISTORY_FILTERS = {
  title: '',
  year: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
  lifecycleStatus: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
  participantType: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
  educationTarget: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
  managerName: '',
} as const satisfies SponsorProgramHistoryFilters

export type UseSponsorProgramHistoryFilterReturn = UseProgramHistoryFilterReturn & {
  isLoading: boolean
  isError: boolean
  totalElements: number
}

/**
 * 후원사 상세 — 프로그램 진행 이력 서버 필터·페이지 API
 * @param enabled LNB 프로그램 이력 탭일 때만 true (기본정보 오픈 시 GET 방지)
 */
export function useSponsorProgramHistoryFilter(
  sponsorId: string,
  enabled = true
): UseSponsorProgramHistoryFilterReturn {
  const [pendingFilters, setPendingFilters] = useState<SponsorProgramHistoryFilters>(
    INITIAL_PROGRAM_HISTORY_FILTERS
  )
  const [appliedFilters, setAppliedFilters] = useState<SponsorProgramHistoryFilters>(
    INITIAL_PROGRAM_HISTORY_FILTERS
  )
  const [selectedKeys, setSelectedKeysState] = useState<Key[]>([])

  const paramsKey = useMemo(
    () => JSON.stringify(programHistoriesParamsFromFilters(appliedFilters)),
    [appliedFilters]
  )
  /**
   * BE educationTarget 필터는 복수 대상 문자열에서 일치하지 않는 경우가 있어,
   * 조회는 동일 조건의 전체 교육 대상을 받고 정규화된 응답으로 FE에서 포함 매칭한다.
   * query key에는 선택값을 유지해 필터별 캐시가 섞이지 않게 한다.
   */
  const serverFilters = useMemo<SponsorProgramHistoryFilters>(
    () => ({
      ...appliedFilters,
      educationTarget: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
    }),
    [appliedFilters]
  )

  const remoteEnabled = useDataManagementRemoteEnabled(
    'sponsors',
    enabled && Boolean(sponsorId)
  )

  const query = useQuery({
    queryKey: dataManagementQueryKeys.sponsors.programHistories(sponsorId, paramsKey),
    queryFn: () => getSponsorProgramHistories(sponsorId, serverFilters),
    enabled: remoteEnabled && enabled && Boolean(sponsorId),
    staleTime: 30_000,
    retry: false,
  })

  const filteredRows = useMemo((): SponsorProgramHistoryRow[] => {
    const items = query.data?.items ?? []
    // educationTarget 복수 대상 및 BE 미지원·불완전 키는 클라이언트 보조 매칭
    return items.filter(row => matchesProgramHistoryFilter(row, appliedFilters))
  }, [appliedFilters, query.data?.items])

  const setSelectedKeys = useCallback((keys: Key[]): void => {
    setSelectedKeysState(keys.map(k => String(k)))
  }, [])

  const handleFilterChange = useCallback((key: string, value: string): void => {
    setPendingFilters(prev => ({ ...prev, [key]: value ?? '' }))
  }, [])

  const handleSearch = useCallback((): void => {
    setAppliedFilters(pendingFilters)
  }, [pendingFilters])

  return {
    pendingFilters,
    filteredRows,
    selectedKeys,
    setSelectedKeys,
    handleFilterChange,
    handleSearch,
    isLoading: query.isLoading,
    isError: query.isError,
    totalElements: query.data?.totalElements ?? filteredRows.length,
  }
}
