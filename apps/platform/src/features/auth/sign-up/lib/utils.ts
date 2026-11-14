import type {
  ConfirmationRow,
  EmploymentStatus,
  GenderType,
  MemberType,
  SchoolStatus,
} from '../model/sign-up.types'
import {
  birthDateRangeMessage,
  checkBirthDateRange,
  type BirthDateRangeStatus,
} from './birth-date-bounds'
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

export type BirthDateInputCheck =
  | { status: 'valid'; date: Date }
  | { status: 'invalid-format' }
  | { status: Exclude<BirthDateRangeStatus, 'valid'> }

/**
 * `YYYY.MM.DD` 생년월일 입력 확인.
 * 형식·실재 날짜를 본 뒤 생년월일 전용 범위(오늘(KST)까지 · 최대 만 120세)를 적용한다 (QA-0220·QA-0503).
 */
export function checkBirthDateInput(value: string, now: Date = new Date()): BirthDateInputCheck {
  const matched = value.trim().match(/^(\d{4})\.(\d{2})\.(\d{2})$/)

  if (!matched) {
    return { status: 'invalid-format' }
  }

  const [, yearValue, monthValue, dayValue] = matched
  const year = Number(yearValue)
  const month = Number(monthValue)
  const day = Number(dayValue)
  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { status: 'invalid-format' }
  }

  const range = checkBirthDateRange(date, now)
  if (range !== 'valid') {
    return { status: range }
  }

  return { status: 'valid', date }
}

/**
 * 작성 중 실시간 안내용 — `YYYY.MM.DD`를 다 입력했고 실재하는 날짜인데 범위를 벗어났을 때만 문구.
 * 입력 중(미완성)·형식 오류·정상은 null.
 */
export function getBirthDateRangeMessage(value: string, now: Date = new Date()): string | null {
  const checked = checkBirthDateInput(value, now)
  if (checked.status === 'future' || checked.status === 'too-old') {
    return birthDateRangeMessage(checked.status)
  }
  return null
}

export function parseBirthDate(value: string, now: Date = new Date()) {
  const result = checkBirthDateInput(value, now)
  return result.status === 'valid' ? result.date : null
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

export {
  ADMIN_REGISTERED_PASSWORD_HELP_TEXT,
  isValidMemberPassword,
  isValidPassword,
  MEMBER_PASSWORD_HELP_TEXT,
} from './password-policy'

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
  const memberTypeRow: ConfirmationRow = {
    label: '회원유형',
    value: getMemberTypeLabel(input.selectedType),
  }
  const identityRows: ConfirmationRow[] = [
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
      memberTypeRow,
      ...identityRows,
      {
        label: '소속/학교',
        value: formatTeacherAffiliation(input.schoolName ?? '', input.schoolAddress ?? ''),
      },
      { label: '재직 현황', value: getEmploymentStatusLabel(input.employmentStatus ?? null) },
      { label: '이메일 ID', value: input.email },
    ]
  }

  const affiliationName = input.affiliationName?.trim() ?? ''
  // 일반회원(14세 이상) — 이메일 ID는 회원유형 바로 다음 (Figma 2516-3293)
  return [
    memberTypeRow,
    { label: '이메일 ID', value: input.email },
    ...identityRows,
    { label: '재학유무', value: getSchoolStatusLabel(input.schoolStatus) },
    ...(input.schoolStatus === 'none'
      ? [{ label: '소속 기관명', value: affiliationName || '소속 없음' }]
      : []),
    { label: '자택 주소', value: formatHomeAddress(input.address, input.addressDetail) },
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
      // 가입정보 확인은 본인(보호자 포함) 입력값이라 원문 표시(개인정보 마스킹 정책 10/26, 사용자 플랫폼 2)
      label: '보호자 휴대폰',
      value: toApiSignupPhone(input.guardianPhone) || input.guardianPhone?.trim() || '-',
    },
    { label: '가입자와의 관계', value: input.guardianRelationship?.trim() || '-' },
  )

  return rows
}
