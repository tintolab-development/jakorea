/**
 * Matching 엔티티 Zod 스키마
 * Phase 3.2: 강사 매칭 관리
 */

import { z } from 'zod'
import type { Status } from '@/types'

export const matchingStatusSchema = z.enum(['active', 'inactive', 'pending', 'completed', 'cancelled'])

export type MatchingFormData = {
  programId: string
  roundId: string
  instructorId: string
  scheduleId?: string
  status: Status
}

export const matchingFormSchema = z.object({
  programId: z.string().min(1, '프로그램을 선택해주세요'),
  roundId: z.string().min(1, '회차를 선택해주세요'),
  instructorId: z.string().min(1, '강사를 선택해주세요'),
  scheduleId: z.string().optional(),
  status: matchingStatusSchema,
})

