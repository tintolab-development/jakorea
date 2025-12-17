/**
 * 매칭 Mock API Service
 * Phase 3.2: 매칭 CRUD 및 강사 후보 제안 로직
 */

import type { Matching, UUID, PaginatedResponse, Instructor } from '../../types'
import { mockMatchings, mockMatchingsMap, mockMatchingsByProgram, mockMatchingsByInstructor } from '../../data/mock/matchings'
import { mockInstructors } from '../../data/mock/instructors'
import { mockPrograms } from '../../data/mock/programs'
import { mockSchedules } from '../../data/mock/schedules'

export interface MatchingListParams {
  page: number
  pageSize: number
  programId?: UUID
  instructorId?: UUID
  status?: Matching['status']
  search?: string
  sortBy?: 'matchedAt' | 'status' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface MatchingFilters {
  programId?: UUID
  instructorId?: UUID
  status?: Matching['status']
  search?: string
}

export interface InstructorCandidate {
  instructor: Instructor
  score: number
  reasons: string[]
}

/**
 * 강사 후보 제안 로직
 * 지역/전문분야 기반 필터링 및 점수 계산
 */
export function suggestInstructorCandidates(
  programId: UUID,
  roundId?: UUID,
  excludeInstructorIds: UUID[] = []
): InstructorCandidate[] {
  const program = mockPrograms.find(p => p.id === programId)
  if (!program) return []

  const candidates: InstructorCandidate[] = []

  // 프로그램과 연결된 일정 찾기
  const programSchedules = mockSchedules.filter(s => s.programId === programId && (!roundId || s.roundId === roundId))

  for (const instructor of mockInstructors) {
    // 제외 목록에 있는 강사는 스킵
    if (excludeInstructorIds.includes(instructor.id)) continue

    let score = 0
    const reasons: string[] = []

    // 1. 전문분야 일치 확인
    // 프로그램 형식에 따라 관련 전문분야 매칭 (간단한 로직)
    const programFormatToSpecialties: Record<string, string[]> = {
      workshop: ['워크샵', '교육', '비즈니스'],
      seminar: ['세미나', '강의', '비즈니스'],
      course: ['교육', '코스', '강의'],
      lecture: ['강의', '세미나'],
      other: [],
    }

    const relevantSpecialties = programFormatToSpecialties[program.format] || []
    const hasRelevantSpecialty = instructor.specialty.some(spec =>
      relevantSpecialties.some(rel => spec.toLowerCase().includes(rel.toLowerCase()))
    )

    if (hasRelevantSpecialty) {
      score += 30
      reasons.push('전문분야 일치')
    }

    // 2. 지역 일치 확인 (오프라인 프로그램인 경우)
    // 지역이 일치하면 추가 점수 (간단한 로직, 실제로는 더 정교한 매칭 필요)
    if (program.type === 'offline' || program.type === 'hybrid') {
      // 지역 매칭은 프로그램 정보에 지역 정보가 없으므로 건너뜀 (향후 확장)
      score += 10 // 기본 점수
    }

    // 3. 평가 점수 반영
    if (instructor.rating) {
      score += instructor.rating * 10 // 3.0~5.0 -> 30~50점
      reasons.push(`평가 점수: ${instructor.rating}`)
    }

    // 4. 경력 반영
    if (instructor.experience) {
      score += 10
      reasons.push('경력 보유')
    }

    // 5. 기존 매칭 수 고려 (너무 많은 매칭이면 점수 감소)
    const existingMatchings = mockMatchingsByInstructor.get(instructor.id) || []
    const activeMatchings = existingMatchings.filter(m => m.status === 'active' || m.status === 'pending').length
    if (activeMatchings > 5) {
      score -= (activeMatchings - 5) * 5 // 5개 초과 시 감점
      reasons.push(`현재 ${activeMatchings}개 매칭 중`)
    } else if (activeMatchings > 0) {
      reasons.push(`현재 ${activeMatchings}개 매칭 중`)
    }

    // 6. 일정 충돌 확인 (점수 감소는 하지 않고 reasons에만 표시)
    if (programSchedules.length > 0) {
      const instructorSchedules = mockSchedules.filter(s => s.instructorId === instructor.id)
      const hasConflict = programSchedules.some(ps => {
        return instructorSchedules.some(is => {
          if (ps.date !== is.date) return false
          const psStart = parseInt(ps.startTime.replace(':', ''), 10)
          const psEnd = parseInt(ps.endTime.replace(':', ''), 10)
          const isStart = parseInt(is.startTime.replace(':', ''), 10)
          const isEnd = parseInt(is.endTime.replace(':', ''), 10)
          return psStart < isEnd && isStart < psEnd
        })
      })

      if (hasConflict) {
        reasons.push('⚠️ 일정 충돌 가능성')
      }
    }

    // 최소 점수 이상인 경우만 후보에 포함
    if (score > 0) {
      candidates.push({
        instructor,
        score,
        reasons,
      })
    }
  }

  // 점수 순으로 정렬
  candidates.sort((a, b) => b.score - a.score)

  // 상위 10개만 반환
  return candidates.slice(0, 10)
}

/**
 * 매칭 목록 조회 (필터링, 정렬, 페이지네이션)
 */
export async function getMatchings(params: MatchingListParams): Promise<PaginatedResponse<Matching>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  let filtered = [...mockMatchings]

