/**
 * 프로그램 Mock 서비스
 * Phase 2.1: Mock API 서비스
 */

import type { Program, ProgramRound } from '@/types/domain'
import { mockPrograms, mockProgramsMap } from '@/data/mock'

export const programService = {
  getAll: async (): Promise<Program[]> => {
    return Promise.resolve(mockPrograms)
  },

  getById: async (id: string): Promise<Program> => {
    const program = mockProgramsMap.get(id)
    if (!program) {
      throw new Error(`Program not found: ${id}`)
    }
    return Promise.resolve(program)
  },

  create: async (data: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Promise<Program> => {
    const programId = `program-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newProgram: Program = {
      ...data,
      id: programId,
      rounds: data.rounds.map((round, index) => ({
        ...round,
        id: round.id || `${programId}-round-${index + 1}`,
        programId,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockPrograms.push(newProgram)
    mockProgramsMap.set(newProgram.id, newProgram)
    return Promise.resolve(newProgram)
  },

  update: async (id: string, data: Partial<Omit<Program, 'id' | 'createdAt'>>): Promise<Program> => {
    const program = mockProgramsMap.get(id)
    if (!program) {
      throw new Error(`Program not found: ${id}`)
    }
    const updatedProgram: Program = {
      ...program,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    const index = mockPrograms.findIndex(p => p.id === id)
    if (index !== -1) {
      mockPrograms[index] = updatedProgram
    }
    mockProgramsMap.set(id, updatedProgram)
    return Promise.resolve(updatedProgram)
  },

  delete: async (id: string): Promise<void> => {
    const index = mockPrograms.findIndex(p => p.id === id)
    if (index === -1) {
      throw new Error(`Program not found: ${id}`)
    }
    mockPrograms.splice(index, 1)
    mockProgramsMap.delete(id)
    return Promise.resolve()
  },

  updateRound: async (
    programId: string,
    roundId: string,
    data: Partial<Omit<ProgramRound, 'id' | 'programId'>>
  ): Promise<ProgramRound> => {
    const program = mockProgramsMap.get(programId)
    if (!program) {
      throw new Error(`Program not found: ${programId}`)
    }
    const roundIndex = program.rounds.findIndex(r => r.id === roundId)
    if (roundIndex === -1) {
      throw new Error(`Round not found: ${roundId}`)
    }
    const updatedRound: ProgramRound = {
      ...program.rounds[roundIndex],
      ...data,
    }
    program.rounds[roundIndex] = updatedRound
    return Promise.resolve(updatedRound)
  },
}

