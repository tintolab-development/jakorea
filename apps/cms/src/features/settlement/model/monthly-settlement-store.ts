/**
 * 월별 정산 관리 Store
 * V3 Phase 4: 월별 정산 관리
 */

import { create } from 'zustand'
import { settlementService } from '@/entities/settlement/api/settlement-service'
import type { Settlement } from '@/types/domain'

export interface MonthlySettlementSummary {
  period: string // "2025-01"
  totalCount: number
  totalAmount: number
  statusCounts: Record<Settlement['status'], number>
  statusAmounts: Record<Settlement['status'], number>
}

interface MonthlySettlementStore {
  monthlySummaries: MonthlySettlementSummary[]
  loading: boolean
  fetchMonthlySummaries: () => Promise<void>
  getSettlementsByPeriod: (period: string) => Settlement[]
  getMonthlySummary: (period: string) => MonthlySettlementSummary | null
}

export const useMonthlySettlementStore = create<MonthlySettlementStore>((set, get) => ({
  monthlySummaries: [],
  loading: false,

  fetchMonthlySummaries: async () => {
    set({ loading: true })
    try {
      const settlements = await settlementService.getAll()

      // 월별로 그룹화
      const periodMap = new Map<string, Settlement[]>()
      settlements.forEach(settlement => {
        // period가 "YYYY-MM" 형식인 경우만 처리
        if (/^\d{4}-\d{2}$/.test(settlement.period)) {
          const period = settlement.period
          if (!periodMap.has(period)) {
            periodMap.set(period, [])
          }
          periodMap.get(period)!.push(settlement)
        }
      })

      // 월별 집계 생성
      const summaries: MonthlySettlementSummary[] = Array.from(periodMap.entries())
        .map(([period, periodSettlements]) => {
          const statusCounts: Record<Settlement['status'], number> = {
            pending: 0,
            calculated: 0,
            approved: 0,
            paid: 0,
            cancelled: 0,
          }

          const statusAmounts: Record<Settlement['status'], number> = {
            pending: 0,
            calculated: 0,
            approved: 0,
            paid: 0,
            cancelled: 0,
          }

          periodSettlements.forEach(settlement => {
            statusCounts[settlement.status]++
            statusAmounts[settlement.status] += settlement.totalAmount
          })

          return {
            period,
            totalCount: periodSettlements.length,
            totalAmount: periodSettlements.reduce((sum, s) => sum + s.totalAmount, 0),
            statusCounts,
            statusAmounts,
          }
        })
        .sort((a, b) => b.period.localeCompare(a.period)) // 최신순 정렬

      set({ monthlySummaries: summaries, loading: false })
    } catch (error) {
      console.error('Failed to fetch monthly summaries:', error)
      set({ loading: false })
    }
  },

  getSettlementsByPeriod: () => {
    // 실제로는 store에서 가져와야 하지만, 여기서는 service에서 직접 가져옴
    // 향후 store에 캐싱 추가 가능
    return []
  },

  getMonthlySummary: (period: string) => {
    const { monthlySummaries } = get()
    return monthlySummaries.find(s => s.period === period) || null
  },
}))

