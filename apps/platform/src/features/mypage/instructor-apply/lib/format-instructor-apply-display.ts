import { BUSINESS_INCOME_OPTIONS } from '@jakorea/domain/instructor/business-income'
import { CAREER_LEVEL_OPTIONS } from '@jakorea/domain/instructor/career-level'
import {
  EDUCATION_DEGREE_OPTIONS,
  EDUCATION_DETAIL_OPTIONS,
  EDUCATION_SCHOOL_TYPE_OPTIONS,
  EDUCATION_STATUS_OPTIONS,
  orderEducationDetailKeys,
  type EducationDetailKey,
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

function normalizeEducationYear(value: string | null | undefined): string {
  if (!value?.trim()) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 4) return digits.slice(0, 4)
  return value.trim()
}

/** 입학·졸업 연도 — `2013 ~ 2016` */
export function formatInstructorApplyEducationYearRange(
  admitYear: string | null | undefined,
  gradYear: string | null | undefined,
): string {
  const from = normalizeEducationYear(admitYear)
  const to = normalizeEducationYear(gradYear)
  if (!from && !to) return ''
  if (!to) return from
  if (!from) return to
  return `${from} ~ ${to}`
}

export function formatInstructorApplyEducationDetailSummary(keys: EducationDetailKey[]): string {
  return orderEducationDetailKeys(keys)
    .map(key => labelFromOptions(key, EDUCATION_DETAIL_OPTIONS))
    .filter(Boolean)
    .join(', ')
}

export function formatInstructorApplyEducationDetailFieldLabel(key: EducationDetailKey): string {
  return labelFromOptions(key, EDUCATION_DETAIL_OPTIONS)
}

export function formatInstructorApplySchoolMajorLine(school: string, major: string): string {
  return [school.trim(), major.trim()].filter(Boolean).join(' ')
}

/** 대학원 행 앞부분 — `2022 ~ 2024 석사` */
export function formatInstructorApplyGraduateLeadingDisplay(
  admitYear: string | null | undefined,
  gradYear: string | null | undefined,
  degree: string,
): string {
  const period = formatInstructorApplyEducationYearRange(admitYear, gradYear)
  const degreeLabel = formatInstructorApplyDegreeDisplay(degree)
  return [period, degreeLabel].filter(Boolean).join(' ')
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
    'memberType' | 'affiliationName' | 'affiliationNone'
  >,
): string {
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
