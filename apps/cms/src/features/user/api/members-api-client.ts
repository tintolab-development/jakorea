import type {
  AdminAccountApprovalDecisionRequest,
  ListAdminApprovalRequestsParams,
} from '@/features/user/api/admin-approval-requests.types'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIMembersSubset } from '@/shared/api/generated/members/members-api'
import { customInstance } from '@/shared/api/orval-mutator'
import type {
  AdminAccountCreateRequest,
  AdminAccountResponse,
  AdminAccountVerificationRequest,
  AdminPreRegisterIndividualRequest,
  AdminPreRegisterInstructorRequest,
  AdminPreRegisterMemberRequest,
  AdminPreRegisterSchoolRequest,
  AdminPrivacyUnmaskRequest,
  AdminRoleChangeRequest,
  AdminRolePermissionMatrixResponse,
  AdminRolePermissionUpdateRequest,
  IndividualMemberDetailResponse,
  InstructorDetailResponse,
  InstructorMemberDetailResponse,
  InstructorRoleReviewRequest,
  ListAdminsParams,
  ListInstructorRoleRequestsParams,
  ListMembersParams,
  MemberDetailResponse,
  MemberWorkflowResponse,
  PageResponse,
  PageResponseAdminAccountListItemResponse,
  PageResponseInstructorRoleRequestListItemResponse,
  SchoolMemberDetailResponse,
} from '@/shared/api/generated/members/schemas'
import type { AdminMemberBasicInfoUpdateRequest } from '@/shared/api/generated/members/schemas/adminMemberBasicInfoUpdateRequest'
import type { AdminMemberCommentCreateRequest } from '@/shared/api/generated/members/schemas/adminMemberCommentCreateRequest'
import type { AdminCommentUpdateRequest } from '@/shared/api/generated/members/schemas/adminCommentUpdateRequest'
import type { AdminMemberDeleteRequest } from '@/shared/api/generated/members/schemas/adminMemberDeleteRequest'
import type { AdminCommentResponse } from '@/shared/api/generated/members/schemas/adminCommentResponse'
import type { UserResponse } from '@/shared/api/generated/members/schemas/userResponse'
import type { ListMemberApplicationsParams } from '@/shared/api/generated/members/schemas/listMemberApplicationsParams'
import type { ListMemberProgramHistoryParams } from '@/shared/api/generated/members/schemas/listMemberProgramHistoryParams'
import type { ListMemberAdminProgramsParams } from '@/shared/api/generated/members/schemas/listMemberAdminProgramsParams'
import type { PageResponseMemberApplicationHistoryResponse } from '@/shared/api/generated/members/schemas/pageResponseMemberApplicationHistoryResponse'
import type { PageResponseMemberProgramHistoryResponse } from '@/shared/api/generated/members/schemas/pageResponseMemberProgramHistoryResponse'
import type { PageResponseMemberAdminProgramResponse } from '@/shared/api/generated/members/schemas/pageResponseMemberAdminProgramResponse'
import type { SchoolAffiliatedTeacherRow } from '@/shared/api/generated/members/schemas/schoolAffiliatedTeacherRow'
import type { ListMemberCommentsParams } from '@/shared/api/generated/members/schemas/listMemberCommentsParams'
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

/** @deprecated 역할별 상세 API 사용 권장 */
export async function fetchMemberDetailRemote(memberId: number): Promise<MemberDetailResponse> {
  return unwrapApiBody(await membersApi.getMemberDetail(memberIdParam(memberId)))
}

export async function fetchIndividualMemberDetailRemote(
  memberId: number
): Promise<IndividualMemberDetailResponse> {
  return unwrapApiBody(await membersApi.getIndividualMemberDetail(memberId))
}

export async function fetchSchoolMemberDetailRemote(
  memberId: number
): Promise<SchoolMemberDetailResponse> {
  return unwrapApiBody(await membersApi.getSchoolMemberDetail(memberId))
}

export async function fetchInstructorMemberDetailRemote(
  memberId: number
): Promise<InstructorMemberDetailResponse> {
  return unwrapApiBody(await membersApi.getInstructorMemberDetail(memberId))
}

export async function updateMemberBasicInfoRemote(
  memberId: number,
  body: AdminMemberBasicInfoUpdateRequest
): Promise<UserResponse> {
  return unwrapApiBody(await membersApi.updateMemberBasicInfo(memberId, body))
}

export async function fetchMemberCommentsRemote(
  memberId: number,
  params?: ListMemberCommentsParams
): Promise<AdminCommentResponse[]> {
  const data = await unwrapApiBody(await membersApi.listMemberComments(memberId, params))
  return Array.isArray(data) ? data : []
}

export async function createMemberCommentRemote(
  memberId: number,
  body: AdminMemberCommentCreateRequest
): Promise<AdminCommentResponse> {
  return unwrapApiBody(await membersApi.createMemberComment(memberId, body))
}

export async function updateMemberCommentRemote(
  memberId: number,
  commentId: number,
  body: AdminCommentUpdateRequest
): Promise<AdminCommentResponse> {
  return unwrapApiBody(await membersApi.updateMemberComment(memberId, commentId, body))
}

export async function deleteMemberCommentRemote(memberId: number, commentId: number): Promise<void> {
  await membersApi.deleteMemberComment(memberId, commentId)
}

