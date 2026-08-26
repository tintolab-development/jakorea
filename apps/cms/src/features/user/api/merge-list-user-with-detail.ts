import type { PatchUserBasicInfoInput } from '@/entities/user/api/user-service'
import type { User } from '@/types/user'
import type { InfiniteData } from '@tanstack/react-query'
import {
  formatInstructorCareerDisplay,
  isInstructorMaskedPlaceholder,
  looksLikeInstructorActivityEnumCode,
} from '@/features/user/api/map-instructor-activity-display'
import {
  inferInstructorMemberProfileFromRoles,
} from '@/features/user/api/map-member-role'
import { isInstructorPermissionRevoked } from '@/features/user/shared/lib/member-list-display'
import { resolveCanonicalUserDetailId } from '@/features/user/api/user-response-row-id'
import { mergeTermsAgreementRowsFromPatch } from '@/features/user/api/member-basic-info-terms-patch'

const MASK_GUARDED_LIST_METRIC_KEYS = new Set<keyof NonNullable<User['listMetrics']>>([
  'instructorCareerYearsLabel',
  'instructorCareerSummaryLabel',
  'highestEducationLabel',
  'instructorFeeGradeLabel',
  'jaEvaluationGrade',
  'permissionApplicationTypeLabel',
  'instructorAssignedGrade',
])

function resolveMergedDisplayName(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>,
  role: User['role']
): string {
  if (role === 'SCHOOL') {
    const schoolName = (fetched.schoolInfo ?? listUser.schoolInfo)?.schoolName?.trim()
    if (schoolName) return schoolName
  }

  const listName = listUser.name?.trim()
  const fetchedName = fetched.name?.trim()
  if (!listName) return fetchedName || '-'
  if (!fetchedName) return listName

  if (role === 'INSTRUCTOR') {
    const schoolLabel =
      listUser.affiliatedSchoolName?.trim() ||
      fetched.affiliatedSchoolName?.trim() ||
      listUser.schoolInfo?.schoolName?.trim() ||
      fetched.schoolInfo?.schoolName?.trim()
    if (schoolLabel && fetchedName === schoolLabel) {
      return listName
    }
  }

  return fetchedName || listName
}

function resolveMergedAffiliation(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>
): string | undefined {
  const fetchedAffiliation = fetched.affiliation?.trim()
  const listAffiliation = listUser.affiliation?.trim()

  /**
   * 상세 GET이 미재학(NOT_ENROLLED)이면 목록에 남은 소속을 되살리지 않는다.
   * (포털 온보딩에서 재학→해당 없음 변경 후 CMS 상세가 옛 소속을 보여주던 원인)
   */
  if (fetched.schoolEnrollmentStatus === 'NOT_ENROLLED') {
    if (fetchedAffiliation && !looksLikeInstructorActivityEnumCode(fetchedAffiliation)) {
      return fetchedAffiliation
    }
    return undefined
  }

  if (fetchedAffiliation && !looksLikeInstructorActivityEnumCode(fetchedAffiliation)) {
    return fetchedAffiliation
  }
  if (listAffiliation) return listAffiliation
  return fetchedAffiliation || undefined
}

function resolveMergedBio(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>
): string | undefined {
  const fetchedBio = fetched.bio?.trim()
  const listBio = listUser.bio?.trim()
  if (fetchedBio && !isInstructorMaskedPlaceholder(fetchedBio)) return fetchedBio
  if (listBio && !isInstructorMaskedPlaceholder(listBio)) return listBio
  return fetchedBio || listBio || undefined
}

function pickFirstNonMaskedString(
  ...candidates: Array<string | undefined | null>
): string | undefined {
  for (const value of candidates) {
    const trimmed = value?.trim()
    if (trimmed && !isInstructorMaskedPlaceholder(trimmed)) return trimmed
  }
  return undefined
}

function resolveMergedInstructorTextField(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>,
  key: 'instructorCareerText' | 'instructorSelfIntroduction'
): string | undefined {
  return pickFirstNonMaskedString(fetched[key], listUser[key])
}

