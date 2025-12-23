/**
 * 강사 유효성 검사 스키마 (Zod)
 * Phase 1.2: react-hook-form과 함께 사용
 */

import { z } from 'zod'

export const instructorSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이하여야 합니다'),
  contactPhone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, '010-XXXX-XXXX 형식으로 입력해주세요')
    .optional()
    .or(z.literal('')),
  contactEmail: z.string().email('올바른 이메일 형식이 아닙니다').optional().or(z.literal('')),
  region: z.string().min(1, '지역을 선택해주세요'),
  specialty: z.array(z.string()).min(1, '최소 1개 이상의 전문분야를 선택해주세요'),
  availableTime: z.string().optional().or(z.literal('')),
  experience: z.string().optional().or(z.literal('')),
  rating: z
    .number()
    .min(0, '평가는 0 이상이어야 합니다')
    .max(5, '평가는 5 이하여야 합니다')
    .optional()
    .nullable(),
  bankAccount: z.string().optional().or(z.literal('')),
})

export type InstructorFormData = z.infer<typeof instructorSchema>






