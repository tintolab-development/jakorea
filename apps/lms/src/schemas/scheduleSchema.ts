/**
 * 일정 유효성 검사 스키마 (Zod)
 * Phase 3.1: react-hook-form과 함께 사용, 중복 감지 로직 포함
 */

import { z } from 'zod'

export const scheduleSchema = z
  .object({
    programId: z.string().uuid('올바른 프로그램을 선택해주세요'),
    roundId: z.string().uuid('올바른 회차를 선택해주세요').optional().or(z.literal('')),
    title: z.string().min(1, '일정 제목을 입력해주세요').max(200, '일정 제목은 200자 이하여야 합니다'),
    date: z
      .string()
      .min(1, '날짜를 입력해주세요')
      .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)'),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '올바른 시간 형식이 아닙니다 (HH:mm)'),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '올바른 시간 형식이 아닙니다 (HH:mm)'),
    location: z.string().max(500, '장소는 500자 이하여야 합니다').optional().or(z.literal('')),
    onlineLink: z
      .string()
      .url('올바른 URL 형식이 아닙니다')
      .optional()
      .or(z.literal('')),
    instructorId: z.string().uuid('올바른 강사를 선택해주세요').optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // 시작 시간이 종료 시간보다 앞서야 함
      const start = parseInt(data.startTime.replace(':', ''), 10)
      const end = parseInt(data.endTime.replace(':', ''), 10)
      return start < end
    },
    {
      message: '종료 시간은 시작 시간보다 늦어야 합니다',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      // location 또는 onlineLink 중 하나는 필수
      return data.location || data.onlineLink
    },
    {
      message: '장소 또는 온라인 링크 중 하나는 입력해주세요',
      path: ['location'],
    }
  )

export type ScheduleFormData = z.infer<typeof scheduleSchema>

/**
 * 일정 중복 감지 유틸리티
 */
export interface ScheduleConflict {
  type: 'instructor' | 'time' | 'location'
  conflictingScheduleId: string
  conflictingScheduleTitle: string
  message: string
}

/**
 * 일정이 시간적으로 겹치는지 확인
 */
export function isTimeOverlapping(
  date1: string,
  startTime1: string,
  endTime1: string,
  date2: string,
  startTime2: string,
  endTime2: string
): boolean {
  // 날짜가 다르면 겹치지 않음
  if (date1 !== date2) return false

  const time1Start = parseInt(startTime1.replace(':', ''), 10)
  const time1End = parseInt(endTime1.replace(':', ''), 10)
  const time2Start = parseInt(startTime2.replace(':', ''), 10)
  const time2End = parseInt(endTime2.replace(':', ''), 10)

  // 시간이 겹치는 경우: time1Start < time2End && time2Start < time1End
  return time1Start < time2End && time2Start < time1End
}

