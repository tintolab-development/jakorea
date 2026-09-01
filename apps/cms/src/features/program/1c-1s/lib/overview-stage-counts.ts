import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import type { CompanySchoolOverviewStatusFilter } from '@/features/program/1c-1s/api/list-params'

/** 1사1교 목록 4카드(전체/예정/진행/완료) — 목록 필터와 동일 기준 */
export type CompanySchoolOverviewStageCounts = {
  scheduled: number
  inProgress: number
  completed: number
  total: number
}

function getProgramOperationDatePhase(
  program: Program
): CompanySchoolOverviewStatusFilter | null {
  const start = dayjs(program.startDate)
  const end = dayjs(program.endDate)
  if (!start.isValid() || !end.isValid()) return null

  const today = dayjs().startOf('day')
  if (today.isBefore(start.startOf('day'))) return 'scheduled'
  if (today.isBefore(end.startOf('day'))) return 'in_progress'
  return 'completed'
}

/**
 * mock 목록 overview status 필터 — `use-program-list-filters` 와 동일.
 * remote는 API `periodStatus`가 SSOT이므로 이 함수를 쓰지 않음.
 */
export function filterCompanySchoolProgramsByOverviewStatus(
  programs: readonly Program[],
  status: CompanySchoolOverviewStatusFilter
): Program[] {
  return programs.filter(program => {
    const operationPhase = getProgramOperationDatePhase(program)
    if (status === 'scheduled') {
      if (operationPhase) return operationPhase === 'scheduled'
      return [
        'recruiting_students',
        'recruiting_instructors',
        'matching_completed',
        'education_before_textbook',
      ].includes(program.lifecycleStatus || '')
    }
    if (status === 'in_progress') {
      if (operationPhase) return operationPhase === 'in_progress'
      return program.lifecycleStatus === 'education_after_textbook'
    }
    if (operationPhase) return operationPhase === 'completed'
    return ['education_completed', 'document_processing_completed'].includes(
      program.lifecycleStatus || ''
    )
  })
}

/**
 * 운영 기간·lifecycle 버킷으로 집계.
 * `total`은 목록 「전체」와 같이 필터 전 전체 건수(버킷 합과 다를 수 있음).
 */
export function countCompanySchoolOverviewStages(
  programs: readonly Program[]
): CompanySchoolOverviewStageCounts {
  const list = [...programs]
  return {
    total: list.length,
    scheduled: filterCompanySchoolProgramsByOverviewStatus(list, 'scheduled').length,
    inProgress: filterCompanySchoolProgramsByOverviewStatus(list, 'in_progress').length,
    completed: filterCompanySchoolProgramsByOverviewStatus(list, 'completed').length,
  }
}