function resolveMergedListMetrics(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>,
  patchMetrics?: User['listMetrics']
): User['listMetrics'] | undefined {
  const listM = listUser.listMetrics ?? {}
  const fetchedM = omitUndefinedMetrics(fetched.listMetrics) ?? {}
  const patchM = omitUndefinedMetrics(patchMetrics) ?? {}

  const allKeys = new Set([
    ...Object.keys(listM),
    ...Object.keys(fetchedM),
    ...Object.keys(patchM),
  ]) as Set<keyof NonNullable<User['listMetrics']>>

  const next: NonNullable<User['listMetrics']> = {}
  for (const key of allKeys) {
    if (MASK_GUARDED_LIST_METRIC_KEYS.has(key)) {
      // patch > fetched(상세 GET) > list — 둘 다 비마스킹이면 상세가 최신
      const val = pickFirstNonMaskedString(
        patchM[key] as string | undefined,
        fetchedM[key] as string | undefined,
        listM[key] as string | undefined
      )
      if (val !== undefined) {
        ;(next as Record<string, unknown>)[key as string] = val
      }
      continue
    }

    const val = patchM[key] ?? fetchedM[key] ?? listM[key]
    if (val === undefined || val === null) continue
    if (typeof val === 'string' && !val.trim()) continue
    ;(next as Record<string, unknown>)[key as string] = val
  }

  return Object.keys(next).length > 0 ? next : undefined
}

/**
 * 자택 주소 상세 — 상세 GET(비마스킹) 우선.
 * 예전엔 더 긴 문자열을 고르다 목록의 구주소가 포털에서 바꾼 신주소보다 길면 구주소가 남았다.
 */
function resolveMergedDetailAddressDetail(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>
): string | undefined {
  const fetchedDetail = fetched.detailAddressDetail?.trim()
  const listDetail = listUser.detailAddressDetail?.trim()
  const fetchedOk =
    fetchedDetail && !isInstructorMaskedPlaceholder(fetchedDetail) ? fetchedDetail : undefined
  const listOk = listDetail && !isInstructorMaskedPlaceholder(listDetail) ? listDetail : undefined
  return fetchedOk || listOk || fetchedDetail || listDetail || undefined
}

/** 자택 주소 — 상세 GET(비마스킹) 우선, 마스킹이면 목록 값 */
function resolveMergedDetailAddress(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>
): string | undefined {
  const fetchedAddr = fetched.detailAddress?.trim()
  const listAddr = listUser.detailAddress?.trim()
  const fetchedOk =
    fetchedAddr && !isInstructorMaskedPlaceholder(fetchedAddr) ? fetchedAddr : undefined
  const listOk = listAddr && !isInstructorMaskedPlaceholder(listAddr) ? listAddr : undefined
  return fetchedOk || listOk || undefined
}

/**
 * 목록 행을 remote 상세로 덮어쓸 때 SCHOOL·schoolInfo 등 목록 전용 필드를 보존한다.
 * 상세 API가 roles 누락 시 INDIVIDUAL로 떨어지면 「학교 상세」가 「회원 상세」로 보이는 문제를 막는다.
 */
function resolveMergedInstructorInfo(
  listInfo: User['instructorInfo'] | undefined,
  fetchedInfo: User['instructorInfo'] | undefined
): User['instructorInfo'] | undefined {
  if (!listInfo && !fetchedInfo) return undefined
  if (!fetchedInfo) return listInfo
  if (!listInfo) return fetchedInfo

  const fetchedHasBank =
    Boolean(fetchedInfo.bankName?.trim()) ||
    Boolean(fetchedInfo.accountNumber?.trim()) ||
    Boolean(fetchedInfo.accountHolder?.trim())

  return {
    ...listInfo,
    ...fetchedInfo,
    bankName: fetchedHasBank
      ? fetchedInfo.bankName || listInfo.bankName
      : listInfo.bankName || fetchedInfo.bankName,
    accountNumber: fetchedHasBank
      ? fetchedInfo.accountNumber || listInfo.accountNumber
      : listInfo.accountNumber || fetchedInfo.accountNumber,
    accountHolder: fetchedHasBank
      ? fetchedInfo.accountHolder || listInfo.accountHolder
      : listInfo.accountHolder || fetchedInfo.accountHolder,
    isBusinessIncome: fetchedInfo.isBusinessIncome ?? listInfo.isBusinessIncome,
  }
}

