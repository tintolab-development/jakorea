import type { User } from '@/types/user'
import type { SchoolOrganizationListItemResponse } from '@/shared/api/generated/members/schemas/schoolOrganizationListItemResponse'
import { coercePositiveInt } from '@/features/user/api/user-response-row-id'

export const ORGANIZATION_ID_PREFIX = 'organization-'

export function toOrganizationUserId(organizationId: number): string {
  return `${ORGANIZATION_ID_PREFIX}${organizationId}`
}

export function parseOrganizationIdFromUserId(userId: string | undefined | null): number | undefined {
  if (!userId?.trim()) return undefined
  const trimmed = userId.trim()
  const prefixed = trimmed.match(/^organization-(\d+)$/i)
  if (prefixed) {
    const n = Number(prefixed[1])
    return Number.isFinite(n) && n > 0 ? n : undefined
  }
  return undefined
}

export function mapSchoolOrganizationToUser(
  item: SchoolOrganizationListItemResponse
): Omit<User, 'password'> {
  const organizationId = coercePositiveInt(item.organizationId)
  if (organizationId == null) {
    throw new Error('학교 organization 응답에 organizationId가 없습니다.')
  }

  const schoolName = item.name?.trim() || '-'
  const address = item.address?.trim() || ''
  const addressDetail = item.addressDetail?.trim() || undefined
  const now = new Date().toISOString()
  const status = item.status?.trim().toUpperCase()
  const isActive = !status || status === 'ACTIVE' || status === 'ENABLED' || status === 'NORMAL'

  const listMetrics: NonNullable<User['listMetrics']> = {}
  if (item.affiliatedTeacherCount != null) {
    listMetrics.institutionRegisteredTeacherCount = item.affiliatedTeacherCount
  }
  if (item.programApplyCount != null) {
    listMetrics.institutionProgramApplicationCount = item.programApplyCount
  }
  if (item.programCompleteCount != null) {
    listMetrics.institutionProgramAttendanceCount = item.programCompleteCount
  }

  return {
    id: toOrganizationUserId(organizationId),
    organizationId,
    email: '-',
    name: schoolName,
    role: 'SCHOOL',
    isActive,
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now,
    schoolInfo: {
      schoolName,
      address,
      ...(addressDetail ? { addressDetail } : {}),
    },
    ...(item.zipcode?.trim() ? { zipCode: item.zipcode.trim() } : {}),
    ...(Object.keys(listMetrics).length > 0 ? { listMetrics } : {}),
  }
}

export function mapSchoolOrganizationsToUsers(
  items: SchoolOrganizationListItemResponse[] | undefined
): Omit<User, 'password'>[] {
  if (!items?.length) return []
  return items
    .filter(item => coercePositiveInt(item.organizationId) != null)
    .map(mapSchoolOrganizationToUser)
}
