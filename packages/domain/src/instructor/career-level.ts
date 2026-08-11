import { getLabel } from '../shared/option-helpers.js'
import type { DomainSelectOption } from '../shared/types.js'

export const CAREER_LEVEL = {
  new: 'new',
  experienced: 'experienced',
} as const

export type CareerLevel = (typeof CAREER_LEVEL)[keyof typeof CAREER_LEVEL]

export const CAREER_LEVEL_OPTIONS: DomainSelectOption<CareerLevel>[] = [
  { value: CAREER_LEVEL.new, label: '신입' },
  { value: CAREER_LEVEL.experienced, label: '경력' },
]

export function getCareerLevelLabel(value: CareerLevel): string {
  return getLabel(CAREER_LEVEL_OPTIONS, value)
}
