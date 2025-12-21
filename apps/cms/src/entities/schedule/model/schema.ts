/**
 * 일정 스키마 정의
 * Phase 3.1: Zod 스키마
 */

import { z } from 'zod'

export const scheduleSchema = z.object({
  programId: z.string().min(1, '프로그램을 선택해주세요'),
  roundId: z.string().optional(),
  title: z.string().min(1, '일정 제목을 입력해주세요'),
  date: z.string().min(1, '날짜를 선택해주세요'),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, '시작 시간을 올바르게 입력해주세요 (HH:mm)'),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, '종료 시간을 올바르게 입력해주세요 (HH:mm)'),
  location: z.string().optional(),
  onlineLink: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  instructorId: z.string().optional(),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>




