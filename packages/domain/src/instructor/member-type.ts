import { getLabel } from '../shared/option-helpers.js'
import type { DomainSelectOption } from '../shared/types.js'

export const INSTRUCTOR_MEMBER_TYPE = {
  general: 'general',
  schoolTeacher: 'school_teacher',
} as const

export type InstructorMemberType =
  (typeof INSTRUCTOR_MEMBER_TYPE)[keyof typeof INSTRUCTOR_MEMBER_TYPE]

export const INSTRUCTOR_MEMBER_TYPE_OPTIONS: DomainSelectOption<InstructorMemberType>[] = [
  { value: INSTRUCTOR_MEMBER_TYPE.general, label: '일반 회원' },
  { value: INSTRUCTOR_MEMBER_TYPE.schoolTeacher, label: '교사 회원' },
]

export function getInstructorMemberTypeLabel(value: InstructorMemberType): string {
  return getLabel(INSTRUCTOR_MEMBER_TYPE_OPTIONS, value)
}
