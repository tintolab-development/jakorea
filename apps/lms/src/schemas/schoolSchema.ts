/**
 * 학교 유효성 검사 스키마 (Zod)
 * Phase 1.4: react-hook-form과 함께 사용
 */

import { z } from 'zod'

export const schoolSchema = z.object({
  name: z.string().min(1, '학교명을 입력해주세요').max(100, '학교명은 100자 이하여야 합니다'),
  region: z.string().min(1, '지역을 선택해주세요'),
  address: z.string().max(200, '주소는 200자 이하여야 합니다').optional().or(z.literal('')),
  contactPerson: z.string().min(1, '담당자 이름을 입력해주세요').max(50, '담당자 이름은 50자 이하여야 합니다'),
  contactPhone: z
    .string()
    .regex(/^0\d{1,2}-\d{3,4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다 (예: 02-1234-5678)')
    .optional()
    .or(z.literal('')),
  contactEmail: z.string().email('올바른 이메일 형식이 아닙니다').optional().or(z.literal('')),
})

export type SchoolFormData = z.infer<typeof schoolSchema>







