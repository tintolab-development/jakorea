/**
 * 학생 등록 모달 폼 스키마
 * 필수: 학생명, 성별, 생년월일(8자리), 학급 / 선택: 연락처, 이메일, 비고 (react-hook-form)
 */

import { z } from 'zod'
import { isValidKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'

/** 선택 입력(빈 문자열 허용)용 문자열, max 제한이 필요하면 union으로 각각 정의 */
const optionalString = z.union([z.string(), z.literal('')])

/** 8자리(YYYYMMDD) → 목록 표시 형식 `YYYY. MM. DD.` */
export function formatStudentBirthDateFromDigits(digits: string): string {
  const normalized = digits.replace(/\D/g, '')
  if (normalized.length !== 8) return digits.trim()
  return `${normalized.slice(0, 4)}. ${normalized.slice(4, 6)}. ${normalized.slice(6, 8)}.`
}

export const addStudentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '학생명을 입력해주세요')
    .max(50, '학생명은 50자 이내로 입력해주세요'),
  gender: z.enum(['male', 'female'], { message: '성별을 선택해주세요' }),
  birthDate: z
    .string()
    .trim()
    .min(1, '생년월일을 입력해주세요')
    .regex(/^\d{8}$/, '생년월일 8자리를 입력해주세요'),
  gradeClass: z
    .string()
    .trim()
    .min(1, '학급을 선택해주세요')
    .max(20, '학급은 20자 이내로 입력해주세요'),
  contact: z.union([
    z
      .string()
      .trim()
      .max(20, '연락처는 20자 이내로 입력해주세요')
      .refine(isValidKoreanPhoneNumber, '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'),
    z.literal(''),
  ]),
  email: optionalString.refine(
    v => !v || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    '올바른 이메일 형식을 입력해주세요'
  ),
  notes: z.union([
    z.string().trim().max(200, '비고는 200자 이내로 입력해주세요'),
    z.literal(''),
  ]),
})

export type AddStudentFormValues = z.infer<typeof addStudentFormSchema>

export const DEFAULT_ADD_STUDENT_FORM_VALUES: AddStudentFormValues = {
  name: '',
  gender: 'male',
  birthDate: '',
  contact: '',
  email: '',
  notes: '',
  gradeClass: '',
}
