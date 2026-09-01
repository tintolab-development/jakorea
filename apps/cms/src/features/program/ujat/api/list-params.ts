import type { AdminProgramsListQuery } from '@/features/program/general/api/programs-api-client'

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
    size: params.size ?? 500,
  }
}
