import { createElement, type ReactNode } from 'react'
import type { User } from '@/types/user'
import type { DateValue } from '@/types'
import { formatDate } from '@/shared/utils'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { getMemberPermissionInstructorApplicationTypeLabel } from '@/features/user/permission-management/lib/member-permission-instructor-application-type'

function ageFromBirthDate(birthDate: DateValue | undefined): number | null {
  if (!birthDate) return null
  const t = new Date(birthDate).getTime()
  if (Number.isNaN(t)) return null
  return Math.floor((Date.now() - t) / (365.25 * 24 * 60 * 60 * 1000))
}

export function formatGenderBirthLine(user: Omit<User, 'password'>): string {
  const gender = user.gender ?? '-'
  if (!user.birthDate) return `${gender} | -`
  const d = formatDate(user.birthDate)
  const age = ageFromBirthDate(user.birthDate)
  const agePart = age != null ? ` (만 ${age}세)` : ''
  return `${gender} | ${d}${agePart}`
}

export function affiliationLine(user: Omit<User, 'password'>): string {
  if (user.affiliation) return user.affiliation
  if (user.schoolInfo) {
    const { schoolName, position } = user.schoolInfo
    return position ? `${schoolName} | ${position}` : schoolName
  }
  return '-'
}

export function affiliationAndGradeLine(user: Omit<User, 'password'>): string {
  const school = user.affiliatedSchoolName?.trim()
  const grade = user.listMetrics?.instructorAssignedGrade?.trim()
  if (school && grade) return `${school} | ${grade}`
  if (school) return school
  return affiliationLine(user)
}

export function affiliationAndInstructorCareerLine(user: Omit<User, 'password'>): string {
  const summary = user.listMetrics?.instructorCareerSummaryLabel?.trim()
  if (summary) return summary

  const school = user.affiliatedSchoolName?.trim()
  const grade = user.listMetrics?.instructorAssignedGrade?.trim()
  const schoolPart = school && grade ? `${school}(${grade})` : school || affiliationLine(user)
  const typeLabel = instructorApplicationTypeLine(user).trim()
  const years = user.listMetrics?.instructorCareerYearsLabel?.trim()
  const tail = [typeLabel === '-' ? '' : typeLabel, years].filter(Boolean).join(' | ')

  if (schoolPart && schoolPart !== '-' && tail) return `${schoolPart}, ${tail}`
  if (tail) return tail
  if (schoolPart && schoolPart !== '-') return schoolPart
  return '-'
}

export function highestEducationLine(user: Omit<User, 'password'>): string {
  const t = user.listMetrics?.highestEducationLabel?.trim()
  return t && t.length > 0 ? t : '-'
}

export function jaEvaluationGradeLine(user: Omit<User, 'password'>): string {
  const grade = user.listMetrics?.jaEvaluationGrade?.trim()
  if (!grade) return '-'
  return grade.endsWith('등급') ? grade : `${grade}등급`
}

export function instructorFeeGradeLine(user: Omit<User, 'password'>): string {
  const grade =
    user.listMetrics?.instructorFeeGradeLabel?.trim() ||
    user.listMetrics?.instructorTypeLabel?.trim()
  return grade && grade.length > 0 ? grade : '-'
}

export function oneLineIntroLine(user: Omit<User, 'password'>): string {
  const bio = user.bio?.trim()
  return bio && bio.length > 0 ? bio : '-'
}

/** 회원 관리 기준 신청·소속 구분 (강사비 등급 `instructorTypeLabel`은 사용하지 않음) */
export function instructorApplicationTypeLine(user: Omit<User, 'password'>): string {
  return getMemberPermissionInstructorApplicationTypeLabel(user)
}

export function addressLine(user: Omit<User, 'password'>): string {
  return user.schoolInfo?.address ?? user.detailAddress ?? '-'
}

export function socialLine(user: Omit<User, 'password'>): string {
  return user.socialAccounts?.length ? user.socialAccounts.join(' | ') : '-'
}

export function detailPhoneDisplay(user: Omit<User, 'password'>, revealed: boolean): string {
  const t = user.phone?.trim()
  if (!t) return '-'
  if (revealed) return user.phone ?? '-'
  return MASKING_POLICY.phone(t)
}

export function detailEmailDisplay(user: Omit<User, 'password'>, revealed: boolean): string {
  const t = user.email?.trim()
  if (!t) return '-'
  if (revealed) return t
  return MASKING_POLICY.email(t)
}

export function detailAddressView(user: Omit<User, 'password'>, revealed: boolean): ReactNode {
  const raw = addressLine(user)
  if (raw === '-' || revealed) return raw
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '-'
  if (parts.length === 1) {
    const [one] = parts
    const cut = Math.min(4, Math.ceil(one.length / 2))
    const head = one.slice(0, cut)
    const tail = one.slice(cut)
    return createElement(
      'span',
      { className: 'user-basic-info-section__address-privacy' },
      createElement('span', null, head),
      tail
        ? createElement(
            'span',
            { className: 'user-basic-info-section__address-privacy__blur', 'aria-hidden': true },
            tail
          )
        : null
    )
  }
  const head = parts.slice(0, 2).join(' ')
  const tail = parts.slice(2).join(' ')
  return createElement(
    'span',
    { className: 'user-basic-info-section__address-privacy' },
    createElement('span', null, head),
    tail
      ? createElement(
          'span',
          { className: 'user-basic-info-section__address-privacy__blur', 'aria-hidden': true },
          ` ${tail}`
        )
      : null
  )
}

export function instructorBankLine(user: Omit<User, 'password'>, revealed: boolean): string {
  const info = user.instructorInfo
  if (!info) return '-'
  const rawNum = info.accountNumber ?? ''
  const rawHolder = info.accountHolder ?? ''
  const bank = info.bankName ?? ''
  if (revealed) {
    const left = `${bank} ${rawNum}`.trim()
    const holder = rawHolder ? ` | ${rawHolder}` : ''
    return left || holder ? `${left}${holder}` : '-'
  }
  const maskedNum = rawNum ? MASKING_POLICY.accountNumber(rawNum) : ''
  const maskedHolder = rawHolder ? MASKING_POLICY.accountHolderName(rawHolder) : ''
  const left = `${bank} ${maskedNum}`.trim()
  const holder = maskedHolder ? ` | ${maskedHolder}` : ''
  return left || holder ? `${left}${holder}` : '-'
}

export function institutionTimesLabel(n: number | undefined): string {
  return n != null && !Number.isNaN(n) ? `${n}회` : '-'
}
