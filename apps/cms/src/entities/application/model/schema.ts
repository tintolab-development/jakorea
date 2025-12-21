/**
 * 신청 스키마 정의
 * Phase 2.2: Zod 스키마
 */

import { z } from 'zod'

export const applicationSchema = z.object({
  programId: z.string().min(1, '프로그램을 선택해주세요'),
  roundId: z.string().optional(),
  subjectType: z.enum(['school', 'student', 'instructor']),
  subjectId: z.string().min(1, '신청 주체를 선택해주세요'),
  status: z.enum(['submitted', 'reviewing', 'approved', 'rejected', 'cancelled']),
  notes: z.string().optional(),
})

export type ApplicationFormData = z.infer<typeof applicationSchema>




