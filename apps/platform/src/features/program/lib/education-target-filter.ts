import type { EducationTargetKey, ProgramListItem, ProgramsListParams } from '../model/types'
import { DEFAULT_PROGRAMS_LIST_PARAMS } from './constants.ts'

export function programEducationTargetKeys(program: ProgramListItem): EducationTargetKey[] {
  if (program.educationTargetKeys.length > 0) return program.educationTargetKeys
  return program.educationTargetKey != null ? [program.educationTargetKey] : []
}

export function programMatchesEducationTargetFilter(
  program: ProgramListItem,
  filterValue: string,
): boolean {
  if (!filterValue || filterValue === DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentTarget) {
    return true
  }
  const key = filterValue.trim().toLowerCase() as EducationTargetKey
  return programEducationTargetKeys(program).includes(key)
}

/** 모집대상·교육대상 필터 — `educationTargets` 복수 OR 포함 */
export function filterProgramsByEducationTargetParams(
  items: readonly ProgramListItem[],
  params: Pick<ProgramsListParams, 'recruitmentTarget' | 'educationTarget'>,
): ProgramListItem[] {
  let result = [...items]
  if (params.recruitmentTarget !== DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentTarget) {
    result = result.filter(program =>
      programMatchesEducationTargetFilter(program, params.recruitmentTarget),
    )
  }
  if (params.educationTarget !== DEFAULT_PROGRAMS_LIST_PARAMS.educationTarget) {
    result = result.filter(program =>
      programMatchesEducationTargetFilter(program, params.educationTarget),
    )
  }
  return result
}
