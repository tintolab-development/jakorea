/**
 * 후원사 상세 — 담당자 등록 모달 폼 스키마 (react-hook-form + zod)
 */

import { z } from 'zod'
import type { SponsorContactType } from '@/features/sponsor/model/sponsor-management.types'

const optionalTrimmedString = z.union([z.string().trim(), z.literal('')])

export const sponsorContactRegisterFormSchema = z.object({
  contactType: z.enum(['lead', 'assistant'], {
    message: '담당자 유형을 선택해 주세요.',
  }),
  name: z
    .string()
    .trim()
    .min(1, '담당자명을 입력해 주세요.')
    .max(50, '담당자명은 50자 이내로 입력해 주세요.'),
  position: z.union([
    z.string().trim().max(50, '직급은 50자 이내로 입력해 주세요.'),
    z.literal(''),
  ]),
  phone: z.union([
    z
      .string()
      .trim()
      .max(20, '연락처는 20자 이내로 입력해 주세요.')
      .regex(/^[\d-]+$/, '연락처는 숫자와 하이픈(-)만 입력해 주세요.'),
    z.literal(''),
  ]),
  email: optionalTrimmedString.refine(
    value => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    '올바른 이메일 형식을 입력해 주세요.'
  ),
})

export type SponsorContactRegisterFormValues = z.infer<typeof sponsorContactRegisterFormSchema>

export const DEFAULT_SPONSOR_CONTACT_REGISTER_FORM_VALUES: SponsorContactRegisterFormValues = {
  contactType: 'lead',
  name: '',
  position: '',
  phone: '',
  email: '',
}

export function toSponsorContactRegisterPayload(
  values: SponsorContactRegisterFormValues
): {
  contactType: SponsorContactType
  name: string
  position: string
  phone: string
  email: string
} {
  return {
    contactType: values.contactType,
    name: values.name.trim(),
    position: values.position.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
  }
}
