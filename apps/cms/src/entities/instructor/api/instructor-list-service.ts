/**
 * 강사 조회 서비스
 * Phase 4.1: 강사 조회/다운로드 (필라별) (FR-F00)
 */

// import type { UUID } from '@/types' // 사용하지 않음
import { mockInstructors } from '@/data/mock/instructors'
import { mockUsers } from '@/data/mock/users'
import { mockInstructorUsers } from '@/data/mock/instructor-users'

export interface InstructorListFilters {
  pillar?: string
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
  specialty?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

/**
 * 강사 목록 조회
 */
export async function getInstructors(
  filters?: InstructorListFilters
): Promise<InstructorListItem[]> {
  // Mock: 실제로는 API 호출
  await new Promise(resolve => setTimeout(resolve, 300))

  const instructors: InstructorListItem[] = []

  for (const instructor of mockInstructors) {
    // 필라 필터 (specialty의 첫 번째 항목을 pillar로 사용)
    const pillar = instructor.specialty?.[0] || '기타'
    if (filters?.pillar && pillar !== filters.pillar) {
      continue
    }

    // 상태 필터 (Instructor 타입에 status가 없으므로 모두 ACTIVE로 처리)
    const isActive = true // Mock 데이터에서는 모두 활성으로 처리
    if (filters?.status) {
      if (filters.status === 'ACTIVE' && !isActive) continue
      if (filters.status === 'INACTIVE' && isActive) continue
    }

    // 사용자 정보 조회 (Instructor와 연결된 User 우선, 없으면 일반 User에서 찾기)
    const user = mockInstructorUsers.find(u => u.instructorId === instructor.id) ||
                 mockUsers.find(u => u.instructorId === instructor.id)
    if (!user) continue

    // 검색 필터
    if (filters?.keyword) {
      const keyword = filters.keyword.toLowerCase()
      const specialtyText = instructor.specialty?.join(', ') || ''
      if (
        !instructor.name.toLowerCase().includes(keyword) &&
        !user.email.toLowerCase().includes(keyword) &&
        !specialtyText.toLowerCase().includes(keyword)
      ) {
        continue
      }
    }

    instructors.push({
      id: instructor.id,
      instructorId: instructor.id,
      name: instructor.name,
      email: user.email,
      phone: instructor.contactPhone,
      pillar,
      specialty: instructor.specialty?.join(', '),
      status: isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: typeof instructor.createdAt === 'string' ? instructor.createdAt : instructor.createdAt.toISOString(),
    })
  }

  // 최신순 정렬
  return instructors.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
