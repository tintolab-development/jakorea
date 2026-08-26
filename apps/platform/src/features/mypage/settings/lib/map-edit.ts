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
  grade: string
  address: string
  addressDetail: string
  postalCode: string
  regionSido: string
  regionSigungu: string
  volunteerId: string
  schoolOrganizationId: number | null
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
    affiliationName: enrolled ? form.schoolName.trim() : '',
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
