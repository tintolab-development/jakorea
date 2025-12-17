/**
 * 스폰서 Mock 서비스
 * Phase 1.3: Mock API 함수 구현
 * 향후 백엔드 연동 시 인터페이스 유지
 */

import type { Sponsor, UUID, PaginatedResponse, PaginationParams } from '../../types'
import { mockSponsors, mockSponsorsMap } from '../../data/mock/sponsors'

export interface SponsorFilters {
  search?: string // 이름, 설명, 연락처 검색
}

export interface SponsorListParams extends PaginationParams {
  filters?: SponsorFilters
  sortBy?: 'name' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// 목록 조회 (필터, 정렬, 페이지네이션)
export async function getSponsors(
  params: SponsorListParams = { page: 1, pageSize: 10 }
): Promise<PaginatedResponse<Sponsor>> {
  const { page = 1, pageSize = 10, filters, sortBy = 'createdAt', sortOrder = 'desc' } = params

  // 필터링
  let filtered = [...mockSponsors]

  if (filters) {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower) ||
          s.contactInfo?.toLowerCase().includes(searchLower)
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
  await new Promise((resolve) => setTimeout(resolve, 100))

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}

// 상세 조회
export async function getSponsorById(id: UUID): Promise<Sponsor> {
  // 네트워크 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 50))

  const sponsor = mockSponsorsMap.get(id)
  if (!sponsor) {
    throw new Error('스폰서를 찾을 수 없습니다')
  }
  return sponsor
}

// 생성
export async function createSponsor(
  data: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Sponsor> {
  // 네트워크 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 200))

  const newSponsor: Sponsor = {
    ...data,
    id: `sponsor-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Mock 데이터에 추가 (실제로는 메모리에만 존재, 새로고침 시 초기화됨)
  mockSponsors.push(newSponsor)
  mockSponsorsMap.set(newSponsor.id, newSponsor)

  return newSponsor
}

// 수정
export async function updateSponsor(
  id: UUID,
  data: Partial<Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Sponsor> {
  // 네트워크 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 200))

  const existing = mockSponsorsMap.get(id)
  if (!existing) {
    throw new Error('스폰서를 찾을 수 없습니다')
  }

  const updatedSponsor: Sponsor = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  }

  // Mock 데이터 업데이트
  const index = mockSponsors.findIndex((s) => s.id === id)
  if (index !== -1) {
    mockSponsors[index] = updatedSponsor
  }
  mockSponsorsMap.set(id, updatedSponsor)

  return updatedSponsor
}

// 삭제
export async function deleteSponsor(id: UUID): Promise<void> {
  // 네트워크 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 200))

  const index = mockSponsors.findIndex((s) => s.id === id)
  if (index === -1) {
    throw new Error('스폰서를 찾을 수 없습니다')
  }

  mockSponsors.splice(index, 1)
  mockSponsorsMap.delete(id)
}

