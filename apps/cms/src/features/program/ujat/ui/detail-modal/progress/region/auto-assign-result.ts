import {
  UJAT_CAPACITY_WARNING_VOLUNTEER_SHORTAGE,
  type UjatAutoAssignmentResponse,
} from '@/features/program/ujat/api/education-execution-api'
import type { UjatCapacityWarning } from '@/features/program/ujat/api/temporary-schedule-api'
import type { RegionAssignmentTableData } from './types'

export const AUTO_ASSIGN_RERUN_CONFIRM_MESSAGE =
  '기존 확정 배정은 유지됩니다.\n미배정 학급은 가용 봉사자 수에 따라 2인 또는 1인으로 배정되며, 기존 1인 학급에는 봉사자가 추가 배정될 수 있습니다.\n자동배정을 실행할까요?'

/** 배정된 셀이 하나라도 있으면 재실행으로 보고 확인 모달을 띄운다. */
export function hasExistingRegionAssignments(data: RegionAssignmentTableData): boolean {
  return data.rows.some(row => row.cells.some(cell => cell.kind === 'assigned'))
}

function formatCount(value: number | null | undefined): string {
  return value != null && Number.isFinite(value) ? `${value}건` : '-'
}

function formatCapacityWarning(warning: UjatCapacityWarning): string | null {
  const message = warning.message?.trim()
  if (message) return message
  if (warning.capacityType === UJAT_CAPACITY_WARNING_VOLUNTEER_SHORTAGE) {
    return `봉사자 인원이 부족합니다. (필요 ${warning.maxCount ?? '-'}명 · 배정 ${warning.currentCount ?? '-'}명)`
  }
  return null
}

export type AutoAssignResultSummary = {
  lines: string[]
  warnings: string[]
  hasVolunteerShortage: boolean
}

export function summarizeAutoAssignResult(
  response: UjatAutoAssignmentResponse | null | undefined
): AutoAssignResultSummary {
  const single = response?.singleAssignedCount ?? 0
  const unassigned = response?.unassignedCount ?? 0
  const secondaryUnfilled = response?.secondaryUnfilledCount ?? 0
  const capacityWarnings = response?.capacityWarnings ?? []
  const hasShortageWarning = capacityWarnings.some(
    warning => warning.capacityType === UJAT_CAPACITY_WARNING_VOLUNTEER_SHORTAGE
  )

  const lines = [
    `대상 학급 ${formatCount(response?.targetSlotCount)}`,
    `2인 배정 ${formatCount(response?.pairAssignedCount)} · 1인 배정 ${formatCount(
      response?.singleAssignedCount
    )} · 미배정 ${formatCount(response?.unassignedCount)}`,
    `1인 학급 보강 성공 ${formatCount(response?.secondaryAddedCount)} · 실패 ${formatCount(
      response?.secondaryUnfilledCount
    )}`,
  ]

  const warnings: string[] = []
  if (single > 0) {
    warnings.push(`봉사자가 부족해 일부 학급이 1인으로 배정되었습니다. (${single}건)`)
  }
  if (unassigned > 0) {
    warnings.push(
      `배정 가능한 봉사자가 부족하여 일부 학급이 미배정 상태입니다. (${unassigned}건)`
    )
  }
  if (secondaryUnfilled > 0) {
    warnings.push(
      `일부 학급의 추가 봉사자 배정이 완료되지 않았습니다. (${secondaryUnfilled}건)`
    )
  }
  for (const warning of capacityWarnings) {
    if (warning.capacityType === UJAT_CAPACITY_WARNING_VOLUNTEER_SHORTAGE) continue
    const text = formatCapacityWarning(warning)
    if (text) warnings.push(text)
  }

  const pairSplitCount = (response?.results ?? []).filter(
    row => row.reason?.trim().toUpperCase() === 'PAIR_SPLIT'
  ).length
  if (pairSplitCount > 0) {
    warnings.push(
      `기존 2인조에서 한 명을 옮겨 1인 학급을 커버했습니다. (${pairSplitCount}건)`
    )
  }

  return {
    lines,
    warnings,
    hasVolunteerShortage: hasShortageWarning || single > 0 || secondaryUnfilled > 0,
  }
}

export function collectAutoAssignRefreshSlotIds(
  results: UjatAutoAssignmentResponse['results']
): number[] {
  const ids = new Set<number>()
  for (const row of results ?? []) {
    if (typeof row.educationSlotId === 'number' && Number.isFinite(row.educationSlotId)) {
      ids.add(row.educationSlotId)
    }
    if (
      typeof row.sourceEducationSlotId === 'number' &&
      Number.isFinite(row.sourceEducationSlotId)
    ) {
      ids.add(row.sourceEducationSlotId)
    }
  }
  return [...ids]
}

export type AutoAssignResultAlert = {
  title: string
  content: string
}

export function buildAutoAssignResultAlert(
  response: UjatAutoAssignmentResponse | null | undefined
): AutoAssignResultAlert {
  const { lines, warnings } = summarizeAutoAssignResult(response)
  const head = ['교육일 자동 배정이 완료되었습니다.', ...lines]

  if (warnings.length === 0) {
    return { title: '안내', content: head.join('\n') }
  }
  return {
    title: '확인 필요',
    content: [...head, '', ...warnings.map(warning => `· ${warning}`)].join('\n'),
  }
}
