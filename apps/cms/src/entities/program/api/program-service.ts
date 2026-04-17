/**
 * 프로그램 Mock 서비스
 * Phase 2.1: Mock API 서비스
 * Phase 4.2.2: 권한별 데이터 필터링
 * P0: 프로그램 생성 시 자동 OWNER 권한 부여
 */

import type { Program, ProgramRound } from '@/types/domain'
import { mockPrograms, mockProgramsMap } from '@/data/mock'
import { getEconomyProgramById } from '@/data/mock/economy-programs'
import type { UserRole } from '@/types/user'
import { updateUserProgramRole } from '@/entities/user/api/user-service'

function resolveProgramFromStores(id: string): Program | undefined {
  return mockProgramsMap.get(id) ?? getEconomyProgramById(id)
}

export const programService = {
  /**
   * 모든 프로그램 조회 (권한별 필터링)
   * @param userRole 사용자 권한
   * @param userId 사용자 ID (강사/봉사자일 경우 instructorId) - 향후 매칭 정보 기반 필터링에 사용 예정
   */
  getAll: async (userRole?: UserRole | null, userId?: string): Promise<Program[]> => {
    // userId는 향후 매칭 정보 기반 필터링에 사용 예정
    void userId
    const allPrograms = [...mockPrograms]

    // 권한별 필터링 적용
    // 관리자는 전체 조회, 강사/봉사자는 본인이 담당한 프로그램만 조회
    // Program에는 instructorId가 없으므로, 매칭 정보를 통해 필터링해야 함
    // 현재는 모든 프로그램 반환 (향후 매칭 정보 기반 필터링 구현 필요)
    if (userRole && userRole !== 'ADMIN') {
      // TODO: 매칭 정보를 통해 본인이 담당한 프로그램만 필터링
      return Promise.resolve(allPrograms)
    }

    return Promise.resolve(allPrograms)
  },

  getById: async (id: string): Promise<Program> => {
    const program = resolveProgramFromStores(id)
    if (!program) {
      throw new Error(`Program not found: ${id}`)
    }
    return Promise.resolve(program)
  },

  create: async (
    data: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>,
    creatorUserId?: string
  ): Promise<Program> => {
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

    // P0: 프로그램 생성 시 생성한 관리자에게 자동으로 OWNER 권한 부여
    if (creatorUserId) {
      try {
        await updateUserProgramRole(creatorUserId, programId, 'OWNER')
      } catch (error) {
        // 사용자가 관리자가 아니거나 권한 부여 실패 시 에러 로그만 출력 (프로그램 생성은 계속 진행)
        console.warn('프로그램 생성자에게 OWNER 권한 부여 실패:', error)
      }
    }

    return Promise.resolve(newProgram)
  },

  update: async (
    id: string,
    data: Partial<Omit<Program, 'id' | 'createdAt'>>
  ): Promise<Program> => {
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

  // Phase 1.3: Mock 데이터 참조 추상화 - 조회 헬퍼 함수
  /**
   * ID로 프로그램 이름 조회 (동기)
   * @param id 프로그램 ID
   * @returns 프로그램 제목 또는 ID
   */
  getNameById: (id: string): string => {
    const program = resolveProgramFromStores(id)
    return program?.title || id
  },

  /**
   * ID로 프로그램 전체 조회 (동기)
   * @param id 프로그램 ID
   * @returns 프로그램 또는 undefined
   */
  getByIdSync: (id: string): Program | undefined => {
    return resolveProgramFromStores(id)
  },

  /**
   * 모든 프로그램 조회 (동기)
   * @returns 프로그램 배열
   */
  getAllSync: (): Program[] => {
    return [...mockPrograms]
  },

  /**
   * 후원사 ID로 프로그램 목록 조회
   * @param sponsorId 후원사 ID
   * @returns 해당 후원사의 프로그램 배열
   */
  getBySponsorId: async (sponsorId: string): Promise<Program[]> => {
    const programs = mockPrograms.filter(p => p.sponsorId === sponsorId)
    return Promise.resolve(programs)
  },
}
