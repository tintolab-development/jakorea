import type { GetUsersPageParams } from '@/entities/user/api/user-service'
import type { ListInstructorRoleRequestsParams } from '@/shared/api/generated/members/schemas'
import type { ListAdminsParams } from '@/shared/api/generated/members/schemas/listAdminsParams'

export const memberQueryKeys = {
  all: ['cms', 'members'] as const,
  list: (filtersKey: string) => [...memberQueryKeys.all, 'list', filtersKey] as const,
  detail: (memberId: number) => [...memberQueryKeys.all, 'detail', memberId] as const,
  detailByUuid: (uuid: string) => [...memberQueryKeys.all, 'detailByUuid', uuid] as const,
  instructorProfile: (memberId: number) =>
    [...memberQueryKeys.all, 'instructorProfile', memberId] as const,
  consentRecords: (memberId: number) => [...memberQueryKeys.all, 'consentRecords', memberId] as const,
  externalIdentifiers: (memberId: number) =>
    [...memberQueryKeys.all, 'externalIdentifiers', memberId] as const,
  instructorSettlements: (memberId: number) =>
    [...memberQueryKeys.all, 'instructorSettlements', memberId] as const,
  instructorRoleRequests: {
    all: () => [...memberQueryKeys.all, 'instructorRoleRequests'] as const,
    list: (paramsKey: string) =>
      [...memberQueryKeys.instructorRoleRequests.all(), 'list', paramsKey] as const,
  },
  adminApprovalRequests: {
    all: () => [...memberQueryKeys.all, 'adminApprovalRequests'] as const,
    list: (paramsKey: string) =>
      [...memberQueryKeys.adminApprovalRequests.all(), 'list', paramsKey] as const,
  },
  adminPermissions: {
    all: () => [...memberQueryKeys.all, 'adminPermissions'] as const,
    catalog: () => [...memberQueryKeys.adminPermissions.all(), 'catalog'] as const,
    roles: () => [...memberQueryKeys.adminPermissions.all(), 'roles'] as const,
    roleMatrix: (roleCode: string) =>
      [...memberQueryKeys.adminPermissions.all(), 'roleMatrix', roleCode] as const,
  },
} as const

export function serializeMemberListFilters(filters: GetUsersPageParams | undefined): string {
  return JSON.stringify(filters ?? {})
}

export function serializeInstructorRoleRequestParams(
  params: ListInstructorRoleRequestsParams
): string {
  return JSON.stringify(params)
}

export function serializeAdminApprovalRequestParams(params: ListAdminsParams): string {
  return JSON.stringify(params)
}
