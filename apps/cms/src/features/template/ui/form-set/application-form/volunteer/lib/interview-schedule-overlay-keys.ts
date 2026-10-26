/** 봉사 면접 overlay 키 이름(스토어 아님). 스토어 읽기·쓰기는 `interview-schedule-overlay-sync`. */

export type VolunteerInterviewOverlayStore = 'application' | 'recruit'

export function getInterviewOverlayKeyPrefix(
  store: VolunteerInterviewOverlayStore,
  namespace?: string
): string {
  if (namespace?.trim()) return namespace.trim()
  return store === 'recruit' ? 'recruit.volunteer.interview' : 'application.volunteer.interview'
}

export function buildVolunteerInterviewOverlayKey(
  store: VolunteerInterviewOverlayStore,
  suffix: string,
  namespace?: string
): string {
  return `${getInterviewOverlayKeyPrefix(store, namespace)}.${suffix}`
}
