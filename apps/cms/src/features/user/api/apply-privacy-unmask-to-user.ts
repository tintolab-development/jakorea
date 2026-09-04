import type { User, UserRole } from '@/types/user'
import type { AdminAccountPrivacyResponse } from '@/shared/api/generated/members/schemas/adminAccountPrivacyResponse'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import type { IndividualMemberDetailResponse } from '@/shared/api/generated/members/schemas/individualMemberDetailResponse'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas/instructorMemberDetailResponse'
import type { InstructorRoleRequestDetailResponse } from '@/shared/api/generated/members/schemas/instructorRoleRequestDetailResponse'
import type { MemberDetailResponse } from '@/shared/api/generated/members/schemas/memberDetailResponse'
import {
  extract1365IdFromMemberPrivacyPayload,
  preferUnmasked1365Id,
} from '@/features/user/api/map-external-identifiers'
import {
  mapIndividualMemberDetailToUser,
  mapInstructorMemberDetailToUser,
  mapMemberDetailToUser,
} from '@/features/user/api/map-member-detail-to-user'
import { mapInstructorRoleRequestDetailToUser } from '@/features/user/api/map-instructor-role-request-detail-to-user'
import { mergeListUserWithFetchedDetail } from '@/features/user/api/merge-list-user-with-detail'

function withPreferred1365Id(
  merged: Omit<User, 'password'>,
  unmaskPayload: unknown,
  previous: Omit<User, 'password'>
): Omit<User, 'password'> {
  const id1365 = preferUnmasked1365Id(
    extract1365IdFromMemberPrivacyPayload(unmaskPayload),
    merged.id1365,
    previous.id1365
  )
  return id1365 ? { ...merged, id1365 } : merged
}

/**
 * 개인정보 unmask API 응답 → 현재 상세 User에 원문 필드 병합.
 * 강사: 주소·계좌·소개 등 `"마스킹"`/잘린 값을 원문으로 교체.
 */
export function applyPrivacyUnmaskResponseToUser(
  current: Omit<User, 'password'>,
  unmaskPayload: unknown,
  role: UserRole = current.role
): Omit<User, 'password'> {
  if (unmaskPayload == null || typeof unmaskPayload !== 'object') {
    return current
  }

  try {
    if (
      current.instructorRoleRequestId != null ||
      'requestId' in unmaskPayload
    ) {
      const mapped = mapInstructorRoleRequestDetailToUser(
        unmaskPayload as InstructorRoleRequestDetailResponse,
        { fallbackId: current.id }
      )
      return withPreferred1365Id(
        mergeListUserWithFetchedDetail(current, {
          ...mapped,
          instructorRoleRequestId:
            mapped.instructorRoleRequestId ?? current.instructorRoleRequestId,
        }),
        unmaskPayload,
        current
      )
    }

    if (role === 'ADMIN') {
      const privacy = unmaskPayload as AdminAccountPrivacyResponse
      const genderDisplay = privacy.gender != null ? toDisplayGender(privacy.gender) : undefined
      return mergeListUserWithFetchedDetail(current, {
        ...current,
        adminAccountId: privacy.adminAccountId ?? current.adminAccountId,
        email: privacy.email?.trim() || current.email,
        name: privacy.name?.trim() || current.name,
        phone: privacy.phone?.trim() || current.phone,
        gender: genderDisplay && genderDisplay !== '-' ? genderDisplay : current.gender,
        birthDate: privacy.birthDate ?? current.birthDate,
      })
    }

    if (role === 'INSTRUCTOR') {
      const mapped = mapInstructorMemberDetailToUser(
        unmaskPayload as InstructorMemberDetailResponse,
        { fallbackRole: 'INSTRUCTOR' }
      )
      return withPreferred1365Id(
        mergeListUserWithFetchedDetail(current, mapped),
        unmaskPayload,
        current
      )
    }

    if (role === 'INDIVIDUAL') {
      const mapped = mapIndividualMemberDetailToUser(
        unmaskPayload as IndividualMemberDetailResponse,
        { fallbackRole: 'INDIVIDUAL' }
      )
      return withPreferred1365Id(
        mergeListUserWithFetchedDetail(current, mapped),
        unmaskPayload,
        current
      )
    }

    // SCHOOL 등 — legacy member unmask (MemberDetailResponse)
    const mapped = mapMemberDetailToUser(unmaskPayload as MemberDetailResponse, null, {
      fallbackRole: role,
    })
    return withPreferred1365Id(
      mergeListUserWithFetchedDetail(current, mapped),
      unmaskPayload,
      current
    )
  } catch {
    // 매핑 실패 시에도 payload에서 1365 원문만 보강
    return withPreferred1365Id(current, unmaskPayload, current)
  }
}
