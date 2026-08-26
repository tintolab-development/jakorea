import type {
  AdminAccountApprovalDecisionRequest,
  ListAdminApprovalRequestsParams,
} from '@/features/user/api/admin-approval-requests.types'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { EXTERNAL_IDENTIFIER_PROVIDER_1365 } from '@/features/user/api/map-external-identifiers'
import {
  MEMBER_DETAIL_SCREEN_CODE,
  resolveLatestMemberAdminCommentDetail,
} from '@/features/user/api/map-member-comments'
import { getJAKoreaCMSBackendAPIMembersSubset } from '@/shared/api/generated/members/members-api'
import { customInstance } from '@/shared/api/orval-mutator'
import type {
  AdminAccountCreateRequest,
  AdminAccountResponse,
  AdminAccountVerificationRequest,
  AdminPreRegisterIndividualRequest,
  AdminPreRegisterInstructorRequest,
  AdminPreRegisterSchoolRequest,
  AdminPrivacyUnmaskRequest,
  FilledDocumentResponse,
  AdminRoleChangeRequest,
  AdminRolePermissionMatrixResponse,
  AdminRolePermissionUpdateRequest,
  IndividualMemberDetailResponse,
  InstructorDetailResponse,
  InstructorMemberDetailResponse,
  InstructorRoleRequestDetailResponse,
  InstructorRoleReviewRequest,
  ListAdminsParams,
  ListInstructorRoleRequestsParams,
  ListMembersParams,
  ListSchoolsParams,
  MemberDetailResponse,
  MemberWorkflowResponse,
  PageResponse,
  PageResponseAdminAccountListItemResponse,
  PageResponseInstructorRoleRequestListItemResponse,
  PageResponseSchoolOrganizationListItemResponse,
  SchoolAffiliatedTeacherResponse,
  SchoolMemberDetailResponse,
  SchoolOrganizationListItemResponse,
  SchoolOrganizationUpsertRequest,
  TeacherMemberDetailResponse,
  PortalSchoolSelectionRequest,
} from '@/shared/api/generated/members/schemas'
import type { AdminAccountApprovalDetailResponse } from '@/shared/api/generated/members/schemas/adminAccountApprovalDetailResponse'
import type { AdminAccountBasicInfoUpdateRequest } from '@/shared/api/generated/members/schemas/adminAccountBasicInfoUpdateRequest'
import type { AdminMemberBasicInfoUpdateRequest } from '@/shared/api/generated/members/schemas/adminMemberBasicInfoUpdateRequest'
import type { AdminMemberBasicInfoUpdateRequestWithAddress } from '@/features/user/api/map-patch-user-basic-info'
import type { AdminMemberCommentCreateRequest } from '@/shared/api/generated/members/schemas/adminMemberCommentCreateRequest'
import type { AdminCommentUpdateRequest } from '@/shared/api/generated/members/schemas/adminCommentUpdateRequest'
import type { AdminMemberDeleteRequest } from '@/shared/api/generated/members/schemas/adminMemberDeleteRequest'
import type { AdminCommentResponse } from '@/shared/api/generated/members/schemas/adminCommentResponse'
import type { UserResponse } from '@/shared/api/generated/members/schemas/userResponse'
import type { ListMemberApplicationsParams } from '@/shared/api/generated/members/schemas/listMemberApplicationsParams'
import type {
  BulkActionResponse,
  ListSchoolOrganizationProgramEnrollmentHistoryParams,
  PageResponseSchoolOrganizationProgramEnrollmentHistoryItemResponse,
  SchoolOrganizationProgramEnrollmentHistoryBulkDeleteRequest,
} from '@/features/user/api/school-organization-program-enrollment-history.types'
import type { ListMemberProgramHistoryParams } from '@/shared/api/generated/members/schemas/listMemberProgramHistoryParams'
import type { ListMemberAdminProgramsParams } from '@/shared/api/generated/members/schemas/listMemberAdminProgramsParams'
import type { ListProgramRoles1Params } from '@/shared/api/generated/members/schemas/listProgramRoles1Params'
import type { PageResponseAdminProgramAssignmentResponse } from '@/shared/api/generated/members/schemas/pageResponseAdminProgramAssignmentResponse'
import type { PageResponseMemberApplicationHistoryResponse } from '@/shared/api/generated/members/schemas/pageResponseMemberApplicationHistoryResponse'
import type { PageResponseMemberProgramHistoryResponse } from '@/shared/api/generated/members/schemas/pageResponseMemberProgramHistoryResponse'
import type { PageResponseMemberAdminProgramResponse } from '@/shared/api/generated/members/schemas/pageResponseMemberAdminProgramResponse'
import type { SchoolAffiliatedTeacherRow } from '@/shared/api/generated/members/schemas/schoolAffiliatedTeacherRow'
import type { ListMemberCommentsParams } from '@/shared/api/generated/members/schemas/listMemberCommentsParams'
import type { AdminPermissionResponse } from '@/shared/api/generated/members/schemas/adminPermissionResponse'
import type { AdminRoleResponse } from '@/shared/api/generated/members/schemas/adminRoleResponse'
import type { MemberConsentRecordResponse } from '@/shared/api/generated/members/schemas/memberConsentRecordResponse'
import type { ExternalIdentifierResponse } from '@/shared/api/generated/members/schemas/externalIdentifierResponse'
import type { InstructorEvaluationGradeChangeRequest } from '@/shared/api/generated/members/schemas/instructorEvaluationGradeChangeRequest'
import type { AccountDirectoryBulkDeleteRequest } from '@/shared/api/generated/members/schemas/accountDirectoryBulkDeleteRequest'
import type { BulkDecisionRequest } from '@/shared/api/generated/members/schemas/bulkDecisionRequest'
import type { ListAllCmsMembersAndAdminsParams } from '@/shared/api/generated/members/schemas/listAllCmsMembersAndAdminsParams'
import type { PageResponseAccountDirectoryItemResponse } from '@/shared/api/generated/members/schemas/pageResponseAccountDirectoryItemResponse'
import type { DeleteSchoolParams } from '@/shared/api/generated/members/schemas/deleteSchoolParams'
import type { DeleteApplicationHistoryParams } from '@/shared/api/generated/members/schemas/deleteApplicationHistoryParams'
import type { MemberEnrollmentSummaryResponse } from '@/shared/api/generated/members/schemas/memberEnrollmentSummaryResponse'
import type { MemberAssignmentSubmissionResponse } from '@/shared/api/generated/members/schemas/memberAssignmentSubmissionResponse'
import type { GetApplicationEnrollmentSummaryParams } from '@/shared/api/generated/members/schemas/getApplicationEnrollmentSummaryParams'
import type { ListAssignmentSubmissionsParams } from '@/shared/api/generated/members/schemas/listAssignmentSubmissionsParams'

