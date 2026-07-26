import { createElement, type ReactNode } from 'react'
import type { User } from '@/types/user'
import type { DateValue } from '@/types'
import { formatDateDot } from '@/shared/utils'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { getMemberPermissionInstructorApplicationTypeLabel } from '@/features/user/permission-management/lib/member-permission-instructor-application-type'
import { DetailInfoFormTdDivider } from '@/shared/components/detail-info-form'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'

function ageFromBirthDate(birthDate: DateValue | undefined): number | null {
  if (!birthDate) return null
  const t = new Date(birthDate).getTime()
  if (Number.isNaN(t)) return null
  return Math.floor((Date.now() - t) / (365.25 * 24 * 60 * 60 * 1000))
}

export function formatGenderBirthLine(user: Omit<User, 'password'>): string {
  const gender = toDisplayGender(user.gender)
  if (!user.birthDate) return `${gender} | -`
  const d = formatDateDot(user.birthDate)
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

/** 소속 td — 문자 `|` 대신 TdDivider, gap 12px */
export function affiliationView(user: Omit<User, 'password'>): ReactNode {
  if (user.affiliation) {
    return pipeSeparatedInlineView(user.affiliation)
  }
  if (user.schoolInfo) {
    const { schoolName, position } = user.schoolInfo
    if (position) return inlineSegmentsWithDivider([schoolName, position])
    return schoolName
  }
  return '-'
}

/** `A | B` 직렬화 문자열 → TdDivider 세그먼트 */
function pipeSeparatedInlineView(text: string | undefined | null): ReactNode {
  const trimmed = text?.trim()
  if (!trimmed || trimmed === '-') return '-'
  const parts = trimmed
    .split(/\s*\|\s*/)
    .map(part => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return '-'
  if (parts.length === 1) return parts[0]
  return inlineSegmentsWithDividers(parts)
}

function inlineSegmentsWithDivider(
  segments: [ReactNode, ReactNode],
  className = 'user-basic-info-section__inline-segments'
): ReactNode {
  return inlineSegmentsWithDividers([segments[0], segments[1]], className)
}

export function inlineSegmentsWithDividers(
  segments: ReactNode[],
  className = 'user-basic-info-section__inline-segments'
): ReactNode {
  const filtered = segments.filter(s => s != null && s !== '' && s !== '-')
  if (filtered.length === 0) return '-'
  if (filtered.length === 1) return filtered[0]

  const children: ReactNode[] = []
  filtered.forEach((seg, i) => {
    if (i > 0) {
      children.push(createElement(DetailInfoFormTdDivider, { key: `d-${i}` }))
    }
    children.push(createElement('span', { key: `s-${i}` }, seg))
  })
  return createElement('span', { className }, ...children)
}

/** 성별 및 생년월일 td — 문자 `|` 대신 TdDivider, gap 12px */
export function genderBirthView(user: Omit<User, 'password'>): ReactNode {
  const gender = toDisplayGender(user.gender)
  if (!user.birthDate) {
    return inlineSegmentsWithDivider([gender, '-'])
  }
  const d = formatDateDot(user.birthDate)
  const age = ageFromBirthDate(user.birthDate)
  const agePart = age != null ? ` (만 ${age}세)` : ''
  return inlineSegmentsWithDivider([gender, `${d}${agePart}`])
}

/** 교사 기본 정보 — 소속 및 담당 학년 td (문자 `|` 대신 TdDivider, gap 12px) */
export function affiliationAndGradeView(user: Omit<User, 'password'>): ReactNode {
  const school = user.affiliatedSchoolName?.trim()
  const grade = user.listMetrics?.instructorAssignedGrade?.trim()
  if (school && grade) {
    return inlineSegmentsWithDivider([school, grade])
  }
  if (school) return school

  if (user.schoolInfo) {
    const { schoolName, position } = user.schoolInfo
    if (position) {
      return inlineSegmentsWithDivider([schoolName, position])
    }
    return schoolName
  }

  if (user.affiliation) return user.affiliation
  return '-'
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

/** 강사 기본 정보 — 소속 및 강사 경력 td (문자 `|` 대신 TdDivider, gap 12px) */
export function affiliationAndInstructorCareerView(user: Omit<User, 'password'>): ReactNode {
  const summary = user.listMetrics?.instructorCareerSummaryLabel?.trim()
  if (summary) return summary

  const school = user.affiliatedSchoolName?.trim()
  const grade = user.listMetrics?.instructorAssignedGrade?.trim()

  let schoolPart: ReactNode | null = null
  if (school && grade) {
    schoolPart = `${school}(${grade})`
  } else if (school) {
    schoolPart = school
  } else if (user.schoolInfo) {
    const { schoolName, position } = user.schoolInfo
    schoolPart = position ? inlineSegmentsWithDivider([schoolName, position]) : schoolName
  } else if (user.affiliation) {
    schoolPart = user.affiliation
  }

  const typeLabel = instructorApplicationTypeLine(user).trim()
  const years = user.listMetrics?.instructorCareerYearsLabel?.trim()
  const tailNode = inlineSegmentsWithDividers([typeLabel === '-' ? '' : typeLabel, years ?? ''])

  const hasSchool = schoolPart != null && schoolPart !== '-'
  const hasTail = tailNode !== '-' && tailNode != null

  if (hasSchool && hasTail) {
    return createElement('span', null, schoolPart, ', ', tailNode)
  }
  if (hasTail) return tailNode
  if (hasSchool) return schoolPart
  return '-'
}

export function highestEducationLine(user: Omit<User, 'password'>): string {
  const t = user.listMetrics?.highestEducationLabel?.trim()
  return t && t.length > 0 ? t : '-'
}

/** 최종학력 td — 문자 `|` 대신 TdDivider */
export function highestEducationView(user: Omit<User, 'password'>): ReactNode {
  return pipeSeparatedInlineView(highestEducationLine(user))
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

/** 연동된 소셜 계정 td — 문자 `|` 대신 TdDivider, gap 12px */
export function socialView(user: Omit<User, 'password'>): ReactNode {
  const accounts = user.socialAccounts?.filter(Boolean) ?? []
  if (accounts.length === 0) return '-'
  return inlineSegmentsWithDividers(accounts)
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

/** 강사 기본 정보 — 정산 계좌 정보 td (문자 `|` 대신 TdDivider, gap 12px) */
export function instructorBankView(user: Omit<User, 'password'>, revealed: boolean): ReactNode {
  const info = user.instructorInfo
  if (!info) return '-'

  const rawNum = info.accountNumber ?? ''
  const rawHolder = info.accountHolder ?? ''
  const bank = info.bankName ?? ''

  if (revealed) {
    const left = `${bank} ${rawNum}`.trim()
    const holder = rawHolder.trim()
    if (!left && !holder) return '-'
    if (!holder) return left
    if (!left) return holder
    return inlineSegmentsWithDivider([left, holder])
  }

  const maskedNum = rawNum ? MASKING_POLICY.accountNumber(rawNum) : ''
  const maskedHolder = rawHolder ? MASKING_POLICY.accountHolderName(rawHolder) : ''
  const left = `${bank} ${maskedNum}`.trim()
  if (!left && !maskedHolder) return '-'
  if (!maskedHolder) return left
  if (!left) return maskedHolder
  return inlineSegmentsWithDivider([left, maskedHolder])
}

export function institutionTimesLabel(n: number | undefined): string {
  return n != null && !Number.isNaN(n) ? `${n}회` : '-'
}
