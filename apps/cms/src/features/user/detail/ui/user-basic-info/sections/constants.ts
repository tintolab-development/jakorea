import { getFormInputsWidth } from '@/shared/lib/form-inputs-width'

export const GENDER_EDIT_OPTIONS = [
  { value: '남성', label: '남성' },
  { value: '여성', label: '여성' },
]

export const JA_EVALUATION_GRADE_OPTIONS = ['A', 'B', 'C', 'D'].map(v => ({
  value: v,
  label: v,
}))

const INDIVIDUAL_AFFILIATION_GRADE_OPTIONS: { value: string; label: string }[] = [
  { value: '1학년', label: '1학년' },
  { value: '2학년', label: '2학년' },
  { value: '3학년', label: '3학년' },
  { value: '4학년', label: '4학년' },
  { value: '5학년', label: '5학년' },
  { value: '6학년', label: '6학년' },
]

export const INDIVIDUAL_AFFILIATION_FIELDS_WIDTH = getFormInputsWidth({ inputCount: 2 })

export function individualAffiliationGradeSelectOptions(currentGrade: string | undefined) {
  const g = currentGrade?.trim()
  const opts = [...INDIVIDUAL_AFFILIATION_GRADE_OPTIONS]
  if (g && !opts.some(o => o.value === g)) opts.unshift({ value: g, label: g })
  return opts
}