const membersApi = getJAKoreaCMSBackendAPIMembersSubset()

export async function fetchMembersPageRemote(params: ListMembersParams): Promise<PageResponse> {
  return unwrapApiBody(await membersApi.listMembers(params))
}

/** Swagger `listAllCmsMembersAndAdmins` — `GET /api/admin/members/all` */
export type FetchAllCmsMembersAndAdminsParams = ListAllCmsMembersAndAdminsParams & {
  createdAtFrom?: string
  createdAtTo?: string
}

export async function fetchAllCmsMembersAndAdminsPageRemote(
  params?: FetchAllCmsMembersAndAdminsParams
): Promise<PageResponseAccountDirectoryItemResponse> {
  return unwrapApiBody(
    await membersApi.listAllCmsMembersAndAdmins(params as ListAllCmsMembersAndAdminsParams)
  )
}

/** Swagger `bulkDelete1` — `POST /api/admin/members/all/bulk-delete` */
export async function bulkDeleteAllAccountsRemote(body: AccountDirectoryBulkDeleteRequest) {
  return unwrapApiBody(await membersApi.bulkDelete1(body))
}

/** Swagger `bulkDeleteAndAnonymize` — `POST /api/admin/users/bulk-delete` */
export async function bulkDeleteMembersRemote(body: BulkDecisionRequest) {
  return unwrapApiBody(await membersApi.bulkDeleteAndAnonymize(body))
}

/** Swagger `bulkDeleteAdmins` — `POST /api/admin/admin-accounts/bulk-delete` */
export async function bulkDeleteAdminsRemote(body: BulkDecisionRequest) {
  return unwrapApiBody(await membersApi.bulkDeleteAdmins(body))
}

/** Swagger `bulkDeleteSchools` — `POST /api/admin/organizations/schools/bulk-delete` */
export async function bulkDeleteSchoolsRemote(body: BulkDecisionRequest) {
  return unwrapApiBody(await membersApi.bulkDeleteSchools(body))
}

