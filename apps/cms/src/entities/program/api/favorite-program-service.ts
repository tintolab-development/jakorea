/**
 * 관심 프로그램 API (Mock)
 * Phase 5.2.6: 관심 프로그램 관리
 */

import type { UUID, Program } from '@/types'
import { mockPrograms } from '@/data/mock'
import dayjs from 'dayjs'

/**
 * 관심 프로그램 필터
 */
export interface FavoriteProgramFilters {
  status?: 'active' | 'completed' | 'scheduled' | 'all'
  category?: 'school' | 'individual' | 'all'
  search?: string
}

/**
 * 관심 프로그램 정보
 */
export interface FavoriteProgram extends Program {
  favoritedAt: string // 관심 등록일
}

// instructor1@example.com용 고정 instructorId
const INSTRUCTOR1_ID = 'instructor-1-fixed-id-for-testing'

// Mock: 사용자별 관심 프로그램 목록 (실제로는 서버에서 관리)
const mockFavoritePrograms: Record<UUID, Set<UUID>> = {
  // 예시: instructor-1이 program-1, program-2를 관심 등록
  [INSTRUCTOR1_ID]: new Set(['program-1', 'program-2', 'program-3']),
  'instructor-2': new Set(['program-3']),
}

/**
 * 관심 프로그램 목록 조회
 */
export async function getFavoritePrograms(
  userId: UUID,
  filters?: FavoriteProgramFilters
): Promise<FavoriteProgram[]> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // 사용자의 관심 프로그램 ID 목록
  const favoriteIds = mockFavoritePrograms[userId] || new Set<UUID>()

  // 관심 프로그램 조회
  let programs = mockPrograms
    .filter(p => favoriteIds.has(p.id))
    .map(program => ({
      ...program,
      favoritedAt: dayjs().subtract(Math.floor(Math.random() * 30), 'day').toISOString(), // Mock: 랜덤 등록일
    } as FavoriteProgram))

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
 * 관심 프로그램 등록
 */
export async function addFavoriteProgram(userId: UUID, programId: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200))

  if (!mockFavoritePrograms[userId]) {
    mockFavoritePrograms[userId] = new Set()
  }

  mockFavoritePrograms[userId].add(programId)
}

/**
 * 관심 프로그램 해제
 */
export async function removeFavoriteProgram(userId: UUID, programId: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200))

  if (mockFavoritePrograms[userId]) {
    mockFavoritePrograms[userId].delete(programId)
  }
}

/**
 * 관심 프로그램 등록 여부 확인
 */
export async function isFavoriteProgram(userId: UUID, programId: UUID): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100))

  const favoriteIds = mockFavoritePrograms[userId] || new Set<UUID>()
  return favoriteIds.has(programId)
}

/**
 * 관심 프로그램 상세 조회
 */
export async function getFavoriteProgramDetail(
  userId: UUID,
  programId: UUID
): Promise<FavoriteProgram | null> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const favoriteIds = mockFavoritePrograms[userId] || new Set<UUID>()
  if (!favoriteIds.has(programId)) {
    return null
  }

  const program = mockPrograms.find(p => p.id === programId)
  if (!program) {
    return null
  }

  return {
    ...program,
    favoritedAt: dayjs().subtract(Math.floor(Math.random() * 30), 'day').toISOString(),
  }
}

