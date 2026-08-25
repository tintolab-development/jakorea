import type { GetUsersPageParams } from '@/entities/user/api/user-service'
import type { ListInstructorRoleRequestsParams } from '@/shared/api/generated/members/schemas'
import type { ListAdminApprovalRequestsParams } from '@/features/user/api/admin-approval-requests.types'

export const memberQueryKeys = {
  all: ['cms', 'members'] as const,
  listAll: () => [...memberQueryKeys.all, 'list'] as const,
  list: (filtersKey: string) => [...memberQueryKeys.listAll(), filtersKey] as const,
  schoolsListAll: () => [...memberQueryKeys.all, 'schoolsList'] as const,
  schoolsList: (filtersKey: string) =>
    [...memberQueryKeys.schoolsListAll(), filtersKey] as const,
  detail: (memberId: number) => [...memberQueryKeys.all, 'detail', memberId] as const,
  detailByUuid: (uuid: string) => [...memberQueryKeys.all, 'detailByUuid', uuid] as const,
  instructorProfile: (memberId: number) =>
    [...memberQueryKeys.all, 'instructorProfile', memberId] as const,
  consentRecords: (memberId: number) => [...memberQueryKeys.all, 'consentRecords', memberId] as const,
  externalIdentifiers: (memberId: number) =>
    [...memberQueryKeys.all, 'externalIdentifiers', memberId] as const,
  instructorSettlements: (memberId: number) =>
    [...memberQueryKeys.all, 'instructorSettlements', memberId] as const,
  comments: (memberId: number, screenCode?: string) =>
    [...memberQueryKeys.all, 'comments', memberId, screenCode ?? ''] as const,
  applications: (memberId: number) =>
    [...memberQueryKeys.all, 'applications', memberId] as const,
  programHistory: (memberId: number) =>
    [...memberQueryKeys.all, 'programHistory', memberId] as const,
  affiliatedTeachers: (memberId: number) =>
    [...memberQueryKeys.all, 'affiliatedTeachers', memberId] as const,
  schoolTeachers: (organizationId: number) =>
    [...memberQueryKeys.all, 'schoolTeachers', organizationId] as const,
  schoolProgramEnrollmentHistory: (
    organizationId: number,
    filtersKey = '',
    organizationUserId = ''
  ) =>
    [
      ...memberQueryKeys.all,
      'schoolProgramEnrollmentHistory',
      organizationId,
      organizationUserId,
      filtersKey,
    ] as const,
  adminPrograms: (memberId: number) =>
    [...memberQueryKeys.all, 'adminPrograms', memberId] as const,
  adminAccountPrograms: (adminAccountId: number) =>
    [...memberQueryKeys.all, 'adminAccountPrograms', adminAccountId] as const,
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

export function serializeAdminApprovalRequestParams(
  params: ListAdminApprovalRequestsParams
): string {
  return JSON.stringify(params)
}
