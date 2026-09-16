/**
 * 일반 프로그램 FE 시드 (`general-prog-*`) — 서버와 무관하게 목록·상세 QA용
 *
 * `VITE_GENERAL_PROGRAM_FE_SEEDS_ENABLED=true` 일 때만 목록 병합·상세 mock 경로 활성.
 */

import {
  clientFilterGeneralPrograms,
  type GeneralProgramListTableFilters,
} from '@/features/program/general/api/general-program-list-filter-params'
import type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'
import { programMatchesProgressPhase } from '@/features/program/general/ui/constants/program-list-constants'
import { getGeneralPrograms } from '@/data/mock/general-programs'
import type { Program } from '@/types/domain'

export const GENERAL_PROGRAM_FE_SEED_ID_PREFIX = 'general-prog-' as const
export const GENERAL_PROGRAM_FE_SEEDS_ENABLED_ENV =
  'VITE_GENERAL_PROGRAM_FE_SEEDS_ENABLED' as const

/** `.env`에 `VITE_GENERAL_PROGRAM_FE_SEEDS_ENABLED=true` 일 때만 FE 시드 하이브리드 활성 */
export function isGeneralProgramFeSeedsEnabled(): boolean {
  return (
    String(import.meta.env.VITE_GENERAL_PROGRAM_FE_SEEDS_ENABLED).trim().toLowerCase() ===
    'true'
  )
}

/** FE mock 시드 프로그램 id (type / scheduled / lnb 등) — prefix만 판별 */
export function isGeneralProgramFeSeedId(programId: string | undefined | null): boolean {
  return Boolean(programId?.startsWith(GENERAL_PROGRAM_FE_SEED_ID_PREFIX))
}

/**
 * env ON + `general-prog-*` — 목록 병합·remote 스킵·상세 mock 대상
 */
export function shouldUseGeneralProgramFeSeed(
  programId: string | undefined | null
): boolean {
  return isGeneralProgramFeSeedsEnabled() && isGeneralProgramFeSeedId(programId)
}

/**
 * overview 탭·테이블 필터에 맞는 FE 시드 목록.
 * API 목록 상단에 병합할 때 사용. env OFF면 빈 배열.
 */
export function getGeneralProgramFeSeedListForOverview(
  statusFilter: GeneralProgramOverviewStatusFilter | null,
  tableFilters: GeneralProgramListTableFilters = {}
): Program[] {
  if (!isGeneralProgramFeSeedsEnabled()) return []

  let programs = getGeneralPrograms().filter(p => isGeneralProgramFeSeedId(p.id))

  if (statusFilter != null) {
    programs = programs.filter(p => programMatchesProgressPhase(p, statusFilter))
  }

  // title keyword — API는 keyword 쿼리, FE는 클라이언트 필터
  const titleQ = tableFilters.title?.trim().toLowerCase()
  if (titleQ) {
    programs = programs.filter(p => {
      const hay = `${p.title ?? ''} ${p.mainTitle ?? ''}`.toLowerCase()
      return hay.includes(titleQ)
    })
  }

  return clientFilterGeneralPrograms(programs, {
    ...tableFilters,
    title: undefined,
  })
}

/** API 목록 + FE 시드 병합 (시드 상단, id 중복 제거) */
export function mergeGeneralProgramFeSeedsIntoList(
  remotePrograms: Program[],
  feSeeds: Program[]
): Program[] {
  if (feSeeds.length === 0) return remotePrograms
  const seedIds = new Set(feSeeds.map(p => p.id))
  return [...feSeeds, ...remotePrograms.filter(p => !seedIds.has(p.id))]
}
