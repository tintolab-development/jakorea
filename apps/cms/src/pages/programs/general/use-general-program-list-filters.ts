import { useCallback, useMemo, useState } from 'react'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { getGeneralPrograms, invalidateGeneralProgramsCache } from '@/data/mock/general-programs'
import type { Program } from '@/types/domain'
import type { ProgramListView } from '@/features/program/general/ui/table/program-table-column-resolver'
import type { ProgramListConfig } from '@/features/program/general/ui/program-list'

/** 일반 프로그램 목록 — 4카드 위젯 status 쿼리 */
export type GeneralProgramOverviewStatusFilter = 'scheduled' | 'in_progress' | 'completed'

export interface GeneralProgramListQueryParams extends Record<string, string | undefined> {
  programId?: string
  status?: GeneralProgramOverviewStatusFilter | 'economy_scheduled' | 'economy_in_progress' | 'economy_completed'
}

const overviewStatusValues = ['scheduled', 'in_progress', 'completed'] as const

export function useGeneralProgramListFilters() {
  const { params, setParam } = useQueryParams<GeneralProgramListQueryParams>()
  const [listVersion, setListVersion] = useState(0)

  const refetchPrograms = useCallback(() => {
    invalidateGeneralProgramsCache()
    setListVersion(v => v + 1)
  }, [])

  const statusFilter = useMemo<GeneralProgramOverviewStatusFilter | null>(() => {
    const value = params.status
    if (value && (overviewStatusValues as readonly string[]).includes(value)) {
      return value as GeneralProgramOverviewStatusFilter
    }
    // 하위 호환: 기존 economy_* 쿼리 키
    if (value === 'economy_scheduled') return 'scheduled'
    if (value === 'economy_in_progress') return 'in_progress'
    if (value === 'economy_completed') return 'completed'
    return null
  }, [params.status])

  const filteredPrograms = useMemo(() => {
    void listVersion
    let filtered: Program[] = getGeneralPrograms()

    if (statusFilter === 'scheduled') {
      filtered = filtered.filter(program =>
        [
          'recruiting_students',
          'recruiting_instructors',
          'matching_completed',
          'education_before_textbook',
        ].includes(program.lifecycleStatus || '')
      )
    } else if (statusFilter === 'in_progress') {
      filtered = filtered.filter(program =>
        ['education_after_textbook', 'education_in_progress'].includes(
          program.lifecycleStatus || ''
        )
      )
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(program =>
        ['education_completed', 'document_processing_completed'].includes(
          program.lifecycleStatus || ''
        )
      )
    }

    return filtered
  }, [statusFilter, listVersion])

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
  }
}
