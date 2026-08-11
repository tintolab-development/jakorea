import { useQuery } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  mapIndividualMemberDetailToUser,
  mapInstructorMemberDetailToUser,
  mapMemberDetailToUser,
  mapSchoolMemberDetailToUser,
} from '@/features/user/api/map-member-detail-to-user'
import {
  fetchIndividualMemberDetailRemote,
  fetchInstructorMemberDetailRemote,
  fetchMemberConsentRecordsRemote,
  fetchMemberDetailRemote,
  fetchMemberExternalIdentifiersRemote,
  fetchSchoolMemberDetailRemote,
  fetchSchoolOrganizationRemote,
} from '@/features/user/api/members-api-client'
import {
  mapSchoolOrganizationToUser,
  parseOrganizationIdFromUserId,
} from '@/features/user/api/map-school-organization-to-user'
import {
  fetchAdminMemberDetailAsUser,
  isAdminMemberDetailRole,
  shouldUseAdminAccountDetailApi,
} from '@/features/user/api/fetch-admin-member-detail'
import { resolve1365IdFromExternalIdentifiers } from '@/features/user/api/map-external-identifiers'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { resolveMemberIdForApi } from '@/features/user/api/member-id-registry'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { resolvePrimaryUserRole } from '@/features/user/api/map-member-role'
import type { User, UserRole } from '@/types/user'

export function useMemberDetailQuery(
  userId: string | null | undefined,
  enabled = true,
  options?: {
    role?: UserRole
    memberId?: number
    organizationId?: number
    adminAccountId?: number
    email?: string
  }
) {
  const remote = isMembersRemoteEnabled()

  return useQuery({
    queryKey: remote
      ? [
          ...memberQueryKeys.detailByUuid(userId ?? ''),
          options?.role ?? 'auto',
          options?.adminAccountId ?? '',
          options?.organizationId ?? '',
        ]
      : ['users', 'detail', userId, options?.role ?? 'auto', options?.organizationId ?? ''],
    enabled: Boolean(enabled && userId && remote),
    queryFn: async (): Promise<Omit<User, 'password'>> => {
      if (!userId) throw new Error('userId가 없습니다.')

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

      if (options?.role === 'SCHOOL' || organizationId != null) {
        if (organizationId != null) {
          return mapSchoolOrganizationToUser(await fetchSchoolOrganizationRemote(organizationId))
        }
        const memberId = resolveMemberIdForApi(userId, { memberId: options?.memberId })
        return mapSchoolMemberDetailToUser(await fetchSchoolMemberDetailRemote(memberId), {
          fallbackRole: 'SCHOOL',
        })
      }

      const memberId = resolveMemberIdForApi(userId, { memberId: options?.memberId })
      // options.role은 위에서 SCHOOL early-return 후 좁혀질 수 있어 명시 타입 유지
      let role: UserRole | undefined = options?.role

      if (!role) {
        const legacy = await fetchMemberDetailRemote(memberId)
        role = resolvePrimaryUserRole(legacy.roles)
        if (
          isAdminMemberDetailRole(role) &&
          shouldUseAdminAccountDetailApi({ userId, adminAccountId: options?.adminAccountId })
        ) {
          return fetchAdminMemberDetailAsUser(userId, {
            memberId,
            adminAccountId: options?.adminAccountId,
            email: legacy.email,
          })
        }
        if (role !== 'SCHOOL' && role !== 'INSTRUCTOR' && role !== 'INDIVIDUAL') {
          const externalIdentifiers = await fetchMemberExternalIdentifiersRemote(memberId).catch(
            () => []
          )
          const user = mapMemberDetailToUser(legacy, null)
          const id1365 = resolve1365IdFromExternalIdentifiers(
            externalIdentifiers,
            legacy.external1365Id
          )
          if (id1365) user.id1365 = id1365
          return user
        }
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

      if (role === 'SCHOOL') {
        if (organizationId != null) {
          return mapSchoolOrganizationToUser(await fetchSchoolOrganizationRemote(organizationId))
        }
        return mapSchoolMemberDetailToUser(await fetchSchoolMemberDetailRemote(memberId), {
          fallbackRole: 'SCHOOL',
        })
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

export function useMemberConsentRecordsQuery(
  memberId: number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: memberQueryKeys.consentRecords(memberId ?? 0),
    enabled: Boolean(enabled && memberId != null && isMembersRemoteEnabled()),
    queryFn: () => fetchMemberConsentRecordsRemote(memberId!),
  })
}
