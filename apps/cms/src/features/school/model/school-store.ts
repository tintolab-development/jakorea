/**
 * 학교 Zustand 스토어
 * Phase 1.4: 상태 관리
 */

import { create } from 'zustand'
import type { School } from '@/types/domain'
import { schoolService } from '@/entities/school/api/school-service'

interface SchoolState {
  schools: School[]
  selectedSchool: School | null
  loading: boolean
  error: Error | null
  fetchSchools: () => Promise<void>
  fetchSchoolById: (id: string) => Promise<void>
  createSchool: (data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSchool: (id: string, data: Partial<Omit<School, 'id' | 'createdAt'>>) => Promise<void>
  deleteSchool: (id: string) => Promise<void>
  setSelectedSchool: (school: School | null) => void
  clearError: () => void
}

export const useSchoolStore = create<SchoolState>(set => ({
  schools: [],
  selectedSchool: null,
  loading: false,
  error: null,

  fetchSchools: async () => {
    set({ loading: true, error: null })
    try {
      const schools = await schoolService.getAll()
      set({ schools, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  fetchSchoolById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const school = await schoolService.getById(id)
      set({ selectedSchool: school, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  createSchool: async (data) => {
    set({ loading: true, error: null })
    try {
      const newSchool = await schoolService.create(data)
      set(state => ({
        schools: [...state.schools, newSchool],
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  updateSchool: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updatedSchool = await schoolService.update(id, data)
      set(state => ({
        schools: state.schools.map(s => (s.id === id ? updatedSchool : s)),
        selectedSchool: state.selectedSchool?.id === id ? updatedSchool : state.selectedSchool,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  deleteSchool: async (id) => {
    set({ loading: true, error: null })
    try {
      await schoolService.delete(id)
      set(state => ({
        schools: state.schools.filter(s => s.id !== id),
        selectedSchool: state.selectedSchool?.id === id ? null : state.selectedSchool,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  setSelectedSchool: (school) => set({ selectedSchool: school }),

  clearError: () => set({ error: null }),
}))






