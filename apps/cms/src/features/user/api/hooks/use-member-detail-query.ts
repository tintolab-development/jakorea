import { useQuery } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { mapMemberDetailToUser } from '@/features/user/api/map-member-detail-to-user'
import {
  fetchMemberConsentRecordsRemote,
  fetchMemberDetailRemote,
  fetchMemberExternalIdentifiersRemote,
  fetchMemberInstructorProfileRemote,
} from '@/features/user/api/members-api-client'
import { resolve1365IdFromExternalIdentifiers } from '@/features/user/api/map-external-identifiers'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { resolveMemberIdForApi } from '@/features/user/api/member-id-registry'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { User } from '@/types/user'

export function useMemberDetailQuery(userId: string | null | undefined, enabled = true) {
  const remote = isMembersRemoteEnabled()

  return useQuery({
    queryKey: remote
      ? memberQueryKeys.detailByUuid(userId ?? '')
      : ['users', 'detail', userId],
    enabled: Boolean(enabled && userId && remote),
    queryFn: async (): Promise<Omit<User, 'password'>> => {
      if (!userId) throw new Error('userId가 없습니다.')
      const memberId = resolveMemberIdForApi(userId)
      const detail = await fetchMemberDetailRemote(memberId)
      const roleTokens = detail.roles ?? []
      const isInstructor =
        roleTokens.some(r => r.toUpperCase() === 'INSTRUCTOR') ||
        detail.roles?.includes('INSTRUCTOR')
      const [instructorProfile, externalIdentifiers] = await Promise.all([
        isInstructor
          ? fetchMemberInstructorProfileRemote(memberId).catch(() => null)
          : Promise.resolve(null),
        fetchMemberExternalIdentifiersRemote(memberId).catch(() => []),
      ])
      const user = mapMemberDetailToUser(detail, instructorProfile)
      const id1365 = resolve1365IdFromExternalIdentifiers(
        externalIdentifiers,
        detail.external1365Id
      )
      if (id1365) {
        user.id1365 = id1365
      }
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
