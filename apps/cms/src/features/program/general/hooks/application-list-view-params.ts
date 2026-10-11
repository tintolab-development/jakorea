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

export type ApplicationListViewMode = 'table' | 'calendar'

export function parseApplicationListViewMode(
  searchParams: URLSearchParams,
  paramName: string | null | undefined
): ApplicationListViewMode {
  if (!paramName) return 'table'
  return searchParams.get(paramName) === 'calendar' ? 'calendar' : 'table'
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
