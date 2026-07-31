import { createElement, type ReactNode } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type { User } from '@/types/user'
import type { DateValue } from '@/types'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { getMemberPermissionInstructorApplicationTypeLabel } from '@/features/user/permission-management/lib/member-permission-instructor-application-type'
import {
  formatInstructorEducationLevelDisplay,
  isInstructorMaskedPlaceholder,
  resolveInstructorPublicTextField,
} from '@/features/user/api/map-instructor-activity-display'
import { DetailInfoFormTdDivider } from '@/shared/components/detail-info-form'
import { toApiBirthDate, toDisplayGender } from '@/features/user/api/map-member-gender-birth'

/** 만 나이 — 생일이 지나지 않았으면 연차에서 1을 뺀다 */
function manAgeFromDayjs(birth: Dayjs): number | null {
  const today = dayjs()
  let age = today.year() - birth.year()
  if (
    today.month() < birth.month() ||
    (today.month() === birth.month() && today.date() < birth.date())
  ) {
    age -= 1
  }
  return age >= 0 ? age : null
}

function parseBirthDayjs(birthDate: DateValue | undefined): Dayjs | null {
  if (birthDate == null || birthDate === '') return null
  if (birthDate instanceof Date) {
    const parsed = dayjs(birthDate)
    return parsed.isValid() ? parsed : null
  }
  const normalized = toApiBirthDate(String(birthDate)) ?? String(birthDate).trim()
  const parsed = dayjs(normalized)
  return parsed.isValid() ? parsed : null
}

/** 시안: `1990. 09. 15 (만 35세)` */
function formatBirthDateAndManAge(birthDate: DateValue | undefined): string {
  const parsed = parseBirthDayjs(birthDate)
  if (!parsed) return '-'
  const formatted = parsed.format('YYYY. MM. DD')
  const age = manAgeFromDayjs(parsed)
  return age != null ? `${formatted} (만 ${age}세)` : formatted
}

