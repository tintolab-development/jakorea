import { getLabel } from '../shared/option-helpers.js'
import type { DomainSelectOption } from '../shared/types.js'

export const GENDER = {
  male: 'male',
  female: 'female',
} as const

export type Gender = (typeof GENDER)[keyof typeof GENDER]

export const GENDER_OPTIONS: DomainSelectOption<Gender>[] = [
  { value: GENDER.male, label: '남' },
  { value: GENDER.female, label: '여' },
]

export function getGenderLabel(value: Gender): string {
  return getLabel(GENDER_OPTIONS, value)
}
