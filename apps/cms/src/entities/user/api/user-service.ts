/**
 * 사용자 관리 API 서비스 (Mock + Remote 분기)
 * Phase 5.1.2: 사용자 관리 페이지
 */

import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'
import {
  getAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { matchesUserInstitutionLocation } from '@/entities/user/lib/matches-institution-location'
import {
  matchesInstructorJaEvaluationGradeFilter,
  matchesInstructorSettlementFilter,
} from '@/entities/user/lib/matches-instructor-list-filters'
import { applyInstructorPermissionRevokedToUser } from '@/features/user/shared/lib/apply-instructor-permission-revoked'
import {
  isInstructorPermissionRevoked,
  matchesAllTabRoleFilter,
} from '@/features/user/shared/lib/member-list-display'
import { markInstructorPermissionRevoked } from '@/features/user/shared/lib/revoked-instructor-overlay'
import {
  canAssignUserProgramRoleForProgram,
  PROGRAM_PM_ROLE_LIMIT_MESSAGE,
} from '@/entities/program/lib/program-pm-role-policy'
import { mockUsers } from '@/data/mock/users'
import { mockUserHistories } from '@/data/mock/mypage'
import type { UUID } from '@/types/index'
import {
  isAdminPermissionVariantPatchRemoteEnabled,
  isMemberBasicInfoPatchRemoteEnabled,
  isMembersRemoteEnabled,
} from '@/features/user/api/member-remote-capabilities'
import { mapMemberListItems } from '@/features/user/api/map-member-list-item'
import {
  mapSchoolOrganizationToUser,
  mapSchoolOrganizationsToUsers,
  parseOrganizationIdFromUserId,
  shouldFetchSchoolOrganizationDetail,
} from '@/features/user/api/map-school-organization-to-user'
import {
  instructorListRolesExactAnyOf,
  rolesExactAnyOfForAllTabRoleFilter,
  type AllTabRoleFilterValue,
} from '@/features/user/api/map-roles-exact-any-of'
import {
  applySavedBasicInfoPatchToUser,
  mergeListUserWithFetchedDetail,
} from '@/features/user/api/merge-list-user-with-detail'
import { mergeTermsAgreementRowsFromPatch } from '@/features/user/api/member-basic-info-terms-patch'
import {
  mapIndividualMemberDetailToUser,
  mapInstructorMemberDetailToUser,
  mapTeacherMemberDetailToUser,
  mapMemberDetailToUser,
  mapSchoolMemberDetailToUser,
} from '@/features/user/api/map-member-detail-to-user'
import {
  mapCreateUserRequestToCreateSchool,
  mapCreateUserRequestToPreRegisterIndividual,
  mapCreateUserRequestToPreRegisterInstructor,
} from '@/features/user/api/map-pre-register-request'
import { mergeInstructorGradesFromCreateRequestIntoUser } from '@/features/user/api/map-instructor-cms-profile'
import { resolveAdminProvisionedTempPassword } from '@/features/user/lib/admin-provisioned-temp-password'
import { toApiBirthDate, toApiGender } from '@/features/user/api/map-member-gender-birth'
import {
  mapIsActiveToMemberStatus,
  mapUserRoleToApiRole,
  resolveInstructorMemberProfileHint,
} from '@/features/user/api/map-member-role'
import {
  bulkDeleteAdminsRemote,
  bulkDeleteAllAccountsRemote,
  bulkDeleteMembersRemote,
  bulkDeleteSchoolsRemote,
  changeAdminAccountRoleRemote,
  createAdminAccountRemote,
  createSchoolOrganizationRemote,
  deleteMemberRemote,
  deleteAdminAccountRemote,
  deleteSchoolRemote,
  fetchAdminsPageRemote,
  fetchIndividualMemberDetailRemote,
  fetchInstructorMemberDetailRemote,
  fetchMemberDetailRemote,
  fetchMemberExternalIdentifiersRemote,
  fetchMembersPageRemote,
  fetchSchoolMemberDetailRemote,
  fetchSchoolOrganizationRemote,
  fetchSchoolsPageRemote,
  fetchTeacherMemberDetailRemote,
  preRegisterIndividualRemote,
  preRegisterInstructorRemote,
  revokeInstructorPermissionRemote,
  updateMemberBasicInfoRemote,
  updateAdminBasicInfoRemote,
  upsertMemberAdminCommentRemote,
} from '@/features/user/api/members-api-client'
import { fetchAllAccountsDirectoryPage } from '@/features/user/api/fetch-all-accounts-directory-page'
import {
  collectAdminAccountIds,
  collectMemberIds,
  collectOrganizationIds,
  toAccountDirectoryBulkDeleteTargets,
} from '@/features/user/api/partition-users-for-bulk-delete'
import type { MemberListKind } from '@/shared/config/member-list-kinds'
import { adminPermissionFeeGradeToRoleCode } from '@/features/user/api/admin-approval-role'
import type { InstructorCertificationUpsertRequest } from '@/shared/api/generated/members/schemas/instructorCertificationUpsertRequest'
import type { AdminTermsAgreementRequest } from '@/shared/api/generated/members/schemas/adminTermsAgreementRequest'
import type { TermsAgreementRequest } from '@/shared/api/generated/members/schemas/termsAgreementRequest'
import { resolvePreRegisterTermsAgreementVersions } from '@/features/user/api/resolve-pre-register-terms-agreement-versions'
import { attachFilledDocumentsToTermsAgreements } from '@/features/user/api/attach-filled-documents'
import type { MemberRegisterConsentWriteSnapshots } from '@/features/user/shared/lib/member-register-consent-write-snapshot'
import { MEMBER_DETAIL_SCREEN_CODE } from '@/features/user/api/map-member-comments'
import {
  hasAdminCommentPatch,
  isAdminCommentOnlyPatch,
  mapPatchUserBasicInfoToAdminAccountApiRequest,
  mapPatchUserBasicInfoToApiRequest,
} from '@/features/user/api/map-patch-user-basic-info'
import { resolve1365IdFromExternalIdentifiers } from '@/features/user/api/map-external-identifiers'
import { resolveMemberIdForApi } from '@/features/user/api/member-id-registry'
import { probeMemberDetailAsUser } from '@/features/user/api/probe-member-detail-as-user'
import {
  fetchAdminMemberDetailAsUser,
  isAdminMemberDetailRole,
  parseAdminAccountIdFromUserId,
  resolveAdminAccountIdForDetail,
  shouldUseAdminAccountDetailApi,
} from '@/features/user/api/fetch-admin-member-detail'
import { mapAdminAccountListItems } from '@/features/user/api/map-admin-account-list-item-to-user'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'

/**
 * 사용자 목록 조회
 */
export async function getUsers(filters?: {
  role?: UserRole
  allTabRoleFilter?: AllTabRoleFilterValue | 'ALL'
  search?: string
  isActive?: boolean
  createdAtFrom?: string
  createdAtTo?: string
  institutionLocation?: string
  jaEvaluationGrade?: string
  settlementStatus?: string
  adminPermissionVariant?: AdminPermissionTagVariant
  rolesExactAnyOf?: string
  regionSido?: string
  regionSigungu?: string
  /**
   * @deprecated 목록은 `rolesExactAnyOf` 사용. 프로그램 후보 조회 호환용 —
   * mock에서는 활성 강사(교사겸 포함)만 남긴다.
   */
  instructorListPureOnly?: boolean
}): Promise<Omit<User, 'password'>[]> {
  await new Promise(resolve => setTimeout(resolve, 300))

  let users = [...mockUsers]

  if (filters?.allTabRoleFilter && filters.allTabRoleFilter !== 'ALL') {
    users = users.filter(user => matchesAllTabRoleFilter(user, filters.allTabRoleFilter!))
  } else if (filters?.role) {
    users = users.filter(user => user.role === filters.role)
  }

  if (filters?.instructorListPureOnly) {
    // 활성 강사(교사겸 포함). 권한박탈 제외 — dual 제외하던 FE 후처리 제거
    users = users.filter(
      user => !isInstructorPermissionRevoked(user) && user.role === 'INSTRUCTOR'
    )
  }

  // 검색 필터 (이름, 이메일)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    users = users.filter(
      user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    )
  }

  // 활성화 상태 필터
  if (filters?.isActive !== undefined) {
    users = users.filter(user => user.isActive === filters.isActive)
  }

  // 가입일 필터
  if (filters?.createdAtFrom || filters?.createdAtTo) {
    users = users.filter(user => {
      const created = user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : ''
      if (filters.createdAtFrom && created < filters.createdAtFrom) return false
      if (filters.createdAtTo && created > filters.createdAtTo) return false
      return true
    })
  }

  if (filters?.institutionLocation?.trim()) {
    users = users.filter(user => matchesUserInstitutionLocation(user, filters.institutionLocation!))
  }

  if (filters?.jaEvaluationGrade?.trim()) {
    users = users.filter(user =>
      matchesInstructorJaEvaluationGradeFilter(user, filters.jaEvaluationGrade!)
    )
  }

  if (filters?.settlementStatus?.trim()) {
    users = users.filter(user => matchesInstructorSettlementFilter(user, filters.settlementStatus!))
  }

  if (filters?.adminPermissionVariant) {
    const v = filters.adminPermissionVariant
    users = users.filter(
      user => user.role === 'ADMIN' && getAdminPermissionVariant(user) === v
    )
  }

  // 비밀번호 제외하고 반환, participationHistory 계산
  users.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bTime - aTime
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return users.map(({ password, ...user }) => {
    // 실제 참여이력 데이터에서 계산
    const userHistories = mockUserHistories.filter(
      h => h.userId === user.id && h.finalStatus !== 'CANCELLED'
    )
    return {
      ...user,
      participationHistory: userHistories.length,
    }
  })
}

