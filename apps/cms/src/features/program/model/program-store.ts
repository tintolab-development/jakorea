/**
 * 프로그램 Zustand 스토어
 * Phase 2.1: 상태 관리
 */

import { create } from 'zustand'
import type { Program, ProgramRound } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'

interface ProgramState {
  programs: Program[]
  selectedProgram: Program | null
  loading: boolean
  error: Error | null
  fetchPrograms: () => Promise<void>
  fetchProgramById: (id: string) => Promise<void>
  createProgram: (data: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProgram: (id: string, data: Partial<Omit<Program, 'id' | 'createdAt'>>) => Promise<void>
  deleteProgram: (id: string) => Promise<void>
  updateRound: (programId: string, roundId: string, data: Partial<Omit<ProgramRound, 'id' | 'programId'>>) => Promise<void>
  setSelectedProgram: (program: Program | null) => void
  clearError: () => void
}

export const useProgramStore = create<ProgramState>(set => ({
  programs: [],
  selectedProgram: null,
  loading: false,
  error: null,

  fetchPrograms: async () => {
    set({ loading: true, error: null })
    try {
      const programs = await programService.getAll()
      set({ programs, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  fetchProgramById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const program = await programService.getById(id)
      set({ selectedProgram: program, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  createProgram: async (data) => {
    set({ loading: true, error: null })
    try {
      const newProgram = await programService.create(data)
      set(state => ({
        programs: [...state.programs, newProgram],
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  updateProgram: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updatedProgram = await programService.update(id, data)
      set(state => ({
        programs: state.programs.map(p => (p.id === id ? updatedProgram : p)),
        selectedProgram: state.selectedProgram?.id === id ? updatedProgram : state.selectedProgram,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  deleteProgram: async (id) => {
    set({ loading: true, error: null })
    try {
      await programService.delete(id)
      set(state => ({
        programs: state.programs.filter(p => p.id !== id),
        selectedProgram: state.selectedProgram?.id === id ? null : state.selectedProgram,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  updateRound: async (programId, roundId, data) => {
    set({ loading: true, error: null })
    try {
      await programService.updateRound(programId, roundId, data)
      const updatedProgram = await programService.getById(programId)
      set(state => ({
        programs: state.programs.map(p => (p.id === programId ? updatedProgram : p)),
        selectedProgram: state.selectedProgram?.id === programId ? updatedProgram : state.selectedProgram,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  setSelectedProgram: (program) => set({ selectedProgram: program }),

  clearError: () => set({ error: null }),
}))





