import type {
  AgreementItem,
  AgreementState,
  ConfirmationRow,
  GenderType,
  MemberType,
  SchoolStatus,
} from '../model/sign-up.types'
import {
  MOCK_VERIFIED_NAME,
  MOCK_VERIFIED_PHONE,
} from './sign-up.constants'

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

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
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

export function formatHomeAddress(address: string, addressDetail: string) {
  return [address.trim(), addressDetail.trim()].filter(Boolean).join(' ')
}

export function isAllAgreed(agreements: AgreementState, items: AgreementItem[]) {
  return items.every(item => agreements[item.key])
}

export function isRequiredAgreed(agreements: AgreementState, items: AgreementItem[]) {
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
}): ConfirmationRow[] {
  return [
    { label: '회원유형', value: getMemberTypeLabel(input.selectedType) },
    { label: '이름', value: MOCK_VERIFIED_NAME },
    { label: '휴대폰 번호', value: MOCK_VERIFIED_PHONE },
    { label: '생년월일', value: input.birthDate },
    { label: '성별', value: getGenderLabel(input.gender) },
    { label: '재학유무', value: getSchoolStatusLabel(input.schoolStatus) },
    { label: '자택 주소', value: formatHomeAddress(input.address, input.addressDetail) },
    { label: '이메일 ID', value: input.email },
    { label: '1365 ID', value: input.volunteerId.trim() || '-' },
  ]
}