export interface GetUsersPageParams {
  role?: UserRole
  /** 전체 회원 탭 — `GET /api/admin/members/all` */
  listAllAccounts?: boolean
  /** 전체 회원 탭 유형 필터 */
  allTabRoleFilter?: AllTabRoleFilterValue | 'ALL'
  /** 전체 회원 디렉터리 — MEMBER / ADMIN_ACCOUNT */
  accountType?: 'MEMBER' | 'ADMIN_ACCOUNT'
  search?: string
  isActive?: boolean
  createdAtFrom?: string
  createdAtTo?: string
  institutionLocation?: string
  regionSido?: string
  regionSigungu?: string
  jaEvaluationGrade?: string
  settlementStatus?: string
  adminPermissionVariant?: AdminPermissionTagVariant
  rolesExactAnyOf?: string
  /** @deprecated use rolesExactAnyOf */
  instructorListPureOnly?: boolean
}

export interface GetUsersPageResult {
  users: Omit<User, 'password'>[]
  total: number
  hasMore: boolean
  nextPageParam?: number
}

const PAGE_SIZE = 15

/**
 * 사용자 목록 페이지 조회 (무한 스크롤용)
 * 필터 적용 후 offset/limit 슬라이스 반환
 */
export async function getUsersPage(
  filters: GetUsersPageParams | undefined,
  pageParam = 0
): Promise<GetUsersPageResult> {
  if (isMembersRemoteEnabled()) {
    try {
      const apiFilters = filters ?? {}
      const page = pageParam

      if (apiFilters.listAllAccounts) {
        return fetchAllAccountsDirectoryPage(
          {
            search: apiFilters.search,
            createdAtFrom: apiFilters.createdAtFrom,
            createdAtTo: apiFilters.createdAtTo,
            accountType: apiFilters.accountType,
            allTabRoleFilter: apiFilters.allTabRoleFilter,
          },
          page,
          PAGE_SIZE
        )
      }

      if (apiFilters.role === 'ADMIN') {
        const res = await fetchAdminsPageRemote({
          keyword: apiFilters.search?.trim() || undefined,
          roleCode: apiFilters.adminPermissionVariant
            ? adminPermissionFeeGradeToRoleCode(apiFilters.adminPermissionVariant)
            : undefined,
          page,
          size: PAGE_SIZE,
        })
        const users = mapAdminAccountListItems(res.items)
        const total = res.totalElements ?? users.length
        const totalPages = res.totalPages ?? 0
        const hasMore = totalPages > 0 ? page + 1 < totalPages : users.length >= PAGE_SIZE
        return { users, total, hasMore }
      }

      if (apiFilters.role === 'SCHOOL') {
        const res = await fetchSchoolsPageRemote({
          keyword: apiFilters.search?.trim() || undefined,
          regionSido: apiFilters.regionSido?.trim() || undefined,
          regionSigungu: apiFilters.regionSigungu?.trim() || undefined,
          createdAtFrom: apiFilters.createdAtFrom || undefined,
          createdAtTo: apiFilters.createdAtTo || undefined,
          page,
          size: PAGE_SIZE,
        })
        const users = mapSchoolOrganizationsToUsers(res.items)
        const total = res.totalElements ?? users.length
        const totalPages = res.totalPages ?? 0
        const hasMore = totalPages > 0 ? page + 1 < totalPages : users.length >= PAGE_SIZE
        return { users, total, hasMore }
      }

      const rolesExactAnyOf =
        apiFilters.rolesExactAnyOf?.trim() ||
        (apiFilters.instructorListPureOnly || apiFilters.role === 'INSTRUCTOR'
          ? instructorListRolesExactAnyOf()
          : rolesExactAnyOfForAllTabRoleFilter(apiFilters.role))

      const res = await fetchMembersPageRemote({
        keyword: apiFilters.search?.trim() || undefined,
        ...(rolesExactAnyOf
          ? { rolesExactAnyOf }
          : { role: mapUserRoleToApiRole(apiFilters.role) }),
        memberStatus: mapIsActiveToMemberStatus(apiFilters.isActive),
        createdAtFrom: apiFilters.createdAtFrom || undefined,
        createdAtTo: apiFilters.createdAtTo || undefined,
        instructorType: apiFilters.jaEvaluationGrade?.trim() || undefined,
        settlementStatus: apiFilters.settlementStatus?.trim() || undefined,
        page,
        size: PAGE_SIZE,
      })
      const users = mapMemberListItems(res.items)
      const total = res.totalElements ?? users.length
      const totalPages = res.totalPages ?? 0
      const hasMore = totalPages > 0 ? page + 1 < totalPages : users.length >= PAGE_SIZE
      return { users, total, hasMore }
    } catch (error) {
      throw new Error(getMemberApiErrorMessage(error, '회원 목록을 불러오지 못했습니다.'))
    }
  }

  const all = await getUsers(filters)
  const page = typeof pageParam === 'number' ? pageParam : 0
  const offset = page * PAGE_SIZE
  const users = all.slice(offset, offset + PAGE_SIZE)
  return {
    users,
    total: all.length,
    hasMore: offset + users.length < all.length,
  }
}

