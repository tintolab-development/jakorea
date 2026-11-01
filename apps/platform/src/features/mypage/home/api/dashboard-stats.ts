import type { MypageProgramStats } from '../../model/types'
import type { PortalApplicationSummary } from './client'

const EMPTY_STATS: MypageProgramStats = {
  applied: 0,
  inProgress: 0,
  completed: 0,
}

function count(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/** 목록 탭과 같은 묶음. 신청=제출·승인, 종료=`applications.ended`(완료·포기·반려·취소 합산 금지). */
export function mapPortalDashboardStats(
  summary: PortalApplicationSummary | undefined,
): MypageProgramStats {
  if (!summary) return EMPTY_STATS
  return {
    applied: count(summary.submitted) + count(summary.approved),
    inProgress: count(summary.inProgress),
    completed: count(summary.ended),
  }
}
