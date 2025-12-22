/**
 * 신청 경로 Zod 스키마
 * V3 Phase 7: 신청 경로 관리
 */

import { z } from 'zod'

export const applicationPathSchema = z
  .object({
    programId: z.string().min(1, '프로그램을 선택해주세요'),
    pathType: z.enum(['google_form', 'internal'] as const, {
      required_error: '신청 경로를 선택해주세요',
    }),
    googleFormUrl: z
      .string()
      .url('올바른 URL 형식이 아닙니다')
      .optional()
      .or(z.literal(''))
      .transform(val => (val === '' ? undefined : val)),
    guideMessage: z.string().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    data => {
      if (data.pathType === 'google_form' && !data.googleFormUrl) {
        return false
      }
      return true
    },
    {
      message: '구글폼 링크를 입력해주세요',
      path: ['googleFormUrl'],
    }
  )

export type ApplicationPathFormData = z.infer<typeof applicationPathSchema>