/**
 * 사용자 상세 조회
 */
export type PatchUserBasicInfoInput = Partial<
  Pick<
    User,
    | 'name'
    | 'nameEn'
    | 'phone'
    | 'email'
    | 'detailAddress'
    | 'detailAddressDetail'
    | 'affiliation'
    | 'gender'
    | 'birthDate'
    | 'socialAccounts'
    | 'adminComment'
    | 'bio'
    | 'schoolInfo'
    | 'instructorInfo'
    | 'listMetrics'
  >
> & {
  /** PATCH `instructorInfo.certifications` — 등록·상세 수정 공통 */
  instructorCertifications?: InstructorCertificationUpsertRequest[]
  /** PATCH `profile` — CMS 강사 구조체 (§3.8) */
  instructorCmsProfile?: import('@/features/user/api/types/instructor-cms-profile-proposal').InstructorCmsProfileProposal
  /** PATCH `settlement` */
  instructorCmsSettlement?: import('@/features/user/api/types/instructor-cms-profile-proposal').InstructorCmsSettlement
  /** PATCH `termsAgreements` — 약관·동의 여부 수정 */
  termsAgreements?: TermsAgreementRequest[]
  /** 이번 세션에서 재작성한 동의서 본문 — wire에 안 실리고 attach 후 제거 */
  consentWriteSnapshots?: MemberRegisterConsentWriteSnapshots
  /**
   * 개인 회원 GET·pre-register `enrollmentStatus`.
   * 있을 때만 PATCH extras(`schoolName`/`enrollmentStatus`)를 붙인다 — 강사 `affiliation`과 분리.
   */
  schoolEnrollmentStatus?: User['schoolEnrollmentStatus']
  /** 개인 회원 GET·pre-register `schoolName` (기관명만, 학년 파이프 없음) */
  individualSchoolName?: string
  /** 개인 회원 학년 — extra `grade` (GET·pre-register 전용 필드 없음) */
  individualGrade?: string
  /** 재학 중 CMS 학교 PK — wire extension */
  individualSchoolOrganizationId?: number | null
  /** NEIS/CareerNet 검색 메타 — CMS PK 없을 때 schoolSelection */
  individualSchoolProvider?: string
  individualSchoolExternalCode?: string
  individualSchoolLevel?: string
  individualSchoolAddress?: string
  individualSchoolZipcode?: string
  individualSchoolRegionSido?: string
  individualSchoolRegionSigungu?: string
}

/** 코멘트 전용 저장 시 상세 GET·코멘트 목록 GET을 줄이기 위한 힌트 */
export type PatchUserBasicInfoOptions = {
  knownRole?: UserRole
  memberId?: number
  organizationId?: number
  existingCommentId?: number
  /** 코멘트만 저장 후 이 객체를 기준으로 반환 (추가 상세 GET 생략) */
  baseUser?: Omit<User, 'password'>
}

function isAdminPermissionVariantOnlyPatch(patch: PatchUserBasicInfoInput): boolean {
  const keys = Object.keys(patch) as (keyof PatchUserBasicInfoInput)[]
  if (keys.length !== 1 || keys[0] !== 'listMetrics' || !patch.listMetrics) return false
  const metricKeys = Object.keys(patch.listMetrics)
  return (
    metricKeys.length === 1 &&
    metricKeys[0] === 'adminPermissionVariant' &&
    (patch.listMetrics.adminPermissionVariant === 'manager' ||
      patch.listMetrics.adminPermissionVariant === 'partner' ||
      patch.listMetrics.adminPermissionVariant === 'viewer')
  )
}

async function mergeUserFromApiResponse(
  userId: UUID,
  response: Awaited<ReturnType<typeof updateMemberBasicInfoRemote>>,
  patch?: PatchUserBasicInfoInput,
  baseUser?: Omit<User, 'password'>
): Promise<Omit<User, 'password'>> {
  const mapped = mapMemberListItems([response])[0]
  if (!mapped) {
    throw new Error('회원 정보 수정 응답을 처리하지 못했습니다.')
  }

  const existing = baseUser ?? (await getUserById(userId))
  if (!existing) {
    return patch ? applySavedBasicInfoPatchToUser(mapped, patch) : mapped
  }

  let merged = mergeListUserWithFetchedDetail(existing, mapped)
  if (patch) {
    merged = applySavedBasicInfoPatchToUser(merged, patch)
  }
  return merged
}

async function patchAdminUserBasicInfoRemote(
  userId: UUID,
  existing: Omit<User, 'password'>,
  patch: PatchUserBasicInfoInput,
  options?: PatchUserBasicInfoOptions
): Promise<Omit<User, 'password'>> {
  const adminId =
    existing.adminAccountId ?? (await resolveAdminAccountIdForDetail(userId))

  if (isAdminPermissionVariantOnlyPatch(patch)) {
    return patchAdminPermissionVariantRemote(userId, patch.listMetrics!.adminPermissionVariant!)
  }

  const memberId = options?.memberId ?? existing.memberId
  if (memberId != null && hasAdminCommentPatch(patch)) {
    const comment = patch.adminComment?.trim()
    if (comment) {
      await upsertMemberAdminCommentRemote(memberId, comment, {
        existingCommentId: options?.existingCommentId,
        screenCode: MEMBER_DETAIL_SCREEN_CODE,
      })
    }
  }

  const { adminComment: _adminComment, listMetrics, ...patchWithoutCommentAndMetrics } = patch
  let resolvedTerms = patchWithoutCommentAndMetrics.termsAgreements
  if (resolvedTerms != null && resolvedTerms.length > 0) {
    resolvedTerms = await resolvePreRegisterTermsAgreementVersions(resolvedTerms)
    resolvedTerms = await attachFilledDocumentsToTermsAgreements(resolvedTerms, {
      mode: 'patch',
      snapshots: patch.consentWriteSnapshots,
      memberId: options?.memberId ?? existing.memberId,
    })
  }
  const patchForAdminBody: PatchUserBasicInfoInput = {
    ...patchWithoutCommentAndMetrics,
    ...(resolvedTerms != null ? { termsAgreements: resolvedTerms } : {}),
  }
  const body = mapPatchUserBasicInfoToAdminAccountApiRequest(patchForAdminBody)
  const hasBasicBody = Object.keys(body).length > 0

  const permVariant = listMetrics?.adminPermissionVariant
  if (
    permVariant === 'manager' ||
    permVariant === 'partner' ||
    permVariant === 'viewer'
  ) {
    const current = getAdminPermissionVariant(existing)
    if (permVariant !== current) {
      await changeAdminAccountRoleRemote(adminId, {
        roleCode: adminPermissionFeeGradeToRoleCode(permVariant),
        reason: `CMS 관리자 회원 권한 유형 변경 (${permVariant})`,
      })
    }
  }

  if (!hasBasicBody && !hasAdminCommentPatch(patch) && !listMetrics?.adminPermissionVariant) {
    return existing
  }

  if (hasBasicBody) {
    await updateAdminBasicInfoRemote(adminId, body)
  }

  if (isAdminCommentOnlyPatch(patch)) {
    const comment = patch.adminComment?.trim()
    return {
      ...existing,
      ...(comment ? { adminComment: comment } : { adminComment: undefined }),
    }
  }

  return fetchAdminMemberDetailAsUser(userId, {
    adminAccountId: adminId,
    memberId: existing.memberId,
    email: existing.email,
  })
}

