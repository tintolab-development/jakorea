import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { invalidateGeneralProgramsCache } from '@/data/mock/general-programs'
import {
  fetchGeneralProgramsRemoteList,
  getGeneralProgramsMockList,
} from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useGeneralProgramsRemoteEnabled } from '@/features/program/general/hooks/use-general-programs-remote-enabled'
import {
  GENERAL_PROGRAM_OVERVIEW_STATUS_VALUES,
  type GeneralProgramOverviewStatusFilter,
} from '@/features/program/general/lib/list-status-filter'
import type { ProgramListView } from '@/features/program/general/ui/table/program-table-column-resolver'
import type { ProgramListConfig } from '@/features/program/general/ui/program-list'
import { useQueryParams } from '@/shared/hooks/use-query-params'

export type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'

export interface GeneralProgramListQueryParams extends Record<string, string | undefined> {
  programId?: string
  status?: GeneralProgramOverviewStatusFilter | 'economy_scheduled' | 'economy_in_progress' | 'economy_completed'
}

export function useGeneralProgramListFilters() {
  const { params, setParam } = useQueryParams<GeneralProgramListQueryParams>()
  const [mockListVersion, setMockListVersion] = useState(0)
  const remoteEnabled = useGeneralProgramsRemoteEnabled()

  const statusFilter = useMemo<GeneralProgramOverviewStatusFilter | null>(() => {
    const value = params.status
    if (value && (GENERAL_PROGRAM_OVERVIEW_STATUS_VALUES as readonly string[]).includes(value)) {
      return value as GeneralProgramOverviewStatusFilter
    }
    if (value === 'economy_scheduled') return 'scheduled'
    if (value === 'economy_in_progress') return 'in_progress'
    if (value === 'economy_completed') return 'completed'
    return null
  }, [params.status])

  const remoteListQuery = useQuery({
    queryKey: generalProgramQueryKeys.list(statusFilter),
    queryFn: () => fetchGeneralProgramsRemoteList(statusFilter),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const filteredPrograms = useMemo(() => {
    if (remoteEnabled) {
      return remoteListQuery.data ?? []
    }
    void mockListVersion
    return getGeneralProgramsMockList(statusFilter)
  }, [remoteEnabled, remoteListQuery.data, statusFilter, mockListVersion])

  const refetchPrograms = useCallback(() => {
    if (remoteEnabled) {
      void remoteListQuery.refetch()
      return
    }
    invalidateGeneralProgramsCache()
    setMockListVersion(v => v + 1)
  }, [remoteEnabled, remoteListQuery])

  const headerTitle = useMemo(() => {
    if (statusFilter === 'scheduled') return '예정 프로그램'
    if (statusFilter === 'in_progress') return '진행 중인 프로그램'
    if (statusFilter === 'completed') return '완료 프로그램'
    return '전체 프로그램'
  }, [statusFilter])

  const programListConfig = useMemo((): ProgramListConfig => {
    const listView: ProgramListView =
      statusFilter === 'scheduled'
        ? 'SCHEDULED'
        : statusFilter === 'in_progress'
          ? 'IN_PROGRESS'
          : statusFilter === 'completed'
            ? 'COMPLETED'
            : 'ALL'

    return {
      mode: 'overview',
      view: listView,
      lifecycleStatus: undefined,
    }
  }, [statusFilter])

  return {
    statusFilter,
    filteredPrograms,
    headerTitle,
    programListConfig,
    params,
    setParam,
    refetchPrograms,
    loading: remoteEnabled ? remoteListQuery.isFetching : false,
    isRemoteDataSource: remoteEnabled,
  }
}
