/**
 * 강사/봉사자 본인 프로그램 조회 API (stub — remote 연동 전 빈 목록)
 * Phase 5.2.2: 본인 프로그램 조회
 */

import type { UUID, Program, Schedule } from '@/types'

export interface MyProgramFilters {
  status?: 'active' | 'completed' | 'scheduled' | 'all'
  category?: 'school' | 'individual' | 'all'
  search?: string
}

export interface MyProgram extends Program {
  matchingId: UUID
  matchedAt: string
  schedules: Schedule[]
}

export async function getMyPrograms(
  _instructorId: UUID,
  _filters?: MyProgramFilters
): Promise<MyProgram[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return []
}

export async function getMyProgramDetail(
  _instructorId: UUID,
  _programId: UUID
): Promise<MyProgram | null> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return null
}