async function patchUserBasicInfoRemote(
  userId: UUID,
  patch: PatchUserBasicInfoInput,
  options?: PatchUserBasicInfoOptions
): Promise<Omit<User, 'password'>> {
  const knownRole = options?.knownRole ?? options?.baseUser?.role

  if (shouldUseAdminAccountDetailApi({ userId }) || knownRole === 'ADMIN') {
    const existing =
      options?.baseUser?.role === 'ADMIN'
        ? options.baseUser
        : await fetchAdminMemberDetailAsUser(userId)
    return patchAdminUserBasicInfoRemote(userId, existing, patch, options)
  }

  let existingForRole: Omit<User, 'password'> | null = options?.baseUser ?? null
  if (!knownRole && !existingForRole) {
    try {
      existingForRole = await getUserById(userId)
    } catch {
      existingForRole = null
    }
  }
  if ((knownRole ?? existingForRole?.role) === 'ADMIN') {
    const existing =
      existingForRole ?? (await fetchAdminMemberDetailAsUser(userId))
    return patchAdminUserBasicInfoRemote(userId, existing, patch, options)
  }

  const role = knownRole ?? existingForRole?.role
  if (role === 'SCHOOL') {
    const organizationId =
      options?.organizationId ??
      options?.baseUser?.organizationId ??
      existingForRole?.organizationId ??
      parseOrganizationIdFromUserId(userId)

    if (organizationId != null) {
      if (hasAdminCommentPatch(patch)) {
        const comment = patch.adminComment?.trim()
        if (comment) {
          await upsertMemberAdminCommentRemote(organizationId, comment, {
            existingCommentId: options?.existingCommentId,
            screenCode: MEMBER_DETAIL_SCREEN_CODE,
          })
        }
      }

      if (isAdminCommentOnlyPatch(patch)) {
        const base =
          options?.baseUser ??
          existingForRole ??
          (await getUserById(userId).catch(() => null))
        if (!base) throw new Error('사용자를 찾을 수 없습니다.')
        return {
          ...base,
          adminComment: patch.adminComment?.trim() || base.adminComment,
        }
      }
    }
  }

  const memberId = options?.memberId ?? resolveMemberIdForApi(userId, options)
  try {
    if (hasAdminCommentPatch(patch)) {
      const comment = patch.adminComment?.trim()
      if (comment) {
        await upsertMemberAdminCommentRemote(memberId, comment, {
          existingCommentId: options?.existingCommentId,
          screenCode: MEMBER_DETAIL_SCREEN_CODE,
        })
      }
    }

    const { adminComment: _adminComment, ...patchWithoutComment } = patch
    let resolvedTerms = patchWithoutComment.termsAgreements
    if (resolvedTerms != null && resolvedTerms.length > 0) {
      resolvedTerms = await resolvePreRegisterTermsAgreementVersions(resolvedTerms)
      resolvedTerms = await attachFilledDocumentsToTermsAgreements(resolvedTerms, {
        mode: 'patch',
        snapshots: patch.consentWriteSnapshots,
        memberId,
      })
    }
    const patchWithResolvedTerms: PatchUserBasicInfoInput = {
      ...patchWithoutComment,
      ...(resolvedTerms != null ? { termsAgreements: resolvedTerms } : {}),
    }
    const body = mapPatchUserBasicInfoToApiRequest(patchWithResolvedTerms)
    const hasBodyFields = Object.keys(body).length > 0

    if (!hasBodyFields && hasAdminCommentPatch(patch)) {
      const base =
        options?.baseUser ??
        existingForRole ??
        (await getUserById(userId))
      if (!base) {
        throw new Error('사용자를 찾을 수 없습니다.')
      }
      return {
        ...base,
        adminComment: patch.adminComment?.trim() || base.adminComment,
      }
    }

    if (!hasBodyFields) {
      const existing = options?.baseUser ?? existingForRole ?? (await getUserById(userId))
      if (!existing) throw new Error('사용자를 찾을 수 없습니다.')
      return existing
    }

    const response = await updateMemberBasicInfoRemote(memberId, body)
    return mergeUserFromApiResponse(
      userId,
      response,
      {
        ...patch,
        ...(resolvedTerms != null ? { termsAgreements: resolvedTerms } : {}),
      },
      options?.baseUser ?? existingForRole ?? undefined
    )
  } catch (error) {
    throw new Error(getMemberApiErrorMessage(error, '회원 정보 저장에 실패했습니다.'))
  }
}

async function resolveAdminAccountIdForMemberUser(
  user: Pick<User, 'id' | 'email' | 'adminAccountId'>
): Promise<number> {
  if (user.adminAccountId != null && user.adminAccountId > 0) {
    return user.adminAccountId
  }

  const email = user.email?.trim()
  const page = await fetchAdminsPageRemote({
    ...(email ? { keyword: email } : {}),
    page: 0,
    size: 50,
  })
  const items = page.items ?? []
  const idToken = user.id.replace(/^(admin-|member-)/, '')
  const match = items.find(item => {
    if (email && item.email?.trim().toLowerCase() === email.toLowerCase()) return true
    if (item.uuid && (item.uuid === user.id || item.uuid === idToken)) return true
    return false
  })
  if (match?.adminAccountId == null) {
    throw new Error('관리자 계정(adminId)을 찾지 못해 권한 유형을 변경할 수 없습니다.')
  }
  return match.adminAccountId
}

/**
 * 관리자 목록·상세 권한 유형 드롭다운
 * → `PATCH /api/admin/admin-accounts/{adminId}/role` (승인 플로우와 동일)
 *
 * 관리자 목록 행 id 가 member 상세에 없는 경우(admin account id만 존재)에도
 * adminId 로 role PATCH 가 가능하도록 getUserById 실패를 허용한다.
 */
async function patchAdminPermissionVariantRemote(
  userId: UUID,
  variant: AdminPermissionTagVariant
): Promise<Omit<User, 'password'>> {
  try {
    let existing: Omit<User, 'password'> | null = null
    try {
      existing = await getUserById(userId, { role: 'ADMIN' })
    } catch {
      existing = null
    }

    let adminId: number
    const adminIdFromUserId = parseAdminAccountIdFromUserId(userId)
    if (existing?.adminAccountId != null && existing.adminAccountId > 0) {
      adminId = existing.adminAccountId
    } else if (adminIdFromUserId != null) {
      adminId = adminIdFromUserId
    } else if (existing) {
      adminId = await resolveAdminAccountIdForMemberUser(existing)
    } else {
      // 목록 행이 member 상세에 없어도, id 레지스트리·숫자 id 로 admin account PATCH 시도
      let registeredId: number | null = null
      try {
        registeredId = resolveMemberIdForApi(userId)
      } catch {
        registeredId = null
      }
      const raw = String(userId).replace(/^(admin-|member-|admin-account-)/, '')
      const numeric = Number(raw)
      if (registeredId != null && registeredId > 0) {
        adminId = registeredId
      } else if (Number.isFinite(numeric) && numeric > 0) {
        adminId = Math.trunc(numeric)
      } else {
        const page = await fetchAdminsPageRemote({ page: 0, size: 100 })
        const match = (page.items ?? []).find(item => {
          const uuid = item.uuid?.trim()
          if (!uuid) return false
          return uuid === userId || uuid === raw || `admin-${uuid}` === userId
        })
        if (match?.adminAccountId == null) {
          throw new Error('관리자 계정(adminId)을 찾지 못해 권한 유형을 변경할 수 없습니다.')
        }
        adminId = match.adminAccountId
      }
    }

    const roleCode = adminPermissionFeeGradeToRoleCode(variant)
    await changeAdminAccountRoleRemote(adminId, {
      roleCode,
      reason: `CMS 관리자 회원 권한 유형 변경 (${roleCode})`,
    })

    const refreshed = await fetchAdminMemberDetailAsUser(userId, {
      adminAccountId: adminId,
      memberId: existing?.memberId,
      email: existing?.email,
    })

    return {
      ...refreshed,
      registeredByAdmin: Boolean(
        existing?.registeredByAdmin ?? refreshed.registeredByAdmin
      ),
      identitySelfSignupCompletedAfterAdminRegistration: Boolean(
        existing?.identitySelfSignupCompletedAfterAdminRegistration ??
          refreshed.identitySelfSignupCompletedAfterAdminRegistration
      ),
      listMetrics: {
        ...refreshed.listMetrics,
        adminPermissionVariant: variant,
      },
    }
  } catch (error) {
    throw new Error(getMemberApiErrorMessage(error, '관리자 권한 유형 변경에 실패했습니다.'))
  }
}

