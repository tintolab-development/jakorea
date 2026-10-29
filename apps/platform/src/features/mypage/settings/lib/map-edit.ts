import {
  SCHOOL_TEACHER_EMPLOYMENT_STATUS,
  type SchoolTeacherEmploymentStatus,
} from '@jakorea/domain/instructor/employment-status'
import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'
import { EMPTY_SETTINGS_VALUE } from './constants.ts'
import {
  formatSettingsEnrollment,
  formatSettingsGender,
  formatSettingsGrade,
  type SettingsProfileInput,
} from './map-view.ts'

export type SettingsEditSchoolStatus = 'enrolled' | 'none'

export type SettingsEditFormValues = {
  schoolStatus: SettingsEditSchoolStatus
  schoolName: string
  /** 미재학(해당 없음) 선택 시 선택 입력 */
  affiliationName: string
  grade: string
  address: string
  addressDetail: string
  postalCode: string
  regionSido: string
  regionSigungu: string
  volunteerId: string
  schoolOrganizationId: number | null
}

/** 회원정보 설정·가입과 동일 — 재직 중 / 휴직 중만 */
export type SettingsTeacherEmploymentStatus = Extract<
  SchoolTeacherEmploymentStatus,
  'ACTIVE' | 'ON_LEAVE'
>

export const SETTINGS_TEACHER_EMPLOYMENT_OPTIONS: {
  value: SettingsTeacherEmploymentStatus
  label: string
}[] = [
  { value: SCHOOL_TEACHER_EMPLOYMENT_STATUS.active, label: '재직 중' },
  { value: SCHOOL_TEACHER_EMPLOYMENT_STATUS.onLeave, label: '휴직 중' },
]

export type SettingsTeacherEditFormValues = {
  schoolName: string
  schoolOrganizationId: number | null
  schoolAddress: string
  schoolNeisCode: string
  schoolEducationOfficeCode: string
  schoolSource?: 'neis' | 'careerNet'
  employmentStatus: SettingsTeacherEmploymentStatus | ''
}

export function toTeacherEmploymentStatus(
  value: string | undefined,
): SettingsTeacherEmploymentStatus | '' {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'EMPLOYED') {
    return SCHOOL_TEACHER_EMPLOYMENT_STATUS.active
  }
  if (normalized === 'ON_LEAVE' || normalized === 'LEAVE') {
    return SCHOOL_TEACHER_EMPLOYMENT_STATUS.onLeave
  }
  return ''
}

export function mapProfileToTeacherSettingsEditForm(
  profile: SettingsProfileInput,
): SettingsTeacherEditFormValues {
  return {
    schoolName: profile.schoolName?.trim() || profile.affiliationName?.trim() || '',
    schoolOrganizationId: profile.schoolOrganizationId ?? null,
    schoolAddress: profile.schoolAddress?.trim() ?? '',
    schoolNeisCode: '',
    schoolEducationOfficeCode: '',
    employmentStatus: toTeacherEmploymentStatus(profile.teacherEmploymentStatus),
  }
}

export function isTeacherSettingsEditValid(form: SettingsTeacherEditFormValues): boolean {
  return Boolean(form.schoolName.trim() && form.employmentStatus)
}

export function applyTeacherSettingsEditToSnapshot(
  previous: SettingsProfileInput,
  form: SettingsTeacherEditFormValues,
): SettingsProfileInput {
  const schoolName = form.schoolName.trim()
  return {
    ...previous,
    schoolName,
    affiliationName: schoolName,
    schoolOrganizationId: form.schoolOrganizationId,
    schoolAddress: form.schoolAddress.trim() || previous.schoolAddress,
    teacherEmploymentStatus: form.employmentStatus || previous.teacherEmploymentStatus,
  }
}

export function toSettingsSchoolStatus(value: string | undefined): SettingsEditSchoolStatus {
  return formatSettingsEnrollment(value) === '재학 중' ? 'enrolled' : 'none'
}

export function toSettingsGender(value: string | undefined): 'male' | 'female' | '' {
  const label = formatSettingsGender(value)
  if (label === '남성') return 'male'
  if (label === '여성') return 'female'
  return ''
}

export function toSettingsGradeOption(value: string | undefined): string {
  const formatted = formatSettingsGrade(value)
  return formatted === EMPTY_SETTINGS_VALUE ? '' : formatted
}

