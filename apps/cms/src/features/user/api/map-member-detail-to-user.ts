import type { InstructorDetailResponse } from '@/shared/api/generated/members/schemas'
import type { IndividualMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { MemberBankAccountHistoryResponse } from '@/shared/api/generated/members/schemas'
import type { MemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { SchoolMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { UserResponse } from '@/shared/api/generated/members/schemas'
import type { User, UserListRowMetrics } from '@/types/user'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  formatInstructorCareerDisplay,
  isInstructorMaskedPlaceholder,
  looksLikeInstructorActivityEnumCode,
  mapInstructorActivityTypesToLabels,
  toEmploymentStatusDisplayLabel,
  toInstructorActivityTypeLabel,
  toInstructorFeeGradeDisplayLabel,
} from '@/features/user/api/map-instructor-activity-display'
import {
  toApiBirthDate,
  toDisplayGender,
} from '@/features/user/api/map-member-gender-birth'
import {
  mapMemberStatusToIsActive,
  resolvePrimaryUserRole,
} from '@/features/user/api/map-member-role'

function fallbackUuid(memberId?: number): string {
  if (memberId != null) return `member-${memberId}`
  return `member-unknown-${crypto.randomUUID()}`
}

function pickTrimmed(...values: Array<string | undefined | null>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

/** OpenAPI 외 BE가 내려줄 수 있는 동의어 필드 */
type InstructorProfileLoose = InstructorDetailResponse & {
  homeAddressDetail?: string
  feeGrade?: string
  jaGrade?: string
  businessIncome?: boolean | string
  affiliation?: string
  affiliatedSchoolName?: string
  schoolName?: string
  employmentStatus?: string
}

type InstructorMemberDetailLoose = InstructorMemberDetailResponse & {
  homeAddress?: string
  homeAddressDetail?: string
  affiliation?: string
  affiliatedSchoolName?: string
  employmentStatus?: string
}

function asInstructorProfileLoose(
  profile: InstructorDetailResponse | null | undefined
): InstructorProfileLoose | null {
  return profile ?? null
}

function resolveInstructorHomeAddressLine(
  detail: InstructorMemberDetailResponse,
  profile: InstructorProfileLoose | null
): string | undefined {
  const looseDetail = detail as InstructorMemberDetailLoose
  const homeAddress = pickTrimmed(profile?.homeAddress, looseDetail.homeAddress)
  const homeAddressDetail = pickTrimmed(profile?.homeAddressDetail, looseDetail.homeAddressDetail)
  const addressLine = [homeAddress, homeAddressDetail].filter(Boolean).join(' ')
  return addressLine || undefined
}

function parseBusinessIncomeFlag(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const upper = value.trim().toUpperCase()
    if (upper === 'Y' || upper === 'TRUE' || upper === '1') return true
    if (upper === 'N' || upper === 'FALSE' || upper === '0') return false
  }
  return undefined
}

function resolveCurrentBankAccount(
  accounts: MemberBankAccountHistoryResponse[] | undefined
): MemberBankAccountHistoryResponse | undefined {
  if (!accounts?.length) return undefined
  return accounts.find(account => account.current === true) ?? accounts[0]
}

export function resolveInstructorBankFields(detail: InstructorMemberDetailResponse): {
  bankName: string
  accountNumber: string
  accountHolder: string
} {
  const current = resolveCurrentBankAccount(detail.bankAccounts)
  return {
    bankName: detail.bankName?.trim() || current?.bankName?.trim() || '',
    accountNumber: detail.accountNumber?.trim() || current?.accountNumber?.trim() || '',
    accountHolder: detail.accountHolder?.trim() || current?.accountHolder?.trim() || '',
  }
}

function assignDefinedListMetrics(
  target: UserListRowMetrics | undefined,
  patch: Partial<UserListRowMetrics>
): UserListRowMetrics | undefined {
  const next: UserListRowMetrics = { ...target }
  let changed = Boolean(target)

  for (const [key, value] of Object.entries(patch) as Array<
    [keyof UserListRowMetrics, UserListRowMetrics[keyof UserListRowMetrics] | undefined]
  >) {
    if (value === undefined || value === null) continue
    if (typeof value === 'string' && !value.trim()) continue
    ;(next as Record<string, unknown>)[key as string] = value
    changed = true
  }

  return changed ? next : target
}

type MemberDetailMappingSource = MemberDetailResponse &
  Pick<UserResponse, 'socialAccounts' | 'guardianInfo' | 'schoolInfo' | 'role'>

export function mapMemberDetailToUser(
  detail: MemberDetailMappingSource,
  instructorProfile?: InstructorDetailResponse | null,
  options?: { fallbackRole?: User['role'] }
): Omit<User, 'password'> {
  const memberId = detail.memberId
  const uuid =
    typeof detail.uuid === 'string' && detail.uuid.trim()
      ? detail.uuid.trim()
      : memberId != null
        ? fallbackUuid(memberId)
        : fallbackUuid()

  if (memberId != null) {
    registerMemberIdMapping(uuid, memberId)
  }

  const role = resolvePrimaryUserRole(detail.roles, detail.role ?? options?.fallbackRole)
  const now = new Date().toISOString()
  const normalizedBirthDate = toApiBirthDate(detail.birthDate)

  const user: Omit<User, 'password'> = {
    id: uuid,
    memberId,
    email: String(detail.email ?? '').trim() || '-',
    name: String(detail.name ?? '').trim() || '-',
    phone: detail.phone?.trim() || undefined,
    role,
    gender: (() => {
      const display = toDisplayGender(detail.gender)
      return display === '-' ? undefined : display
    })(),
    birthDate: normalizedBirthDate ?? detail.birthDate ?? undefined,
    isActive: mapMemberStatusToIsActive(undefined, detail.status),
    createdAt: detail.joinedAt ?? detail.createdAt ?? now,
    updatedAt: detail.updatedAt ?? now,
    registeredByAdmin: Boolean(detail.preRegistered ?? detail.createdByAdmin),
    id1365: detail.external1365Id?.trim() || undefined,
    identitySelfSignupCompletedAfterAdminRegistration: detail.identityVerified === true,
    socialAccounts: detail.socialAccounts?.map(account => account.trim()).filter(Boolean),
    under14: detail.under14,
    guardianConsentRequired: detail.guardianConsentRequired,
    guardianInfo: detail.guardianInfo
      ? {
          guardianName: detail.guardianInfo.guardianName?.trim() || undefined,
          relation: detail.guardianInfo.relation?.trim() || undefined,
          phone: detail.guardianInfo.phone?.trim() || undefined,
          consentStatus: detail.guardianInfo.consentStatus?.trim() || undefined,
          consentedAt: detail.guardianInfo.consentedAt,
        }
      : undefined,
  }

  if (role === 'SCHOOL') {
    const schoolName = String(
      detail.schoolInfo?.schoolName ?? detail.name ?? ''
    ).trim()
    if (schoolName) {
      user.schoolInfo = {
        schoolName,
        address: detail.schoolInfo?.address?.trim() ?? '',
        ...(detail.schoolInfo?.position?.trim()
          ? { position: detail.schoolInfo.position.trim() }
          : {}),
      }
      user.name = schoolName
    }
  }

  if (role === 'INSTRUCTOR' && instructorProfile) {
    applyInstructorProfile(user, instructorProfile, detail.name)
  }

  return user
}

function applyInstructorProfile(
  user: Omit<User, 'password'>,
  instructorProfile: InstructorDetailResponse,
  memberName?: string | null
) {
  const profile = asInstructorProfileLoose(instructorProfile)
  const businessIncome =
    parseBusinessIncomeFlag(profile?.businessIncomeYn) ??
    parseBusinessIncomeFlag(profile?.businessIncome)

  user.instructorInfo = {
    bankName: '',
    accountNumber: '',
    accountHolder: memberName?.trim() ?? '',
    isBusinessIncome: businessIncome ?? false,
  }

  const oneLine = pickTrimmed(profile?.oneLineIntro)
  const selfIntro = pickTrimmed(profile?.selfIntroduction)
  if (oneLine && !isInstructorMaskedPlaceholder(oneLine)) {
    user.bio = oneLine
  } else if (selfIntro && !isInstructorMaskedPlaceholder(selfIntro)) {
    user.bio = selfIntro
  }

  const homeAddress = pickTrimmed(profile?.homeAddress)
  const homeAddressDetail = pickTrimmed(profile?.homeAddressDetail)
  const addressLine = [homeAddress, homeAddressDetail].filter(Boolean).join(' ')
  if (addressLine) {
    user.detailAddress = addressLine
  }

  const careerText = pickTrimmed(profile?.careerText)
  const careerDisplay = formatInstructorCareerDisplay(careerText)
  if (careerDisplay) {
    user.instructorCareerText = careerDisplay
  }
  if (selfIntro && !isInstructorMaskedPlaceholder(selfIntro)) {
    user.instructorSelfIntroduction = selfIntro
  }

  // activityTypes/primaryActivityType 은 신청·활동 유형 — 소속(affiliation)에 넣지 않는다
  const activityLabels = mapInstructorActivityTypesToLabels(
    profile?.activityTypes,
    profile?.primaryActivityType
  )
  const primaryActivityLabel =
    toInstructorActivityTypeLabel(profile?.primaryActivityType) ?? activityLabels[0]

  const primaryUpper = profile?.primaryActivityType?.trim().toUpperCase()
  if (primaryUpper === 'SCHOOL_TEACHER') {
    user.instructorMemberProfile = user.instructorMemberProfile ?? 'school_teacher'
  } else if (primaryUpper === 'GENERAL') {
    user.instructorMemberProfile = user.instructorMemberProfile ?? 'instructor_only'
  }

  const feeGrade = toInstructorFeeGradeDisplayLabel(
    pickTrimmed(profile?.defaultFeeGrade, profile?.feeGrade)
  )
  const jaGrade = pickTrimmed(profile?.defaultJaGrade, profile?.jaGrade)
  const educationLevel = pickTrimmed(profile?.educationLevel)

  user.listMetrics = assignDefinedListMetrics(user.listMetrics, {
    instructorFeeGradeLabel: feeGrade,
    jaEvaluationGrade: jaGrade,
    highestEducationLabel: educationLevel,
    instructorCareerSummaryLabel: careerDisplay,
    instructorCareerYearsLabel: careerDisplay,
    permissionApplicationTypeLabel:
      primaryActivityLabel ??
      (activityLabels.length > 0 ? activityLabels.join(', ') : undefined),
  })

  if (profile?.status?.trim()) {
    user.instructorApprovalStatus = profile.status.trim()
  }
}

export function mapIndividualMemberDetailToUser(
  detail: IndividualMemberDetailResponse,
  options?: { fallbackRole?: User['role'] }
): Omit<User, 'password'> {
  const member = detail.member
  if (!member) {
    throw new Error('개인 회원 상세 응답에 member가 없습니다.')
  }
  const user = mapMemberDetailToUser(member, null, {
    fallbackRole: options?.fallbackRole ?? 'INDIVIDUAL',
  })
  const addressLine = [detail.address?.trim(), detail.addressDetail?.trim()]
    .filter(Boolean)
    .join(' ')
  if (addressLine) user.detailAddress = addressLine
  if (detail.schoolName?.trim()) {
    user.affiliation = detail.enrollmentStatus?.trim()
      ? `${detail.schoolName.trim()} | ${detail.enrollmentStatus.trim()}`
      : detail.schoolName.trim()
  }
  return user
}

export function mapSchoolMemberDetailToUser(
  detail: SchoolMemberDetailResponse,
  options?: { fallbackRole?: User['role'] }
): Omit<User, 'password'> {
  const member = detail.member
  if (!member) {
    throw new Error('학교 회원 상세 응답에 member가 없습니다.')
  }
  const user = mapMemberDetailToUser(member, null, {
    fallbackRole: options?.fallbackRole ?? 'SCHOOL',
  })
  const schoolName = detail.organizationName?.trim() || user.schoolInfo?.schoolName || user.name
  const address = detail.address?.trim() ?? ''
  const addressDetail = detail.addressDetail?.trim() || undefined
  user.role = 'SCHOOL'
  user.schoolInfo = {
    schoolName,
    address,
    ...(addressDetail ? { addressDetail } : {}),
    ...(detail.position?.trim() ? { position: detail.position.trim() } : {}),
  }
  user.name = schoolName
  return user
}

export function mapInstructorMemberDetailToUser(
  detail: InstructorMemberDetailResponse,
  options?: { fallbackRole?: User['role'] }
): Omit<User, 'password'> {
  const member = detail.member
  if (!member) {
    throw new Error('강사 회원 상세 응답에 member가 없습니다.')
  }
  const profile = detail.instructorProfile ?? null
  const user = mapMemberDetailToUser(member, profile, {
    fallbackRole: options?.fallbackRole ?? 'INSTRUCTOR',
  })
  user.role = 'INSTRUCTOR'

  const profileLoose = asInstructorProfileLoose(profile)
  const looseDetail = detail as InstructorMemberDetailLoose
  // homeAddress → detailAddress (자택 주소). 프로필/응답 루트 어느 쪽이든 반영
  const homeAddressLine = resolveInstructorHomeAddressLine(detail, profileLoose)
  if (homeAddressLine) user.detailAddress = homeAddressLine

  const affiliation = pickTrimmed(profileLoose?.affiliation, looseDetail.affiliation)
  if (affiliation && !looksLikeInstructorActivityEnumCode(affiliation)) {
    user.affiliation = affiliation
  }

  const schoolName = pickTrimmed(
    profileLoose?.affiliatedSchoolName,
    profileLoose?.schoolName,
    looseDetail.affiliatedSchoolName
  )
  if (schoolName) {
    user.affiliatedSchoolName = schoolName
    if (!user.instructorMemberProfile || user.instructorMemberProfile === 'instructor_only') {
      user.instructorMemberProfile = 'instructor_dual'
    }
  }

  const employmentLabel = toEmploymentStatusDisplayLabel(
    pickTrimmed(profileLoose?.employmentStatus, looseDetail.employmentStatus)
  )
  if (employmentLabel) {
    user.listMetrics = assignDefinedListMetrics(user.listMetrics, {
      employmentStatusLabel: employmentLabel,
    })
  }

  const bank = resolveInstructorBankFields(detail)
  const businessIncome =
    parseBusinessIncomeFlag(profileLoose?.businessIncomeYn) ??
    parseBusinessIncomeFlag(profileLoose?.businessIncome)

  if (!user.instructorInfo) {
    user.instructorInfo = {
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountHolder: bank.accountHolder || member.name?.trim() || '',
      isBusinessIncome: businessIncome ?? false,
    }
  } else {
    // 빈 문자열이어도 API 값을 반영 (목록 빈 instructorInfo가 남는 경우 방지)
    user.instructorInfo.bankName = bank.bankName || user.instructorInfo.bankName
    user.instructorInfo.accountNumber = bank.accountNumber || user.instructorInfo.accountNumber
    user.instructorInfo.accountHolder =
      bank.accountHolder || user.instructorInfo.accountHolder || member.name?.trim() || ''
    if (businessIncome !== undefined) {
      user.instructorInfo.isBusinessIncome = businessIncome
    }
  }

  const certifications = (detail.certifications ?? [])
    .map(row => {
      const name = row.certificationName?.trim()
      if (!name) return null
      return {
        id: row.id,
        name,
        ...(row.issuer?.trim() ? { issuer: row.issuer.trim() } : {}),
        ...(row.certificateNumber?.trim()
          ? { certificateNumber: row.certificateNumber.trim() }
          : {}),
        ...(row.issuedDate?.trim() ? { issuedDate: row.issuedDate.trim() } : {}),
        ...(row.expiresDate?.trim() ? { expiresDate: row.expiresDate.trim() } : {}),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
  if (certifications.length > 0) {
    user.instructorCertifications = certifications
  }

  return user
}
