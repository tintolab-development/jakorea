/**
 * 스폰서 Zustand 스토어
 * Phase 1.3: 상태 관리
 */

import { create } from 'zustand'
import type { Sponsor } from '@/types/domain'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'

interface SponsorState {
  sponsors: Sponsor[]
  selectedSponsor: Sponsor | null
  loading: boolean
  error: Error | null
  fetchSponsors: () => Promise<void>
  fetchSponsorById: (id: string) => Promise<void>
  createSponsor: (data: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSponsor: (id: string, data: Partial<Omit<Sponsor, 'id' | 'createdAt'>>) => Promise<void>
  deleteSponsor: (id: string) => Promise<void>
  setSelectedSponsor: (sponsor: Sponsor | null) => void
  clearError: () => void
}

export const useSponsorStore = create<SponsorState>(set => ({
  sponsors: [],
  selectedSponsor: null,
  loading: false,
  error: null,

  fetchSponsors: async () => {
    set({ loading: true, error: null })
    try {
      const sponsors = await sponsorService.getAll()
      set({ sponsors, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  fetchSponsorById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const sponsor = await sponsorService.getById(id)
      set({ selectedSponsor: sponsor, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  createSponsor: async (data) => {
    set({ loading: true, error: null })
    try {
      const newSponsor = await sponsorService.create(data)
      set(state => ({
        sponsors: [...state.sponsors, newSponsor],
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  updateSponsor: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updatedSponsor = await sponsorService.update(id, data)
      set(state => ({
        sponsors: state.sponsors.map(s => (s.id === id ? updatedSponsor : s)),
        selectedSponsor: state.selectedSponsor?.id === id ? updatedSponsor : state.selectedSponsor,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  deleteSponsor: async (id) => {
    set({ loading: true, error: null })
    try {
      await sponsorService.delete(id)
      set(state => ({
        sponsors: state.sponsors.filter(s => s.id !== id),
        selectedSponsor: state.selectedSponsor?.id === id ? null : state.selectedSponsor,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  setSelectedSponsor: (sponsor) => set({ selectedSponsor: sponsor }),

  clearError: () => set({ error: null }),
}))