export async function updateAffiliatedTeacherEmploymentStatusRemote(
  memberId: number,
  teacherMemberId: number,
  employmentStatus: string
): Promise<SchoolAffiliatedTeacherRow> {
  return unwrapApiBody(
    await membersApi.updateAffiliatedTeacherEmploymentStatus(memberId, teacherMemberId, {
      employmentStatus,
    })
  )
}

export async function deleteMemberAdminProgramRemote(
  memberId: number,
  programId: number
): Promise<void> {
  await membersApi.deleteAdminProgram(memberId, programId)
}

export async function resendInstructorRoleNotificationRemote(requestId: number): Promise<void> {
  await membersApi.resendNotification(requestId)
}

export async function createAdminAccountRemote(
  body: AdminAccountCreateRequest
): Promise<AdminAccountResponse> {
  return unwrapApiBody(await membersApi.createAdmin(body))
}

export async function fetchMemberApplicationsRemote(
  memberId: number,
  params?: ListMemberApplicationsParams
): Promise<PageResponseMemberApplicationHistoryResponse> {
  return unwrapApiBody(await membersApi.listMemberApplications(memberId, params))
}

export async function fetchMemberProgramHistoryRemote(
  memberId: number,
  params?: ListMemberProgramHistoryParams
): Promise<PageResponseMemberProgramHistoryResponse> {
  return unwrapApiBody(await membersApi.listMemberProgramHistory(memberId, params))
}

export async function fetchAffiliatedTeachersRemote(
  memberId: number
): Promise<SchoolAffiliatedTeacherRow[]> {
  const data = await unwrapApiBody(await membersApi.listAffiliatedTeachers(memberId))
  return Array.isArray(data) ? data : []
}

export async function fetchMemberAdminProgramsRemote(
  memberId: number,
  params?: ListMemberAdminProgramsParams
): Promise<PageResponseMemberAdminProgramResponse> {
  return unwrapApiBody(await membersApi.listMemberAdminPrograms(memberId, params))
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

/** @deprecated 역할별 pre-register 사용 권장 */
export async function preRegisterMemberRemote(
  body: AdminPreRegisterMemberRequest
): Promise<MemberWorkflowResponse> {
  return unwrapApiBody(await membersApi.preRegister(body))
}

export async function preRegisterIndividualRemote(
  body: AdminPreRegisterIndividualRequest
): Promise<MemberWorkflowResponse> {
  return unwrapApiBody(await membersApi.preRegisterIndividual(body))
}

export async function preRegisterSchoolRemote(
  body: AdminPreRegisterSchoolRequest
): Promise<MemberWorkflowResponse> {
  return unwrapApiBody(await membersApi.preRegisterSchool(body))
}

export async function preRegisterInstructorRemote(
  body: AdminPreRegisterInstructorRequest
): Promise<MemberWorkflowResponse> {
  return unwrapApiBody(await membersApi.preRegisterInstructor(body))
}

export async function unmaskIndividualMemberPrivacyRemote(
  memberId: number,
  body: AdminPrivacyUnmaskRequest
): Promise<IndividualMemberDetailResponse> {
  return unwrapApiBody(await membersApi.unmaskIndividualMemberPrivacy(memberId, body))
}

export async function unmaskInstructorMemberPrivacyRemote(
  memberId: number,
  body: AdminPrivacyUnmaskRequest
): Promise<InstructorMemberDetailResponse> {
  return unwrapApiBody(await membersApi.unmaskInstructorMemberPrivacy(memberId, body))
}

/** SCHOOL 전용 unmask path 없음 — legacy member unmask */
export async function unmaskMemberPrivacyRemote(
  memberId: number,
  body: AdminPrivacyUnmaskRequest
): Promise<MemberDetailResponse> {
  return unwrapApiBody(await membersApi.unmaskMemberPrivacy(memberId, body))
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

/** Swagger `listAdminApprovalRequests` — `GET /api/admin/admin-approval-requests` */
export async function fetchAdminApprovalRequestsPageRemote(
  params: ListAdminApprovalRequestsParams
): Promise<PageResponseAdminAccountListItemResponse> {
  return unwrapApiBody(
    await customInstance<unknown>({
      url: '/api/admin/admin-approval-requests',
      method: 'GET',
      params,
    })
  )
}

/** Swagger `approveAdminApprovalRequest` — `POST /api/admin/admin-approval-requests/{adminId}/approve` */
export async function approveAdminApprovalRequestRemote(
  adminId: number,
  body: AdminAccountApprovalDecisionRequest
) {
  await customInstance({
    url: `/api/admin/admin-approval-requests/${adminId}/approve`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

/** Swagger `rejectAdminApprovalRequest` — `POST /api/admin/admin-approval-requests/{adminId}/reject` */
export async function rejectAdminApprovalRequestRemote(
  adminId: number,
  body: AdminAccountApprovalDecisionRequest
) {
  await customInstance({
    url: `/api/admin/admin-approval-requests/${adminId}/reject`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

export async function verifyAdminAccountRemote(
  adminId: number,
  body: AdminAccountVerificationRequest
) {
  await membersApi.verifyAdmin(adminId, body)
}

/** Swagger `listAdmins` — `GET /api/admin/admin-accounts` */
export async function fetchAdminsPageRemote(
  params?: ListAdminsParams
): Promise<PageResponseAdminAccountListItemResponse> {
  return unwrapApiBody(await membersApi.listAdmins(params))
}

export async function changeAdminAccountRoleRemote(
  adminId: number,
  body: AdminRoleChangeRequest
) {
  await membersApi.changeAdminRole(adminId, body)
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
