import { getLabel } from '../shared/option-helpers'
import type { DomainSelectOption } from '../shared/types'

export const EDUCATION_TARGET = {
  elementary: 'elementary',
  middle: 'middle',
  high: 'high',
  university: 'university',
  adult: 'adult',
} as const

export type EducationTarget = (typeof EDUCATION_TARGET)[keyof typeof EDUCATION_TARGET]

export const EDUCATION_TARGET_OPTIONS: DomainSelectOption<EducationTarget>[] = [
  { value: EDUCATION_TARGET.elementary, label: '초등학생' },
  { value: EDUCATION_TARGET.middle, label: '중학생' },
  { value: EDUCATION_TARGET.high, label: '고등학생' },
  { value: EDUCATION_TARGET.university, label: '대학(원)생' },
  { value: EDUCATION_TARGET.adult, label: '성인' },
]

export function getEducationTargetLabel(value: EducationTarget): string {
  return getLabel(EDUCATION_TARGET_OPTIONS, value)
}
