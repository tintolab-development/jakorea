/**
 * 일반 프로그램 상세 — 신청 목록(기관·참여자·강사) 리스트/캘린더 뷰 URL 연동
 * - 값 `calendar` (생략 시 리스트)
 */

export const INSTITUTION_APPLICATION_VIEW_PARAM = 'institutionApplicationView'
export const PARTICIPANT_APPLICATION_VIEW_PARAM = 'participantApplicationView'
export const INSTRUCTOR_APPLICATION_VIEW_PARAM = 'instructorApplicationView'

export const APPLICATION_LIST_VIEW_PARAMS = [
  INSTITUTION_APPLICATION_VIEW_PARAM,
  PARTICIPANT_APPLICATION_VIEW_PARAM,
  INSTRUCTOR_APPLICATION_VIEW_PARAM,
] as const

export type ApplicationListViewParam = (typeof APPLICATION_LIST_VIEW_PARAMS)[number]

export type ApplicationListViewMode = 'table' | 'calendar'

/** 참여자 신청 목록 LNB — 기관·개인 메뉴 canonical param 상호 alias */
const PARTICIPANT_APPLICATION_LIST_VIEW_ALIASES: Partial<
  Record<ApplicationListViewParam, readonly ApplicationListViewParam[]>
> = {
  [INSTITUTION_APPLICATION_VIEW_PARAM]: [PARTICIPANT_APPLICATION_VIEW_PARAM],
  [PARTICIPANT_APPLICATION_VIEW_PARAM]: [INSTITUTION_APPLICATION_VIEW_PARAM],
}

export function parseApplicationListViewMode(
  searchParams: URLSearchParams,
  paramName: ApplicationListViewParam | null | undefined
): ApplicationListViewMode {
  if (!paramName) return 'table'
  const keys: ApplicationListViewParam[] = [
    paramName,
    ...(PARTICIPANT_APPLICATION_LIST_VIEW_ALIASES[paramName] ?? []),
  ]
  for (const key of keys) {
    if (searchParams.get(key) === 'calendar') return 'calendar'
  }
  return 'table'
}

/**
 * 참여자 신청 목록(main) — 외부·북마크 URL의 view param을 프로그램 유형별 canonical로 맞춘다.
 * @returns searchParams 변경 여부
 */
export function canonicalizeParticipantApplicationListViewParams(
  next: URLSearchParams,
  options: { isIndividualParticipantProgram: boolean }
): boolean {
  const canonical = options.isIndividualParticipantProgram
    ? PARTICIPANT_APPLICATION_VIEW_PARAM
    : INSTITUTION_APPLICATION_VIEW_PARAM
  const alias = options.isIndividualParticipantProgram
    ? INSTITUTION_APPLICATION_VIEW_PARAM
    : PARTICIPANT_APPLICATION_VIEW_PARAM

  const wantsCalendar =
    next.get(canonical) === 'calendar' || next.get(alias) === 'calendar'
  if (!wantsCalendar) return false

  let changed = false
  if (next.get(canonical) !== 'calendar') {
    next.set(canonical, 'calendar')
    changed = true
  }
  for (const key of APPLICATION_LIST_VIEW_PARAMS) {
    if (key === canonical) continue
    if (next.has(key)) {
      next.delete(key)
      changed = true
    }
  }
  return changed
}

export function applyApplicationListViewMode(
  next: URLSearchParams,
  paramName: string,
  mode: ApplicationListViewMode
): void {
  for (const key of APPLICATION_LIST_VIEW_PARAMS) {
    if (key !== paramName) next.delete(key)
  }
  if (mode === 'table') next.delete(paramName)
  else next.set(paramName, 'calendar')
}

/** 현재 LNB 메뉴에 해당하지 않는 신청 목록 캘린더 쿼리 제거 (북마크·딥링크 정리) */
export function clearInactiveApplicationListViewParams(
  next: URLSearchParams,
  activeParam: string | null | undefined
): void {
  for (const key of APPLICATION_LIST_VIEW_PARAMS) {
    if (key !== activeParam) next.delete(key)
  }
}
