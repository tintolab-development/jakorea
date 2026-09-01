/**
 * 역할 힌트 없이 회원 상세를 조회할 때 — individual → school → instructor 순으로
 * **한 번만** 호출하고 바로 User로 매핑한다.
 * (`fetchMemberDetailRemote` 후 역할별 GET을 다시 치는 이중 호출을 막기 위함)
 */

import {
  fetchIndividualMemberDetailRemote,
  fetchInstructorMemberDetailRemote,
  fetchMemberExternalIdentifiersRemote,
  fetchSchoolMemberDetailRemote,
  fetchTeacherMemberDetailRemote,
} from '@/features/user/api/members-api-client'
import {
  mapIndividualMemberDetailToUser,
  mapInstructorMemberDetailToUser,
  mapSchoolMemberDetailToUser,
  mapTeacherMemberDetailToUser,
} from '@/features/user/api/map-member-detail-to-user'
import { resolve1365IdFromExternalIdentifiers } from '@/features/user/api/map-external-identifiers'
import {
  inferInstructorMemberProfileFromRoles,
  resolvePrimaryUserRole,
} from '@/features/user/api/map-member-role'
import {
  fetchAdminMemberDetailAsUser,
  isAdminMemberDetailRole,
  shouldUseAdminAccountDetailApi,
} from '@/features/user/api/fetch-admin-member-detail'
import type { User, UserRole } from '@/types/user'

export async function probeMemberDetailAsUser(
  userId: string,
  memberId: number,
  options?: {
    adminAccountId?: number
    email?: string
  }
): Promise<Omit<User, 'password'>> {
  const errors: unknown[] = []

  try {
    const [detail, externalIdentifiers] = await Promise.all([
      fetchIndividualMemberDetailRemote(memberId),
      fetchMemberExternalIdentifiersRemote(memberId).catch(() => []),
    ])
    if (detail.member) {
      const role = resolvePrimaryUserRole(detail.member.roles)
      if (isAdminMemberDetailRole(role)) {
        if (
          shouldUseAdminAccountDetailApi({
            userId,
            adminAccountId: options?.adminAccountId,
          })
        ) {
          return fetchAdminMemberDetailAsUser(userId, {
            memberId,
            adminAccountId: options?.adminAccountId,
            email: options?.email ?? detail.member.email,
          })
        }
        throw new Error(
          '관리자 회원 상세를 조회하려면 목록 응답에 adminAccountId가 필요합니다.'
        )
      }
      // roles가 INSTRUCTOR/SCHOOL이면 해당 상세로 한 번 더 조회 (enrich)
      if (isSpecializedMemberRole(role)) {
        return fetchSpecializedMemberDetailAsUser(
          userId,
          memberId,
          role,
          options,
          detail.member.roles
        )
      }
      // individual 엔드포인트가 응답했으면 동일 GET을 반복하지 않고 즉시 매핑
      const user = mapIndividualMemberDetailToUser(detail, { fallbackRole: 'INDIVIDUAL' })
      const id1365 = resolve1365IdFromExternalIdentifiers(
        externalIdentifiers,
        detail.member.external1365Id
      )
      if (id1365) user.id1365 = id1365
      return user
    }
  } catch (error) {
    errors.push(error)
  }

  try {
    const detail = await fetchSchoolMemberDetailRemote(memberId)
    if (detail.member) {
      return mapSchoolMemberDetailToUser(detail, { fallbackRole: 'SCHOOL' })
    }
  } catch (error) {
    errors.push(error)
  }

  try {
    const [detail, externalIdentifiers] = await Promise.all([
      fetchInstructorMemberDetailRemote(memberId),
      fetchMemberExternalIdentifiersRemote(memberId).catch(() => []),
    ])
    if (detail.member) {
      if (inferInstructorMemberProfileFromRoles(detail.member.roles) === 'school_teacher') {
        return fetchInstructorLikeDetailAsUser(memberId, detail.member.roles)
      }
      const user = mapInstructorMemberDetailToUser(detail, { fallbackRole: 'INSTRUCTOR' })
      const id1365 = resolve1365IdFromExternalIdentifiers(
        externalIdentifiers,
        detail.member?.external1365Id
      )
      if (id1365) user.id1365 = id1365
      return user
    }
  } catch (error) {
    errors.push(error)
  }

  const last = errors[errors.length - 1]
  throw last instanceof Error ? last : new Error('회원 상세를 불러오지 못했습니다.')
}

function isSpecializedMemberRole(role: UserRole): boolean {
  return role === 'INSTRUCTOR' || role === 'SCHOOL'
}

async function fetchInstructorLikeDetailAsUser(
  memberId: number,
  roles?: string[]
): Promise<Omit<User, 'password'>> {
  const useTeacher = inferInstructorMemberProfileFromRoles(roles) === 'school_teacher'
  const [detail, externalIdentifiers] = await Promise.all([
    useTeacher
      ? fetchTeacherMemberDetailRemote(memberId)
      : fetchInstructorMemberDetailRemote(memberId),
    fetchMemberExternalIdentifiersRemote(memberId).catch(() => []),
  ])
  const user = useTeacher
    ? mapTeacherMemberDetailToUser(detail, { fallbackRole: 'INSTRUCTOR' })
    : mapInstructorMemberDetailToUser(detail, { fallbackRole: 'INSTRUCTOR' })
  const id1365 = resolve1365IdFromExternalIdentifiers(
    externalIdentifiers,
    detail.member?.external1365Id
  )
  if (id1365) user.id1365 = id1365
  return user
}

async function fetchSpecializedMemberDetailAsUser(
  userId: string,
  memberId: number,
  role: UserRole,
  options?: {
    adminAccountId?: number
    email?: string
  },
  roles?: string[]
): Promise<Omit<User, 'password'>> {
  if (role === 'SCHOOL') {
    return mapSchoolMemberDetailToUser(await fetchSchoolMemberDetailRemote(memberId), {
      fallbackRole: 'SCHOOL',
    })
  }
  if (role === 'INSTRUCTOR') {
    return fetchInstructorLikeDetailAsUser(memberId, roles)
  }
  if (
    isAdminMemberDetailRole(role) &&
    shouldUseAdminAccountDetailApi({ userId, adminAccountId: options?.adminAccountId })
  ) {
    return fetchAdminMemberDetailAsUser(userId, {
      memberId,
      adminAccountId: options?.adminAccountId,
      email: options?.email,
    })
  }
  throw new Error('회원 상세를 불러오지 못했습니다.')
}
