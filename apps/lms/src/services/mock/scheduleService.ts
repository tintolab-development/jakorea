/**
 * 일정 Mock API Service
 * Phase 3.1: 일정 CRUD 및 중복 감지
 */

import type { Schedule, UUID, PaginatedResponse } from '../../types'
import { mockSchedules, mockSchedulesMap, mockSchedulesByInstructor } from '../../data/mock/schedules'
import { isTimeOverlapping, type ScheduleConflict } from '../../schemas/scheduleSchema'

export interface ScheduleListParams {
  page: number
  pageSize: number
  programId?: UUID
  instructorId?: UUID
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  search?: string
  sortBy?: 'date' | 'startTime' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ScheduleFilters {
  programId?: UUID
  instructorId?: UUID
  startDate?: string
  endDate?: string
  search?: string
}

/**
 * 일정 목록 조회 (필터링, 정렬, 페이지네이션)
 */
export async function getSchedules(params: ScheduleListParams): Promise<PaginatedResponse<Schedule>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  let filtered = [...mockSchedules]

  // 프로그램 필터
  if (params.programId) {
    filtered = filtered.filter(schedule => schedule.programId === params.programId)
  }

  // 강사 필터
  if (params.instructorId) {
    filtered = filtered.filter(schedule => schedule.instructorId === params.instructorId)
  }

  // 날짜 범위 필터
  if (params.startDate) {
    filtered = filtered.filter(schedule => schedule.date >= params.startDate!)
  }
  if (params.endDate) {
    filtered = filtered.filter(schedule => schedule.date <= params.endDate!)
  }

