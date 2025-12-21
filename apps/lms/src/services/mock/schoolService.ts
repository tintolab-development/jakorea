/**
 * 학교 Mock 서비스
 * Phase 1.4: Mock API 함수 구현
 * 향후 백엔드 연동 시 인터페이스 유지
 */

import type { School, UUID, PaginatedResponse, PaginationParams } from '../../types'
import { mockSchools, mockSchoolsMap } from '../../data/mock/schools'

export interface SchoolFilters {
  region?: string
  search?: string // 이름, 담당자, 주소 검색
}

export interface SchoolListParams extends PaginationParams {
  filters?: SchoolFilters
  sortBy?: 'name' | 'region' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// 목록 조회 (필터, 정렬, 페이지네이션)
export async function getSchools(
  params: SchoolListParams = { page: 1, pageSize: 10 }
): Promise<PaginatedResponse<School>> {
  const { page = 1, pageSize = 10, filters, sortBy = 'createdAt', sortOrder = 'desc' } = params

  // 필터링
  let filtered = [...mockSchools]

  if (filters) {
    if (filters.region) {
      filtered = filtered.filter(s => s.region === filters.region)
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(searchLower) ||
          s.contactPerson.toLowerCase().includes(searchLower) ||
          s.address?.toLowerCase().includes(searchLower)
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

  // 네트워크 지연 시뮬레이션
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
export async function getSchoolById(id: UUID): Promise<School> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 50))

  const school = mockSchoolsMap.get(id)
  if (!school) {
    throw new Error('학교를 찾을 수 없습니다')
  }
  return school
}

// 생성
export async function createSchool(
  data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>
): Promise<School> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 200))

  const newSchool: School = {
    ...data,
    id: `school-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Mock 데이터에 추가 (실제로는 메모리에만 존재, 새로고침 시 초기화됨)
  mockSchools.push(newSchool)
  mockSchoolsMap.set(newSchool.id, newSchool)

  return newSchool
}

// 수정
export async function updateSchool(
  id: UUID,
  data: Partial<Omit<School, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<School> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 200))

  const existing = mockSchoolsMap.get(id)
  if (!existing) {
    throw new Error('학교를 찾을 수 없습니다')
  }

  const updatedSchool: School = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  }

  // Mock 데이터 업데이트
  const index = mockSchools.findIndex(s => s.id === id)
  if (index !== -1) {
    mockSchools[index] = updatedSchool
  }
  mockSchoolsMap.set(id, updatedSchool)

  return updatedSchool
}

// 삭제
export async function deleteSchool(id: UUID): Promise<void> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 200))

  const index = mockSchools.findIndex(s => s.id === id)
  if (index === -1) {
    throw new Error('학교를 찾을 수 없습니다')
  }

  mockSchools.splice(index, 1)
  mockSchoolsMap.delete(id)
}

// 지역 목록 조회 (필터용)
export async function getRegions(): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 50))
  return Array.from(new Set(mockSchools.map(s => s.region))).sort()
}





