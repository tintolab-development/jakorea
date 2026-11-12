import type { MypageProgramStats } from '../../../model/types'
import type { EducationApplicationListItem } from '../model/types'
import { resolveEducationApplicationTab } from './display-status.ts'

/** 나의 홈·현황 탭과 동일 — displayStatus 기준으로 신청/진행/종료 건수를 집계한다. */
export function summarizeMypageProgramStatsFromApplications(
  items: readonly EducationApplicationListItem[],
): MypageProgramStats {
  const stats: MypageProgramStats = { applied: 0, inProgress: 0, completed: 0 }
  for (const item of items) {
    const tab = resolveEducationApplicationTab(item.displayStatus)
    if (tab === 'applied') stats.applied += 1
    else if (tab === 'in_progress') stats.inProgress += 1
    else stats.completed += 1
  }
  return stats
}
