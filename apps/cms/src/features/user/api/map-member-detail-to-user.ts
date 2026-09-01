import type { InstructorDetailResponse } from '@/shared/api/generated/members/schemas'
import type { IndividualMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { TeacherMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { MemberBankAccountHistoryResponse } from '@/shared/api/generated/members/schemas/memberBankAccountHistoryResponse'
import type { MemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { SchoolMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { TermsAgreementRow } from '@/shared/api/generated/members/schemas/termsAgreementRow'
import type { User, UserListRowMetrics } from '@/types/user'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  formatInstructorCareerDisplay,
  formatInstructorEducationLevelDisplay,
  isInstructorMaskedPlaceholder,
  resolveInstructorPublicTextField,
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
  copyMemberRoles,
  inferInstructorMemberProfileFromRoles,
  mapMemberStatusToIsActive,
  resolvePrimaryUserRole,
} from '@/features/user/api/map-member-role'
import { normalizeRevokedInstructorUser } from '@/features/user/shared/lib/apply-instructor-permission-revoked'
import {
  mergeInstructorCmsProfileFromLegacyFlat,
  buildLegacyFlatFieldsFromCmsProfile,
  normalizeInstructorCmsProfileFromApi,
  normalizeInstructorCmsSettlementFromApi,
  synthesizeLegacyInstructorProfileFromCms,
} from '@/features/user/api/map-instructor-cms-profile'
import { parseOrganizationNamesFromText } from '@/features/user/detail/lib/parse-instructor-affiliation-text'
import type {
  InstructorCmsMemberType,
  InstructorCmsProfileProposal,
  InstructorCmsSettlement,
} from '@/features/user/api/types/instructor-cms-profile-proposal'
import {
  resolveIdentitySelfSignupCompletedAfterAdminRegistration,
  resolveRegisteredByAdmin,
} from '@/features/user/api/resolve-member-registration-flags'
import { coercePositiveInt } from '@/features/user/api/user-response-row-id'

const USER_AFFILIATION_PIPE_SEP = ' | ' as const

function parseIndividualApiEnrollmentStatus(
  raw: string | undefined
): 'ENROLLED' | 'NOT_ENROLLED' | undefined {
  const trimmed = raw?.trim()
  if (!trimmed) return undefined
  const upper = trimmed.toUpperCase()
  if (upper === 'ENROLLED' || upper === 'NOT_ENROLLED') return upper
  return undefined
}

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
  organizationText?: string
}

type InstructorMemberDetailLoose = InstructorMemberDetailResponse & {
  /** @deprecated BE 6개월 병행 — runtime legacy flat */
  instructorProfile?: InstructorDetailResponse | null
  homeAddress?: string
  homeAddressDetail?: string
  affiliation?: string
  affiliatedSchoolName?: string
  employmentStatus?: string
  assignedGrade?: string
  instructorAssignedGrade?: string
  organizationText?: string
  listMetrics?: UserListRowMetrics
  /** @deprecated BE 6개월 병행 — runtime 루트 flat 계좌 */
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  bankAccounts?: MemberBankAccountHistoryResponse[]
  termsAgreements?: TermsAgreementRow[]
}

function resolveCmsMemberTypeForMerge(
  user: Omit<User, 'password'>,
  cmsProfile: InstructorCmsProfileProposal | undefined,
  legacy: InstructorDetailResponse | null | undefined
): InstructorCmsMemberType {
  if (cmsProfile?.memberType) return cmsProfile.memberType
  const primary = legacy?.primaryActivityType?.trim().toUpperCase()
  if (primary === 'SCHOOL_TEACHER') return 'SCHOOL_TEACHER'
  if (user.instructorMemberProfile === 'school_teacher') return 'SCHOOL_TEACHER'
  return 'GENERAL'
}

function buildDefaultCmsAffiliationForMerge(
  memberType: InstructorCmsMemberType,
  cmsProfile: InstructorCmsProfileProposal | undefined,
  legacy: InstructorProfileLoose | null,
  loose?: { affiliation?: string; organizationText?: string }
): InstructorCmsProfileProposal['affiliation'] {
  if (memberType === 'SCHOOL_TEACHER') {
    const schoolName = pickTrimmed(
      cmsProfile?.affiliation?.schoolName,
      legacy?.affiliatedSchoolName,
      legacy?.schoolName,
      loose?.organizationText
    )
    return {
      ...(schoolName ? { schoolName } : {}),
      ...(cmsProfile?.affiliation?.employmentStatus
        ? { employmentStatus: cmsProfile.affiliation.employmentStatus }
        : {}),
      organizationNames: [],
    }
  }

  const existingOrgs =
    cmsProfile?.affiliation?.organizationNames?.map(name => name.trim()).filter(Boolean) ?? []
  if (existingOrgs.length > 0) {
    return cmsProfile!.affiliation
  }

  const fromText = pickTrimmed(
    loose?.organizationText,
    loose?.affiliation,
    legacy?.affiliation,
    legacy?.organizationText
  )
  const orgs = parseOrganizationNamesFromText(fromText)
  return orgs.length > 0 ? { organizationNames: orgs } : { organizationNames: [] }
}

function asInstructorProfileLoose(
  profile: InstructorDetailResponse | null | undefined
): InstructorProfileLoose | null {
  return profile ?? null
}

function resolveInstructorHomeAddressParts(
  detail: InstructorMemberDetailResponse,
  profile: InstructorProfileLoose | null,
  cmsProfile?: InstructorCmsProfileProposal
): { homeAddress?: string; homeAddressDetail?: string } {
  const looseDetail = detail as InstructorMemberDetailLoose
  const looseMember = detail.member as
    | (MemberDetailResponse & { homeAddress?: string; address?: string })
    | undefined
  const homeAddress = pickTrimmed(
    cmsProfile?.homeAddress?.line,
    profile?.homeAddress,
    (profile as { address?: string } | null)?.address,
    looseDetail.homeAddress,
    (looseDetail as { address?: string }).address,
    looseMember?.homeAddress,
    looseMember?.address
  )
  const homeAddressDetail = pickTrimmed(
    cmsProfile?.homeAddress?.detail,
    profile?.homeAddressDetail,
    looseDetail.homeAddressDetail
  )

  if (!homeAddress || isInstructorMaskedPlaceholder(homeAddress)) {
    const detailOnly =
      homeAddressDetail && !isInstructorMaskedPlaceholder(homeAddressDetail)
        ? homeAddressDetail
        : undefined
    if (detailOnly) return { homeAddressDetail: detailOnly }
    return homeAddress ? { homeAddress } : {}
  }

  const detailPart =
    homeAddressDetail && !isInstructorMaskedPlaceholder(homeAddressDetail)
      ? homeAddressDetail
      : undefined

  return {
    homeAddress,
    ...(detailPart ? { homeAddressDetail: detailPart } : {}),
  }
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
  const looseDetail = detail as InstructorMemberDetailLoose
  const settlement = detail.settlement
  if (
    settlement?.bankName?.trim() ||
    settlement?.accountNumber?.trim() ||
    settlement?.accountHolder?.trim()
  ) {
    return {
      bankName: settlement.bankName?.trim() || '',
      accountNumber: settlement.accountNumber?.trim() || '',
      accountHolder: settlement.accountHolder?.trim() || '',
    }
  }

  const current = resolveCurrentBankAccount(looseDetail.bankAccounts)
  return {
    bankName: looseDetail.bankName?.trim() || current?.bankName?.trim() || '',
    accountNumber: looseDetail.accountNumber?.trim() || current?.accountNumber?.trim() || '',
    accountHolder: looseDetail.accountHolder?.trim() || current?.accountHolder?.trim() || '',
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

export function mapMemberDetailToUser(
  detail: MemberDetailResponse,
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

  const role = resolvePrimaryUserRole(detail.roles, options?.fallbackRole)
  const now = new Date().toISOString()
  const normalizedBirthDate = toApiBirthDate(detail.birthDate)
  const roles = copyMemberRoles(detail.roles)

  const user: Omit<User, 'password'> = {
    id: uuid,
    memberId,
    email: String(detail.email ?? '').trim() || '-',
    name: String(detail.name ?? '').trim() || '-',
    phone: detail.phone?.trim() || undefined,
    role,
    ...(roles ? { roles } : {}),
    gender: (() => {
      const display = toDisplayGender(detail.gender)
      return display === '-' ? undefined : display
    })(),
    birthDate: normalizedBirthDate ?? detail.birthDate ?? undefined,
    isActive: mapMemberStatusToIsActive(undefined, detail.status),
    createdAt: detail.joinedAt ?? detail.createdAt ?? now,
    updatedAt: detail.updatedAt ?? now,
    registeredByAdmin: resolveRegisteredByAdmin({
      role,
      preRegistered: detail.preRegistered,
      createdByAdmin: detail.createdByAdmin,
    }),
    id1365: detail.external1365Id?.trim() || undefined,
    identitySelfSignupCompletedAfterAdminRegistration:
      resolveIdentitySelfSignupCompletedAfterAdminRegistration({
        role,
        preRegistered: detail.preRegistered,
        createdByAdmin: detail.createdByAdmin,
        identityVerified: detail.identityVerified,
      }),
    under14: detail.under14,
    guardianConsentRequired: detail.guardianConsentRequired,
  }

  const profileFromRoles = inferInstructorMemberProfileFromRoles(detail.roles)
  if (profileFromRoles) {
    user.instructorMemberProfile = profileFromRoles
  }

  if (role === 'INSTRUCTOR' && instructorProfile) {
    applyInstructorProfile(user, instructorProfile, detail.name)
  }

  return user
}

function applyInstructorCmsStructureToUser(
  user: Omit<User, 'password'>,
  cmsProfile: InstructorCmsProfileProposal | undefined,
  cmsSettlement: InstructorCmsSettlement | undefined,
  legacyProfile: InstructorDetailResponse | null,
  loose?: { affiliation?: string; organizationText?: string }
): void {
  const legacyLoose = asInstructorProfileLoose(legacyProfile)
  const memberType = resolveCmsMemberTypeForMerge(user, cmsProfile, legacyProfile)
  const affiliationLoose = {
    affiliation: pickTrimmed(loose?.affiliation, legacyLoose?.affiliation, user.affiliation),
    organizationText: pickTrimmed(loose?.organizationText, legacyLoose?.organizationText),
  }
  const mergedProfile = mergeInstructorCmsProfileFromLegacyFlat(
    cmsProfile ?? {
      memberType,
      affiliation: buildDefaultCmsAffiliationForMerge(
        memberType,
        cmsProfile,
        legacyLoose,
        affiliationLoose
      ),
      homeAddress: { line: user.detailAddress ?? '' },
      education: {},
      career: { level: 'experienced', rows: [] },
      jaKoreaActivities: [],
      licenses: [],
      awards: [],
      essays: {},
    },
    legacyProfile ?? undefined,
    affiliationLoose
  )

  user.instructorCmsProfile = mergedProfile
  if (cmsSettlement) {
    user.instructorCmsSettlement = cmsSettlement
  }

  const legacyFlat = buildLegacyFlatFieldsFromCmsProfile(mergedProfile)
  const oneLine = resolveInstructorPublicTextField(legacyFlat.oneLineIntro)
  const selfIntro = resolveInstructorPublicTextField(legacyFlat.selfIntroduction)
  if (oneLine) {
    user.bio = oneLine
  } else if (selfIntro) {
    user.bio = selfIntro
  }
  if (selfIntro) {
    user.instructorSelfIntroduction = selfIntro
  }
  if (legacyFlat.careerText) {
    const careerDisplay = formatInstructorCareerDisplay(legacyFlat.careerText)
    if (careerDisplay) {
      user.instructorCareerText = careerDisplay
    }
  }
  const educationLevel = resolveInstructorPublicTextField(legacyFlat.educationLevel)
  if (educationLevel) {
    const educationDisplay =
      formatInstructorEducationLevelDisplay(educationLevel) ?? educationLevel
    user.listMetrics = assignDefinedListMetrics(user.listMetrics, {
      highestEducationLabel: educationDisplay,
    })
  }

  const feeGradeLabel = toInstructorFeeGradeDisplayLabel(mergedProfile.defaultFeeGrade)
  const jaGrade = mergedProfile.defaultJaGrade?.trim()
  if (feeGradeLabel || jaGrade) {
    user.listMetrics = assignDefinedListMetrics(user.listMetrics, {
      ...(feeGradeLabel ? { instructorFeeGradeLabel: feeGradeLabel } : {}),
      ...(jaGrade ? { jaEvaluationGrade: jaGrade } : {}),
    })
  }

  const homeLine = mergedProfile.homeAddress.line?.trim()
  if (homeLine && !isInstructorMaskedPlaceholder(homeLine)) {
    user.detailAddress = homeLine
  }
  const homeDetail = mergedProfile.homeAddress.detail?.trim()
  if (homeDetail && !isInstructorMaskedPlaceholder(homeDetail)) {
    user.detailAddressDetail = homeDetail
  }

  if (cmsSettlement) {
    user.instructorInfo = {
      bankName: cmsSettlement.bankName ?? user.instructorInfo?.bankName ?? '',
      accountNumber: cmsSettlement.accountNumber ?? user.instructorInfo?.accountNumber ?? '',
      accountHolder: cmsSettlement.accountHolder ?? user.instructorInfo?.accountHolder ?? '',
      isBusinessIncome: cmsSettlement.businessIncome ?? user.instructorInfo?.isBusinessIncome ?? false,
    }
  }

  applyCmsAffiliationFromProfile(user, mergedProfile)
}

function applyCmsAffiliationFromProfile(
  user: Omit<User, 'password'>,
  profile: InstructorCmsProfileProposal
): void {
  const affiliation = profile.affiliation ?? {}
  const schoolName = affiliation.schoolName?.trim()
  const isSchoolTeacher =
    profile.memberType === 'SCHOOL_TEACHER' ||
    user.instructorMemberProfile === 'school_teacher' ||
    Boolean(schoolName)

  if (isSchoolTeacher) {
    if (schoolName && !user.affiliatedSchoolName?.trim()) {
      user.affiliatedSchoolName = schoolName
    }

    const employmentLabel = toEmploymentStatusDisplayLabel(affiliation.employmentStatus)
    if (employmentLabel && !user.listMetrics?.employmentStatusLabel?.trim()) {
      user.listMetrics = assignDefinedListMetrics(user.listMetrics, {
        employmentStatusLabel: employmentLabel,
      })
    }

    if (schoolName && !user.affiliation?.trim()) {
      user.affiliation = employmentLabel
        ? `${schoolName}${USER_AFFILIATION_PIPE_SEP}${employmentLabel}`
        : schoolName
    }

    const orgs = affiliation.organizationNames?.map(name => name.trim()).filter(Boolean) ?? []
    if (orgs.length > 0) {
      const orgPart = orgs.join(', ')
      if (!user.affiliation?.trim()) {
        user.affiliation = schoolName ? `${schoolName}, ${orgPart}` : orgPart
      } else if (!user.affiliation.includes(orgPart)) {
        user.affiliation = `${user.affiliation}, ${orgPart}`
      }
    }
    return
  }

  const orgs = affiliation.organizationNames?.map(name => name.trim()).filter(Boolean) ?? []
  if (orgs.length > 0 && !user.affiliation?.trim()) {
    user.affiliation = orgs.join(', ')
  }
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

  const oneLine = resolveInstructorPublicTextField(profile?.oneLineIntro)
  const selfIntro = resolveInstructorPublicTextField(profile?.selfIntroduction)
  if (oneLine) {
    user.bio = oneLine
  } else if (selfIntro) {
    user.bio = selfIntro
  }

  const homeAddress = pickTrimmed(profile?.homeAddress, (profile as { address?: string } | null)?.address)
  const homeAddressDetail = pickTrimmed(profile?.homeAddressDetail)
  if (homeAddress) {
    user.detailAddress = homeAddress
  }
  if (homeAddressDetail) {
    user.detailAddressDetail = homeAddressDetail
  }

  const careerDisplay = formatInstructorCareerDisplay(profile?.careerText)
  if (careerDisplay) {
    user.instructorCareerText = careerDisplay
  }
  if (selfIntro) {
    user.instructorSelfIntroduction = selfIntro
  }

  // activityTypes/primaryActivityType 은 신청·활동 유형 — 소속(affiliation)에 넣지 않는다
  const activityLabels = mapInstructorActivityTypesToLabels(
    profile?.activityTypes,
    profile?.primaryActivityType
  )
  const primaryActivityLabel =
    toInstructorActivityTypeLabel(profile?.primaryActivityType) ?? activityLabels[0]

  const feeGrade = toInstructorFeeGradeDisplayLabel(profile?.defaultFeeGrade)
  const jaGrade = pickTrimmed(profile?.defaultJaGrade, profile?.jaGrade)
  const educationLevel = resolveInstructorPublicTextField(profile?.educationLevel)
  const educationDisplay = educationLevel
    ? formatInstructorEducationLevelDisplay(educationLevel) ?? educationLevel
    : undefined

  user.listMetrics = assignDefinedListMetrics(user.listMetrics, {
    instructorFeeGradeLabel: feeGrade,
    jaEvaluationGrade: jaGrade,
    highestEducationLabel: educationDisplay,
    instructorCareerSummaryLabel: careerDisplay,
    instructorCareerYearsLabel: careerDisplay,
    permissionApplicationTypeLabel:
      primaryActivityLabel ??
      (activityLabels.length > 0 ? activityLabels.join(', ') : undefined),
  })

  if (profile?.status?.trim()) {
    user.instructorApprovalStatus = profile.status.trim()
  }
  if (profile?.revokedAt?.trim()) {
    user.instructorApprovalStatus = 'REVOKED'
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
  const address = detail.address?.trim()
  const addressDetail = detail.addressDetail?.trim()
  if (address) user.detailAddress = address
  if (addressDetail) user.detailAddressDetail = addressDetail

  const enrollment = parseIndividualApiEnrollmentStatus(detail.enrollmentStatus)
  if (enrollment) {
    user.schoolEnrollmentStatus = enrollment
  }

  const schoolName = detail.schoolName?.trim()
  const grade = pickTrimmed((detail as { grade?: string }).grade)
  if (schoolName) {
    if (enrollment === 'NOT_ENROLLED') {
      user.affiliation = schoolName
    } else if (enrollment === 'ENROLLED' && grade) {
      user.affiliation = `${schoolName}${USER_AFFILIATION_PIPE_SEP}${grade}`
    } else if (enrollment === 'ENROLLED') {
      user.affiliation = schoolName
    } else {
      const legacySuffix = detail.enrollmentStatus?.trim()
      user.affiliation =
        legacySuffix && !parseIndividualApiEnrollmentStatus(legacySuffix)
          ? `${schoolName}${USER_AFFILIATION_PIPE_SEP}${legacySuffix}`
          : schoolName
    }
  } else if (enrollment === 'NOT_ENROLLED') {
    // 포털에서 소속 해제 시 schoolName 비움 — 목록 merge가 옛 소속을 되살리지 않도록 명시
    user.affiliation = undefined
  }
  if (detail.termsAgreements?.length) {
    user.termsAgreements = detail.termsAgreements
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
  {
    const organizationId = coercePositiveInt(detail.organizationId)
    if (organizationId != null) {
      user.organizationId = organizationId
    }
  }
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

  const looseDetail = detail as InstructorMemberDetailLoose
  const cmsProfile = normalizeInstructorCmsProfileFromApi(detail.profile)
  const cmsSettlement = normalizeInstructorCmsSettlementFromApi(detail.settlement)
  const legacyProfile =
    looseDetail.instructorProfile ??
    (cmsProfile
      ? synthesizeLegacyInstructorProfileFromCms(cmsProfile, cmsSettlement, member.memberId)
      : null)
  const profile = legacyProfile ?? null

  const user = mapMemberDetailToUser(member, profile, {
    fallbackRole: options?.fallbackRole ?? 'INSTRUCTOR',
  })
  user.role = 'INSTRUCTOR'

  const profileLoose = asInstructorProfileLoose(profile)
  const { homeAddress, homeAddressDetail } = resolveInstructorHomeAddressParts(
    detail,
    profileLoose,
    cmsProfile
  )
  if (homeAddress) user.detailAddress = homeAddress
  if (homeAddressDetail) user.detailAddressDetail = homeAddressDetail

  // member.gender 누락 시 루트/프로필 동의어로 보강 — 표시는 항상 남성/여성
  if (!user.gender) {
    const looseGender = pickTrimmed(
      (looseDetail as { gender?: string }).gender,
      (profileLoose as { gender?: string } | null)?.gender,
      (member as { genderLabel?: string }).genderLabel
    )
    const display = toDisplayGender(looseGender)
    if (display !== '-') user.gender = display
  }

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
  }

  const employmentLabel = toEmploymentStatusDisplayLabel(
    pickTrimmed(profileLoose?.employmentStatus, looseDetail.employmentStatus)
  )
  if (employmentLabel) {
    user.listMetrics = assignDefinedListMetrics(user.listMetrics, {
      employmentStatusLabel: employmentLabel,
    })
  }

  const assignedGrade = pickTrimmed(
    looseDetail.instructorAssignedGrade,
    looseDetail.assignedGrade,
    looseDetail.listMetrics?.instructorAssignedGrade
  )
  if (assignedGrade) {
    user.listMetrics = assignDefinedListMetrics(user.listMetrics, {
      instructorAssignedGrade: assignedGrade,
    })
  }

  const bank = resolveInstructorBankFields(detail)
  const businessIncome =
    parseBusinessIncomeFlag(cmsSettlement?.businessIncome) ??
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

  if (detail.termsAgreements?.length) {
    user.termsAgreements = detail.termsAgreements
  } else if (looseDetail.termsAgreements?.length) {
    user.termsAgreements = looseDetail.termsAgreements
  }

  applyInstructorCmsStructureToUser(
    user,
    cmsProfile,
    cmsSettlement,
    profile,
    {
      affiliation: pickTrimmed(profileLoose?.affiliation, looseDetail.affiliation),
      organizationText: pickTrimmed(
        looseDetail.organizationText,
        (member as { organizationText?: string }).organizationText,
        profileLoose?.organizationText
      ),
    }
  )

  return normalizeRevokedInstructorUser(user)
}

/** 학교 소속 교사 상세 — `GET /api/admin/users/{memberId}/teacher` */
export function mapTeacherMemberDetailToUser(
  detail: TeacherMemberDetailResponse,
  options?: { fallbackRole?: User['role'] }
): Omit<User, 'password'> {
  const member = detail.member
  if (!member) {
    throw new Error('교사 회원 상세 응답에 member가 없습니다.')
  }

  const user = mapMemberDetailToUser(member, null, {
    fallbackRole: options?.fallbackRole ?? 'INSTRUCTOR',
  })
  user.role = 'INSTRUCTOR'
  user.instructorMemberProfile =
    inferInstructorMemberProfileFromRoles(member.roles) ?? 'school_teacher'

  const organizationId = coercePositiveInt(detail.organizationId)
  if (organizationId != null) {
    user.organizationId = organizationId
  }

  const schoolName = detail.organizationName?.trim()
  if (schoolName) {
    user.affiliatedSchoolName = schoolName
    const employmentLabel = toEmploymentStatusDisplayLabel(detail.employmentStatus)
    user.affiliation = employmentLabel
      ? `${schoolName}${USER_AFFILIATION_PIPE_SEP}${employmentLabel}`
      : schoolName
    if (employmentLabel) {
      user.listMetrics = assignDefinedListMetrics(user.listMetrics, {
        employmentStatusLabel: employmentLabel,
      })
    }
  }

  const address = detail.address?.trim()
  const addressDetail = detail.addressDetail?.trim()
  if (address) user.detailAddress = address
  if (addressDetail) user.detailAddressDetail = addressDetail

  if (detail.termsAgreements?.length) {
    user.termsAgreements = detail.termsAgreements
  }

  return user
}
