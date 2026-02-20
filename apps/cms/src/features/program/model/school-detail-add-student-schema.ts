/**
 * 학생 등록 모달 폼 스키마
 * 필수: 학생명, 성별, 학급 / 선택: 연락처, 이메일
 * React Hook Form + Zod 검증
 */

import { z } from 'zod'

/** 선택 입력(빈 문자열 허용)용 문자열, max 제한이 필요하면 union으로 각각 정의 */
const optionalString = z.union([z.string(), z.literal('')])

export const addStudentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '학생명을 입력해주세요')
    .max(50, '학생명은 50자 이내로 입력해주세요'),
  gender: z.enum(['male', 'female'], { required_error: '성별을 선택해주세요' }),
  contact: z.union([
    z.string().trim().max(20, '연락처는 20자 이내로 입력해주세요'),
    z.literal(''),
  ]),
  email: optionalString.refine(
    v => !v || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    '올바른 이메일 형식을 입력해주세요'
  ),
  gradeClass: z
    .string()
    .trim()
    .min(1, '학급을 입력해주세요')
    .max(20, '학급은 20자 이내로 입력해주세요'),
})

export type AddStudentFormValues = z.infer<typeof addStudentFormSchema>

export const DEFAULT_ADD_STUDENT_FORM_VALUES: AddStudentFormValues = {
  name: '',
  gender: 'male',
  contact: '',
  email: '',
  gradeClass: '',
}
