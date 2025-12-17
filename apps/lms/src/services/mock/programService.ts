/**
 * 프로그램 Mock API 서비스
 * Phase 2.1: 프로그램 CRUD 작업
 */

import type { Program, UUID, PaginatedResponse } from '../../types'
import type { PaginationParams } from '../../types/index'
import { mockPrograms, mockProgramsMap } from '../../data/mock/programs'

export interface ProgramListParams extends PaginationParams {
  search?: string
  sponsorId?: UUID
  type?: 'online' | 'offline' | 'hybrid'
  format?: 'workshop' | 'seminar' | 'course' | 'lecture' | 'other'
  status?: 'active' | 'inactive' | 'pending'
  sortBy?: 'title' | 'status' | 'startDate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ProgramFilters {
  search?: string
  sponsorId?: UUID
  type?: 'online' | 'offline' | 'hybrid'
  format?: 'workshop' | 'seminar' | 'course' | 'lecture' | 'other'
  status?: 'active' | 'inactive' | 'pending'
}

// 시뮬레이션을 위한 지연
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 프로그램 목록 조회 (필터링, 정렬, 페이지네이션)
 */
export async function getPrograms(
  params: Partial<ProgramListParams> = {}
): Promise<PaginatedResponse<Program>> {
  await delay(300) // 네트워크 지연 시뮬레이션

  const {
    page = 1,
    pageSize = 10,
    search,
    sponsorId,
    type,
    format,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params

  let filtered = [...mockPrograms]

  // 검색 필터 (제목, 설명)
  if (search) {
    const searchLower = search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
    )
  }

  // 스폰서 필터
  if (sponsorId) {
    filtered = filtered.filter((p) => p.sponsorId === sponsorId)
  }

  // 유형 필터
  if (type) {
    filtered = filtered.filter((p) => p.type === type)
  }

  // 형태 필터
  if (format) {
    filtered = filtered.filter((p) => p.format === format)
  }

  // 상태 필터
  if (status) {
    filtered = filtered.filter((p) => p.status === status)
  }

  // 정렬
  filtered.sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    if (sortBy === 'title') {
      aValue = a.title
      bValue = b.title
    } else if (sortBy === 'status') {
      aValue = a.status
      bValue = b.status
    } else if (sortBy === 'startDate') {
      aValue = new Date(a.startDate).getTime()
      bValue = new Date(b.startDate).getTime()
    } else {
      // createdAt (기본값)
      aValue = new Date(a.createdAt).getTime()
      bValue = new Date(b.createdAt).getTime()
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // 페이지네이션
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const data = filtered.slice(startIndex, endIndex)

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * 프로그램 ID로 조회
 */
export async function getProgramById(id: UUID): Promise<Program | null> {
  await delay(200)

  const program = mockProgramsMap[id]
  if (!program) {
    throw new Error('프로그램을 찾을 수 없습니다.')
  }

  return program
}

/**
 * 프로그램 생성
 */
export async function createProgram(
  data: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Program> {
  await delay(400)

  // 유효성 검사
  if (!data.title || !data.sponsorId) {
    throw new Error('필수 입력 항목이 누락되었습니다.')
  }

  const now = new Date().toISOString()
  const newProgram: Program = {
    ...data,
    id: `prog-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  }

  // Mock 데이터에 추가 (실제로는 메모리에만 존재, 새로고침 시 사라짐)
  mockPrograms.push(newProgram)
  mockProgramsMap[newProgram.id] = newProgram

  return newProgram
}

/**
 * 프로그램 수정
 */
export async function updateProgram(
  id: UUID,
  data: Partial<Omit<Program, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Program> {
  await delay(400)

  const program = mockProgramsMap[id]
  if (!program) {
    throw new Error('프로그램을 찾을 수 없습니다.')
  }

  const updatedProgram: Program = {
    ...program,
    ...data,
    updatedAt: new Date().toISOString(),
  }

  // Mock 데이터 업데이트
  const index = mockPrograms.findIndex((p) => p.id === id)
  if (index !== -1) {
    mockPrograms[index] = updatedProgram
  }
  mockProgramsMap[id] = updatedProgram

  return updatedProgram
}

/**
 * 프로그램 삭제
 */
export async function deleteProgram(id: UUID): Promise<void> {
  await delay(300)

  const program = mockProgramsMap[id]
  if (!program) {
    throw new Error('프로그램을 찾을 수 없습니다.')
  }

  // Mock 데이터에서 제거
  const index = mockPrograms.findIndex((p) => p.id === id)
  if (index !== -1) {
    mockPrograms.splice(index, 1)
  }
  delete mockProgramsMap[id]
}

