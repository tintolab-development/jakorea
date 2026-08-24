/**
 * 강사 스키마 정의
 * Phase 1.2: Zod 스키마
 */

import { z } from 'zod'
import { isValidKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'

export const instructorSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  contactPhone: z
    .string()
    .min(1, '연락처를 입력해주세요')
    .refine(isValidKoreanPhoneNumber, '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'),
  contactEmail: z.string().email('올바른 이메일을 입력해주세요').optional().or(z.literal('')),
  region: z.string().min(1, '지역을 선택해주세요'),
  specialty: z.array(z.string()).min(1, '최소 1개 이상의 전문분야를 선택해주세요'),
  availableTime: z.string().optional(),
  experience: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  // 정산 계좌 정보 (은행명이 있으면 계좌번호 필수)
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  accountHolder: z.string().optional(),
}).refine(
  (data) => {
    // 계좌번호가 있으면 은행명도 필수
    if (data.bankAccount && !data.bankName) {
      return false
    }
    return true
  },
  {
    path: ['bankName'],
  }
)

export type InstructorFormData = z.infer<typeof instructorSchema>




