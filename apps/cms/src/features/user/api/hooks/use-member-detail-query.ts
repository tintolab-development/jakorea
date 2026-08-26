import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  mapIndividualMemberDetailToUser,
  mapInstructorMemberDetailToUser,
  mapMemberDetailToUser,
  mapSchoolMemberDetailToUser,
  mapTeacherMemberDetailToUser,
} from '@/features/user/api/map-member-detail-to-user'
import {
  fetchIndividualMemberDetailRemote,
  fetchInstructorMemberDetailRemote,
  fetchMemberConsentRecordsRemote,
  fetchMemberDetailRemote,
  fetchMemberExternalIdentifiersRemote,
  fetchSchoolMemberDetailRemote,
  fetchSchoolOrganizationRemote,
  fetchTeacherMemberDetailRemote,
} from '@/features/user/api/members-api-client'
import {
  mapSchoolOrganizationToUser,
  parseOrganizationIdFromUserId,
  shouldFetchSchoolOrganizationDetail,
} from '@/features/user/api/map-school-organization-to-user'
import {
  fetchAdminMemberDetailAsUser,
  isAdminMemberDetailRole,
  shouldUseAdminAccountDetailApi,
} from '@/features/user/api/fetch-admin-member-detail'
import { resolve1365IdFromExternalIdentifiers } from '@/features/user/api/map-external-identifiers'
import { resolveInstructorMemberProfileHint } from '@/features/user/api/map-member-role'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { resolveMemberIdForApi } from '@/features/user/api/member-id-registry'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { probeMemberDetailAsUser } from '@/features/user/api/probe-member-detail-as-user'
import type { User, UserRole } from '@/types/user'

export type MemberDetailQueryOptions = {
  role?: UserRole
  memberId?: number
  organizationId?: number
  adminAccountId?: number
  email?: string
  instructorMemberProfile?: User['instructorMemberProfile']
  roles?: string[]
}

export function memberDetailQueryOptions(
  userId: string,
  options?: MemberDetailQueryOptions
) {
  const instructorProfileHint = resolveInstructorMemberProfileHint({
    roles: options?.roles,
    instructorMemberProfile: options?.instructorMemberProfile,
  })

  return queryOptions({
    queryKey: isMembersRemoteEnabled()
      ? [
          ...memberQueryKeys.detailByUuid(userId),
          options?.role ?? 'auto',
          options?.adminAccountId ?? '',
          options?.organizationId ?? '',
          instructorProfileHint ?? '',
        ]
      : [
          'users',
          'detail',
          userId,
          options?.role ?? 'auto',
          options?.organizationId ?? '',
          instructorProfileHint ?? '',
        ],
    queryFn: async (): Promise<Omit<User, 'password'>> => {
      if (
        shouldUseAdminAccountDetailApi({
          role: options?.role,
          adminAccountId: options?.adminAccountId,
          userId,
        })
      ) {
        return fetchAdminMemberDetailAsUser(userId, {
          memberId: options?.memberId,
          adminAccountId: options?.adminAccountId,
          email: options?.email,
        })
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
        const memberId = resolveMemberIdForApi(userId, { memberId: options?.memberId })
        return mapSchoolMemberDetailToUser(await fetchSchoolMemberDetailRemote(memberId), {
          fallbackRole: 'SCHOOL',
        })
      }

      const memberId = resolveMemberIdForApi(userId, { memberId: options?.memberId })
      const role: UserRole | undefined = options?.role

      if (!role) {
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

      if (role === 'INSTRUCTOR') {
        const profileHint = resolveInstructorMemberProfileHint({
          roles: options?.roles,
          instructorMemberProfile: options?.instructorMemberProfile,
        })
        const useTeacherDetail = profileHint === 'school_teacher'
        const [detail, externalIdentifiers] = await Promise.all([
          useTeacherDetail
            ? fetchTeacherMemberDetailRemote(memberId)
            : fetchInstructorMemberDetailRemote(memberId),
          fetchMemberExternalIdentifiersRemote(memberId).catch(() => []),
        ])
        const user = useTeacherDetail
          ? mapTeacherMemberDetailToUser(detail, { fallbackRole: 'INSTRUCTOR' })
          : mapInstructorMemberDetailToUser(detail, { fallbackRole: 'INSTRUCTOR' })
        const id1365 = resolve1365IdFromExternalIdentifiers(
          externalIdentifiers,
          detail.member?.external1365Id
        )
        if (id1365) user.id1365 = id1365
        return user
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
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '회원 상세를 불러오지 못했습니다.'),
    },
  })
}

export function useMemberDetailQuery(
  userId: string | null | undefined,
  enabled = true,
  options?: MemberDetailQueryOptions
) {
  const remote = isMembersRemoteEnabled()

  return useQuery({
    ...memberDetailQueryOptions(userId ?? '', options),
    enabled: Boolean(enabled && userId && remote),
  })
}

export function memberConsentRecordsQueryOptions(memberId: number) {
  return queryOptions({
    queryKey: memberQueryKeys.consentRecords(memberId),
    queryFn: () => fetchMemberConsentRecordsRemote(memberId),
  })
}

export function fetchMemberConsentRecordsQuery(queryClient: QueryClient, memberId: number) {
  return queryClient.fetchQuery(memberConsentRecordsQueryOptions(memberId))
}

export function useMemberConsentRecordsQuery(
  memberId: number | undefined,
  enabled = true,
  options?: { manualFetch?: boolean }
) {
  return useQuery({
    ...memberConsentRecordsQueryOptions(memberId ?? 0),
    enabled: options?.manualFetch
      ? false
      : Boolean(enabled && memberId != null && isMembersRemoteEnabled()),
  })
}
