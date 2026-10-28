import {
  UJAT_CAPACITY_WARNING_VOLUNTEER_SHORTAGE,
  type UjatAutoAssignmentResponse,
} from '@/features/program/ujat/api/education-execution-api'
import type { UjatCapacityWarning } from '@/features/program/ujat/api/temporary-schedule-api'
import type { RegionAssignmentTableData } from './types'

export const AUTO_ASSIGN_RERUN_CONFIRM_MESSAGE =
  '기존 배정은 유지되고 미배정 교육일·학급만 배정됩니다.\n교육일 자동 배정을 실행할까요?'

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

  const lines = [
    `2인 배정 ${formatCount(response?.pairAssignedCount)} · 1인 배정 ${formatCount(
      response?.singleAssignedCount
    )} · 미배정 ${formatCount(response?.unassignedCount)}`,
    `1인 슬롯 보강 성공 ${formatCount(response?.secondaryAddedCount)} · 실패 ${formatCount(
      response?.secondaryUnfilledCount
    )}`,
  ]

  const warnings: string[] = []
  if (single > 0) {
    warnings.push(`1인 배정(ASSIGNED_SINGLE) ${single}건이 있습니다. 파트너 배정을 확인해 주세요.`)
  }
  if (secondaryUnfilled > 0) {
    warnings.push(`1인 슬롯 보강 실패 ${secondaryUnfilled}건은 1인으로 유지됩니다.`)
  }
  if (unassigned > 0) {
    warnings.push(`미배정 ${unassigned}건이 있습니다. 직접 배정으로 보완해 주세요.`)
  }
  for (const warning of capacityWarnings) {
    const text = formatCapacityWarning(warning)
    if (text) warnings.push(text)
  }

  return {
    lines,
    warnings,
    hasVolunteerShortage: capacityWarnings.some(
      warning => warning.capacityType === UJAT_CAPACITY_WARNING_VOLUNTEER_SHORTAGE
    ),
  }
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