/** CMS: 관리자 등록 회원 등 기본 정보 일부 수정 (Mock — mockUsers 반영) */
export async function patchUserBasicInfo(
  userId: UUID,
  patch: PatchUserBasicInfoInput,
  options?: PatchUserBasicInfoOptions
): Promise<Omit<User, 'password'>> {
  if (isMembersRemoteEnabled()) {
    if (isAdminPermissionVariantOnlyPatch(patch) && isAdminPermissionVariantPatchRemoteEnabled()) {
      return patchAdminPermissionVariantRemote(userId, patch.listMetrics!.adminPermissionVariant!)
    }
    if (isMemberBasicInfoPatchRemoteEnabled()) {
      return patchUserBasicInfoRemote(userId, patch, options)
    }
    throw new Error('회원 기본정보 수정 API가 아직 제공되지 않습니다.')
  }

  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]
  if (patch.name !== undefined) user.name = patch.name
  if (patch.nameEn !== undefined) user.nameEn = patch.nameEn
  if (patch.phone !== undefined) user.phone = patch.phone
  if (patch.email !== undefined) user.email = patch.email
  if (patch.detailAddress !== undefined) user.detailAddress = patch.detailAddress
  if (Object.prototype.hasOwnProperty.call(patch, 'detailAddressDetail')) {
    const detail = patch.detailAddressDetail?.trim()
    user.detailAddressDetail = detail || undefined
  }
  if (patch.affiliation !== undefined) user.affiliation = patch.affiliation
  if (patch.schoolEnrollmentStatus !== undefined) {
    user.schoolEnrollmentStatus = patch.schoolEnrollmentStatus
  }
  if (patch.gender !== undefined) user.gender = patch.gender
  if (patch.birthDate !== undefined) user.birthDate = patch.birthDate
  if (patch.socialAccounts !== undefined) user.socialAccounts = patch.socialAccounts
  if (Object.prototype.hasOwnProperty.call(patch, 'adminComment')) {
    user.adminComment = patch.adminComment
  }
  if (patch.schoolInfo != null && user.role === 'SCHOOL') {
    const base = user.schoolInfo ?? { schoolName: user.name, address: '' }
    const p = patch.schoolInfo
    user.schoolInfo = {
      ...base,
      ...(p.schoolName !== undefined ? { schoolName: p.schoolName } : {}),
      ...(p.address !== undefined ? { address: p.address } : {}),
      ...(p.position !== undefined ? { position: p.position } : {}),
      ...(p.affiliatedTeachers !== undefined ? { affiliatedTeachers: p.affiliatedTeachers } : {}),
    }
    if (p.schoolName !== undefined && String(p.schoolName).trim() !== '') {
      user.name = String(p.schoolName).trim()
    }
  }
  if (patch.instructorInfo != null && user.role === 'INSTRUCTOR') {
    const base = user.instructorInfo ?? {
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      isBusinessIncome: false,
    }
    const p = patch.instructorInfo
    user.instructorInfo = {
      ...base,
      ...(p.bankName !== undefined ? { bankName: p.bankName } : {}),
      ...(p.accountNumber !== undefined ? { accountNumber: p.accountNumber } : {}),
      ...(p.accountHolder !== undefined ? { accountHolder: p.accountHolder } : {}),
      ...(p.isBusinessIncome !== undefined ? { isBusinessIncome: p.isBusinessIncome } : {}),
    }
  }
  if (patch.listMetrics != null) {
    const prev = user.listMetrics ?? {}
    user.listMetrics = {
      ...prev,
      ...Object.fromEntries(
        Object.entries(patch.listMetrics).filter(([, v]) => v !== undefined)
      ),
    }
  }
  if (patch.termsAgreements != null) {
    user.termsAgreements = mergeTermsAgreementRowsFromPatch(
      user.termsAgreements,
      patch.termsAgreements
    )
  }
  user.updatedAt = new Date().toISOString()

  const refreshed = snapshotUserWithoutPassword(userId)
  if (!refreshed) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }
  return refreshed
}

/** getUserById와 동일 스냅샷 — mockUsers·이력만 반영(추가 왕복 지연 없음) */
function snapshotUserWithoutPassword(userId: UUID): Omit<User, 'password'> | null {
  const user = mockUsers.find(u => u.id === userId)
  if (!user) {
    return null
  }
  const userHistories = mockUserHistories.filter(
    h => h.userId === user.id && h.finalStatus !== 'CANCELLED'
  )
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return {
    ...userWithoutPassword,
    participationHistory: userHistories.length,
  }
}

