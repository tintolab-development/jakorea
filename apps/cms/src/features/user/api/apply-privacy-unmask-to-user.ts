import type { User, UserRole } from '@/types/user'
import type { AdminAccountApprovalDetailResponse } from '@/shared/api/generated/members/schemas/adminAccountApprovalDetailResponse'
import type { AdminAccountPrivacyResponse } from '@/shared/api/generated/members/schemas/adminAccountPrivacyResponse'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import type { IndividualMemberDetailResponse } from '@/shared/api/generated/members/schemas/individualMemberDetailResponse'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas/instructorMemberDetailResponse'
import type { InstructorRoleRequestDetailResponse } from '@/shared/api/generated/members/schemas/instructorRoleRequestDetailResponse'
import type { MemberDetailResponse } from '@/shared/api/generated/members/schemas/memberDetailResponse'
import type { TeacherMemberDetailResponse } from '@/shared/api/generated/members/schemas/teacherMemberDetailResponse'
import {
  extract1365IdFromMemberPrivacyPayload,
  looksMaskedExternalId,
  preferUnmasked1365Id,
} from '@/features/user/api/map-external-identifiers'
import {
  mapIndividualMemberDetailToUser,
  mapInstructorMemberDetailToUser,
  mapMemberDetailToUser,
  mapTeacherMemberDetailToUser,
} from '@/features/user/api/map-member-detail-to-user'
import { mapInstructorRoleRequestDetailToUser } from '@/features/user/api/map-instructor-role-request-detail-to-user'
import { mergeListUserWithFetchedDetail } from '@/features/user/api/merge-list-user-with-detail'
import { fetchSchoolOrganizationRemote } from '@/features/user/api/members-api-client'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'

/** legacy member unmask가 교사 상세 shape(`member` + organization*)을 내려줄 때 */
function isTeacherMemberDetailUnmaskPayload(payload: object): boolean {
  const member = (payload as { member?: unknown }).member
  if (member == null || typeof member !== 'object') return false
  return (
    'organizationName' in payload ||
    'organizationId' in payload ||
    'employmentStatus' in payload ||
    'affiliationStatus' in payload ||
    'neisCode' in payload ||
    'address' in payload
  )
}

function extractOrganizationNameFromUnmaskPayload(payload: unknown): string | undefined {
  if (payload == null || typeof payload !== 'object') return undefined
  const root = payload as Record<string, unknown>
  for (const key of ['organizationName', 'affiliatedSchoolName', 'schoolName'] as const) {
    const value = root[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

/**
 * 관리자 권한 승인 상세 GET 캐시에 privacy unmask 원문 필드를 병합한다.
 * unmask 응답 shape(`AdminAccountPrivacyResponse`) ≠ 상세 GET shape이므로 필드만 patch.
 */
export function mergeAdminApprovalDetailWithPrivacyUnmask(
  prev: AdminAccountApprovalDetailResponse | undefined,
  privacy: AdminAccountPrivacyResponse,
  adminAccountId: number
): AdminAccountApprovalDetailResponse {
  const base: AdminAccountApprovalDetailResponse = prev ?? {
    adminAccountId: privacy.adminAccountId ?? adminAccountId,
  }
  return {
    ...base,
    adminAccountId: privacy.adminAccountId ?? base.adminAccountId ?? adminAccountId,
    ...(privacy.uuid != null ? { uuid: privacy.uuid } : {}),
    ...(privacy.email != null ? { email: privacy.email } : {}),
    ...(privacy.name != null ? { name: privacy.name } : {}),
    ...(privacy.phone != null ? { phone: privacy.phone } : {}),
    ...(privacy.gender != null ? { gender: privacy.gender } : {}),
    ...(privacy.birthDate != null ? { birthDate: privacy.birthDate } : {}),
    ...(privacy.status != null ? { status: privacy.status } : {}),
    ...(privacy.roleCode != null ? { roleCode: privacy.roleCode } : {}),
  }
}

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
      // 순수 교사: `…/teacher/privacy/unmask` → TeacherMemberDetailResponse(교사 매퍼로 소속 원문 반영).
      // MemberDetailResponse 형태(legacy member unmask)도 계속 수용한다.
      if (resolveInstructorMemberProfile(current) === 'school_teacher') {
        const mapped = isTeacherMemberDetailUnmaskPayload(unmaskPayload as object)
          ? mapTeacherMemberDetailToUser(unmaskPayload as TeacherMemberDetailResponse, {
              fallbackRole: 'INSTRUCTOR',
            })
          : mapMemberDetailToUser(unmaskPayload as MemberDetailResponse, null, {
              fallbackRole: 'INSTRUCTOR',
            })
        // 목록/URL에 남은 마스킹 소속(`**초등학교`)이 unmask 원문을 덮지 않게 한다.
        const affiliatedSchoolName = preferUnmasked1365Id(
          mapped.affiliatedSchoolName,
          extractOrganizationNameFromUnmaskPayload(unmaskPayload),
          current.affiliatedSchoolName
        )
        return withPreferred1365Id(
          mergeListUserWithFetchedDetail(current, {
            ...mapped,
            role: 'INSTRUCTOR',
            instructorMemberProfile: current.instructorMemberProfile ?? 'school_teacher',
            roles: current.roles ?? mapped.roles,
            ...(affiliatedSchoolName ? { affiliatedSchoolName } : {}),
            organizationId: mapped.organizationId ?? current.organizationId,
            affiliation: preferUnmasked1365Id(mapped.affiliation, current.affiliation),
            listMetrics: current.listMetrics ?? mapped.listMetrics,
          }),
          unmaskPayload,
          current
        )
      }
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

/**
 * 순수 교사 unmask 후에도 소속이 마스킹(`**초등학교`)이면 organization 상세에서 학교명 원문을 보강한다.
 * legacy member unmask(MemberDetailResponse)에는 organizationName이 없어 GET 마스킹이 남는 경우를 보완.
 */
export async function enrichSchoolTeacherAffiliationFromOrganization(
  user: Omit<User, 'password'>
): Promise<Omit<User, 'password'>> {
  if (resolveInstructorMemberProfile(user) !== 'school_teacher') return user

  const currentSchool = user.affiliatedSchoolName?.trim()
  const needsUnmaskedSchool = !currentSchool || looksMaskedExternalId(currentSchool)
  if (!needsUnmaskedSchool) return user

  const organizationId = user.organizationId
  if (organizationId == null) return user

  try {
    const org = await fetchSchoolOrganizationRemote(organizationId)
    const name = org.name?.trim()
    if (!name || looksMaskedExternalId(name)) return user

    return {
      ...user,
      affiliatedSchoolName: name,
      affiliation: preferUnmasked1365Id(user.affiliation, name),
    }
  } catch {
    return user
  }
}
