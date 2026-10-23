import type { ProgramDetailCase } from '@/features/program'

export type VolunteerSchedulePanelKind = 'assignments' | 'ujat-schedules'

/**
 * 봉사현황 일정 탭 데이터 원천.
 * UJAT 봉사자는 assignments가 빈 배열(또는 포기 시 거절)이 정상이므로 schedules만 사용한다.
 * 프로그램명에 UJAT가 포함되는지는 보지 않는다.
 */
export function resolveVolunteerSchedulePanelKind(
  detailCase: ProgramDetailCase | undefined,
): VolunteerSchedulePanelKind {
  return detailCase === 'ujat-volunteer' ? 'ujat-schedules' : 'assignments'
}