export function mapProfileToSettingsEditForm(
  profile: SettingsProfileInput,
): SettingsEditFormValues {
  const schoolStatus = toSettingsSchoolStatus(profile.schoolEnrollmentStatus)
  const schoolName =
    schoolStatus === 'enrolled'
      ? profile.schoolName?.trim() || profile.affiliationName?.trim() || ''
      : ''

  return {
    schoolStatus,
    schoolName,
    affiliationName: schoolStatus === 'none' ? profile.affiliationName?.trim() || '' : '',
    grade: schoolStatus === 'enrolled' ? toSettingsGradeOption(profile.grade) : '',
    address: profile.address?.trim() ?? '',
    addressDetail: profile.addressDetail?.trim() ?? '',
    postalCode: profile.postalCode?.trim() ?? '',
    regionSido: profile.regionSido?.trim() ?? '',
    regionSigungu: profile.regionSigungu?.trim() ?? '',
    volunteerId: profile.external1365Id?.trim() ?? '',
    schoolOrganizationId: profile.schoolOrganizationId ?? null,
  }
}

export function isSettingsEditValid(form: SettingsEditFormValues): boolean {
  if (
    isRequiredAddressIncomplete({
      address: form.address,
      addressDetail: form.addressDetail,
      subject: 'person',
    })
  ) {
    return false
  }

  if (form.schoolStatus === 'enrolled') {
    return Boolean(form.schoolName.trim() && form.grade.trim())
  }

  return true
}

export function applySettingsEditToSnapshot(
  previous: SettingsProfileInput,
  form: SettingsEditFormValues,
): SettingsProfileInput {
  const enrolled = form.schoolStatus === 'enrolled'

  return {
    ...previous,
    schoolEnrollmentStatus: enrolled ? 'ENROLLED' : 'NOT_ENROLLED',
    schoolName: enrolled ? form.schoolName.trim() : '',
    affiliationName: enrolled ? form.schoolName.trim() : form.affiliationName.trim(),
    grade: enrolled ? form.grade.trim() : '',
    address: form.address.trim(),
    addressDetail: form.addressDetail.trim(),
    postalCode: form.postalCode.trim(),
    regionSido: form.regionSido.trim(),
    regionSigungu: form.regionSigungu.trim(),
    external1365Id: form.volunteerId.trim(),
    schoolOrganizationId: enrolled ? form.schoolOrganizationId : null,
  }
}

/** PATCH 본문의 빈 문자열은 서버가 무시하지 않도록 `null`로 보낸다. */
export function nullifyEmptyProfileUpdateFields<T extends Record<string, unknown>>(payload: T): T {
  const next = { ...payload }

  for (const key of Object.keys(next) as (keyof T)[]) {
    const value = next[key]
    if (typeof value === 'string' && value.trim() === '') {
      next[key] = null as T[keyof T]
    }
  }

  return next
}

export type PortalGuardianPatchInput = {
  guardianName: string
  guardianRelation: string
  guardianPhone: string
}

/** PATCH `/me/profile` 정본 — nested `guardian` 만 보낸다. */
export function attachGuardianToPortalProfileUpdate<T extends Record<string, unknown>>(
  payload: T,
  guardian: PortalGuardianPatchInput | null | undefined,
): T {
  if (!guardian) return payload
  const guardianName = guardian.guardianName.trim()
  const guardianRelation = guardian.guardianRelation.trim()
  const guardianPhone = guardian.guardianPhone.replace(/\D/g, '')
  if (!guardianName && !guardianRelation && !guardianPhone) return payload
  return {
    ...payload,
    guardian: {
      guardianName,
      guardianRelation,
      guardianPhone,
    },
  }
}

/**
 * 해당 없음 전환 시 남아 있을 수 있는 학교 검색 메타를 제출 직전에 제거한다.
 * (재학 중 → 해당 없음 후 소속 기관명 미입력 포함)
 */
export function sanitizeSettingsEditSchoolFields<
  T extends {
    schoolStatus: SettingsEditSchoolStatus
    schoolName: string
    affiliationName: string
    grade: string
    schoolOrganizationId: number | null
    schoolAddress?: string
    schoolNeisCode?: string | null
    schoolEducationOfficeCode?: string | null
    schoolSource?: 'neis' | 'careerNet'
  },
>(input: T): T {
  if (input.schoolStatus === 'enrolled') {
    return {
      ...input,
      affiliationName: '',
    }
  }

  return {
    ...input,
    schoolName: '',
    grade: '',
    schoolOrganizationId: null,
    schoolAddress: '',
    schoolNeisCode: '',
    schoolEducationOfficeCode: '',
    schoolSource: undefined,
  }
}
