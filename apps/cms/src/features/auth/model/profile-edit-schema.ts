import { z } from 'zod'
import { KOREAN_PHONE_REGEX } from '@/shared/utils/phone-validation'

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value
}

export const profileEditSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.preprocess(
    trimString,
    z
      .string()
      .optional()
      .refine(
        value => !value || KOREAN_PHONE_REGEX.test(value),
        '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
      )
  ),
  email: z.preprocess(
    trimString,
    z.string().min(1, '이메일을 입력해주세요').email('올바른 이메일 형식이 아닙니다')
  ),
})

export type ProfileEditFormData = z.infer<typeof profileEditSchema>
