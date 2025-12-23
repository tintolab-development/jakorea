/**
 * Matching Zustand Store
 * Phase 3.2: 강사 매칭 관리
 */

import { create } from 'zustand'
import type { Matching } from '@/types/domain'
import type { UUID } from '@/types'
import { matchingService } from '@/entities/matching/api/matching-service'

interface MatchingState {
  matchings: Matching[]
  selectedMatching: Matching | null
  loading: boolean
  error: Error | null

  // Actions
  fetchMatchings: () => Promise<void>
  fetchMatchingById: (id: UUID) => Promise<void>
  fetchMatchingsByProgramId: (programId: UUID) => Promise<Matching[]>
  fetchMatchingsByRoundId: (roundId: UUID) => Promise<Matching[]>
  createMatching: (data: Parameters<typeof matchingService.create>[0]) => Promise<Matching>
  updateMatching: (id: UUID, data: Parameters<typeof matchingService.update>[1]) => Promise<void>
  deleteMatching: (id: UUID) => Promise<void>
  confirmMatching: (id: UUID) => Promise<void>
  cancelMatching: (id: UUID, reason?: string) => Promise<void>
  setSelectedMatching: (matching: Matching | null) => void
  clearError: () => void
}

export const useMatchingStore = create<MatchingState>((set) => ({
  matchings: [],
  selectedMatching: null,
  loading: false,
  error: null,

  fetchMatchings: async () => {
    set({ loading: true, error: null })
    try {
      const matchings = await matchingService.getAll()
      set({ matchings, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  fetchMatchingById: async (id: UUID) => {
    set({ loading: true, error: null })
    try {
      const matching = await matchingService.getById(id)
      set({ selectedMatching: matching, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  fetchMatchingsByProgramId: async (programId: UUID) => {
    set({ loading: true, error: null })
    try {
      const matchings = await matchingService.getByProgramId(programId)
      set({ loading: false })
      return matchings
    } catch (error) {
      set({ error: error as Error, loading: false })
      return []
    }
  },

  fetchMatchingsByRoundId: async (roundId: UUID) => {
    set({ loading: true, error: null })
    try {
      const matchings = await matchingService.getByRoundId(roundId)
      set({ loading: false })
      return matchings
    } catch (error) {
      set({ error: error as Error, loading: false })
      return []
    }
  },

  createMatching: async (data) => {
    set({ loading: true, error: null })
    try {
      const newMatching = await matchingService.create(data)
      set(state => ({
        matchings: [...state.matchings, newMatching],
        loading: false,
      }))
      return newMatching
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  updateMatching: async (id, data) => {
    set({ loading: true, error: null })
    try {
      await matchingService.update(id, data)
      const updated = await matchingService.getById(id)
      set(state => ({
        matchings: state.matchings.map(m => (m.id === id ? updated : m)),
        selectedMatching: state.selectedMatching?.id === id ? updated : state.selectedMatching,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  deleteMatching: async (id) => {
    set({ loading: true, error: null })
    try {
      await matchingService.delete(id)
      set(state => ({
        matchings: state.matchings.filter(m => m.id !== id),
        selectedMatching: state.selectedMatching?.id === id ? null : state.selectedMatching,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  confirmMatching: async (id) => {
    set({ loading: true, error: null })
    try {
      await matchingService.confirm(id)
      const updated = await matchingService.getById(id)
      set(state => ({
        matchings: state.matchings.map(m => (m.id === id ? updated : m)),
        selectedMatching: state.selectedMatching?.id === id ? updated : state.selectedMatching,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  cancelMatching: async (id, reason) => {
    set({ loading: true, error: null })
    try {
      await matchingService.cancel(id, reason)
      const updated = await matchingService.getById(id)
      set(state => ({
        matchings: state.matchings.map(m => (m.id === id ? updated : m)),
        selectedMatching: state.selectedMatching?.id === id ? updated : state.selectedMatching,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  setSelectedMatching: (matching) => {
    set({ selectedMatching: matching })
  },

  clearError: () => {
    set({ error: null })
  },
}))