export function mergeListUserWithFetchedDetail(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>
): Omit<User, 'password'> {
  const fetchedRevoked = isInstructorPermissionRevoked(fetched)
  const listRevoked = isInstructorPermissionRevoked(listUser)
  const role =
    fetchedRevoked || listRevoked
      ? fetched.role
      : fetched.role === 'INDIVIDUAL' && listUser.role !== 'INDIVIDUAL'
        ? listUser.role
        : fetched.role

  const schoolInfo =
    role === 'SCHOOL' ? (fetched.schoolInfo ?? listUser.schoolInfo) : undefined

  return {
    ...listUser,
    ...fetched,
    id: resolveCanonicalUserDetailId(listUser, fetched),
    memberId: fetched.memberId ?? listUser.memberId,
    adminAccountId: fetched.adminAccountId ?? listUser.adminAccountId,
    role,
    registeredByAdmin: Boolean(listUser.registeredByAdmin || fetched.registeredByAdmin),
    identitySelfSignupCompletedAfterAdminRegistration: Boolean(
      listUser.identitySelfSignupCompletedAfterAdminRegistration ||
        fetched.identitySelfSignupCompletedAfterAdminRegistration
    ),
    schoolInfo,
    instructorInfo: resolveMergedInstructorInfo(listUser.instructorInfo, fetched.instructorInfo),
    instructorCmsProfile: fetched.instructorCmsProfile ?? listUser.instructorCmsProfile,
    instructorCmsSettlement: fetched.instructorCmsSettlement ?? listUser.instructorCmsSettlement,
    roles: fetched.roles ?? listUser.roles,
    instructorMemberProfile:
      inferInstructorMemberProfileFromRoles(fetched.roles ?? listUser.roles) ??
      fetched.instructorMemberProfile ??
      (fetchedRevoked || listRevoked ? undefined : listUser.instructorMemberProfile),
    affiliatedSchoolUserId:
      fetched.affiliatedSchoolUserId ?? listUser.affiliatedSchoolUserId,
    affiliatedSchoolName: fetched.affiliatedSchoolName ?? listUser.affiliatedSchoolName,
    affiliation: resolveMergedAffiliation(listUser, fetched),
    detailAddress: resolveMergedDetailAddress(listUser, fetched),
    detailAddressDetail: resolveMergedDetailAddressDetail(listUser, fetched),
    bio: resolveMergedBio(listUser, fetched),
    instructorCareerText: resolveMergedInstructorTextField(listUser, fetched, 'instructorCareerText'),
    instructorSelfIntroduction: resolveMergedInstructorTextField(
      listUser,
      fetched,
      'instructorSelfIntroduction'
    ),
    instructorApprovalStatus:
      fetched.instructorApprovalStatus ?? listUser.instructorApprovalStatus,
    listMetrics: resolveMergedListMetrics(listUser, fetched),
    name: resolveMergedDisplayName(listUser, fetched, role),
  }
}

/**
 * PATCH 응답·마스킹 GET 위에 폼에서 저장한 값을 반영한다.
 * unmask 세션 직후 저장 시 API `"마스킹"` placeholder가 덮어쓰지 않도록 patch 값을 우선한다.
 */
