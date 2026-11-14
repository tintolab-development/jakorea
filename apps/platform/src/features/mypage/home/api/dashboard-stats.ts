import type { MypageProgramStats } from '../../model/types'
import type { PortalApplicationSummary, PortalDashboardResponse } from './client'

const EMPTY_STATS: MypageProgramStats = {
  applied: 0,
  inProgress: 0,
  completed: 0,
}

function count(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function asApplications(value: unknown): PortalApplicationSummary | undefined {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as PortalApplicationSummary
}

/**
 * GET /api/portal/me/dashboard — 홈 정본은 루트 `applications`.
 * envelope `data` 안으로 들어가기 전에 applications가 있으면 그걸 쓴다.
 * pendingActions / upcomingSchedules / recentNotices / instructorRoleRequest 는 읽지 않는다.
 */
export function readPortalDashboard(payload: unknown): PortalDashboardResponse {
  let current: unknown = payload
  while (current && typeof current === 'object') {
    const record = current as Record<string, unknown>
    if ('applications' in record) {
      return { applications: asApplications(record.applications) }
    }
    if (record.success === true && 'data' in record) {
      current = record.data
      continue
    }
    break
  }
  return {}
}

/**
 * dashboard.applications 집계. 나의 홈 카드는 USER-FUNC-0237에 맞춰
 * `fetchMypageProgramStatsFromApplications`가 정본이다.
 * 신청=submitted(결과 대기·서류 합격·승인 대기), 진행중=inProgress, 종료=ended.
 * approved는 승인 원본 상태 기준이라 inProgress·ended와 겹치므로 더하지 않는다.
 */
export function mapPortalDashboardStats(
  summary: PortalApplicationSummary | undefined,
): MypageProgramStats {
  if (!summary) return EMPTY_STATS
  return {
    applied: count(summary.submitted),
    inProgress: count(summary.inProgress),
    completed: count(summary.ended),
  }
}
