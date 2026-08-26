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
 */
export function useSponsorProgramHistoryFilter(
  sponsorId: string
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

  const remoteEnabled = useDataManagementRemoteEnabled('sponsors', Boolean(sponsorId))

  const query = useQuery({
    queryKey: dataManagementQueryKeys.sponsors.programHistories(sponsorId, paramsKey),
    queryFn: () => getSponsorProgramHistories(sponsorId, appliedFilters),
    enabled: remoteEnabled && Boolean(sponsorId),
    staleTime: 30_000,
    retry: false,
  })

  const filteredRows = useMemo((): SponsorProgramHistoryRow[] => {
    const items = query.data?.items ?? []
    // participantType 등 BE 미지원 키는 클라 보조 매칭
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