export function applySavedBasicInfoPatchToUser(
  user: Omit<User, 'password'>,
  patch: PatchUserBasicInfoInput
): Omit<User, 'password'> {
  const next: Omit<User, 'password'> = { ...user }

  if (patch.name !== undefined) next.name = patch.name
  if (patch.phone !== undefined) next.phone = patch.phone
  if (patch.email !== undefined) next.email = patch.email
  if (patch.detailAddress !== undefined) next.detailAddress = patch.detailAddress
  if (Object.prototype.hasOwnProperty.call(patch, 'detailAddressDetail')) {
    const detail = patch.detailAddressDetail?.trim()
    next.detailAddressDetail = detail || undefined
  }
  if (patch.affiliation !== undefined) next.affiliation = patch.affiliation
  if (patch.schoolEnrollmentStatus !== undefined) {
    next.schoolEnrollmentStatus = patch.schoolEnrollmentStatus
  }
  if (patch.gender !== undefined) next.gender = patch.gender
  if (patch.birthDate !== undefined) next.birthDate = patch.birthDate
  if (patch.socialAccounts !== undefined) next.socialAccounts = patch.socialAccounts
  if (Object.prototype.hasOwnProperty.call(patch, 'adminComment')) {
    next.adminComment = patch.adminComment
  }

  if (patch.bio !== undefined) {
    const bio = patch.bio.trim()
    next.bio = bio || undefined
  }

  if (patch.schoolInfo) {
    next.schoolInfo = { ...next.schoolInfo, ...patch.schoolInfo }
  }

  if (patch.instructorInfo) {
    next.instructorInfo = {
      ...next.instructorInfo,
      ...patch.instructorInfo,
    } as NonNullable<User['instructorInfo']>
  }

  if (patch.instructorCertifications != null) {
    next.instructorCertifications = patch.instructorCertifications
      .map(row => {
        const name = row.certificationName?.trim()
        if (!name) return null
        return {
          ...(row.id != null ? { id: row.id } : {}),
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
  }

  if (patch.instructorCmsProfile) {
    next.instructorCmsProfile = patch.instructorCmsProfile
    if (patch.instructorCmsProfile.essays.freeWrite1) {
      next.instructorSelfIntroduction = patch.instructorCmsProfile.essays.freeWrite1
    }
    if (patch.instructorCmsProfile.oneLineIntro) {
      next.bio = patch.instructorCmsProfile.oneLineIntro
    }
    if (patch.instructorCmsProfile.instructorCareerSummary ?? patch.instructorCmsProfile.career.summaryYears) {
      next.instructorCareerText =
        patch.instructorCmsProfile.instructorCareerSummary ??
        patch.instructorCmsProfile.career.summaryYears
    }
  }

  if (patch.instructorCmsSettlement) {
    next.instructorCmsSettlement = patch.instructorCmsSettlement
    next.instructorInfo = {
      ...next.instructorInfo,
      bankName: patch.instructorCmsSettlement.bankName ?? next.instructorInfo?.bankName ?? '',
      accountNumber:
        patch.instructorCmsSettlement.accountNumber ?? next.instructorInfo?.accountNumber ?? '',
      accountHolder:
        patch.instructorCmsSettlement.accountHolder ?? next.instructorInfo?.accountHolder ?? '',
      isBusinessIncome:
        patch.instructorCmsSettlement.businessIncome ?? next.instructorInfo?.isBusinessIncome ?? false,
    } as NonNullable<User['instructorInfo']>
  }

  if (patch.listMetrics) {
    next.listMetrics = resolveMergedListMetrics(next, next, patch.listMetrics)
    const careerSummary = patch.listMetrics.instructorCareerSummaryLabel?.trim()
    if (careerSummary && !isInstructorMaskedPlaceholder(careerSummary)) {
      const careerDisplay = formatInstructorCareerDisplay(careerSummary) ?? careerSummary
      next.listMetrics = {
        ...next.listMetrics,
        instructorCareerSummaryLabel: careerDisplay,
        instructorCareerYearsLabel:
          next.listMetrics?.instructorCareerYearsLabel &&
          !isInstructorMaskedPlaceholder(next.listMetrics.instructorCareerYearsLabel)
            ? next.listMetrics.instructorCareerYearsLabel
            : careerDisplay,
      }
      next.instructorCareerText = careerDisplay.replace(/년$/, '') || careerSummary
    }
  }

  if (patch.termsAgreements != null) {
    next.termsAgreements = mergeTermsAgreementRowsFromPatch(
      next.termsAgreements,
      patch.termsAgreements
    )
  }

  return next
}

/** 목록 infinite query 페이지에서 memberId·uuid로 행을 찾아 상세/등록 결과를 merge한다. */
export function patchMemberListPagesWithFetchedDetail<
  TPage extends { users: Omit<User, 'password'>[] },
>(
  old: InfiniteData<TPage> | undefined,
  fetched: Omit<User, 'password'>
): InfiniteData<TPage> | undefined {
  if (!old?.pages?.length) return old

  let found = false
  const pages = old.pages.map(page => ({
    ...page,
    users: page.users.map(user => {
      const matches =
        user.id === fetched.id ||
        (fetched.memberId != null && user.memberId === fetched.memberId)
      if (!matches) return user
      found = true
      return mergeListUserWithFetchedDetail(user, fetched)
    }),
  }))

  if (!found) {
    pages[0] = {
      ...pages[0],
      users: [fetched, ...pages[0].users],
    }
  }

  return { ...old, pages }
}

function omitUndefinedMetrics(
  metrics: User['listMetrics'] | undefined
): User['listMetrics'] | undefined {
  if (!metrics) return undefined
  const next: NonNullable<User['listMetrics']> = {}
  for (const [key, value] of Object.entries(metrics) as Array<
    [keyof NonNullable<User['listMetrics']>, unknown]
  >) {
    if (value === undefined || value === null) continue
    if (typeof value === 'string' && !value.trim()) continue
    ;(next as Record<string, unknown>)[key as string] = value
  }
  return Object.keys(next).length > 0 ? next : undefined
}