/** Swagger `deleteSchool` — `DELETE /api/admin/organizations/schools/{organizationId}` */
export async function deleteSchoolRemote(organizationId: number, params?: DeleteSchoolParams) {
  await membersApi.deleteSchool(organizationId, params)
}

export async function fetchSchoolsPageRemote(
  params: ListSchoolsParams
): Promise<PageResponseSchoolOrganizationListItemResponse> {
  return unwrapApiBody(await membersApi.listSchools(params))
}

export async function fetchSchoolOrganizationRemote(
  organizationId: number
): Promise<SchoolOrganizationListItemResponse> {
  return unwrapApiBody(await membersApi.getSchool(organizationId))
}

export async function fetchSchoolTeachersRemote(
  organizationId: number
): Promise<SchoolAffiliatedTeacherResponse[]> {
  const data = await unwrapApiBody(await membersApi.listTeachers(organizationId))
  return Array.isArray(data) ? data : []
}

export async function createSchoolOrganizationRemote(
  body: SchoolOrganizationUpsertRequest
): Promise<SchoolOrganizationListItemResponse> {
  return unwrapApiBody(await membersApi.createSchool(body))
}

export async function updateTeacherEmploymentStatusRemote(
  organizationId: number,
  teacherMemberId: number,
  employmentStatus: string
): Promise<SchoolAffiliatedTeacherResponse> {
  return unwrapApiBody(
    await membersApi.updateTeacherEmploymentStatus(organizationId, teacherMemberId, {
      employmentStatus,
    })
  )
}

/**
 * @deprecated 역할별 상세 API 사용 권장.
 * 통합 GET이 제거되어 individual → school → instructor 순으로 `member` 스냅샷을 조회한다.
 */
