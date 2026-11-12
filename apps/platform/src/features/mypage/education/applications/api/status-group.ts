import type { EducationApplicationTab } from '../model/types'
import type { ProgramApplicationStatusGroup } from './types'

/**
 * 강의·교육·봉사현황 탭 → GET /api/portal/me/program-applications `statusGroup`.
 *
 * BE handoff (옵션 A, 2026-10-06):
 * - 전체 → statusGroup 생략 (`작성 중` 포함)
 * - 신청한 프로그램 → WAITING (`결과 대기`, `서류 합격` — `작성 중` 제외)
 *   목록 UI는 BE statusGroup과 어긋날 때 displayStatus 기준 클라이언트 탭 분류를 쓴다(hooks).
 * - 진행중인 프로그램 → IN_PROGRESS
 * - 종료된 프로그램 → COMPLETED (`진행 완료`, `활동 포기`, `신청 반려`, `신청 취소`)
 * - CANCELLED 는 deprecated (COMPLETED와 동일) — FE에서 쓰지 않음
 */
export function resolveStatusGroupForTab(
  tab: EducationApplicationTab,
): ProgramApplicationStatusGroup | null {
  switch (tab) {
    case 'applied':
      return 'WAITING'
    case 'in_progress':
      return 'IN_PROGRESS'
    case 'completed':
      return 'COMPLETED'
    case 'all':
      return null
  }
}

/** @deprecated use resolveStatusGroupForTab — 단일 statusGroup 계약 */
export function resolveStatusGroupsForTab(
  tab: EducationApplicationTab,
): readonly ProgramApplicationStatusGroup[] | null {
  const group = resolveStatusGroupForTab(tab)
  return group == null ? null : [group]
}
