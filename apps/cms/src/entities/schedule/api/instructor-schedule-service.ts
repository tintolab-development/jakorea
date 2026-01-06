/**
 * 강사/봉사자 본인 일정 조회 API (Mock)
 * Phase 5.2.3: 본인 일정 관리
 */

import type { UUID, Schedule } from '@/types'
import { mockSchedules } from '@/data/mock'
import dayjs from 'dayjs'

/**
 * 본인 일정 조회 (강사/봉사자용)
 */
export async function getMySchedules(instructorId: UUID): Promise<Schedule[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  // 본인 일정만 필터링
  const mySchedules = mockSchedules.filter(schedule => schedule.instructorId === instructorId)

  // 날짜순 정렬
  return mySchedules.sort((a, b) => {
    const dateA = dayjs(a.date)
    const dateB = dayjs(b.date)
    return dateA.valueOf() - dateB.valueOf()
  })
}

/**
 * 본인 일정 상세 조회 (강사/봉사자용)
 */
export async function getMyScheduleDetail(
  instructorId: UUID,
  scheduleId: UUID
): Promise<Schedule | null> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const schedule = mockSchedules.find(
    s => s.id === scheduleId && s.instructorId === instructorId
  )

  return schedule || null
}

/**
 * 본인 일정 상태별 조회
 */
export async function getMySchedulesByStatus(
  instructorId: UUID,
  status?: 'upcoming' | 'past'
): Promise<Schedule[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  let schedules = await getMySchedules(instructorId)

  if (status) {
    const now = dayjs()
    schedules = schedules.filter(schedule => {
      const scheduleDate = dayjs(schedule.date)
      if (status === 'upcoming') {
        return scheduleDate.isAfter(now) || scheduleDate.isSame(now, 'day')
      } else {
        return scheduleDate.isBefore(now, 'day')
      }
    })
  }

  return schedules
}