export async function getUserById(
  userId: UUID,
  options?: {
    memberId?: number
    organizationId?: number
    role?: UserRole
    adminAccountId?: number
    email?: string
    /** 소속 교사(학교 목록) 상세는 `/teacher`, 순수·겸직 강사는 `/instructor` */
    instructorMemberProfile?: User['instructorMemberProfile']
    /** 서버 `roles[]` — 있으면 `/teacher` vs `/instructor` 분기에 우선 */
    roles?: string[]
  }
): Promise<Omit<User, 'password'> | null> {
  if (isMembersRemoteEnabled()) {
    try {
      if (
        shouldUseAdminAccountDetailApi({
          role: options?.role,
          adminAccountId: options?.adminAccountId,
          userId,
        })
      ) {
        return fetchAdminMemberDetailAsUser(userId, options)
      }

      const organizationId =
        options?.organizationId ?? parseOrganizationIdFromUserId(userId) ?? undefined

      if (
        shouldFetchSchoolOrganizationDetail({
          userId,
          role: options?.role,
          organizationId,
        })
      ) {
        if (organizationId != null) {
          return mapSchoolOrganizationToUser(await fetchSchoolOrganizationRemote(organizationId))
        }
        const memberId = resolveMemberIdForApi(userId, options)
        return mapSchoolMemberDetailToUser(await fetchSchoolMemberDetailRemote(memberId), {
          fallbackRole: 'SCHOOL',
        })
      }

      const memberId = resolveMemberIdForApi(userId, options)
      // options.role은 위에서 SCHOOL early-return 후 좁혀질 수 있어 명시 타입 유지
      const role: UserRole | undefined = options?.role

      if (!role) {
        // individual→school→instructor 탐침 1회 + 즉시 매핑 (역할별 GET 재호출 금지)
        return probeMemberDetailAsUser(userId, memberId, {
          adminAccountId: options?.adminAccountId,
          email: options?.email,
        })
      }

      if (
        isAdminMemberDetailRole(role) &&
        shouldUseAdminAccountDetailApi({
          userId,
          adminAccountId: options?.adminAccountId,
        })
      ) {
        return fetchAdminMemberDetailAsUser(userId, {
          memberId: options?.memberId ?? memberId,
          adminAccountId: options?.adminAccountId,
          email: options?.email,
        })
      }

      if (isAdminMemberDetailRole(role)) {
        throw new Error(
          '관리자 회원 상세를 조회하려면 목록 응답에 adminAccountId가 필요합니다.'
        )
      }

      const profileHint = resolveInstructorMemberProfileHint({
        roles: options?.roles,
        instructorMemberProfile: options?.instructorMemberProfile,
      })
      if (
        role === 'INSTRUCTOR' ||
        profileHint === 'school_teacher' ||
        profileHint === 'instructor_dual'
      ) {
        const useTeacherDetail = profileHint === 'school_teacher'
        if (useTeacherDetail) {
          const [detail, externalIdentifiers] = await Promise.all([
            fetchTeacherMemberDetailRemote(memberId),
            fetchMemberExternalIdentifiersRemote(memberId).catch(() => []),
          ])
          const user = mapTeacherMemberDetailToUser(detail, { fallbackRole: 'INSTRUCTOR' })
          const id1365 = resolve1365IdFromExternalIdentifiers(
            externalIdentifiers,
            detail.member?.external1365Id
          )
          if (id1365) user.id1365 = id1365
          return user
        }

        if (role === 'INSTRUCTOR') {
          const [detail, externalIdentifiers] = await Promise.all([
            fetchInstructorMemberDetailRemote(memberId),
            fetchMemberExternalIdentifiersRemote(memberId).catch(() => []),
          ])
          const user = mapInstructorMemberDetailToUser(detail, { fallbackRole: 'INSTRUCTOR' })
          const id1365 = resolve1365IdFromExternalIdentifiers(
            externalIdentifiers,
            detail.member?.external1365Id
          )
          if (id1365) user.id1365 = id1365
          return user
        }
      }

      if (role === 'INDIVIDUAL') {
        const [detail, externalIdentifiers] = await Promise.all([
          fetchIndividualMemberDetailRemote(memberId),
          fetchMemberExternalIdentifiersRemote(memberId).catch(() => []),
        ])
        const user = mapIndividualMemberDetailToUser(detail, { fallbackRole: 'INDIVIDUAL' })
        const id1365 = resolve1365IdFromExternalIdentifiers(
          externalIdentifiers,
          detail.member?.external1365Id
        )
        if (id1365) user.id1365 = id1365
        return user
      }

      const detail = await fetchMemberDetailRemote(memberId)
      const externalIdentifiers = await fetchMemberExternalIdentifiersRemote(memberId).catch(
        () => []
      )
      const user = mapMemberDetailToUser(detail, null, { fallbackRole: role })
      const id1365 = resolve1365IdFromExternalIdentifiers(
        externalIdentifiers,
        detail.external1365Id
      )
      if (id1365) user.id1365 = id1365
      return user
    } catch (error) {
      throw new Error(getMemberApiErrorMessage(error, '회원 상세를 불러오지 못했습니다.'))
    }
  }

  await new Promise(resolve => setTimeout(resolve, 200))
  return snapshotUserWithoutPassword(userId)
}

/**
 * 사용자 권한 변경
 */
export async function updateUserRole(
  userId: UUID,
  newRole: UserRole,
  adminLevel?: AdminLevel,
  programRole?: ProgramRole
): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]
  user.role = newRole

  if (newRole === 'ADMIN') {
    const effectiveAdminLevel = adminLevel || user.adminLevel || 'ADMIN'
    const effectiveProgramRole = programRole || user.programRoles?.['program-1'] || 'ASSISTANT'

    user.adminLevel = effectiveAdminLevel
    user.programRoles = { 'program-1': effectiveProgramRole }
  } else {
    user.adminLevel = undefined
    user.programRoles = undefined
  }

  user.updatedAt = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 사용자 활성화 상태 변경
 */
export async function updateUserStatus(
  userId: UUID,
  isActive: boolean
): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]
  user.isActive = isActive
  user.updatedAt = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 사용자 생성 (관리자용)
 */
export interface CreateUserRequest {
  /** 학교(기관) 등록 등 폼에 이메일이 없으면 생략 — 더미 생성 금지 */
  email?: string
  /**
   * 관리자 사전등록 임시 비밀번호.
   * 계정 아이디(email)가 있으면 `createUser`가 email로 덮어쓴다.
   * email 없는 학교 등록 등에서만 호출부 값을 쓴다.
   */
  password?: string
  name: string
  nameEn?: string
  phone?: string
  gender?: string
  birthDate?: string
  role: UserRole
  adminLevel?: AdminLevel
  programRole?: ProgramRole
  schoolInfo?: {
    schoolName: string
    address: string
    addressDetail?: string
    position?: string
  }
  instructorInfo?: {
    bankName: string
    accountNumber: string
    accountHolder: string
    isBusinessIncome: boolean
  }
  isActive?: boolean
  id1365?: string
  address?: string
  detailAddress?: string
  affiliation?: string
  grade?: string
  schoolEnrollmentStatus?: 'ENROLLED' | 'NOT_ENROLLED'
  /** CMS 등록 학교 PK — 재학 중 pre-register */
  schoolOrganizationId?: number | null
  /** NEIS/CareerNet 학교 검색 메타 — CMS PK 없을 때 schoolSelection */
  schoolProvider?: string
  schoolExternalCode?: string
  schoolLevel?: string
  schoolAddress?: string
  schoolZipcode?: string
  schoolRegionSido?: string
  schoolRegionSigungu?: string
  neisCode?: string
  regionSido?: string
  regionSigungu?: string
  zipCode?: string
  instructorType?: string
  oneLineIntro?: string
  careerText?: string
  selfIntroduction?: string
  /** 강사 사전등록 — 학력 요약(구조화 학력 전용 필드 부재 시) */
  educationLevel?: string
  termsAgreements?: TermsAgreementRequest[]
  adminTermsAgreements?: AdminTermsAgreementRequest[]
  /** 등록 세션 동의서 작성본 — pre-register 직전 filledDocument로 변환 */
  consentWriteSnapshots?: MemberRegisterConsentWriteSnapshots
  certifications?: InstructorCertificationUpsertRequest[]
  /** BE §3.8 — CMS 강사 `profile` 구조체 */
  instructorCmsProfile?: import('@/features/user/api/types/instructor-cms-profile-proposal').InstructorCmsProfileProposal
  /** BE §3.8 — CMS 강사 `settlement` 구조체 */
  instructorCmsSettlement?: import('@/features/user/api/types/instructor-cms-profile-proposal').InstructorCmsSettlement
}

