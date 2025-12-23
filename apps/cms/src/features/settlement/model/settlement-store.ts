/**
 * 정산 Zustand 스토어
 * Phase 4: 상태 관리
 */

import { create } from 'zustand'
import type { Settlement } from '@/types/domain'
import { settlementService } from '@/entities/settlement/api/settlement-service'

interface SettlementState {
  settlements: Settlement[]
  selectedSettlement: Settlement | null
  loading: boolean
  error: Error | null
  fetchSettlements: () => Promise<void>
  fetchSettlementById: (id: string) => Promise<void>
  createSettlement: (data: Omit<Settlement, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>) => Promise<void>
  updateSettlement: (id: string, data: Partial<Omit<Settlement, 'id' | 'createdAt'>>) => Promise<void>
  deleteSettlement: (id: string) => Promise<void>
  updateStatus: (id: string, status: Settlement['status']) => Promise<void>
  setSelectedSettlement: (settlement: Settlement | null) => void
  clearError: () => void
}

export const useSettlementStore = create<SettlementState>(set => ({
  settlements: [],
  selectedSettlement: null,
  loading: false,
  error: null,

  fetchSettlements: async () => {
    set({ loading: true, error: null })
    try {
      const settlements = await settlementService.getAll()
      set({ settlements, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  fetchSettlementById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const settlement = await settlementService.getById(id)
      set({ selectedSettlement: settlement, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  createSettlement: async (data) => {
    set({ loading: true, error: null })
    try {
      const newSettlement = await settlementService.create(data)
      set(state => ({
        settlements: [...state.settlements, newSettlement],
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  updateSettlement: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updatedSettlement = await settlementService.update(id, data)
      set(state => ({
        settlements: state.settlements.map(s => (s.id === id ? updatedSettlement : s)),
        selectedSettlement: state.selectedSettlement?.id === id ? updatedSettlement : state.selectedSettlement,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  deleteSettlement: async (id) => {
    set({ loading: true, error: null })
    try {
      await settlementService.delete(id)
      set(state => ({
        settlements: state.settlements.filter(s => s.id !== id),
        selectedSettlement: state.selectedSettlement?.id === id ? null : state.selectedSettlement,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  updateStatus: async (id, status) => {
    set({ loading: true, error: null })
    try {
      const updatedSettlement = await settlementService.update(id, { status })
      set(state => ({
        settlements: state.settlements.map(s => (s.id === id ? updatedSettlement : s)),
        selectedSettlement: state.selectedSettlement?.id === id ? updatedSettlement : state.selectedSettlement,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  setSelectedSettlement: (settlement) => set({ selectedSettlement: settlement }),

  clearError: () => set({ error: null }),
}))