  // 프로그램 필터
  if (params.programId) {
    filtered = filtered.filter(matching => matching.programId === params.programId)
  }

  // 강사 필터
  if (params.instructorId) {
    filtered = filtered.filter(matching => matching.instructorId === params.instructorId)
  }

  // 상태 필터
  if (params.status) {
    filtered = filtered.filter(matching => matching.status === params.status)
  }

  // 검색 필터 (프로그램 ID, 강사 ID 등으로 검색 - 실제로는 이름으로 검색해야 함)
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filtered = filtered.filter(matching => matching.id.toLowerCase().includes(searchLower))
  }

  // 정렬
  const sortBy = params.sortBy || 'matchedAt'
  const sortOrder = params.sortOrder || 'desc'
  filtered.sort((a, b) => {
    let aValue: string | number | Date
    let bValue: string | number | Date

    switch (sortBy) {
      case 'matchedAt':
        aValue = new Date(a.matchedAt).getTime()
        bValue = new Date(b.matchedAt).getTime()
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
        aValue = new Date(a.matchedAt).getTime()
        bValue = new Date(b.matchedAt).getTime()
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
 * 매칭 상세 조회
 */
export async function getMatchingById(id: UUID): Promise<Matching | null> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const matching = mockMatchingsMap.get(id)
  if (!matching) {
    throw new Error('매칭을 찾을 수 없습니다')
  }

  return matching
}

/**
 * 매칭 생성
 */
export async function createMatching(
  data: Omit<Matching, 'id' | 'createdAt' | 'updatedAt' | 'matchedAt' | 'history'>
): Promise<Matching> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const newMatching: Matching = {
    ...data,
    id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    matchedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: `match-${Date.now()}-history-1`,
        matchingId: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'created',
        changedAt: new Date().toISOString(),
      },
    ],
  }

  mockMatchings.push(newMatching)
  mockMatchingsMap.set(newMatching.id, newMatching)

  // 그룹 업데이트
  const programMatchings = mockMatchingsByProgram.get(newMatching.programId) || []
  programMatchings.push(newMatching)
  mockMatchingsByProgram.set(newMatching.programId, programMatchings)

  const instructorMatchings = mockMatchingsByInstructor.get(newMatching.instructorId) || []
  instructorMatchings.push(newMatching)
  mockMatchingsByInstructor.set(newMatching.instructorId, instructorMatchings)

  return newMatching
}

/**
 * 매칭 수정
 */
export async function updateMatching(
  id: UUID,
  data: Partial<Omit<Matching, 'id' | 'createdAt' | 'updatedAt' | 'matchedAt' | 'history'>>
): Promise<Matching> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const matching = mockMatchingsMap.get(id)
  if (!matching) {
    throw new Error('매칭을 찾을 수 없습니다')
  }

  const previousStatus = matching.status

  const updatedMatching: Matching = {
    ...matching,
    ...data,
    updatedAt: new Date().toISOString(),
    // 취소된 경우 cancelledAt 추가
    cancelledAt: data.status === 'cancelled' && !matching.cancelledAt ? new Date().toISOString() : matching.cancelledAt,
    // 이력 추가
    history: [
      ...(matching.history || []),
      {
        id: `${id}-history-${Date.now()}`,
        matchingId: id,
        action: data.status === 'cancelled' ? 'cancelled' : 'updated',
        previousValue: previousStatus,
        newValue: data.status || previousStatus,
        changedAt: new Date().toISOString(),
      },
    ],
  }

  const index = mockMatchings.findIndex(m => m.id === id)
  if (index !== -1) {
    mockMatchings[index] = updatedMatching
  }
  mockMatchingsMap.set(id, updatedMatching)

  return updatedMatching
}

/**
 * 매칭 삭제
 */
export async function deleteMatching(id: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const matching = mockMatchingsMap.get(id)
  if (!matching) {
    throw new Error('매칭을 찾을 수 없습니다')
  }

  const index = mockMatchings.findIndex(m => m.id === id)
  if (index === -1) {
    throw new Error('매칭을 찾을 수 없습니다')
  }

  mockMatchings.splice(index, 1)
  mockMatchingsMap.delete(id)

  // 그룹에서 제거
  const programMatchings = mockMatchingsByProgram.get(matching.programId) || []
  const filteredProgram = programMatchings.filter(m => m.id !== id)
  if (filteredProgram.length > 0) {
    mockMatchingsByProgram.set(matching.programId, filteredProgram)
  } else {
    mockMatchingsByProgram.delete(matching.programId)
  }

  const instructorMatchings = mockMatchingsByInstructor.get(matching.instructorId) || []
  const filteredInstructor = instructorMatchings.filter(m => m.id !== id)
  if (filteredInstructor.length > 0) {
    mockMatchingsByInstructor.set(matching.instructorId, filteredInstructor)
  } else {
    mockMatchingsByInstructor.delete(matching.instructorId)
  }
}

/**
 * 프로그램별 매칭 목록 조회
 */
export async function getMatchingsByProgram(programId: UUID): Promise<Matching[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  return mockMatchingsByProgram.get(programId) || []
}

/**
 * 강사별 매칭 목록 조회
 */
export async function getMatchingsByInstructor(instructorId: UUID): Promise<Matching[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  return mockMatchingsByInstructor.get(instructorId) || []
}