export async function fetchMemberDetailRemote(memberId: number): Promise<MemberDetailResponse> {
  const loaders: Array<() => Promise<{ member?: MemberDetailResponse }>> = [
    async () => unwrapApiBody(await membersApi.getIndividualMemberDetail(memberId)),
    async () => unwrapApiBody(await membersApi.getSchoolMemberDetail(memberId)),
    async () => unwrapApiBody(await membersApi.getInstructorMemberDetail(memberId)),
  ]

  let lastError: unknown
  for (const load of loaders) {
    try {
      const detail = await load()
      if (detail.member) return detail.member
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('회원 상세를 불러오지 못했습니다.')
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

export async function fetchTeacherMemberDetailRemote(
  memberId: number
): Promise<TeacherMemberDetailResponse> {
  return unwrapApiBody(await membersApi.getTeacherMemberDetail(memberId))
}

export async function updateMemberBasicInfoRemote(
  memberId: number,
  body: AdminMemberBasicInfoUpdateRequestWithAddress
): Promise<UserResponse> {
  return unwrapApiBody(
    await membersApi.updateMemberBasicInfo(memberId, body as AdminMemberBasicInfoUpdateRequest)
  )
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

/**
 * 회원/학교 organization 관리자 코멘트 upsert.
 * path param `{memberId}`는 OpenAPI상 "대상 리소스 식별자" — 학교는 `organizationId`를 전달한다.
 */
export async function upsertMemberAdminCommentRemote(
  resourceId: number,
  comment: string,
  options?: { existingCommentId?: number; screenCode?: string }
): Promise<AdminCommentResponse> {
  const screenCode = options?.screenCode ?? MEMBER_DETAIL_SCREEN_CODE
  const trimmed = comment.trim()
  if (!trimmed) {
    throw new Error('관리자 코멘트가 비어 있습니다.')
  }

  let commentId = options?.existingCommentId
  if (commentId == null) {
    const existingComments = await fetchMemberCommentsRemote(resourceId, { screenCode }).catch(
      () => []
    )
    commentId = resolveLatestMemberAdminCommentDetail(existingComments, screenCode)?.commentId
  }

  if (commentId != null) {
    return updateMemberCommentRemote(resourceId, commentId, { comment: trimmed })
  }
  return createMemberCommentRemote(resourceId, { screenCode, comment: trimmed })
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

/** Swagger `listProgramRoles_1` — GET admin-accounts/{adminAccountId}/program-roles */
export async function fetchAdminAccountProgramRolesRemote(
  adminAccountId: number,
  params?: ListProgramRoles1Params
): Promise<PageResponseAdminProgramAssignmentResponse> {
  return unwrapApiBody(await membersApi.listProgramRoles1(adminAccountId, params))
}

/** Swagger `deleteProgramRole` — DELETE admin-accounts/{adminAccountId}/program-roles/{programId} */
export async function deleteAdminAccountProgramRoleRemote(
  adminAccountId: number,
  programId: number
): Promise<void> {
  await membersApi.deleteProgramRole(adminAccountId, programId)
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

/** Swagger `getApplicationEnrollmentSummary` — enrollment-summary */
export async function fetchApplicationEnrollmentSummaryRemote(
  memberId: number,
  applicationId: number,
  params?: GetApplicationEnrollmentSummaryParams
): Promise<MemberEnrollmentSummaryResponse> {
  return unwrapApiBody(
    await membersApi.getApplicationEnrollmentSummary(memberId, applicationId, params)
  )
}

/** Swagger `listAssignmentSubmissions` — assignment-submissions */
export async function fetchApplicationAssignmentSubmissionsRemote(
  memberId: number,
  applicationId: number,
  params?: ListAssignmentSubmissionsParams
): Promise<MemberAssignmentSubmissionResponse[]> {
  const data = await unwrapApiBody(
    await membersApi.listAssignmentSubmissions(memberId, applicationId, params)
  )
  return Array.isArray(data) ? data : []
}

/** Swagger `deleteApplicationHistory` — DELETE applications/{applicationId} */
export async function deleteMemberApplicationHistoryRemote(
  memberId: number,
  applicationId: number,
  params?: DeleteApplicationHistoryParams
): Promise<void> {
  await membersApi.deleteApplicationHistory(memberId, applicationId, params)
}

/** Swagger `deleteProgramHistory` — DELETE program-history/{participantId} */
export async function deleteMemberProgramHistoryRemote(
  memberId: number,
  participantId: number
): Promise<void> {
  await membersApi.deleteProgramHistory(memberId, participantId)
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

/** POST 동의서 작성본 원문 — 민감정보, 쿼리 캐시에 넣지 말 것 */
export async function fetchConsentFilledDocumentRemote(
  memberId: number,
  consentType: string,
  body: AdminPrivacyUnmaskRequest
): Promise<FilledDocumentResponse> {
  return unwrapApiBody(
    await membersApi.consentFilledDocument(memberId, consentType, body, {
      skipGlobalErrorAlert: true,
    })
  )
}

/** 성범죄 첨부 다운로드. presigned가 아니면 감사 사유를 다시 실어 릴레이한다. */
export async function fetchConsentEvidenceBlobRemote(
  filled: FilledDocumentResponse,
  reason: string
): Promise<Blob | null> {
  const endpoint = filled.evidenceDownloadEndpoint?.trim()
  if (endpoint) {
    try {
      const payload = await customInstance<Blob>(
        {
          url: endpoint,
          method: 'GET',
          responseType: 'blob',
        },
        { skipGlobalErrorAlert: true }
      )
      if (payload instanceof Blob && payload.size > 0 && payload.type !== 'application/json') {
        return payload
      }
    } catch {
      /* POST 릴레이 시도 */
    }
    try {
      const payload = await customInstance<Blob>(
        {
          url: endpoint,
          method: 'POST',
          data: { reason },
          responseType: 'blob',
        },
        { skipGlobalErrorAlert: true }
      )
      if (payload instanceof Blob && payload.size > 0 && payload.type !== 'application/json') {
        return payload
      }
    } catch {
      /* fileObjectId 폴백 */
    }
  }

  if (filled.evidenceFileObjectId == null) return null
  const payload = await customInstance<Blob>(
    {
      url: `/api/admin/files/${filled.evidenceFileObjectId}/sensitive-downloads/stream`,
      method: 'POST',
      data: { reason },
      responseType: 'blob',
    },
    { skipGlobalErrorAlert: true }
  )
  return payload instanceof Blob ? payload : null
}

export async function fetchMemberExternalIdentifiersRemote(
  memberId: number
): Promise<ExternalIdentifierResponse[]> {
  const data = await unwrapApiBody(await membersApi.externalIdentifiers(memberId))
  return Array.isArray(data) ? data : []
}

export async function upsertMember1365ExternalIdentifierRemote(
  memberId: number,
  externalId: string
): Promise<ExternalIdentifierResponse> {
  return unwrapApiBody(
    await membersApi.upsertExternalIdentifier(memberId, EXTERNAL_IDENTIFIER_PROVIDER_1365, {
      externalId,
      reason: 'CMS 관리자 회원 정보 수정',
    })
  )
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
  body: AdminPreRegisterInstructorRequest & { schoolSelection?: PortalSchoolSelectionRequest }
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

/** Swagger `unmask1` — `POST /api/admin/admin-accounts/{adminAccountId}/privacy/unmask` */
export async function unmaskAdminAccountPrivacyRemote(
  adminAccountId: number,
  body: AdminPrivacyUnmaskRequest
) {
  return unwrapApiBody(await membersApi.unmask1(adminAccountId, body))
}

/** Swagger `unmask` — `POST /api/admin/instructor-role-requests/{requestId}/privacy/unmask` */
export async function unmaskInstructorRoleRequestPrivacyRemote(
  requestId: number,
  body: AdminPrivacyUnmaskRequest
): Promise<InstructorRoleRequestDetailResponse> {
  return unwrapApiBody(await membersApi.unmask(requestId, body))
}

export async function deleteMemberRemote(memberId: number, body: AdminMemberDeleteRequest) {
  await membersApi.deleteAndAnonymize(memberId, body)
}

export async function fetchInstructorRoleRequestsPageRemote(
  params: ListInstructorRoleRequestsParams
): Promise<PageResponseInstructorRoleRequestListItemResponse> {
  return unwrapApiBody(await membersApi.listInstructorRoleRequests(params))
}

/** Swagger `getDetail` — `GET /api/admin/instructor-role-requests/{requestId}` */
export async function fetchInstructorRoleRequestDetailRemote(
  requestId: number
): Promise<InstructorRoleRequestDetailResponse> {
  return unwrapApiBody(await membersApi.getDetail(requestId))
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

/** Swagger `getAdminAccount` — `GET /api/admin/admin-accounts/{adminId}` */
export async function fetchAdminAccountDetailRemote(
  adminId: number
): Promise<AdminAccountApprovalDetailResponse> {
  return unwrapApiBody(await membersApi.getAdminAccount(adminId))
}

/** Swagger `updateAdminBasicInfo` — `PATCH /api/admin/admin-accounts/{adminId}/basic-info` */
export async function updateAdminBasicInfoRemote(
  adminId: number,
  body: AdminAccountBasicInfoUpdateRequest
): Promise<AdminAccountResponse> {
  return unwrapApiBody(await membersApi.updateAdminBasicInfo(adminId, body))
}

/** Swagger `deleteAdmin` — `DELETE /api/admin/admin-accounts/{adminId}` */
export async function deleteAdminAccountRemote(
  adminId: number,
  params?: { reason?: string }
): Promise<void> {
  await membersApi.deleteAdmin(adminId, params)
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

/** Swagger `changeEvaluationGrade` — `POST /api/admin/instructors/{instructorMemberId}/evaluation-grade` */
export async function changeInstructorEvaluationGradeRemote(
  instructorMemberId: number,
  body: InstructorEvaluationGradeChangeRequest
) {
  await customInstance({
    url: `/api/admin/instructors/${instructorMemberId}/evaluation-grade`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

/**
 * Swagger `revoke` — `POST /api/admin/instructors/{instructorId}/revoke`
 * path `instructorId` = 회원 memberId
 */
export async function revokeInstructorPermissionRemote(
  instructorId: number,
  body: InstructorRoleReviewRequest
) {
  await customInstance({
    url: `/api/admin/instructors/${instructorId}/revoke`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
}

/** Handoff — `GET .../organizations/schools/{organizationId}/program-enrollment-history` */
export async function fetchSchoolOrganizationProgramEnrollmentHistoryRemote(
  organizationId: number,
  params?: ListSchoolOrganizationProgramEnrollmentHistoryParams
): Promise<PageResponseSchoolOrganizationProgramEnrollmentHistoryItemResponse> {
  return unwrapApiBody(
    await customInstance<unknown>({
      url: `/api/admin/organizations/schools/${organizationId}/program-enrollment-history`,
      method: 'GET',
      params,
    })
  )
}

/** Handoff — `POST .../organizations/schools/{organizationId}/program-enrollment-history/bulk-delete` */
export async function bulkDeleteSchoolOrganizationProgramEnrollmentHistoryRemote(
  organizationId: number,
  body: SchoolOrganizationProgramEnrollmentHistoryBulkDeleteRequest
): Promise<BulkActionResponse> {
  return unwrapApiBody(
    await customInstance<unknown>({
      url: `/api/admin/organizations/schools/${organizationId}/program-enrollment-history/bulk-delete`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}
