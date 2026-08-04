import type { ProgramListItem, ProgramsListParams } from '../model/types'
import { DEFAULT_PROGRAMS_LIST_PARAMS } from './constants'
import { programOverlapsOperatingYear } from './mock-programs'

/** Platform: 모집 예정 우선, 모집 중, 모집 완료 후순위 */
const STATUS_RANK: Record<string, number> = {
  scheduled: 0,
  recruiting: 1,
  closed: 2,
}

function parseYmdTime(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : time
}

/**
 * 목록 탭·필터·정렬 pure 함수.
 * UI state 변경 시 네트워크 재요청 없이 클라이언트에서 적용한다.
 */
export function filterAndSortPrograms(
  programs: readonly ProgramListItem[],
  params: Pick<
    ProgramsListParams,
    | 'category'
    | 'q'
    | 'recruitmentTarget'
    | 'recruitmentStatus'
    | 'operatingPeriod'
    | 'educationTarget'
    | 'educationForm'
    | 'sort'
  >
): ProgramListItem[] {
  let items = [...programs]

  if (params.category !== DEFAULT_PROGRAMS_LIST_PARAMS.category) {
    items = items.filter(program => program.category === params.category)
  }

  if (params.q.trim()) {
    const query = params.q.trim().toLowerCase()
    items = items.filter(program => program.title.toLowerCase().includes(query))
  }

  if (params.operatingPeriod !== DEFAULT_PROGRAMS_LIST_PARAMS.operatingPeriod) {
    items = items.filter(program =>
      programOverlapsOperatingYear(program, params.operatingPeriod)
    )
  }

  if (params.recruitmentTarget !== DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentTarget) {
    items = items.filter(program => program.educationTargetKey === params.recruitmentTarget)
  }

  if (params.educationTarget !== DEFAULT_PROGRAMS_LIST_PARAMS.educationTarget) {
    items = items.filter(program => program.educationTargetKey === params.educationTarget)
  }

  if (params.recruitmentStatus !== DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentStatus) {
    items = items.filter(program => program.recruitmentStatus === params.recruitmentStatus)
  }

  if (params.educationForm !== DEFAULT_PROGRAMS_LIST_PARAMS.educationForm) {
    items = items.filter(program => program.educationForm === params.educationForm)
  }

  if (params.sort === 'name') {
    items.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    return items
  }

  if (params.sort === 'closing-soon') {
    items.sort((a, b) => {
      const rankA = STATUS_RANK[a.recruitmentStatus] ?? 9
      const rankB = STATUS_RANK[b.recruitmentStatus] ?? 9
      if (rankA !== rankB) return rankA - rankB

      const endA = parseYmdTime(a.applicationEndDate)
      const endB = parseYmdTime(b.applicationEndDate)
      if (endA == null && endB == null) return 0
      if (endA == null) return 1
      if (endB == null) return -1
      return endA - endB
    })
    return items
  }

  // latest (default) — 모집 시작일 내림차순
  items.sort((a, b) => {
    const startA = parseYmdTime(a.applicationStartDate)
    const startB = parseYmdTime(b.applicationStartDate)
    if (startA == null && startB == null) return 0
    if (startA == null) return 1
    if (startB == null) return -1
    return startB - startA
  })
  return items
}
