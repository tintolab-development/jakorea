/**
 * 스폰서 유효성 검사 스키마 (Zod)
 * Phase 1.3: react-hook-form과 함께 사용
 */

import { z } from 'zod'

export const sponsorSchema = z.object({
  name: z.string().min(1, '스폰서 이름을 입력해주세요').max(100, '스폰서 이름은 100자 이하여야 합니다'),
  description: z.string().max(500, '설명은 500자 이하여야 합니다').optional().or(z.literal('')),
  contactInfo: z.string().max(200, '연락처 정보는 200자 이하여야 합니다').optional().or(z.literal('')),
  securityMemo: z.string().max(500, '보안 메모는 500자 이하여야 합니다').optional().or(z.literal('')),
})

export type SponsorFormData = z.infer<typeof sponsorSchema>







