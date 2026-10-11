/**
 * 대시보드 데이터 커스텀 훅 (mock 제거 — 빈 집계)
 */

import { useMemo } from 'react'

export interface DashboardStats {
  pendingActions: {
    settlementApprovalPending: number
    applicationReviewPending: number
    scheduleConflictCount: number
  }
  monthlySettlement: {
    totalAmount: number
    previousTotalAmount: number
    changeRate: number
    statusCounts: {
      pending: number
      calculated: number
      approved: number
      paid: number
      cancelled: number
    }
  }
  monthlyApplications: {
    total: number
    previousTotal: number
    changeCount: number
    statusCounts: {
      submitted: number
      reviewing: number
      approved: number
      rejected: number
      cancelled: number
    }
  }
  activePrograms: {
    count: number
    thisWeekSchedules: number
    nextWeekSchedules: number
  }
}

const EMPTY_STATS: DashboardStats = {
  pendingActions: {
    settlementApprovalPending: 0,
    applicationReviewPending: 0,
    scheduleConflictCount: 0,
  },
  monthlySettlement: {
    totalAmount: 0,
    previousTotalAmount: 0,
    changeRate: 0,
    statusCounts: {
      pending: 0,
      calculated: 0,
      approved: 0,
      paid: 0,
      cancelled: 0,
    },
  },
  monthlyApplications: {
    total: 0,
    previousTotal: 0,
    changeCount: 0,
    statusCounts: {
      submitted: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    },
  },
  activePrograms: {
    count: 0,
    thisWeekSchedules: 0,
    nextWeekSchedules: 0,
  },
}

export function useActiveProgramCount(): number {
  return 0
}

export function useDashboardData(): DashboardStats {
  return useMemo(() => EMPTY_STATS, [])
}
