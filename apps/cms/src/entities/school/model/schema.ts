/**
 * 학교 스키마 정의
 * Phase 1.4: Zod 스키마
 */

import { z } from 'zod'
import { isValidKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'

export const schoolSchema = z.object({
  name: z.string().min(1, '학교명을 입력해주세요'),
  region: z.string().min(1, '지역을 선택해주세요'),
  address: z.string().optional(),
  contactPerson: z.string().min(1, '담당자명을 입력해주세요'),
  contactPhone: z
    .string()
    .optional()
    .refine(
      value => !value?.trim() || isValidKoreanPhoneNumber(value),
      '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
    ),
  contactEmail: z.string().email('올바른 이메일을 입력해주세요').optional().or(z.literal('')),
})

export type SchoolFormData = z.infer<typeof schoolSchema>