async function fetchCreatedMemberAsUser(
  memberId: number,
  role: UserRole
): Promise<Omit<User, 'password'>> {
  if (role === 'SCHOOL') {
    // legacy: synthetic school member detail (organization create path does not use this)
    return mapSchoolMemberDetailToUser(await fetchSchoolMemberDetailRemote(memberId), {
      fallbackRole: 'SCHOOL',
    })
  }
  if (role === 'INSTRUCTOR') {
    return mapInstructorMemberDetailToUser(await fetchInstructorMemberDetailRemote(memberId), {
      fallbackRole: 'INSTRUCTOR',
    })
  }
  if (role === 'INDIVIDUAL') {
    return mapIndividualMemberDetailToUser(await fetchIndividualMemberDetailRemote(memberId), {
      fallbackRole: 'INDIVIDUAL',
    })
  }
  return mapMemberDetailToUser(await fetchMemberDetailRemote(memberId), null, {
    fallbackRole: role,
  })
}

/**
 * 관리자 사전등록: 계정 아이디(email) = 임시 비밀번호.
 * email이 없으면(학교 등) 호출부 password를 그대로 사용.
 */
function resolveCreateUserPassword(request: CreateUserRequest): string {
  const accountId = request.email?.trim()
  if (accountId) {
    return resolveAdminProvisionedTempPassword(accountId)
  }
  return request.password?.trim() ?? ''
}

async function withResolvedTermsAgreements(
  request: CreateUserRequest
): Promise<CreateUserRequest> {
  if (request.adminTermsAgreements?.length) {
    const adminTermsAgreements = (await resolvePreRegisterTermsAgreementVersions(
      request.adminTermsAgreements
    )) as AdminTermsAgreementRequest[] | undefined
    return { ...request, adminTermsAgreements }
  }
  if (request.termsAgreements?.length) {
    let termsAgreements = (await resolvePreRegisterTermsAgreementVersions(
      request.termsAgreements
    )) as TermsAgreementRequest[] | undefined
    termsAgreements = await attachFilledDocumentsToTermsAgreements(termsAgreements, {
      mode: 'create',
      snapshots: request.consentWriteSnapshots,
    })
    const { consentWriteSnapshots: _snapshots, ...rest } = request
    return { ...rest, termsAgreements }
  }
  return request
}

