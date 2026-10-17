import type {
  ConfirmationRow,
  EmploymentStatus,
  GenderType,
  MemberType,
  SchoolStatus,
} from '../model/sign-up.types'
import { isDateWithinInputBounds } from '@/shared/ui/pf-date-input/date-utils'
import { maskSignupPhoneForDisplay } from './helpers/mask-phone'
import { toApiSignupPhone } from './helpers/to-api-phone'

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

  if (!isDateWithinInputBounds(date)) {
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
  if (type === 'teacher') return '교사 회원'
  return '일반회원'
}

export function getGenderLabel(value: GenderType | null) {
  if (value === 'female') return '여성'
  if (value === 'male') return '남성'
  return '-'
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

/** 교사 회원 확인 화면 — 학교명, 소재지 */
export function formatTeacherAffiliation(schoolName: string, schoolAddress: string) {
  return [schoolName.trim(), schoolAddress.trim()].filter(Boolean).join(', ') || '-'
}

export function isAllAgreed<T extends string>(agreements: Record<T, boolean>, items: { key: T }[]) {
  return items.every(item => agreements[item.key])
}

export function isRequiredAgreed<T extends string>(
  agreements: Record<T, boolean>,
  items: { key: T; required: boolean }[]
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
  affiliationName?: string
  employmentStatus?: EmploymentStatus | null
}): ConfirmationRow[] {
  const shared: ConfirmationRow[] = [
    { label: '회원유형', value: getMemberTypeLabel(input.selectedType) },
    { label: '이름', value: input.name?.trim() || '-' },
    {
      label: '휴대폰 번호',
      value: toApiSignupPhone(input.phone) || input.phone?.trim() || '-',
    },
    { label: '생년월일', value: input.birthDate.trim() || '-' },
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

  const affiliationName = input.affiliationName?.trim() ?? ''

  return [
    ...shared,
    { label: '재학유무', value: getSchoolStatusLabel(input.schoolStatus) },
    ...(input.schoolStatus === 'none'
      ? [{ label: '소속 기관명', value: affiliationName || '소속 없음' }]
      : []),
    { label: '자택 주소', value: formatHomeAddress(input.address, input.addressDetail) },
    { label: '이메일 ID', value: input.email },
    { label: '1365 ID', value: input.volunteerId.trim() || '-' },
  ]
}

export function buildUnderAgeConfirmationRows(input: {
  birthDate: string
  gender: GenderType | null
  schoolStatus: SchoolStatus
  address: string
  addressDetail: string
  email: string
  volunteerId: string
  memberName?: string
  schoolName?: string
  grade?: string
  affiliationName?: string
  guardianName?: string
  guardianPhone?: string
  guardianRelationship?: string
}): ConfirmationRow[] {
  const rows: ConfirmationRow[] = [
    { label: '회원 유형', value: '일반 회원' },
    { label: '이름', value: input.memberName?.trim() || '-' },
    { label: '생년월일', value: input.birthDate.trim() || '-' },
    { label: '성별', value: getGenderLabel(input.gender) },
    { label: '재학유무', value: getSchoolStatusLabel(input.schoolStatus) },
  ]

  if (input.schoolStatus === 'enrolled') {
    rows.push(
      { label: '소속/학교명', value: input.schoolName?.trim() || '-' },
      { label: '학년', value: input.grade?.trim() || '-' },
    )
  }

  rows.push(
    { label: '자택 주소', value: formatHomeAddress(input.address, input.addressDetail) },
    { label: '이메일 ID', value: input.email },
    { label: '1365 ID', value: input.volunteerId.trim() || '-' },
    { label: '보호자 이름', value: input.guardianName?.trim() || '-' },
    {
      label: '보호자 휴대폰',
      value: maskSignupPhoneForDisplay(input.guardianPhone),
    },
    { label: '가입자와의 관계', value: input.guardianRelationship?.trim() || '-' },
  )

  return rows
}
