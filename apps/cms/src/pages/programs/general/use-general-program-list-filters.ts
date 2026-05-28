import { useMemo } from 'react'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { getGeneralPrograms } from '@/data/mock/general-programs'
import type { Program } from '@/types/domain'
import type { EconomyView } from '@/features/program/general/ui/table/program-table-column-resolver'
import type { ProgramListConfig } from '@/features/program/general/ui/program-list'

/** 일반 프로그램 목록 — 4카드 위젯과 동일한 status 쿼리 */
export type GeneralProgramEconomyStatusFilter =
  | 'economy_scheduled'
  | 'economy_in_progress'
  | 'economy_completed'

export interface GeneralProgramListQueryParams extends Record<string, string | undefined> {
  programId?: string
  status?: GeneralProgramEconomyStatusFilter
}

const economyStatusValues: GeneralProgramEconomyStatusFilter[] = [
  'economy_scheduled',
  'economy_in_progress',
  'economy_completed',
]

export function useGeneralProgramListFilters() {
  const { params, setParam } = useQueryParams<GeneralProgramListQueryParams>()

  const statusFilter = useMemo<GeneralProgramEconomyStatusFilter | null>(() => {
    const value = params.status
    if (value && economyStatusValues.includes(value as GeneralProgramEconomyStatusFilter)) {
      return value as GeneralProgramEconomyStatusFilter
    }
    return null
  }, [params.status])

  const filteredPrograms = useMemo(() => {
    let filtered: Program[] = getGeneralPrograms()

    if (statusFilter === 'economy_scheduled') {
      filtered = filtered.filter(program =>
        [
          'recruiting_students',
          'recruiting_instructors',
          'matching_completed',
          'education_before_textbook',
        ].includes(program.lifecycleStatus || '')
      )
    } else if (statusFilter === 'economy_in_progress') {
      filtered = filtered.filter(program => program.lifecycleStatus === 'education_after_textbook')
    } else if (statusFilter === 'economy_completed') {
      filtered = filtered.filter(program =>
        ['education_completed', 'document_processing_completed'].includes(
          program.lifecycleStatus || ''
        )
      )
    }

    return filtered
  }, [statusFilter])

  const headerTitle = useMemo(() => {
    if (statusFilter === 'economy_scheduled') return '진행 예정 프로그램'
    if (statusFilter === 'economy_in_progress') return '진행 중인 프로그램'
    if (statusFilter === 'economy_completed') return '진행 완료된 프로그램'
    return '전체 프로그램'
  }, [statusFilter])

  const programListConfig = useMemo((): ProgramListConfig => {
    const economyView: EconomyView =
      statusFilter === 'economy_scheduled'
        ? 'SCHEDULED'
        : statusFilter === 'economy_in_progress'
          ? 'IN_PROGRESS'
          : statusFilter === 'economy_completed'
            ? 'COMPLETED'
            : 'ALL'

    return {
      mode: 'economy',
      filterProfile: 'general-overview',
      view: economyView,
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
  }
}
