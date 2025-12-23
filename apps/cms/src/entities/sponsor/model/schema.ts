/**
 * 스폰서 스키마 정의
 * Phase 1.3: Zod 스키마
 */

import { z } from 'zod'

export const sponsorSchema = z.object({
  name: z.string().min(1, '스폰서명을 입력해주세요'),
  description: z.string().optional(),
  contactInfo: z.string().optional(),
  securityMemo: z.string().optional(),
})

export type SponsorFormData = z.infer<typeof sponsorSchema>


