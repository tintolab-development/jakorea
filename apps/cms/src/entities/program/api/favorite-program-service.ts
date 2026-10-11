/**
 * 관심 프로그램 API (stub — remote 연동 전 빈 목록)
 * Phase 5.2.6: 관심 프로그램 관리
 */

import type { UUID, Program } from '@/types'

export interface FavoriteProgramFilters {
  status?: 'active' | 'completed' | 'scheduled' | 'all'
  category?: 'school' | 'individual' | 'all'
  search?: string
}

export interface FavoriteProgram extends Program {
  favoritedAt: string
}

const mockFavoritePrograms: Record<UUID, Set<UUID>> = {}

export async function getFavoritePrograms(
  _userId: UUID,
  _filters?: FavoriteProgramFilters
): Promise<FavoriteProgram[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return []
}

export async function addFavoriteProgram(_userId: UUID, _programId: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200))
}

export async function removeFavoriteProgram(_userId: UUID, _programId: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200))
}

export async function isFavoriteProgram(_userId: UUID, _programId: UUID): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockFavoritePrograms[_userId]?.has(_programId) ?? false
}

export async function getFavoriteProgramIds(_userId: UUID): Promise<UUID[]> {
  await new Promise(resolve => setTimeout(resolve, 100))
  return [...(mockFavoritePrograms[_userId] ?? [])]
}
