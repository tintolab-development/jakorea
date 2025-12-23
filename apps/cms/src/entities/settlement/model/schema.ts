/**
 * 정산 스키마 정의
 * Phase 4: Zod 스키마
 */

import { z } from 'zod'

export const settlementItemSchema = z.object({
  type: z.enum(['instructor_fee', 'transportation', 'accommodation', 'other']),
  description: z.string().min(1, '항목 설명을 입력해주세요'),
  amount: z.number().min(0, '금액은 0 이상이어야 합니다'),
})

export const settlementSchema = z.object({
  programId: z.string().min(1, '프로그램을 선택해주세요'),
  instructorId: z.string().min(1, '강사를 선택해주세요'),
  matchingId: z.string().min(1, '매칭을 선택해주세요'),
  period: z.string().min(1, '기간을 입력해주세요'),
  items: z.array(settlementItemSchema).min(1, '정산 항목을 최소 1개 이상 추가해주세요'),
  status: z.enum(['pending', 'calculated', 'approved', 'paid', 'cancelled']),
  notes: z.string().optional(),
})

export type SettlementFormData = z.infer<typeof settlementSchema>
export type SettlementItemFormData = z.infer<typeof settlementItemSchema>


