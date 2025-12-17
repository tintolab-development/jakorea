/**
 * 정산 유효성 검사 스키마 (Zod)
 * Phase 4: react-hook-form과 함께 사용
 */

import { z } from 'zod'

export const settlementItemSchema = z.object({
  type: z.enum(['instructor_fee', 'transportation', 'accommodation', 'other'], {
    errorMap: () => ({ message: '올바른 정산 항목 유형을 선택해주세요' }),
  }),
  description: z.string().min(1, '설명을 입력해주세요').max(500, '설명은 500자 이하여야 합니다'),
  amount: z.number().min(0, '금액은 0 이상이어야 합니다'),
})

export const settlementSchema = z.object({
  programId: z.string().uuid('올바른 프로그램을 선택해주세요'),
  instructorId: z.string().uuid('올바른 강사를 선택해주세요'),
  matchingId: z.string().uuid('올바른 매칭을 선택해주세요'),
  period: z.string().min(1, '정산 기간을 입력해주세요'),
  items: z.array(settlementItemSchema).min(1, '최소 1개 이상의 정산 항목이 필요합니다'),
  status: z.enum(['pending', 'calculated', 'approved', 'paid', 'cancelled'], {
    errorMap: () => ({ message: '올바른 정산 상태를 선택해주세요' }),
  }),
  notes: z.string().max(1000, '메모는 1000자 이하여야 합니다').optional().or(z.literal('')),
})

export type SettlementItemFormData = z.infer<typeof settlementItemSchema>
export type SettlementFormData = z.infer<typeof settlementSchema>

