/**
 * 대시보드 데이터 커스텀 훅
 * Phase 3: 성능 최적화 및 데이터 중앙화
 */

import { useMemo } from 'react'
import { mockSettlements, mockApplications, mockSchedules, mockPrograms } from '@/data/mock'
import dayjs from 'dayjs'

export interface DashboardStats {
  // 즉시 처리 필요 작업
  pendingActions: {
    settlementApprovalPending: number
    applicationReviewPending: number
    scheduleConflictCount: number
  }
  // 월별 정산 현황
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
  // 이번 달 신청 현황
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
  // 진행 중 프로그램
  activePrograms: {
    count: number
    thisWeekSchedules: number
    nextWeekSchedules: number
  }
}

/**
 * 대시보드 통계 데이터를 계산하는 커스텀 훅
 * 모든 계산을 한 번에 수행하여 성능 최적화
 */
export function useDashboardData(): DashboardStats {
  return useMemo(() => {
    const currentMonth = dayjs().format('YYYY-MM')
    const previousMonth = dayjs().subtract(1, 'month').format('YYYY-MM')
    const today = dayjs()
    const nextWeek = today.add(7, 'day')
    const twoWeeksLater = today.add(14, 'day')

    // ==========================================
    // 즉시 처리 필요 작업
    // ==========================================
    const settlementApprovalPending = mockSettlements.filter(
      s => s.status === 'calculated' || s.status === 'approved'
    ).length

    const applicationReviewPending = mockApplications.filter(
      a => a.status === 'submitted' || a.status === 'reviewing'
    ).length

    // 일정 중복 경고 계산
    const scheduleConflicts = new Set<string>()
    mockSchedules.forEach(schedule1 => {
      if (!schedule1.instructorId) return
      const date1 = typeof schedule1.date === 'string' ? dayjs(schedule1.date) : dayjs(schedule1.date)
      const start1 = dayjs(`${date1.format('YYYY-MM-DD')} ${schedule1.startTime}`, 'YYYY-MM-DD HH:mm')
      const end1 = dayjs(`${date1.format('YYYY-MM-DD')} ${schedule1.endTime}`, 'YYYY-MM-DD HH:mm')

      mockSchedules.forEach(schedule2 => {
        if (
          schedule1.id === schedule2.id ||
          !schedule2.instructorId ||
          schedule1.instructorId !== schedule2.instructorId
        ) {
          return
        }

        const date2 = typeof schedule2.date === 'string' ? dayjs(schedule2.date) : dayjs(schedule2.date)
        if (!date1.isSame(date2, 'day')) return

        const start2 = dayjs(`${date2.format('YYYY-MM-DD')} ${schedule2.startTime}`, 'YYYY-MM-DD HH:mm')
        const end2 = dayjs(`${date2.format('YYYY-MM-DD')} ${schedule2.endTime}`, 'YYYY-MM-DD HH:mm')

        if (start1.isBefore(end2) && end1.isAfter(start2)) {
          scheduleConflicts.add(schedule1.id)
        }
      })
    })

    // ==========================================
    // 월별 정산 현황
    // ==========================================
    const monthlySettlements = mockSettlements.filter(s => {
      const settlementMonth = typeof s.period === 'string' && s.period.match(/^\d{4}-\d{2}$/)
        ? s.period
        : dayjs(s.createdAt).format('YYYY-MM')
      return settlementMonth === currentMonth
    })

    const previousMonthlySettlements = mockSettlements.filter(s => {
      const settlementMonth = typeof s.period === 'string' && s.period.match(/^\d{4}-\d{2}$/)
        ? s.period
        : dayjs(s.createdAt).format('YYYY-MM')
      return settlementMonth === previousMonth
    })

    const totalAmount = monthlySettlements.reduce((sum, s) => sum + s.totalAmount, 0)
    const previousTotalAmount = previousMonthlySettlements.reduce((sum, s) => sum + s.totalAmount, 0)
    const changeRate = previousTotalAmount > 0
      ? ((totalAmount - previousTotalAmount) / previousTotalAmount) * 100
      : totalAmount > 0 ? 100 : 0

    // ==========================================
    // 이번 달 신청 현황
    // ==========================================
    const monthlyApplications = mockApplications.filter(a => {
      const applicationMonth = dayjs(a.createdAt).format('YYYY-MM')
      return applicationMonth === currentMonth
    })

    const previousMonthlyApplications = mockApplications.filter(a => {
      const applicationMonth = dayjs(a.createdAt).format('YYYY-MM')
      return applicationMonth === previousMonth
    })

    const applicationTotal = monthlyApplications.length
    const previousApplicationTotal = previousMonthlyApplications.length
    const changeCount = applicationTotal - previousApplicationTotal

    // ==========================================
    // 진행 중 프로그램
    // ==========================================
    const activePrograms = mockPrograms.filter(p => p.status === 'active')

    const thisWeekSchedules = mockSchedules.filter(s => {
      const scheduleDate = typeof s.date === 'string' ? dayjs(s.date) : dayjs(s.date)
      return scheduleDate.isAfter(today.subtract(1, 'day')) && scheduleDate.isBefore(nextWeek.add(1, 'day'))
    })

    const nextWeekSchedules = mockSchedules.filter(s => {
      const scheduleDate = typeof s.date === 'string' ? dayjs(s.date) : dayjs(s.date)
      return scheduleDate.isAfter(nextWeek.subtract(1, 'day')) && scheduleDate.isBefore(twoWeeksLater.add(1, 'day'))
    })

    return {
      pendingActions: {
        settlementApprovalPending,
        applicationReviewPending,
        scheduleConflictCount: scheduleConflicts.size,
      },
      monthlySettlement: {
        totalAmount,
        previousTotalAmount,
        changeRate,
        statusCounts: {
          pending: monthlySettlements.filter(s => s.status === 'pending').length,
          calculated: monthlySettlements.filter(s => s.status === 'calculated').length,
          approved: monthlySettlements.filter(s => s.status === 'approved').length,
          paid: monthlySettlements.filter(s => s.status === 'paid').length,
          cancelled: monthlySettlements.filter(s => s.status === 'cancelled').length,
        },
      },
      monthlyApplications: {
        total: applicationTotal,
        previousTotal: previousApplicationTotal,
        changeCount,
        statusCounts: {
          submitted: monthlyApplications.filter(a => a.status === 'submitted').length,
          reviewing: monthlyApplications.filter(a => a.status === 'reviewing').length,
          approved: monthlyApplications.filter(a => a.status === 'approved').length,
          rejected: monthlyApplications.filter(a => a.status === 'rejected').length,
          cancelled: monthlyApplications.filter(a => a.status === 'cancelled').length,
        },
      },
      activePrograms: {
        count: activePrograms.length,
        thisWeekSchedules: thisWeekSchedules.length,
        nextWeekSchedules: nextWeekSchedules.length,
      },
    }
  }, []) // mock 데이터는 변경되지 않으므로 의존성 배열 비움
}




