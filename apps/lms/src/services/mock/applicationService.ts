/**
 * 신청 Mock API Service
 * Phase 2.2: 신청 CRUD 및 상태 관리
 */

import type { Application, UUID, PaginatedResponse } from '../../types'
import { mockApplications, mockApplicationsMap } from '../../data/mock/applications'

export interface ApplicationListParams {
  page: number
  pageSize: number
  search?: string
  programId?: UUID
  subjectType?: 'school' | 'student' | 'instructor'
  status?: Application['status']
  sortBy?: 'submittedAt' | 'status' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ApplicationFilters {
  search?: string
  programId?: UUID
  subjectType?: 'school' | 'student' | 'instructor'
  status?: Application['status']
}

/**
 * 신청 목록 조회 (필터링, 정렬, 페이지네이션)
 */
export async function getApplications(
  params: ApplicationListParams
): Promise<PaginatedResponse<Application>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  let filtered = [...mockApplications]

  // 검색 필터
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filtered = filtered.filter(app => {
      // 프로그램 ID, 주체 ID, 메모 등으로 검색 (실제로는 프로그램명, 주체명 등으로 검색해야 함)
      return (
        app.id.toLowerCase().includes(searchLower) || app.notes?.toLowerCase().includes(searchLower)
      )
    })
  }

  // 프로그램 필터
  if (params.programId) {
    filtered = filtered.filter(app => app.programId === params.programId)
  }

  // 주체 유형 필터
  if (params.subjectType) {
    filtered = filtered.filter(app => app.subjectType === params.subjectType)
  }

  // 상태 필터
  if (params.status) {
    filtered = filtered.filter(app => app.status === params.status)
  }

  // 정렬
  const sortBy = params.sortBy || 'submittedAt'
  const sortOrder = params.sortOrder || 'desc'
  filtered.sort((a, b) => {
    let aValue: string | number | Date
    let bValue: string | number | Date

    switch (sortBy) {
      case 'submittedAt':
        aValue = new Date(a.submittedAt).getTime()
        bValue = new Date(b.submittedAt).getTime()
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        aValue = new Date(a.submittedAt).getTime()
        bValue = new Date(b.submittedAt).getTime()
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // 페이지네이션
  const total = filtered.length
  const totalPages = Math.ceil(total / params.pageSize)
  const startIndex = (params.page - 1) * params.pageSize
  const endIndex = startIndex + params.pageSize
  const data = filtered.slice(startIndex, endIndex)

  return {
    data,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
  }
}

/**
 * 신청 상세 조회
 */
export async function getApplicationById(id: UUID): Promise<Application | null> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const application = mockApplicationsMap.get(id)
  if (!application) {
    throw new Error('신청을 찾을 수 없습니다')
  }

  return application
}

/**
 * 신청 생성
 */
export async function createApplication(
  data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Application> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const newApplication: Application = {
    ...data,
    id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockApplications.push(newApplication)
  mockApplicationsMap.set(newApplication.id, newApplication)

  return newApplication
}

/**
 * 신청 수정
 */
export async function updateApplication(
  id: UUID,
  data: Partial<Omit<Application, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Application> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const application = mockApplicationsMap.get(id)
  if (!application) {
    throw new Error('신청을 찾을 수 없습니다')
  }

  const updatedApplication: Application = {
    ...application,
    ...data,
    updatedAt: new Date().toISOString(),
  }

  const index = mockApplications.findIndex(app => app.id === id)
  if (index !== -1) {
    mockApplications[index] = updatedApplication
  }
  mockApplicationsMap.set(id, updatedApplication)

  return updatedApplication
}

/**
 * 신청 삭제
 */
export async function deleteApplication(id: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const index = mockApplications.findIndex(app => app.id === id)
  if (index === -1) {
    throw new Error('신청을 찾을 수 없습니다')
  }

  mockApplications.splice(index, 1)
  mockApplicationsMap.delete(id)
}

/**
 * 신청 상태 변경
 */
export async function updateApplicationStatus(
  id: UUID,
  status: Application['status']
): Promise<Application> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const application = mockApplicationsMap.get(id)
  if (!application) {
    throw new Error('신청을 찾을 수 없습니다')
  }

  const reviewedAt =
    status === 'approved' || status === 'rejected' ? new Date().toISOString() : undefined

  return updateApplication(id, {
    status,
    reviewedAt,
  })
}






