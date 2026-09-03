/**
 * 후원사 상세 — 담당자 등록 모달 폼 스키마 (react-hook-form + zod)
 */

import { z } from 'zod'
import { isValidKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import type { SponsorContactType } from '@/features/sponsor/model/sponsor-management.types'

/** 연락처(`mobilePhone`) — 서버와 동일 */
export const SPONSOR_CONTACT_PHONE_FORMAT_MESSAGE =
  '전화번호 형식이 올바르지 않습니다. 010/070은 4-4자리, 02 및 지역번호는 3~4-4자리 형식으로 입력해 주세요.'

export const SPONSOR_CONTACT_OFFICE_PHONE_FORMAT_MESSAGE =
  '내선번호 형식이 올바르지 않습니다. 02 및 지역번호는 3~4-4자리, 010/070은 4-4자리 형식으로 입력해 주세요.'

/** 내선번호 — 연락처와 동일한 한국 전화번호 형식. 빈 값 허용. */
export function isValidSponsorOfficePhone(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  return isValidKoreanPhoneNumber(trimmed)
}

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
  department: z.union([
    z.string().trim().max(50, '부서는 50자 이내로 입력해 주세요.'),
    z.literal(''),
  ]),
  position: z.union([
    z.string().trim().max(50, '직함은 50자 이내로 입력해 주세요.'),
    z.literal(''),
  ]),
  officePhone: z
    .string()
    .trim()
    .max(20, '내선번호는 20자 이내로 입력해 주세요.')
    .refine(isValidSponsorOfficePhone, SPONSOR_CONTACT_OFFICE_PHONE_FORMAT_MESSAGE),
  phone: z
    .string()
    .trim()
    .min(1, '연락처를 입력해 주세요.')
    .max(20, '연락처는 20자 이내로 입력해 주세요.')
    .refine(isValidKoreanPhoneNumber, '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'),
  email: optionalTrimmedString.refine(
    value => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    '올바른 이메일 형식을 입력해 주세요.'
  ),
  companyAddress: z.union([
    z.string().trim().max(200, '회사 주소는 200자 이내로 입력해 주세요.'),
    z.literal(''),
  ]),
  memo: z.union([
    z.string().trim().max(500, '비고는 500자 이내로 입력해 주세요.'),
    z.literal(''),
  ]),
})

export type SponsorContactRegisterFormValues = z.infer<typeof sponsorContactRegisterFormSchema>

export const DEFAULT_SPONSOR_CONTACT_REGISTER_FORM_VALUES: SponsorContactRegisterFormValues = {
  contactType: 'lead',
  name: '',
  department: '',
  position: '',
  officePhone: '',
  phone: '',
  email: '',
  companyAddress: '',
  memo: '',
}

export function toSponsorContactRegisterPayload(
  values: SponsorContactRegisterFormValues
): {
  contactType: SponsorContactType
  name: string
  department: string
  position: string
  officePhone: string
  phone: string
  email: string
  companyAddress: string
  memo: string
} {
  return {
    contactType: values.contactType,
    name: values.name.trim(),
    department: values.department.trim(),
    position: values.position.trim(),
    officePhone: values.officePhone.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    companyAddress: values.companyAddress.trim(),
    memo: values.memo.trim(),
  }
}
