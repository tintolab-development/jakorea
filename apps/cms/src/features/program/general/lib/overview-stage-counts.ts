import { filterGeneralProgramsByOverviewStatus } from '@/features/program/general/api/adapters/general-program-adapters'
import type { Program } from '@/types/domain'

/** 일반 프로그램 목록 4카드(전체/예정/진행/완료) — 목록 필터와 동일 기준 */
export type GeneralProgramOverviewStageCounts = {
  scheduled: number
  inProgress: number
  completed: number
  total: number
}

/**
 * lifecycleStatus 버킷으로 집계.
 * `total`은 목록 「전체」와 같이 필터 전 전체 건수(버킷 합과 다를 수 있음).
 */
export function countGeneralProgramOverviewStages(
  programs: readonly Program[]
): GeneralProgramOverviewStageCounts {
  const list = [...programs]
  return {
    total: list.length,
    scheduled: filterGeneralProgramsByOverviewStatus(list, 'scheduled').length,
    inProgress: filterGeneralProgramsByOverviewStatus(list, 'in_progress').length,
    completed: filterGeneralProgramsByOverviewStatus(list, 'completed').length,
  }
}