  // 검색 필터
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filtered = filtered.filter(
      schedule =>
        schedule.title.toLowerCase().includes(searchLower) ||
        schedule.location?.toLowerCase().includes(searchLower)
    )
  }

  // 정렬
  const sortBy = params.sortBy || 'date'
  const sortOrder = params.sortOrder || 'asc'
  filtered.sort((a, b) => {
    let aValue: string | number | Date
    let bValue: string | number | Date

    switch (sortBy) {
      case 'date':
        // 날짜 우선, 날짜가 같으면 시작 시간으로 정렬
        const dateA = typeof a.date === 'string' ? a.date : a.date.toISOString().split('T')[0]
        const dateB = typeof b.date === 'string' ? b.date : b.date.toISOString().split('T')[0]
        const dateCompare = dateA.localeCompare(dateB)
        if (dateCompare !== 0) {
          return sortOrder === 'asc' ? dateCompare : -dateCompare
        }
        return sortOrder === 'asc'
          ? a.startTime.localeCompare(b.startTime)
          : b.startTime.localeCompare(a.startTime)
      case 'startTime':
        // 날짜+시간으로 정렬
        const dateTimeA = `${a.date} ${a.startTime}`
        const dateTimeB = `${b.date} ${b.startTime}`
        return sortOrder === 'asc'
          ? dateTimeA.localeCompare(dateTimeB)
          : dateTimeB.localeCompare(dateTimeA)
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
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
 * 일정 상세 조회
 */
export async function getScheduleById(id: UUID): Promise<Schedule | null> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const schedule = mockSchedulesMap.get(id)
  if (!schedule) {
    throw new Error('일정을 찾을 수 없습니다')
  }

  return schedule
}

/**
 * 일정 생성 (중복 감지 포함)
 */
export async function createSchedule(
  data: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ schedule: Schedule; conflicts: ScheduleConflict[] }> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // 중복 감지
  const conflicts = detectConflicts(data, undefined)

  const newSchedule: Schedule = {
    ...data,
    id: `sch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockSchedules.push(newSchedule)
  mockSchedulesMap.set(newSchedule.id, newSchedule)

  // 강사별 일정 그룹 업데이트
  if (newSchedule.instructorId) {
    const instructorSchedules = mockSchedulesByInstructor.get(newSchedule.instructorId) || []
    instructorSchedules.push(newSchedule)
    mockSchedulesByInstructor.set(newSchedule.instructorId, instructorSchedules)
  }

  return { schedule: newSchedule, conflicts }
}

/**
 * 일정 수정 (중복 감지 포함)
 */
export async function updateSchedule(
  id: UUID,
  data: Partial<Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ schedule: Schedule; conflicts: ScheduleConflict[] }> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const schedule = mockSchedulesMap.get(id)
  if (!schedule) {
    throw new Error('일정을 찾을 수 없습니다')
  }

  const updatedSchedule: Schedule = {
    ...schedule,
    ...data,
    updatedAt: new Date().toISOString(),
  }

  // 중복 감지 (현재 일정 제외)
  const conflicts = detectConflicts(updatedSchedule, id)

  const index = mockSchedules.findIndex(s => s.id === id)
  if (index !== -1) {
    mockSchedules[index] = updatedSchedule
  }
  mockSchedulesMap.set(id, updatedSchedule)

  // 강사별 일정 그룹 업데이트
  if (updatedSchedule.instructorId) {
    const instructorSchedules = mockSchedulesByInstructor.get(updatedSchedule.instructorId) || []
    const existingIndex = instructorSchedules.findIndex(s => s.id === id)
    if (existingIndex !== -1) {
      instructorSchedules[existingIndex] = updatedSchedule
    } else {
      instructorSchedules.push(updatedSchedule)
    }
    mockSchedulesByInstructor.set(updatedSchedule.instructorId, instructorSchedules)
  }

  return { schedule: updatedSchedule, conflicts }
}

/**
 * 일정 삭제
 */
export async function deleteSchedule(id: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const schedule = mockSchedulesMap.get(id)
  if (!schedule) {
    throw new Error('일정을 찾을 수 없습니다')
  }

  const index = mockSchedules.findIndex(s => s.id === id)
  if (index === -1) {
    throw new Error('일정을 찾을 수 없습니다')
  }

  mockSchedules.splice(index, 1)
  mockSchedulesMap.delete(id)

  // 강사별 일정 그룹에서 제거
  if (schedule.instructorId) {
    const instructorSchedules = mockSchedulesByInstructor.get(schedule.instructorId) || []
    const filtered = instructorSchedules.filter(s => s.id !== id)
    if (filtered.length > 0) {
      mockSchedulesByInstructor.set(schedule.instructorId, filtered)
    } else {
      mockSchedulesByInstructor.delete(schedule.instructorId)
    }
  }
}

/**
 * 일정 중복 감지
 * @param schedule 확인할 일정
 * @param excludeId 제외할 일정 ID (수정 시 자기 자신 제외)
 */
export function detectConflicts(
  schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'> | Schedule,
  excludeId?: UUID
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []

  if (!schedule.instructorId) {
    return conflicts // 강사가 없으면 중복 감지 불가
  }

  const instructorSchedules = mockSchedulesByInstructor.get(schedule.instructorId) || []

  for (const existingSchedule of instructorSchedules) {
    // 자기 자신 제외
    if (excludeId && existingSchedule.id === excludeId) {
      continue
    }

    // 날짜와 시간이 겹치는지 확인
    const scheduleDate = typeof schedule.date === 'string' ? schedule.date : schedule.date.toISOString().split('T')[0]
    const existingDate =
      typeof existingSchedule.date === 'string'
        ? existingSchedule.date
        : existingSchedule.date.toISOString().split('T')[0]

    if (
      isTimeOverlapping(
        scheduleDate,
        schedule.startTime,
        schedule.endTime,
        existingDate,
        existingSchedule.startTime,
        existingSchedule.endTime
      )
    ) {
      conflicts.push({
        type: 'instructor',
        conflictingScheduleId: existingSchedule.id,
        conflictingScheduleTitle: existingSchedule.title,
        message: `동일 강사(${schedule.instructorId})가 같은 시간대에 다른 일정이 있습니다: "${existingSchedule.title}"`,
      })
    }
  }

  return conflicts
}

/**
 * 특정 강사의 일정 목록 조회
 */
export async function getSchedulesByInstructor(instructorId: UUID): Promise<Schedule[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  return mockSchedulesByInstructor.get(instructorId) || []
}

