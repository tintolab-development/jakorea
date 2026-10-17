import type { InstructorFreeWriteFieldName } from '@jakorea/domain/instructor/free-write'
import { INSTRUCTOR_FREE_WRITE_ITEMS } from '@jakorea/domain/instructor/free-write'
import {
  formatInstructorApplyEducationSchoolTypeDisplay,
  formatInstructorApplyGraduateLeadingDisplay,
} from '@/features/mypage/instructor-apply/lib/format-instructor-apply-display'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import { orderEducationDetailKeys } from '@jakorea/domain/instructor/education-options'

function normalizeMonthDot(value: string | null | undefined): string {
  if (!value?.trim()) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 6) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}`
  }
  if (digits.length === 4) return digits
  return value.trim()
}

/** 설정 화면 학력·기간 표기 — `2020.03 ~ 2025.02` */
export function formatInstructorSettingsMonthRange(
  start: string | null | undefined,
  end: string | null | undefined,
  currentlyEmployed?: boolean,
): string {
  const from = normalizeMonthDot(start)
  const to = currentlyEmployed ? '재직중' : normalizeMonthDot(end)
  if (!from && !to) return ''
  if (!to) return from
  if (!from) return to
  return `${from} ~ ${to}`
}

export type InstructorSettingsListRow = {
  period: string
  primary: string
  secondary?: string
}

function pushSchoolRows(
  rows: InstructorSettingsListRow[],
  admitYear: string | null,
  gradYear: string | null,
  schoolName: string,
  major: string,
  degreeLeading?: string,
) {
  if (!schoolName.trim() && !major.trim() && !admitYear && !gradYear && !degreeLeading) return
  const period =
    degreeLeading ?? formatInstructorSettingsMonthRange(admitYear, gradYear)
  rows.push({
    period,
    primary: schoolName.trim(),
    secondary: major.trim() || undefined,
  })
}

export function flattenInstructorEducationListRows(
  values: Pick<
    InstructorSharedProfileFormValues,
    | 'educationDetailKeys'
    | 'highSchool'
    | 'college23Rows'
    | 'college4Rows'
    | 'graduateRows'
  >,
): InstructorSettingsListRow[] {
  const rows: InstructorSettingsListRow[] = []
  const keys = orderEducationDetailKeys(values.educationDetailKeys)

  for (const key of keys) {
    if (key === 'high') {
      pushSchoolRows(
        rows,
        values.highSchool.admitYear,
        values.highSchool.gradYear,
        values.highSchool.schoolName,
        values.highSchool.major,
      )
    }
    if (key === 'college23') {
      for (const row of values.college23Rows) {
        if (!row.schoolName.trim() && !row.admitYear && !row.gradYear) continue
        pushSchoolRows(rows, row.admitYear, row.gradYear, row.schoolName, row.major)
      }
    }
    if (key === 'college4') {
      for (const row of values.college4Rows) {
        if (!row.schoolName.trim() && !row.admitYear && !row.gradYear) continue
        pushSchoolRows(rows, row.admitYear, row.gradYear, row.schoolName, row.major)
      }
    }
    if (key === 'graduate') {
      for (const row of values.graduateRows) {
        if (!row.schoolName.trim() && !row.admitYear && !row.gradYear && !row.degree) continue
        const leading = formatInstructorApplyGraduateLeadingDisplay(
          row.admitYear,
          row.gradYear,
          row.degree,
        )
        pushSchoolRows(
          rows,
          row.admitYear,
          row.gradYear,
          row.schoolName,
          row.major,
          leading,
        )
      }
    }
  }

  return rows
}

export function formatInstructorEducationHeaderTeaser(
  eduSchoolType: InstructorSharedProfileFormValues['eduSchoolType'],
): string | undefined {
  const label = formatInstructorApplyEducationSchoolTypeDisplay(eduSchoolType)
  return label.trim() ? label : undefined
}

export function formatInstructorCareerHeaderTeaser(
  instructorCareer: string,
): string | undefined {
  const trimmed = instructorCareer.trim()
  return trimmed ? trimmed : undefined
}

export function mapInstructorCareerListRows(
  values: Pick<InstructorSharedProfileFormValues, 'careers'>,
): InstructorSettingsListRow[] {
  return values.careers
    .filter(row => row.companyName.trim() || row.roleName.trim())
    .map(row => ({
      period: formatInstructorSettingsMonthRange(
        row.periodStart,
        row.periodEnd,
        row.currentlyEmployed,
      ),
      primary: row.companyName.trim(),
      secondary: row.roleName.trim() || undefined,
    }))
}

export function mapInstructorJaListRows(
  values: Pick<InstructorSharedProfileFormValues, 'jaKoreaRows'>,
): InstructorSettingsListRow[] {
  return values.jaKoreaRows
    .filter(row => row.title.trim())
    .map(row => ({
      period: formatInstructorSettingsMonthRange(row.periodStart, row.periodEnd),
      primary: row.title.trim(),
      secondary: row.note.trim() || undefined,
    }))
}

export function mapInstructorLicenseOrAwardListRows(
  rows: InstructorSharedProfileFormValues['licenseRows'] | InstructorSharedProfileFormValues['awardRows'],
): InstructorSettingsListRow[] {
  return rows
    .filter(row => row.title.trim())
    .map(row => ({
      period: row.acquiredYear?.trim() ?? '',
      primary: row.title.trim(),
      secondary: row.issuer.trim() || undefined,
    }))
}

export const INSTRUCTOR_SETTINGS_ESSAY_SECTIONS: {
  id: InstructorFreeWriteFieldName
  title: string
}[] = [
  { id: 'freeWrite1', title: '자기소개 및 지원동기' },
  ...INSTRUCTOR_FREE_WRITE_ITEMS.slice(1).map(item => ({
    id: item.name,
    title: item.label.replace(/^\d+\.\s*/, ''),
  })),
]

export type InstructorSettingsSectionId =
  | 'education'
  | 'career'
  | 'ja'
  | 'license'
  | 'award'
  | InstructorFreeWriteFieldName
