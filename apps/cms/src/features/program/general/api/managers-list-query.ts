/**
 * 담당자 정보 UI 필터 → GET …/managers query
 * OpenAPI에 list query가 명시되지 않아 keyword/role만 전달 (미지원 시 BE 무시).
 */

import { toProgramManagerApiRole } from '@/features/program/general/api/adapters/program-managers-adapters'
import type { ProgramRole } from '@/types/user'

export type ProgramManagersListQuery = {
  keyword?: string
  role?: string
}

export type ProgramManagersUiFilters = {
  managerName?: string
  role?: string
}

function trimKeyword(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function isProgramRole(value: string): value is ProgramRole {
  return value === 'OWNER' || value === 'PARTNER' || value === 'ASSISTANT'
}

/** 조회 시 API에 실을 query */
export function buildProgramManagersListQuery(
  filters: ProgramManagersUiFilters = {}
): ProgramManagersListQuery {
  const keyword = trimKeyword(filters.managerName)
  const roleRaw = filters.role?.trim()
  const role =
    roleRaw && roleRaw !== 'all' && isProgramRole(roleRaw)
      ? toProgramManagerApiRole(roleRaw)
      : undefined

  return {
    ...(keyword ? { keyword } : {}),
    ...(role ? { role } : {}),
  }
}

export function serializeProgramManagersListQuery(query: ProgramManagersListQuery): string {
  return JSON.stringify({
    keyword: query.keyword ?? '',
    role: query.role ?? '',
  })
}
