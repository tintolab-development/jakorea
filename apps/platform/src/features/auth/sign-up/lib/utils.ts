import type {
  ConfirmationRow,
  EmploymentStatus,
  GenderType,
  MemberType,
  SchoolStatus,
} from '../model/sign-up.types'
import {
  MOCK_VERIFIED_NAME,
  MOCK_VERIFIED_PHONE,
} from './constants'

/** 숫자만 입력해도 YYYY.MM.DD 형식으로 `.`을 자동 삽입한다. */
export function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 4) {
    return digits
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}.${digits.slice(4)}`
  }

  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
}

export function parseBirthDate(value: string) {
  const matched = value.trim().match(/^(\d{4})\.(\d{2})\.(\d{2})$/)

  if (!matched) {
    return null
  }

  const [, yearValue, monthValue, dayValue] = matched
  const year = Number(yearValue)
  const month = Number(monthValue)
  const day = Number(dayValue)
  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return date
}

export function calculateInternationalAge(birthDateValue: string) {
  const birthDate = parseBirthDate(birthDateValue)

  if (!birthDate) {
    return null
  }

  const today = new Date()
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())

  return today.getFullYear() - birthDate.getFullYear() - (hasBirthdayPassed ? 0 : 1)
}

import { isValidEmailId } from '@/shared/lib/email-id'

export function isValidEmail(value: string) {
  return isValidEmailId(value)
}

export function isValidPassword(value: string) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value)
}

export function getMemberTypeLabel(type: MemberType | null) {
  if (type === 'teacher') return '교사회원'
  return '일반회원'
}

export function getGenderLabel(value: GenderType | null) {
  if (value === 'female') return '여성'
  return '남성'
}

export function getSchoolStatusLabel(value: SchoolStatus) {
  if (value === 'enrolled') return '재학 중'
  return '해당 없음'
}

export function getEmploymentStatusLabel(value: EmploymentStatus | null) {
  if (value === 'on-leave') return '휴직 중'
  if (value === 'employed') return '재직 중'
  return '-'
}

export function formatHomeAddress(address: string, addressDetail: string) {
  return [address.trim(), addressDetail.trim()].filter(Boolean).join(' ')
}

/** 교사회원 확인 화면 — 학교명, 소재지 */
export function formatTeacherAffiliation(schoolName: string, schoolAddress: string) {
  return [schoolName.trim(), schoolAddress.trim()].filter(Boolean).join(', ') || '-'
}

export function isAllAgreed<T extends string>(
  agreements: Record<T, boolean>,
  items: { key: T }[],
) {
  return items.every(item => agreements[item.key])
}

export function isRequiredAgreed<T extends string>(
  agreements: Record<T, boolean>,
  items: { key: T; required: boolean }[],
) {
  return items.filter(item => item.required).every(item => agreements[item.key])
}

export function buildConfirmationRows(input: {
  selectedType: MemberType | null
  birthDate: string
  gender: GenderType | null
  schoolStatus: SchoolStatus
  address: string
  addressDetail: string
  email: string
  volunteerId: string
  name?: string
  phone?: string
  schoolName?: string
  schoolAddress?: string
  employmentStatus?: EmploymentStatus | null
}): ConfirmationRow[] {
  const shared: ConfirmationRow[] = [
    { label: '회원유형', value: getMemberTypeLabel(input.selectedType) },
    { label: '이름', value: input.name?.trim() || MOCK_VERIFIED_NAME },
    { label: '휴대폰 번호', value: input.phone?.trim() || MOCK_VERIFIED_PHONE },
    { label: '생년월일', value: input.birthDate },
    { label: '성별', value: getGenderLabel(input.gender) },
  ]

  if (input.selectedType === 'teacher') {
    return [
      ...shared,
      {
        label: '소속/학교',
        value: formatTeacherAffiliation(input.schoolName ?? '', input.schoolAddress ?? ''),
      },
      { label: '재직 현황', value: getEmploymentStatusLabel(input.employmentStatus ?? null) },
      { label: '이메일 ID', value: input.email },
    ]
  }

  return [
    ...shared,
    { label: '재학유무', value: getSchoolStatusLabel(input.schoolStatus) },
    { label: '자택 주소', value: formatHomeAddress(input.address, input.addressDetail) },
    { label: '이메일 ID', value: input.email },
    { label: '1365 ID', value: input.volunteerId.trim() || '-' },
  ]
}
