/**
 * 강사/봉사자 본인 프로그램 조회 API (Mock)
 * Phase 5.2.2: 본인 프로그램 조회
 */

import type { UUID, Program, Schedule } from '@/types'
import { mockPrograms, mockMatchings, mockSchedules } from '@/data/mock'
import dayjs from 'dayjs'

/**
 * 본인 프로그램 조회 필터
 */
export interface MyProgramFilters {
  status?: 'active' | 'completed' | 'scheduled' | 'all'
  category?: 'school' | 'individual' | 'all'
  search?: string
}

/**
 * 본인 프로그램 정보 (매칭 정보 포함)
 */
export interface MyProgram extends Program {
  matchingId: UUID
  matchedAt: string
  schedules: Schedule[]
}

/**
 * 본인 매칭 프로그램 목록 조회
 */
export async function getMyPrograms(
  instructorId: UUID,
  filters?: MyProgramFilters
): Promise<MyProgram[]> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // 본인 매칭 조회
  const myMatchings = mockMatchings.filter(m => m.instructorId === instructorId)

  // 매칭된 프로그램 조회
  const myProgramIds = new Set(myMatchings.map(m => m.programId))
  let programs = mockPrograms
    .filter(p => myProgramIds.has(p.id))
    .map(program => {
      const matching = myMatchings.find(m => m.programId === program.id)
      if (!matching) return null

      // 본인 일정 조회
      const schedules = mockSchedules.filter(
        s => s.programId === program.id && s.instructorId === instructorId
      )

      return {
        ...program,
        matchingId: matching.id,
        matchedAt: typeof matching.matchedAt === 'string' ? matching.matchedAt : matching.matchedAt.toISOString(),
        schedules,
      } as MyProgram
    })
    .filter((p): p is MyProgram => p !== null)

  // 상태 필터링
  if (filters?.status && filters.status !== 'all') {
    const now = dayjs()
    programs = programs.filter(program => {
      const startDate = dayjs(program.startDate)
      const endDate = dayjs(program.endDate)

      switch (filters.status) {
        case 'active':
          return program.status === 'active' && now.isAfter(startDate) && now.isBefore(endDate)
        case 'completed':
          return program.status === 'completed' || now.isAfter(endDate)
        case 'scheduled':
          return now.isBefore(startDate)
        default:
          return true
      }
    })
  }

  // 카테고리 필터링
  if (filters?.category && filters.category !== 'all') {
    programs = programs.filter(p => p.category === filters.category)
  }

  // 검색 필터링
  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase()
    programs = programs.filter(
      p =>
        p.title.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm)
    )
  }

  return programs
}

/**
 * 본인 프로그램 상세 조회 (매칭 정보 포함)
 */
export async function getMyProgramDetail(
  instructorId: UUID,
  programId: UUID
): Promise<MyProgram | null> {
  await new Promise(resolve => setTimeout(resolve, 200))

  // 본인 매칭 확인
  const matching = mockMatchings.find(
    m => m.instructorId === instructorId && m.programId === programId
  )

  if (!matching) {
    return null
  }

  const program = mockPrograms.find(p => p.id === programId)
  if (!program) {
    return null
  }

  // 본인 일정 조회
  const schedules = mockSchedules.filter(
    s => s.programId === programId && s.instructorId === instructorId
  )

  return {
    ...program,
    matchingId: matching.id,
    matchedAt: typeof matching.matchedAt === 'string' ? matching.matchedAt : matching.matchedAt.toISOString(),
    schedules,
  }
}

