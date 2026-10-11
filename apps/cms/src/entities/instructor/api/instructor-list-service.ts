/**
 * 강사 조회 서비스 (stub)
 */

import type { InstructorType } from '@/types/domain'

export interface InstructorListFilters {
  pillar?: string
  instructorType?: InstructorType
  status?: 'ACTIVE' | 'INACTIVE'
  keyword?: string
}

export interface InstructorListItem {
  id: string
  instructorId: string
  name: string
  email: string
  phone?: string
  pillar: string
  instructorType: InstructorType
  specialty?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

export async function getInstructors(
  _filters?: InstructorListFilters
): Promise<InstructorListItem[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return []
}