export async function createUser(request: CreateUserRequest): Promise<Omit<User, 'password'>> {
  const provisionedPassword = resolveCreateUserPassword(request)

  if (isMembersRemoteEnabled()) {
    try {
      const resolvedRequest = await withResolvedTermsAgreements(request)

      if (resolvedRequest.role === 'ADMIN') {
        const adminEmail = resolvedRequest.email?.trim()
        if (!adminEmail) {
          throw new Error('관리자 등록에는 이메일이 필요합니다.')
        }
        const rawPassword = provisionedPassword
        if (!rawPassword) {
          throw new Error('관리자 등록에는 초기 비밀번호가 필요합니다.')
        }
        const termsAgreements = resolvedRequest.adminTermsAgreements
        if (!termsAgreements || termsAgreements.length !== 4) {
          throw new Error(
            '관리자 등록에는 약관 동의 4종(서비스·개인정보·MFA·마케팅)이 필요합니다.'
          )
        }
        const created = await createAdminAccountRemote({
          email: adminEmail,
          rawPassword,
          name: resolvedRequest.name.trim(),
          phone: resolvedRequest.phone?.trim(),
          gender: toApiGender(resolvedRequest.gender),
          birthDate: toApiBirthDate(resolvedRequest.birthDate),
          roleCode: 'VIEWER',
          reason: 'CMS 관리자 회원 신규 등록',
          termsAgreements,
        })
        const adminAccountId = created.adminAccountId
        const uuid = created.uuid?.trim()
        const id =
          uuid ??
          (adminAccountId != null
            ? `admin-account-${adminAccountId}`
            : `admin-account-${Date.now()}`)
        return {
          id,
          adminAccountId,
          email: created.email?.trim() || adminEmail,
          name: created.name?.trim() || resolvedRequest.name,
          phone: resolvedRequest.phone,
          role: 'ADMIN',
          adminLevel: 'ADMIN',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          registeredByAdmin: true,
          listMetrics: { adminPermissionVariant: 'viewer' },
        }
      }

      if (resolvedRequest.role === 'SCHOOL') {
        const createdSchool = await createSchoolOrganizationRemote(
          mapCreateUserRequestToCreateSchool(resolvedRequest)
        )
        return mapSchoolOrganizationToUser(createdSchool)
      }

      const created =
        resolvedRequest.role === 'INSTRUCTOR'
          ? await preRegisterInstructorRemote(
              mapCreateUserRequestToPreRegisterInstructor(resolvedRequest)
            )
          : await preRegisterIndividualRemote(
              mapCreateUserRequestToPreRegisterIndividual(resolvedRequest)
            )

      const memberId = created.memberId
      if (memberId != null && !Number.isNaN(memberId)) {
        const createdUser = await fetchCreatedMemberAsUser(memberId, resolvedRequest.role)
        if (resolvedRequest.role === 'INSTRUCTOR') {
          return mergeInstructorGradesFromCreateRequestIntoUser(
            createdUser,
            resolvedRequest.instructorCmsProfile
          )
        }
        return createdUser
      }
      if (created.memberUuid?.trim()) {
        return {
          id: created.memberUuid.trim(),
          memberId: created.memberId,
          email: resolvedRequest.email?.trim() || '',
          name: resolvedRequest.name,
          role: resolvedRequest.role,
          isActive: resolvedRequest.isActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          registeredByAdmin: true,
        }
      }
      return {
        id: `member-pre-${Date.now()}`,
        email: resolvedRequest.email?.trim() || '',
        name: resolvedRequest.name,
        role: resolvedRequest.role,
        isActive: resolvedRequest.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        registeredByAdmin: true,
      }
    } catch (error) {
      throw new Error(getMemberApiErrorMessage(error, '회원 사전 등록에 실패했습니다.'))
    }
  }

  await new Promise(resolve => setTimeout(resolve, 300))

  // 이메일 중복 체크 (학교 등 email 미입력은 스킵)
  const emailForCreate = request.email?.trim() || ''
  if (emailForCreate) {
    const existingUser = mockUsers.find(u => u.email === emailForCreate)
    if (existingUser) {
      throw new Error('이미 사용 중인 이메일입니다.')
    }
  }

  // UUID 생성
  function generateUUID(): string {
    return `user-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
  }

  const now = new Date().toISOString()

  const newUser: User = {
    id: generateUUID(),
    email: emailForCreate,
    password: provisionedPassword, // 관리자 사전등록: 계정 아이디 = 임시 비밀번호
    name: request.name,
    nameEn: request.nameEn,
    phone: request.phone,
    gender: request.gender,
    birthDate: request.birthDate,
    role: request.role,
    isActive: request.isActive ?? true,
    createdAt: now,
    updatedAt: now,
    /** CMS 관리자 회원 등록 플로우에서 생성 */
    registeredByAdmin: true,
  }

  // 학교(교사) 회원은 별도 권한 승인 절차 없이 가입 즉시 승인 상태
  if (request.role === 'SCHOOL') {
    newUser.permissionApprovalStatus = 'APPROVED'
  }

  // 관리자 권한 설정
  if (request.role === 'ADMIN') {
    newUser.adminLevel = request.adminLevel || 'ADMIN'
    newUser.programRoles = request.programRole
      ? { 'program-1': request.programRole }
      : { 'program-1': 'ASSISTANT' }
  }

  // 학교 정보 설정
  if (request.role === 'SCHOOL' && request.schoolInfo) {
    newUser.schoolInfo = request.schoolInfo
  }

  // 강사 정보 설정
  if (request.role === 'INSTRUCTOR' && request.instructorInfo) {
    newUser.instructorInfo = request.instructorInfo
  }

  if (request.role === 'INSTRUCTOR') {
    const instructorType = request.instructorType?.trim().toUpperCase()
    newUser.instructorMemberProfile =
      instructorType === 'SCHOOL_TEACHER' ? 'school_teacher' : 'instructor_only'
    if (request.instructorCmsProfile) {
      newUser.instructorCmsProfile = request.instructorCmsProfile
    }
    if (request.instructorCmsSettlement) {
      newUser.instructorCmsSettlement = request.instructorCmsSettlement
    }
    const withGrades = mergeInstructorGradesFromCreateRequestIntoUser(
      newUser,
      request.instructorCmsProfile
    )
    newUser.listMetrics = withGrades.listMetrics
    newUser.instructorCmsProfile = withGrades.instructorCmsProfile
  }

  if (request.id1365) {
    newUser.id1365 = request.id1365
  }

  if (request.address || request.detailAddress) {
    newUser.detailAddress = [request.address, request.detailAddress].filter(Boolean).join(' ').trim()
  }

  if (request.affiliation) {
    newUser.affiliation = request.grade
      ? `${request.affiliation} | ${request.grade}`
      : request.affiliation
  }

  // 최신 등록 사용자가 목록 첫 페이지에 보이도록 앞에 추가
  mockUsers.unshift(newUser)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = newUser
  return userWithoutPassword
}

/**
 * 사용자 프로그램 역할 업데이트
 * 프로그램 생성 시 자동으로 OWNER 권한 부여
 */
export async function updateUserProgramRole(
  userId: UUID,
  programId: string,
  programRole: ProgramRole
): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]

  // 관리자가 아니면 프로그램 역할 설정 불가
  if (user.role !== 'ADMIN') {
    throw new Error('관리자만 프로그램 역할을 가질 수 있습니다.')
  }

  if (!canAssignUserProgramRoleForProgram(mockUsers, programId, userId, programRole)) {
    throw new Error(PROGRAM_PM_ROLE_LIMIT_MESSAGE)
  }

  // programRoles가 없으면 초기화
  if (!user.programRoles) {
    user.programRoles = {}
  }

  // 해당 프로그램에 역할 부여
  user.programRoles[programId] = programRole
  user.updatedAt = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 강사 권한 박탈 (Mock — mockUsers 반영 / Remote — revoke API)
 */
export async function revokeInstructorPermission(
  userId: UUID,
  payload: { reason: string; revokeReason?: string },
  options?: { memberId?: number }
): Promise<Omit<User, 'password'>> {
  if (isMembersRemoteEnabled()) {
    const memberId = resolveMemberIdForApi(userId, options)
    await revokeInstructorPermissionRemote(memberId, {
      reason: payload.reason,
      revokeReason: payload.revokeReason ?? payload.reason,
    })
    const refreshed = await getUserById(userId, { memberId })
    if (!refreshed) {
      throw new Error('강사 권한 박탈 후 회원 정보를 불러오지 못했습니다.')
    }
    const revoked = applyInstructorPermissionRevokedToUser({
      ...refreshed,
      instructorApprovalStatus: 'REVOKED',
    })
    markInstructorPermissionRevoked(revoked)
    return revoked
  }

  await new Promise(resolve => setTimeout(resolve, 200))
  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const current = mockUsers[userIndex]
  if (current.role !== 'INSTRUCTOR') {
    throw new Error('강사 회원만 권한을 박탈할 수 있습니다.')
  }

  const { password: _password, ...withoutPassword } = current
  const revoked = applyInstructorPermissionRevokedToUser(withoutPassword)
  mockUsers[userIndex] = {
    ...current,
    ...revoked,
    password: current.password,
    updatedAt: new Date().toISOString(),
  }
  markInstructorPermissionRevoked(revoked)

  const snapshot = snapshotUserWithoutPassword(userId)
  if (!snapshot) {
    throw new Error('강사 권한 박탈 후 회원 정보를 불러오지 못했습니다.')
  }
  return snapshot
}

/**
 * 사용자 삭제
 */
export async function deleteUser(
  userId: UUID,
  reason = 'CMS 관리자 회원 삭제',
  options?: {
    memberId?: number
    adminAccountId?: number
    organizationId?: number
    role?: UserRole
    email?: string
  }
): Promise<void> {
  if (isMembersRemoteEnabled()) {
    try {
      if (options?.role === 'SCHOOL') {
        const organizationId =
          options.organizationId ?? parseOrganizationIdFromUserId(userId)
        if (organizationId == null) {
          throw new Error('학교 organization id가 없습니다.')
        }
        await deleteSchoolRemote(organizationId, { reason })
        return
      }

      if (
        shouldUseAdminAccountDetailApi({
          role: options?.role,
          adminAccountId: options?.adminAccountId,
          userId,
        })
      ) {
        const adminId =
          options?.adminAccountId ??
          (await resolveAdminAccountIdForDetail(userId, options))
        await deleteAdminAccountRemote(adminId, { reason })
        return
      }

      const memberId = resolveMemberIdForApi(userId, options)
      await deleteMemberRemote(memberId, { reason })
      return
    } catch (error) {
      throw new Error(getMemberApiErrorMessage(error, '회원 삭제에 실패했습니다.'))
    }
  }

  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  mockUsers.splice(userIndex, 1)
}

const DEFAULT_DELETE_REASON = 'CMS 관리자 회원 삭제'

/**
 * 목록 탭별 일괄·단건 삭제 (remote). mock에서는 단건 `deleteUser` 루프.
 */
export async function deleteUsersByListKind(
  users: Omit<User, 'password'>[],
  listKind: MemberListKind,
  reason = DEFAULT_DELETE_REASON
): Promise<void> {
  if (users.length === 0) return

  if (!isMembersRemoteEnabled()) {
    for (const u of users) {
      await deleteUser(u.id, reason, {
        role: u.role,
        memberId: u.memberId,
        adminAccountId: u.adminAccountId,
        organizationId: u.organizationId ?? parseOrganizationIdFromUserId(u.id),
        email: u.email,
      })
    }
    return
  }

  try {
    if (listKind === 'all') {
      await bulkDeleteAllAccountsRemote({
        targets: toAccountDirectoryBulkDeleteTargets(users),
        reason,
      })
      return
    }

    if (listKind === 'admins') {
      if (users.length === 1) {
        const u = users[0]
        await deleteUser(u.id, reason, {
          role: u.role,
          adminAccountId: u.adminAccountId,
          email: u.email,
        })
        return
      }
      await bulkDeleteAdminsRemote({ ids: collectAdminAccountIds(users), reason })
      return
    }

    if (listKind === 'institutions') {
      if (users.length === 1) {
        const u = users[0]
        await deleteUser(u.id, reason, {
          role: 'SCHOOL',
          organizationId: u.organizationId ?? parseOrganizationIdFromUserId(u.id),
          email: u.email,
        })
        return
      }
      await bulkDeleteSchoolsRemote({ ids: collectOrganizationIds(users), reason })
      return
    }

    if (users.length === 1) {
      const u = users[0]
      await deleteUser(u.id, reason, {
        role: u.role,
        memberId: u.memberId,
        email: u.email,
      })
      return
    }

    await bulkDeleteMembersRemote({ ids: collectMemberIds(users), reason })
  } catch (error) {
    throw new Error(getMemberApiErrorMessage(error, '회원 삭제에 실패했습니다.'))
  }
}
