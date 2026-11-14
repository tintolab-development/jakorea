import type { MypageProgramStats } from '../../../model/types'
import type { EducationApplicationListItem, EducationDisplayStatus } from '../model/types'
import { resolveEducationApplicationTab } from './display-status.ts'

/** USER-FUNC-0141 — 홈 카드에서 신청 거절·취소는 신청·진행·종료 어디에도 넣지 않는다. */
const HOME_STATS_EXCLUDED_STATUSES = new Set<EducationDisplayStatus>([
  'rejected',
  'approval_cancelled',
  'cancelled',
])

function statsItemKey(item: EducationApplicationListItem): string {
  return `${item.applicationType ?? 'application'}:${item.id}`
}

/** 나의 홈 현황 카드 — displayStatus 기준. 목록 탭 분류와 같되 반려·취소는 제외한다. */
export function summarizeMypageProgramStatsFromApplications(
  items: readonly EducationApplicationListItem[],
): MypageProgramStats {
  const stats: MypageProgramStats = { applied: 0, inProgress: 0, completed: 0 }
  const seen = new Set<string>()
  for (const item of items) {
    const key = statsItemKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    if (HOME_STATS_EXCLUDED_STATUSES.has(item.displayStatus)) continue
    const tab = resolveEducationApplicationTab(item.displayStatus)
    if (tab === 'applied') stats.applied += 1
    else if (tab === 'in_progress') stats.inProgress += 1
    else stats.completed += 1
  }
  return stats
}
