/**
 * 강사 Mock 서비스
 * Phase 1.2: Mock API 함수 구현
 * 향후 백엔드 연동 시 인터페이스 유지
 */

import type { Instructor, UUID, PaginatedResponse, PaginationParams } from '../../types'
import { mockInstructors, mockInstructorsMap } from '../../data/mock/instructors'

export interface InstructorFilters {
  region?: string
  specialty?: string
  search?: string // 이름, 연락처, 이메일 검색
}

export interface InstructorListParams extends PaginationParams {
  filters?: InstructorFilters
  sortBy?: 'name' | 'region' | 'rating' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// 목록 조회 (필터, 정렬, 페이지네이션)
export async function getInstructors(
  params: InstructorListParams = { page: 1, pageSize: 10 }
): Promise<PaginatedResponse<Instructor>> {
  const { page = 1, pageSize = 10, filters, sortBy = 'createdAt', sortOrder = 'desc' } = params

  // 필터링
  let filtered = [...mockInstructors]

  if (filters) {
    if (filters.region) {
      filtered = filtered.filter(i => i.region === filters.region)
    }
    if (filters.specialty) {
      filtered = filtered.filter(i => i.specialty.includes(filters.specialty!))
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        i =>
          i.name.toLowerCase().includes(searchLower) ||
          i.contactPhone?.includes(searchLower) ||
          i.contactEmail?.toLowerCase().includes(searchLower)
      )
    }
  }

  // 정렬
  filtered.sort((a, b) => {
    let aValue: string | number | undefined
    let bValue: string | number | undefined

    switch (sortBy) {
      case 'name':
        aValue = a.name
        bValue = b.name
        break
      case 'region':
        aValue = a.region
        bValue = b.region
        break
      case 'rating':
        aValue = a.rating ?? 0
        bValue = b.rating ?? 0
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        return 0
    }

    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return 1
    if (bValue === undefined) return -1

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // 페이지네이션
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const data = filtered.slice(startIndex, endIndex)

  // 네트워크 지연 시뮬레이션 (선택사항)
  await new Promise(resolve => setTimeout(resolve, 100))

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}

// 상세 조회
export async function getInstructorById(id: UUID): Promise<Instructor | null> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 50))

  const instructor = mockInstructorsMap.get(id)
  if (!instructor) {
    throw new Error('강사를 찾을 수 없습니다')
  }
  return instructor
}

// 생성
export async function createInstructor(
  data: Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Instructor> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 200))

  const newInstructor: Instructor = {
    ...data,
    id: `instructor-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Mock 데이터에 추가 (실제로는 메모리에만 존재, 새로고침 시 초기화됨)
  mockInstructors.push(newInstructor)
  mockInstructorsMap.set(newInstructor.id, newInstructor)

  return newInstructor
}

// 수정
export async function updateInstructor(
  id: UUID,
  data: Partial<Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Instructor> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 200))

  const existing = mockInstructorsMap.get(id)
  if (!existing) {
    throw new Error('강사를 찾을 수 없습니다')
  }

  const updatedInstructor: Instructor = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  }

  // Mock 데이터 업데이트
  const index = mockInstructors.findIndex(i => i.id === id)
  if (index !== -1) {
    mockInstructors[index] = updatedInstructor
  }
  mockInstructorsMap.set(id, updatedInstructor)

  return updatedInstructor
}

// 삭제
export async function deleteInstructor(id: UUID): Promise<void> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 200))

  const index = mockInstructors.findIndex(i => i.id === id)
  if (index === -1) {
    throw new Error('강사를 찾을 수 없습니다')
  }

  mockInstructors.splice(index, 1)
  mockInstructorsMap.delete(id)
}

// 지역 목록 조회 (필터용)
export async function getRegions(): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 50))
  return Array.from(new Set(mockInstructors.map(i => i.region))).sort()
}

// 전문분야 목록 조회 (필터용)
export async function getSpecialties(): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 50))
  const allSpecialties = new Set<string>()
  mockInstructors.forEach(i => {
    i.specialty.forEach(s => allSpecialties.add(s))
  })
  return Array.from(allSpecialties).sort()
}
