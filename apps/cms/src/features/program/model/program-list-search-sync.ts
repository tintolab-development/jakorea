/**
 * ProgramList — useTableSearch용 URL·컬럼 필터 동기화 설정
 */

import type { ProgramLifecycleStatus } from '@/types/domain'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type { Dayjs } from 'dayjs'

export interface ProgramListPendingFilters extends Record<string, unknown> {
  title: string
  lifecycleStatus: ProgramLifecycleStatus | undefined
  category: string | undefined
  businessArea: string | undefined
  targetLevel: string | undefined
  type: string | undefined
  participantRecruitment: string | undefined
  applicationStartDate: Dayjs | null
  applicationEndDate: Dayjs | null
  operationStartDate: Dayjs | null
  operationEndDate: Dayjs | null
}

const operationPeriodRule: TableSearchParamRule<ProgramListPendingFilters> = {
  kind: 'apply',
  apply: (nextParams, f) => {
    if (f.operationStartDate && f.operationEndDate) {
      nextParams.set('operationStartDate', f.operationStartDate.format('YYYY-MM-DD'))
      nextParams.set('operationEndDate', f.operationEndDate.format('YYYY-MM-DD'))
    } else {
      nextParams.delete('operationStartDate')
      nextParams.delete('operationEndDate')
    }
  },
}

export const economyProgramListParamConfig = [
  {
    kind: 'param' as const,
    filterKey: 'title' as const,
    paramKey: 'title',
    condition: (_f, v) => Boolean(String(v ?? '').trim()),
    transform: v => String(v ?? '').trim(),
  },
  {
    kind: 'param' as const,
    filterKey: 'lifecycleStatus' as const,
    paramKey: 'lifecycleStatus',
  },
  {
    kind: 'param' as const,
    filterKey: 'category' as const,
    paramKey: 'category',
  },
  {
    kind: 'param' as const,
    filterKey: 'targetLevel' as const,
    paramKey: 'targetLevel',
  },
  {
    kind: 'param' as const,
    filterKey: 'participantRecruitment' as const,
    paramKey: 'participantRecruitment',
  },
  operationPeriodRule,
] satisfies readonly TableSearchParamRule<ProgramListPendingFilters>[]

export const economyProgramListTableConfig: Record<
  string,
  (filters: ProgramListPendingFilters) => unknown
> = {
  category: f => f.category ?? null,
  targetLevel: f => f.targetLevel ?? null,
}

export function economyProgramListAfterApplyParams(nextParams: URLSearchParams): void {
  nextParams.delete('statusText')
}

export const educationProgramListParamConfig = [
  {
    kind: 'param' as const,
    filterKey: 'title' as const,
    paramKey: 'title',
    condition: (_f, v) => Boolean(v),
  },
  {
    kind: 'param' as const,
    filterKey: 'lifecycleStatus' as const,
    paramKey: 'status',
  },
  {
    kind: 'param' as const,
    filterKey: 'type' as const,
    paramKey: 'type',
    condition: (_f, v) => Boolean(v && v !== 'all'),
  },
  operationPeriodRule,
] satisfies readonly TableSearchParamRule<ProgramListPendingFilters>[]

export const educationProgramListTableConfig: Record<
  string,
  (filters: ProgramListPendingFilters) => unknown
> = {
  category: f => f.category ?? null,
  businessArea: f => f.businessArea ?? null,
  targetLevel: f => f.targetLevel ?? null,
  type: f => (f.type && f.type !== 'all' ? f.type : null),
}
