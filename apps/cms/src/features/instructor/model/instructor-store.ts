/**
 * 강사 Zustand 스토어
 * Phase 1.2: 상태 관리
 */

import { create } from 'zustand'
import type { Instructor } from '@/types/domain'
import { instructorService } from '@/entities/instructor/api/instructor-service'

interface InstructorState {
  instructors: Instructor[]
  selectedInstructor: Instructor | null
  loading: boolean
  error: Error | null
  fetchInstructors: () => Promise<void>
  fetchInstructorById: (id: string) => Promise<void>
  createInstructor: (data: Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateInstructor: (id: string, data: Partial<Omit<Instructor, 'id' | 'createdAt'>>) => Promise<void>
  deleteInstructor: (id: string) => Promise<void>
  setSelectedInstructor: (instructor: Instructor | null) => void
  clearError: () => void
}

export const useInstructorStore = create<InstructorState>(set => ({
  instructors: [],
  selectedInstructor: null,
  loading: false,
  error: null,

  fetchInstructors: async () => {
    set({ loading: true, error: null })
    try {
      const instructors = await instructorService.getAll()
      set({ instructors, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  fetchInstructorById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const instructor = await instructorService.getById(id)
      set({ selectedInstructor: instructor, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  createInstructor: async (data) => {
    set({ loading: true, error: null })
    try {
      const newInstructor = await instructorService.create(data)
      set(state => ({
        instructors: [...state.instructors, newInstructor],
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  updateInstructor: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updatedInstructor = await instructorService.update(id, data)
      set(state => ({
        instructors: state.instructors.map(i => (i.id === id ? updatedInstructor : i)),
        selectedInstructor: state.selectedInstructor?.id === id ? updatedInstructor : state.selectedInstructor,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  deleteInstructor: async (id) => {
    set({ loading: true, error: null })
    try {
      await instructorService.delete(id)
      set(state => ({
        instructors: state.instructors.filter(i => i.id !== id),
        selectedInstructor: state.selectedInstructor?.id === id ? null : state.selectedInstructor,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  setSelectedInstructor: (instructor) => set({ selectedInstructor: instructor }),

  clearError: () => set({ error: null }),
}))

