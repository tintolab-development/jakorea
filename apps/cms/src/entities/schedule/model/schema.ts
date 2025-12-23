/**
 * 일정 스키마 정의
 * Phase 3.1: Zod 스키마
 */

import { z } from 'zod'

export const scheduleSchema = z.object({
  programId: z.string().min(1, '프로그램을 선택해주세요'),
  roundId: z.string().optional(),
  title: z
    .string({
      required_error: '일정 제목을 입력해주세요',
      invalid_type_error: '일정 제목을 입력해주세요',
    })
    .trim()
    .min(1, '일정 제목을 입력해주세요'),
  date: z.string().min(1, '날짜를 선택해주세요'),
  startTime: z
    .string({
      required_error: '시작 시간을 입력해주세요',
      invalid_type_error: '시작 시간을 입력해주세요',
    })
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, '시작 시간을 올바르게 입력해주세요 (HH:mm 형식)'),
  endTime: z
    .string({
      required_error: '종료 시간을 입력해주세요',
      invalid_type_error: '종료 시간을 입력해주세요',
    })
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, '종료 시간을 올바르게 입력해주세요 (HH:mm 형식)'),
  location: z.string().optional(),
  onlineLink: z
    .string()
    .optional()
    .refine(
      val => !val || val === '' || z.string().url().safeParse(val).success,
      '올바른 URL 형식을 입력해주세요 (예: https://example.com)'
    ),
  instructorId: z.string().optional(),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>




