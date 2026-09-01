import { useCallback, useMemo, useState, type Key } from 'react'
import type {
  SponsorProgramHistoryFilters,
  SponsorProgramHistoryRow,
} from '@/features/sponsor/model/sponsor-management.types'
import {
  matchesProgramHistoryFilter,
  SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
} from '@/features/sponsor/utils/match-program-history-filter'

const INITIAL_PROGRAM_HISTORY_FILTERS = {
  title: '',
  year: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
  lifecycleStatus: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
  participantType: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
  educationTarget: SPONSOR_PROGRAM_HISTORY_FILTER_ALL,
  managerName: '',
} as const satisfies SponsorProgramHistoryFilters

export interface UseProgramHistoryFilterReturn {
  pendingFilters: SponsorProgramHistoryFilters
  filteredRows: SponsorProgramHistoryRow[]
  selectedKeys: Key[]
  setSelectedKeys: (keys: Key[]) => void
  handleFilterChange: (key: string, value: string) => void
  handleSearch: () => void
}

/**
 * 프로그램 이력 필터의 입력(pending)·적용(applied) 상태를 분리하고, 검색 시 `matchesProgramHistoryFilter`로 목록을 도출합니다.
 */
export function useProgramHistoryFilter(
  programHistories: SponsorProgramHistoryRow[]
): UseProgramHistoryFilterReturn {
  const [pendingFilters, setPendingFilters] = useState<SponsorProgramHistoryFilters>(
    INITIAL_PROGRAM_HISTORY_FILTERS
  )
  const [appliedFilters, setAppliedFilters] = useState<SponsorProgramHistoryFilters>(
    INITIAL_PROGRAM_HISTORY_FILTERS
  )
  const [selectedKeys, setSelectedKeysState] = useState<Key[]>([])

  const setSelectedKeys = useCallback((keys: Key[]): void => {
    setSelectedKeysState(keys.map(k => String(k)))
  }, [])

  const filteredRows = useMemo((): SponsorProgramHistoryRow[] => {
    return programHistories.filter(row => matchesProgramHistoryFilter(row, appliedFilters))
  }, [programHistories, appliedFilters])

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
  }
}
