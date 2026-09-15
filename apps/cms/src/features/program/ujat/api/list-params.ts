import type { AdminProgramsListQuery } from '@/features/program/general/api/programs-api-client'
import { GENERAL_PROGRAM_LIST_PAGE_SIZE } from '@/features/program/general/api/general-program-list-filter-params'

export const UJAT_PROGRAM_LIST_PAGE_SIZE = GENERAL_PROGRAM_LIST_PAGE_SIZE

export type ListParams = {
  keyword?: string
  businessYear?: number
  page?: number
  size?: number
}

export function toRemoteListParams(params: ListParams): AdminProgramsListQuery {
  return {
    ...params,
    programType: 'UJAT',
    page: params.page ?? 0,
    size: params.size ?? UJAT_PROGRAM_LIST_PAGE_SIZE,
  }
}