export function formatGenderBirthLine(user: Omit<User, 'password'>): string {
  const gender = toDisplayGender(user.gender)
  return `${gender} | ${formatBirthDateAndManAge(user.birthDate)}`
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

/** 성별 및 생년월일 td — 문자 `|` 대신 TdDivider, gap 12px. 시안: `남성 | 1990. 09. 15 (만 35세)` */
export function genderBirthView(user: Omit<User, 'password'>): ReactNode {
  const gender = toDisplayGender(user.gender)
  const birthPart = formatBirthDateAndManAge(user.birthDate)
  // `-` 세그먼트를 버리지 않음 — 생년월일 없을 때도 `성별 | -` 유지
  return createElement(
    'span',
    { className: 'user-basic-info-section__inline-segments' },
    createElement('span', { key: 's-gender' }, gender),
    createElement(DetailInfoFormTdDivider, { key: 'd-birth' }),
    createElement('span', { key: 's-birth' }, birthPart)
  )
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
  const summary = resolveInstructorPublicTextField(user.listMetrics?.instructorCareerSummaryLabel)
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
  const summary = resolveInstructorPublicTextField(user.listMetrics?.instructorCareerSummaryLabel)
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
  const raw = resolveInstructorPublicTextField(user.listMetrics?.highestEducationLabel)
  if (!raw) return '-'
  return formatInstructorEducationLevelDisplay(raw) ?? raw
}

/** 최종학력 td — 문자 `|` 대신 TdDivider */
export function highestEducationView(user: Omit<User, 'password'>): ReactNode {
  return pipeSeparatedInlineView(highestEducationLine(user))
}

export function instructorCareerYearsLine(user: Omit<User, 'password'>): string {
  const yearsLabel = resolveInstructorPublicTextField(user.listMetrics?.instructorCareerYearsLabel)
  if (yearsLabel) return yearsLabel

  const summary = resolveInstructorPublicTextField(user.listMetrics?.instructorCareerSummaryLabel)
  if (summary) {
    if (/^\d+$/.test(summary)) return `${summary}년`
    return summary
  }

  const careerText = resolveInstructorPublicTextField(user.instructorCareerText)
  if (careerText) {
    if (/^\d+$/.test(careerText)) return `${careerText}년`
    return careerText
  }

  const years = user.participationHistory
  if (typeof years === 'number' && years > 0) return `${years}년`
  if (typeof years === 'number' && years === 0) return '0년'
  return '-'
}

export function oneLineIntroLine(user: Omit<User, 'password'>): string {
  const bio = resolveInstructorPublicTextField(user.bio)
  return bio ?? '-'
}

/** 강사 소속 — 학교(기관)와 그 외(JA 강사단 등)를 분리. 여러 소속은 콤마로 합친다. */
export function resolveInstructorAffiliationParts(user: Omit<User, 'password'>): {
  schoolName?: string
  others: string[]
} {
  const schoolName =
    user.affiliatedSchoolName?.trim() ||
    user.schoolInfo?.schoolName?.trim() ||
    undefined

  const seen = new Set<string>()
  const others: string[] = []

  const addOther = (raw: string | undefined | null) => {
    const trimmed = raw?.trim()
    if (!trimmed || trimmed === '-') return
    const name = trimmed.split(/\s*\|\s*/)[0]?.trim()
    if (!name) return
    if (schoolName && name === schoolName) return
    if (seen.has(name)) return
    seen.add(name)
    others.push(name)
  }

  if (schoolName) seen.add(schoolName)

  const affiliation = user.affiliation?.trim()
  if (affiliation) {
    for (const part of affiliation.split(/\s*,\s*/)) {
      addOther(part)
    }
  }

  // 신청 유형 라벨 중 소속으로 쓸 만한 것만 (일반 강사/교사 회원 등 유형 라벨 제외)
  const applicationType = user.listMetrics?.permissionApplicationTypeLabel?.trim()
  if (applicationType && /(강사단|특강|UJAT|제미나이)/i.test(applicationType)) {
    addOther(applicationType)
  }

  return { schoolName, others }
}

export function instructorAffiliationLine(user: Omit<User, 'password'>): string {
  const { schoolName, others } = resolveInstructorAffiliationParts(user)
  const parts = [...(schoolName ? [schoolName] : []), ...others]
  return parts.length > 0 ? parts.join(', ') : '-'
}

export function jaEvaluationGradeLine(user: Omit<User, 'password'>): string {
  const grade = user.listMetrics?.jaEvaluationGrade?.trim()
  if (!grade) return '-'
  return grade.endsWith('등급') ? grade : `${grade}등급`
}

export function instructorFeeGradeLine(user: Omit<User, 'password'>): string {
  // instructorTypeLabel(강사 유형)과 혼동하지 않음 — 승인 status가 type에 섞인 사례 방지
  const grade = user.listMetrics?.instructorFeeGradeLabel?.trim()
  if (!grade || grade === '-') return '-'
  const upper = grade.toUpperCase()
  if (
    upper === 'APPROVED' ||
    upper === 'PENDING' ||
    upper === 'REJECTED' ||
    upper === 'ACTIVE' ||
    upper === 'REVOKED'
  ) {
    return '-'
  }
  return grade
}

/** 회원 관리 기준 신청·소속 구분 (강사비 등급 `instructorTypeLabel`은 사용하지 않음) */
export function instructorApplicationTypeLine(user: Omit<User, 'password'>): string {
  return getMemberPermissionInstructorApplicationTypeLabel(user)
}

export function composeUserDetailAddressLine(user: Pick<User, 'detailAddress' | 'detailAddressDetail'>): string {
  return [user.detailAddress?.trim(), user.detailAddressDetail?.trim()].filter(Boolean).join(' ')
}

export function addressLine(user: Omit<User, 'password'>): string {
  // 학교(기관) 상세 — 기관 소재지
  if (user.role === 'SCHOOL') {
    const parts = [user.schoolInfo?.address?.trim(), user.schoolInfo?.addressDetail?.trim()].filter(
      Boolean
    )
    if (parts.length > 0) return parts.join(' ')
    return '-'
  }
  // 강사·개인 등 — 자택 주소 (`homeAddress` + `homeAddressDetail`)
  const combined = composeUserDetailAddressLine(user)
  if (!combined) return '-'
  if (isInstructorMaskedPlaceholder(combined)) return combined
  return combined
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

/**
 * 자택 주소 표시.
 * - 개인정보 상세보기 전: BE가 시·군·구(또는 그 이하)로 잘라 준 값은 그대로 노출.
 *   토큰 2개 이하(예: `서울특별시`, `서울특별시 관악구`)는 추가 블러하지 않음
 *   → 시 단위만 올 때 글자 단위 블러로 “안 보이는” 현상 방지.
 * - 도로명·상세가 더 붙으면(토큰 3+) 앞 2토큰만 노출, 이후 CSS blur.
 * - 상세보기 후: 원문 전체.
 */
export function detailAddressView(user: Omit<User, 'password'>, revealed: boolean): ReactNode {
  const raw = addressLine(user)
  if (raw === '-' || revealed) return raw
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '-'
  // BE 마스킹 응답(시 / 시군구) — FE에서 재블러하지 않음
  if (parts.length <= 2) return raw

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

/**
 * 강사 상세 · 정산 계좌 정보 마스킹 규칙
 * - 은행명: 원문(마스킹 없음)
 * - 계좌번호: 숫자 전부 `*` (하이픈 등 구분자는 유지)
 * - 예금주: 성(씨)만 노출, 나머지 `*`
 * - 형식: `{은행명} {마스킹계좌} | {마스킹예금주}` (예: `농협 ******-**-****** | 박**`)
 */
export function formatInstructorSettlementAccountParts(info: {
  bankName?: string | null
  accountNumber?: string | null
  accountHolder?: string | null
}): { left: string; holder: string } | null {
  const bank = String(info.bankName ?? '').trim()
  const rawNum = String(info.accountNumber ?? '').trim()
  const rawHolder = String(info.accountHolder ?? '').trim()
  if (!bank && !rawNum && !rawHolder) return null

  const maskedNum = rawNum ? MASKING_POLICY.accountNumber(rawNum) : ''
  const maskedHolder = rawHolder ? MASKING_POLICY.accountHolderName(rawHolder) : ''
  const left = [bank, maskedNum].filter(Boolean).join(' ')
  return { left, holder: maskedHolder }
}

export function instructorBankLine(user: Omit<User, 'password'>, revealed: boolean): string {
  const info = user.instructorInfo
  if (!info) return '-'

  if (revealed) {
    const bank = String(info.bankName ?? '').trim()
    const rawNum = String(info.accountNumber ?? '').trim()
    const rawHolder = String(info.accountHolder ?? '').trim()
    const left = [bank, rawNum].filter(Boolean).join(' ')
    if (left && rawHolder) return `${left} | ${rawHolder}`
    return left || rawHolder || '-'
  }

  const parts = formatInstructorSettlementAccountParts(info)
  if (!parts) return '-'
  const { left, holder } = parts
  if (left && holder) return `${left} | ${holder}`
  return left || holder || '-'
}

/** 강사 기본 정보 — 정산 계좌 정보 td (문자 `|` 대신 TdDivider, gap 12px) */
export function instructorBankView(user: Omit<User, 'password'>, revealed: boolean): ReactNode {
  const info = user.instructorInfo
  if (!info) return '-'

  if (revealed) {
    const bank = String(info.bankName ?? '').trim()
    const rawNum = String(info.accountNumber ?? '').trim()
    const rawHolder = String(info.accountHolder ?? '').trim()
    const left = [bank, rawNum].filter(Boolean).join(' ')
    if (left && rawHolder) return inlineSegmentsWithDivider([left, rawHolder])
    return left || rawHolder || '-'
  }

  const parts = formatInstructorSettlementAccountParts(info)
  if (!parts) return '-'
  const { left, holder } = parts
  if (left && holder) return inlineSegmentsWithDivider([left, holder])
  return left || holder || '-'
}

export function institutionTimesLabel(n: number | undefined): string {
  return n != null && !Number.isNaN(n) ? `${n}회` : '-'
}
