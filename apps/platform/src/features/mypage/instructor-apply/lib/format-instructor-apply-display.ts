import { BUSINESS_INCOME_OPTIONS } from '@jakorea/domain/instructor/business-income'
import { CAREER_LEVEL_OPTIONS } from '@jakorea/domain/instructor/career-level'
import {
  EDUCATION_DEGREE_OPTIONS,
  EDUCATION_SCHOOL_TYPE_OPTIONS,
  EDUCATION_STATUS_OPTIONS,
} from '@jakorea/domain/instructor/education-options'
import { GENDER_OPTIONS } from '@jakorea/domain/instructor/gender'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import { SETTINGS_TEACHER_EMPLOYMENT_OPTIONS } from '@/features/mypage/settings/lib/map-edit'

function labelFromOptions(
  value: string,
  options: readonly { value: string; label: string }[],
): string {
  const found = options.find(option => option.value === value)
  return found?.label ?? value
}

export function formatInstructorApplyGenderDisplay(gender: string): string {
  return labelFromOptions(gender, GENDER_OPTIONS)
}

export function formatInstructorApplyEmploymentDisplay(
  status: InstructorSharedProfileFormValues['employmentStatus'],
): string {
  if (!status) return ''
  return labelFromOptions(status, SETTINGS_TEACHER_EMPLOYMENT_OPTIONS)
}

export function formatInstructorApplyBusinessIncomeDisplay(value: 'yes' | 'no'): string {
  return labelFromOptions(value, BUSINESS_INCOME_OPTIONS)
}

export function formatInstructorApplyCareerLevelDisplay(
  level: InstructorSharedProfileFormValues['careerLevel'],
): string {
  return labelFromOptions(level, CAREER_LEVEL_OPTIONS)
}

export function formatInstructorApplyEducationSchoolTypeDisplay(value: string): string {
  if (!value) return ''
  return labelFromOptions(value, EDUCATION_SCHOOL_TYPE_OPTIONS)
}

export function formatInstructorApplyEducationStatusDisplay(value: string): string {
  if (!value) return ''
  return labelFromOptions(value, EDUCATION_STATUS_OPTIONS)
}

export function formatInstructorApplyDegreeDisplay(value: string): string {
  if (!value) return ''
  return labelFromOptions(value, EDUCATION_DEGREE_OPTIONS)
}

export function formatInstructorApplyHomeAddressDisplay(
  line: string,
  detail: string,
): string {
  const parts = [line.trim(), detail.trim()].filter(Boolean)
  return parts.join(' | ')
}

export function formatInstructorApplyAffiliationDisplay(
  values: Pick<
    InstructorSharedProfileFormValues,
    'memberType' | 'schoolName' | 'employmentStatus' | 'affiliationName' | 'affiliationNone'
  >,
): string {
  if (values.memberType === 'school_teacher') {
    const school = values.schoolName.trim()
    const employment = formatInstructorApplyEmploymentDisplay(values.employmentStatus)
    return [school, employment].filter(Boolean).join(' | ')
  }
  if (values.affiliationNone) return '소속 없음'
  return values.affiliationName.trim()
}

export function formatInstructorApplyPeriodDisplay(
  start: string | null,
  end: string | null,
  currentlyEmployed?: boolean,
): string {
  const from = start?.trim() ?? ''
  const to = currentlyEmployed ? '재직중' : (end?.trim() ?? '')
  if (!from && !to) return ''
  if (!to) return from
  if (!from) return to
  return `${from} – ${to}`
}

export function formatInstructorApplyBankDisplay(
  bankName: string,
  accountNumber: string,
  accountHolder: string,
): string {
  return [bankName.trim(), accountNumber.trim(), accountHolder.trim()].filter(Boolean).join(' ')
}

export function displayOrDash(value: string | undefined | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '–'
}
