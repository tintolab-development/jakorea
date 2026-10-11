/**
 * 강사/봉사자 본인 일정 조회 API (stub)
 */

import type { UUID, Schedule } from '@/types'

export async function getMySchedules(_instructorId: UUID): Promise<Schedule[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return []
}

export async function getMyScheduleDetail(
  _instructorId: UUID,
  _scheduleId: UUID
): Promise<Schedule | null> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return null
}

export async function getMySchedulesByStatus(
  _instructorId: UUID,
  _status?: 'upcoming' | 'past'
): Promise<Schedule[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return []
}
