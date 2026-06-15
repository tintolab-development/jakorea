import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIMembersSubset } from '@/shared/api/generated/members/members-api'
import type {
  AdminPreRegisterMemberRequest,
  AdminRolePermissionMatrixResponse,
  AdminRolePermissionUpdateRequest,
  InstructorDetailResponse,
  InstructorRoleReviewRequest,
  ListInstructorRoleRequestsParams,
  ListMembersParams,
  MemberDetailResponse,
  MemberWorkflowResponse,
  PageResponse,
  PageResponseInstructorRoleRequestListItemResponse,
} from '@/shared/api/generated/members/schemas'
import type { AdminMemberDeleteRequest } from '@/shared/api/generated/members/schemas/adminMemberDeleteRequest'
import type { AdminPermissionResponse } from '@/shared/api/generated/members/schemas/adminPermissionResponse'
import type { AdminRoleResponse } from '@/shared/api/generated/members/schemas/adminRoleResponse'
import type { MemberConsentRecordResponse } from '@/shared/api/generated/members/schemas/memberConsentRecordResponse'
import type { ExternalIdentifierResponse } from '@/shared/api/generated/members/schemas/externalIdentifierResponse'

const membersApi = getJAKoreaCMSBackendAPIMembersSubset()

function memberIdParam(memberId: number): string {
  return String(memberId)
}

export async function fetchMembersPageRemote(params: ListMembersParams): Promise<PageResponse> {
  return unwrapApiBody(await membersApi.listMembers(params))
}

export async function fetchMemberDetailRemote(memberId: number): Promise<MemberDetailResponse> {
  return unwrapApiBody(await membersApi.getMemberDetail(memberIdParam(memberId)))
}

export async function fetchMemberInstructorProfileRemote(
  memberId: number
): Promise<InstructorDetailResponse> {
  return unwrapApiBody(await membersApi.getInstructorDetail(memberId))
}

export async function fetchMemberConsentRecordsRemote(
  memberId: number
): Promise<MemberConsentRecordResponse[]> {
  const data = await unwrapApiBody(await membersApi.consentRecords(memberId))
  return Array.isArray(data) ? data : []
}

export async function fetchMemberExternalIdentifiersRemote(
  memberId: number
): Promise<ExternalIdentifierResponse[]> {
  const data = await unwrapApiBody(await membersApi.externalIdentifiers(memberId))
  return Array.isArray(data) ? data : []
}

export async function preRegisterMemberRemote(
  body: AdminPreRegisterMemberRequest
): Promise<MemberWorkflowResponse> {
  return unwrapApiBody(await membersApi.preRegister(body))
}

export async function deleteMemberRemote(memberId: number, body: AdminMemberDeleteRequest) {
  await membersApi.deleteAndAnonymize(memberId, body)
}

export async function fetchInstructorRoleRequestsPageRemote(
  params: ListInstructorRoleRequestsParams
): Promise<PageResponseInstructorRoleRequestListItemResponse> {
  return unwrapApiBody(await membersApi.listInstructorRoleRequests(params))
}

export async function approveInstructorRoleRequestRemote(
  requestId: number,
  body: InstructorRoleReviewRequest
) {
  await membersApi.approve1(requestId, body)
}

export async function rejectInstructorRoleRequestRemote(
  requestId: number,
  body: InstructorRoleReviewRequest
) {
  await membersApi.reject2(requestId, body)
}

export async function fetchAdminPermissionsCatalogRemote(): Promise<AdminPermissionResponse[]> {
  const data = await unwrapApiBody(await membersApi.listPermissions())
  return Array.isArray(data) ? data : []
}

export async function fetchAdminRolesRemote(): Promise<AdminRoleResponse[]> {
  const data = await unwrapApiBody(await membersApi.listRoles())
  return Array.isArray(data) ? data : []
}

export async function fetchAdminRolePermissionMatrixRemote(
  roleCode: string
): Promise<AdminRolePermissionMatrixResponse> {
  return unwrapApiBody(await membersApi.getRolePermissions(roleCode))
}

export async function updateAdminRolePermissionsRemote(
  roleCode: string,
  body: AdminRolePermissionUpdateRequest
) {
  await membersApi.updateRolePermissions(roleCode, body)
}
