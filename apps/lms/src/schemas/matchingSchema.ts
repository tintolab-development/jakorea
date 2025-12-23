/**
 * 매칭 유효성 검사 스키마 (Zod)
 * Phase 3.2: react-hook-form과 함께 사용
 */

import { z } from 'zod'

export const matchingSchema = z.object({
  programId: z.string().uuid('올바른 프로그램을 선택해주세요'),
  roundId: z.string().uuid('올바른 회차를 선택해주세요').optional().or(z.literal('')),
  instructorId: z.string().uuid('올바른 강사를 선택해주세요'),
  scheduleId: z.string().uuid('올바른 일정을 선택해주세요').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'pending', 'completed', 'cancelled'], {
    errorMap: () => ({ message: '매칭 상태를 선택해주세요' }),
  }),
  cancellationReason: z.string().max(500, '취소 사유는 500자 이하여야 합니다').optional().or(z.literal('')),
})

export type MatchingFormData = z.infer<typeof matchingSchema>







