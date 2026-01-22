/**
 * 일정 협의 Zod 스키마
 * V3 Phase 8: 일정 협의 관리
 */

import { z } from 'zod'

export const scheduleNegotiationProposalSchema = z.object({
  date: z.string().min(1, '날짜를 선택해주세요'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'rejected']).default('pending'),
  note: z.string().optional(),
})

export const scheduleNegotiationSchema = z.object({
  programId: z.string().min(1, '프로그램을 선택해주세요'),
  schoolId: z.string().min(1, '학교를 선택해주세요'),
  proposals: z
    .array(scheduleNegotiationProposalSchema)
    .min(1, '최소 1개 이상의 일정 제안이 필요합니다'),
  status: z.enum(['proposed', 'accepted', 'rejected', 'revised']).default('proposed'),
})

export type ScheduleNegotiationFormData = z.infer<typeof scheduleNegotiationSchema>
export type ScheduleNegotiationProposalFormData = z.infer<typeof scheduleNegotiationProposalSchema>
