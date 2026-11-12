import type {
  AdminAccountApprovalDecisionRequest,
  ListAdminApprovalRequestsParams,
} from '@/features/user/api/admin-approval-requests.types'
import type { BulkActionResponse as MembersBulkActionResponse } from '@/shared/api/generated/members/schemas/bulkActionResponse'
import { assertBulkActionSucceeded } from '@/features/user/api/lib/assert-bulk-action-succeeded'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { isFileDownloadPasswordErrorCode, messageForProtectedDownloadErrorCode } from '@jakorea/domain/shared/file-download-password'
import { extractApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { EXTERNAL_IDENTIFIER_PROVIDER_1365 } from '@/features/user/api/map-external-identifiers'
import {
  MEMBER_DETAIL_SCREEN_CODE,
  resolveLatestMemberAdminCommentDetail,
} from '@/features/user/api/map-member-comments'
import { getJAKoreaCMSBackendAPIMembersSubset } from '@/shared/api/generated/members/members-api'
import { loadSensitiveAdminFileBlob } from '@/shared/lib/admin-file-upload'
import { customInstance } from '@/shared/api/orval-mutator'
import { parseMemberConsentSummariesPayload } from '@/features/user/api/parse-member-consent-summaries-payload'
import { resolveConsentSignedSignatureField } from '@/features/user/shared/lib/resolve-consent-signed-signature-field'
import type { SchoolMemberDetailResponse } from '@/shared/api/generated/members/schemas/schoolMemberDetailResponse'
import type { AdminPreRegisterSchoolRequest } from '@/shared/api/generated/members/schemas/adminPreRegisterSchoolRequest'
import type {
  AdminAccountCreateRequest,
  AdminAccountResponse,
  AdminAccountVerificationRequest,
  AdminPreRegisterIndividualRequest,
  AdminPreRegisterInstructorRequest,
  AdminPrivacyUnmaskRequest,
  FilledDocumentResponse,
  SignedConsentDocumentResponse,
  AdminRoleChangeRequest,
  AdminRolePermissionMatrixResponse,
  AdminRolePermissionUpdateRequest,
  IndividualMemberDetailResponse,
  InstructorDetailResponse,
  InstructorMemberDetailResponse,
  InstructorRoleRequestDetailResponse,
  InstructorRoleBulkReviewRequest,
  InstructorRoleReviewRequest,
  ListAdminsParams,
  ListInstructorRoleRequestsParams,
  ListInstructorsParams,
  ListMembersParams,
  ListSchoolsParams,
  MemberDetailResponse,
  MemberWorkflowResponse,
  PageResponse,
  PageResponseAdminAccountListItemResponse,
  PageResponseInstructorRoleRequestListItemResponse,
  PageResponseSchoolOrganizationListItemResponse,
  SchoolAffiliatedTeacherResponse,
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
import type { NotificationResendRequest as NotificationResendRequestBody } from '@/shared/api/generated/members/schemas/notificationResendRequest'
import type { ListMemberApplicationsParams } from '@/shared/api/generated/members/schemas/listMemberApplicationsParams'
import type {
  BulkActionResponse,
  ListSchoolOrganizationProgramEnrollmentHistoryParams,
  PageResponseSchoolOrganizationProgramEnrollmentHistoryItemResponse,
  SchoolOrganizationProgramEnrollmentHistoryBulkDeleteRequest,
} from '@/features/user/api/school-organization-program-enrollment-history.types'
import type { ListMemberProgramHistoryParams } from '@/shared/api/generated/members/schemas/listMemberProgramHistoryParams'
import type { ListMemberAdminProgramsParams } from '@/shared/api/generated/members/schemas/listMemberAdminProgramsParams'
import type { ListProgramRolesParams } from '@/shared/api/generated/members/schemas/listProgramRolesParams'
import type { PageResponseAdminProgramAssignmentResponse } from '@/shared/api/generated/members/schemas/pageResponseAdminProgramAssignmentResponse'
import type { PageResponseMemberApplicationHistoryResponse } from '@/shared/api/generated/members/schemas/pageResponseMemberApplicationHistoryResponse'
import type { PageResponseMemberProgramHistoryResponse } from '@/shared/api/generated/members/schemas/pageResponseMemberProgramHistoryResponse'
import type { PageResponseMemberAdminProgramResponse } from '@/shared/api/generated/members/schemas/pageResponseMemberAdminProgramResponse'
import type { SchoolAffiliatedTeacherRow } from '@/shared/api/generated/members/schemas/schoolAffiliatedTeacherRow'
import type { ListMemberCommentsParams } from '@/shared/api/generated/members/schemas/listMemberCommentsParams'
import type { AdminPermissionResponse } from '@/shared/api/generated/members/schemas/adminPermissionResponse'
import type { AdminRoleResponse } from '@/shared/api/generated/members/schemas/adminRoleResponse'
import type { MemberConsentRecordResponse } from '@/shared/api/generated/members/schemas/memberConsentRecordResponse'
import type { MemberPortalConsentSummary } from '@/shared/api/generated/members/schemas/memberPortalConsentSummary'
import type { ExternalIdentifierResponse } from '@/shared/api/generated/members/schemas/externalIdentifierResponse'
import type { InstructorJaEvaluationInput } from '@/shared/api/generated/members/schemas/instructorJaEvaluationInput'
import type { InstructorJaEvaluationResponse } from '@/shared/api/generated/members/schemas/instructorJaEvaluationResponse'
import type { AdminSelfWithdrawalRequest } from '@/shared/api/generated/members/schemas/adminSelfWithdrawalRequest'
import type { AccountDirectoryBulkDeleteRequest } from '@/shared/api/generated/members/schemas/accountDirectoryBulkDeleteRequest'
import type { AdminMemberBulkDeleteRequest } from '@/shared/api/generated/members/schemas/adminMemberBulkDeleteRequest'
import type { AdminApprovalBulkDecisionRequest } from '@/shared/api/generated/members/schemas/adminApprovalBulkDecisionRequest'
import type { ApprovalResetRequest } from '@/shared/api/generated/members/schemas/approvalResetRequest'
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

/** Swagger `listInstructors` — `GET /api/admin/instructors` (jaGrade·settlementStatus) */
export async function fetchInstructorsPageRemote(
  params: ListInstructorsParams
): Promise<PageResponse> {
  return unwrapApiBody(await membersApi.listInstructors(params))
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
export async function bulkDeleteMembersRemote(body: AdminMemberBulkDeleteRequest) {
  return unwrapApiBody(await membersApi.bulkDeleteAndAnonymize(body))
}

/** Swagger `bulkDeleteAdmins` — `POST /api/admin/admin-accounts/bulk-delete` */
export async function bulkDeleteAdminsRemote(body: BulkDecisionRequest) {
  return unwrapApiBody(await membersApi.bulkDeleteAdmins(body))
}

/** Swagger `bulkDeleteSchools` — `POST /api/admin/organizations/schools/bulk-delete` */
export async function bulkDeleteSchoolsRemote(body: BulkDecisionRequest) {
  const result = unwrapApiBody<MembersBulkActionResponse>(await membersApi.bulkDeleteSchools(body))
  assertBulkActionSucceeded(result, '학교 일괄 삭제에 실패했습니다.')
  return result
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
    async () =>
      unwrapApiBody(
        await customInstance<SchoolMemberDetailResponse>({
          url: `/api/admin/users/${memberId}/school`,
          method: 'GET',
        })
      ),
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
  // OpenAPI members subset removed deprecated school-member detail; keep runtime path.
  return unwrapApiBody(
    await customInstance<SchoolMemberDetailResponse>({
      url: `/api/admin/users/${memberId}/school`,
      method: 'GET',
    })
  )
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

export async function fetchAdminAccountCommentsRemote(
  adminAccountId: number,
  params?: ListMemberCommentsParams
): Promise<AdminCommentResponse[]> {
  const data = await unwrapApiBody(await membersApi.listComments(adminAccountId, params))
  return Array.isArray(data) ? data : []
}

export async function fetchAdminCommentsRemote(
  resourceId: number,
  target: 'member' | 'schoolOrganization' | 'adminAccount',
  params?: ListMemberCommentsParams
): Promise<AdminCommentResponse[]> {
  if (target === 'adminAccount') {
    return fetchAdminAccountCommentsRemote(resourceId, params)
  }
  return fetchMemberCommentsRemote(resourceId, params)
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

export async function createAdminAccountCommentRemote(
  adminAccountId: number,
  body: AdminMemberCommentCreateRequest
): Promise<AdminCommentResponse> {
  return unwrapApiBody(await membersApi.createComment(adminAccountId, body))
}

export async function updateAdminAccountCommentRemote(
  adminAccountId: number,
  commentId: number,
  body: AdminCommentUpdateRequest
): Promise<AdminCommentResponse> {
  return unwrapApiBody(await membersApi.updateComment(adminAccountId, commentId, body))
}

/**
 * 회원/학교 organization/관리자 계정 관리자 코멘트 upsert.
 * - `adminAccount`: `/api/admin/admin-accounts/{adminAccountId}/comments`
 * - `schoolOrganization`: `/api/admin/users/{organizationId}/comments`
 * - `member`: `/api/admin/users/{memberId}/comments`
 */
export async function upsertMemberAdminCommentRemote(
  resourceId: number,
  comment: string,
  options?: {
    existingCommentId?: number
    screenCode?: string
    target?: 'member' | 'schoolOrganization' | 'adminAccount'
  }
): Promise<AdminCommentResponse> {
  const screenCode = options?.screenCode ?? MEMBER_DETAIL_SCREEN_CODE
  const target = options?.target ?? 'member'
  const trimmed = comment.trim()
  if (!trimmed) {
    throw new Error('관리자 코멘트가 비어 있습니다.')
  }

  let commentId = options?.existingCommentId
  if (commentId == null) {
    const existingComments = await fetchAdminCommentsRemote(resourceId, target, { screenCode }).catch(
      () => []
    )
    commentId = resolveLatestMemberAdminCommentDetail(existingComments, screenCode)?.commentId
  }

  if (commentId != null) {
    if (target === 'adminAccount') {
      return updateAdminAccountCommentRemote(resourceId, commentId, { comment: trimmed })
    }
    return updateMemberCommentRemote(resourceId, commentId, { comment: trimmed })
  }

  if (target === 'adminAccount') {
    return createAdminAccountCommentRemote(resourceId, { screenCode, comment: trimmed })
  }
  return createMemberCommentRemote(resourceId, { screenCode, comment: trimmed })
}

export async function deleteMemberCommentRemote(memberId: number, commentId: number): Promise<void> {
  await membersApi.deleteMemberComment(memberId, commentId)
}

export async function deleteAdminAccountCommentRemote(
  adminAccountId: number,
  commentId: number
): Promise<void> {
  await membersApi.deleteComment(adminAccountId, commentId)
}

/**
 * 회원/학교 organization/관리자 계정 관리자 코멘트 삭제 (내용을 비워 저장 — QA-0044).
 * - `adminAccount`: `DELETE /api/admin/admin-accounts/{adminAccountId}/comments/{commentId}`
 * - `member`·`schoolOrganization`: `DELETE /api/admin/users/{id}/comments/{commentId}`
 * 삭제할 코멘트를 찾지 못하면 아무것도 호출하지 않고 `false`.
 */
export async function deleteMemberAdminCommentRemote(
  resourceId: number,
  options?: {
    existingCommentId?: number
    screenCode?: string
    target?: 'member' | 'schoolOrganization' | 'adminAccount'
  }
): Promise<boolean> {
  const screenCode = options?.screenCode ?? MEMBER_DETAIL_SCREEN_CODE
  const target = options?.target ?? 'member'

  let commentId = options?.existingCommentId
  if (commentId == null) {
    const existingComments = await fetchAdminCommentsRemote(resourceId, target, { screenCode })
    commentId = resolveLatestMemberAdminCommentDetail(existingComments, screenCode)?.commentId
  }
  if (commentId == null) return false

  if (target === 'adminAccount') {
    await deleteAdminAccountCommentRemote(resourceId, commentId)
  } else {
    await deleteMemberCommentRemote(resourceId, commentId)
  }
  return true
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
  // OpenAPI members subset removed legacy member admin-programs DELETE; keep runtime path.
  await customInstance({
    url: `/api/admin/users/${memberId}/admin-programs/${programId}`,
    method: 'DELETE',
  })
}

/** Swagger `listProgramRoles` — GET admin-accounts/{adminAccountId}/program-roles (이력) */
export async function fetchAdminAccountProgramRolesRemote(
  adminAccountId: number,
  params?: ListProgramRolesParams
): Promise<PageResponseAdminProgramAssignmentResponse> {
  return unwrapApiBody(await membersApi.listProgramRoles(adminAccountId, params))
}

/** Swagger `listActiveProgramRoles` — GET admin-accounts/{adminAccountId}/program-roles/active */
export async function fetchAdminAccountActiveProgramRolesRemote(
  adminAccountId: number,
  params?: import('@/shared/api/generated/members/schemas/listActiveProgramRolesParams').ListActiveProgramRolesParams
): Promise<
  import('@/shared/api/generated/members/schemas/pageResponseAdminActiveProgramAssignmentResponse').PageResponseAdminActiveProgramAssignmentResponse
> {
  return unwrapApiBody(await membersApi.listActiveProgramRoles(adminAccountId, params))
}

/** Swagger `listSelectableRoles` — GET admin-roles/selectable (N-16 정본 역할) */
export async function fetchSelectableAdminRolesRemote(): Promise<
  import('@/shared/api/generated/members/schemas/adminRoleResponse').AdminRoleResponse[]
> {
  return unwrapApiBody(await membersApi.listSelectableRoles())
}

/** Swagger `deleteProgramRole` — DELETE admin-accounts/{adminAccountId}/program-roles/{programId} */
export async function deleteAdminAccountProgramRoleRemote(
  adminAccountId: number,
  programId: number
): Promise<void> {
  await membersApi.deleteProgramRole(adminAccountId, programId)
}

export type { NotificationResendRequestBody }

export async function resendInstructorRoleNotificationRemote(
  requestId: number,
  body?: NotificationResendRequestBody
): Promise<void> {
  await customInstance({
    url: `/api/admin/instructor-role-requests/${requestId}/resend-notification`,
    method: 'POST',
    ...(body && (body.timing || body.scheduledAt) ? { data: body } : {}),
  })
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
  params?: GetApplicationEnrollmentSummaryParams,
  options?: { skipGlobalErrorAlert?: boolean }
): Promise<MemberEnrollmentSummaryResponse> {
  return unwrapApiBody(
    await membersApi.getApplicationEnrollmentSummary(
      memberId,
      applicationId,
      params,
      options?.skipGlobalErrorAlert ? { skipGlobalErrorAlert: true } : undefined
    )
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

/** Members subset Orval에서 제외 — DELETE program-history/{participantId} */
export async function deleteMemberProgramHistoryRemote(
  memberId: number,
  participantId: number
): Promise<void> {
  await customInstance<void>({
    url: `/api/admin/users/${memberId}/program-history/${participantId}`,
    method: 'DELETE',
  })
}

/** Members subset Orval에서 제외 — POST program-history/bulk-delete */
export async function bulkDeleteProgramHistoryRemote(
  memberId: number,
  body: BulkDecisionRequest
): Promise<MembersBulkActionResponse> {
  const result = unwrapApiBody<MembersBulkActionResponse>(
    await customInstance<MembersBulkActionResponse>({
      url: `/api/admin/users/${memberId}/program-history/bulk-delete`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
  assertBulkActionSucceeded(result, '프로그램 이력 일괄 삭제에 실패했습니다.')
  return result
}

/** Swagger `downloadAllLectureReports` — GET users/{memberId}/lecture-reports/download */
export async function downloadAllMemberLectureReportsRemote(
  memberId: number
): Promise<import('@/shared/lib/lecture-report-bulk-download').LectureReportBulkDownloadJob> {
  return unwrapApiBody(
    await customInstance(
      {
        url: `/api/admin/users/${memberId}/lecture-reports/download`,
        method: 'GET',
      },
      { skipGlobalErrorAlert: true }
    )
  )
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
  // OpenAPI members subset removed legacy member admin-programs GET; keep runtime path.
  return unwrapApiBody(
    await customInstance<PageResponseMemberAdminProgramResponse>({
      url: `/api/admin/users/${memberId}/admin-programs`,
      method: 'GET',
      params,
    })
  )
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

/** GET /api/admin/users/{memberId}/consents — Envelope 없이 ConsentSummary[] */
export async function fetchMemberConsentSummariesRemote(
  memberId: number,
  signal?: AbortSignal
): Promise<MemberPortalConsentSummary[]> {
  const body = await customInstance<MemberPortalConsentSummary[] | { data?: unknown }>(
    {
      url: `/api/admin/users/${memberId}/consents`,
      method: 'GET',
      signal,
    },
    { skipGlobalErrorAlert: true }
  )
  return parseMemberConsentSummariesPayload(body)
}

/** POST 동의서 작성본 원문 — 민감정보, 쿼리 캐시에 넣지 말 것 */
export async function fetchConsentFilledDocumentRemote(
  memberId: number,
  consentType: string,
  body: AdminPrivacyUnmaskRequest,
  consentRecordId?: number
): Promise<FilledDocumentResponse> {
  return unwrapApiBody(
    await membersApi.consentFilledDocument(
      memberId,
      consentType,
      body,
      consentRecordId == null ? undefined : { consentRecordId },
      { skipGlobalErrorAlert: true }
    )
  )
}

function consentRecordQuery(consentRecordId?: number) {
  return consentRecordId == null ? undefined : { consentRecordId }
}

function asDownloadBlob(payload: unknown): Blob | null {
  if (payload instanceof Blob) return payload.size > 0 ? payload : null
  const unwrapped = unwrapApiBody(payload)
  if (unwrapped instanceof Blob) return unwrapped.size > 0 ? unwrapped : null
  return null
}

function isUsableSignatureImageBlob(blob: Blob | null): blob is Blob {
  if (blob == null || blob.size < 1) return false
  const type = blob.type.toLowerCase()
  if (type.includes('text/html') || type.includes('application/json')) return false
  return true
}

/** POST 전자서명 스냅샷 메타 — 민감정보, 쿼리 캐시에 넣지 말 것 */
export async function fetchConsentSignedDocumentRemote(
  memberId: number,
  consentType: string,
  body: AdminPrivacyUnmaskRequest,
  consentRecordId?: number
): Promise<SignedConsentDocumentResponse> {
  return unwrapApiBody(
    await membersApi.signedConsentDocument(
      memberId,
      consentType,
      body,
      consentRecordQuery(consentRecordId),
      { skipGlobalErrorAlert: true }
    )
  )
}

/** POST 전자서명 이미지 Blob — 실패 시 null (본문 보기를 막지 않음) */
export async function fetchConsentSignedSignatureImageRemote(
  memberId: number,
  consentType: string,
  fieldKey: string,
  body: AdminPrivacyUnmaskRequest,
  consentRecordId?: number
): Promise<Blob | null> {
  const payload = await membersApi.signedConsentSignatureImage(
    memberId,
    consentType,
    fieldKey,
    body,
    consentRecordQuery(consentRecordId),
    {
      skipGlobalErrorAlert: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'image/png,image/jpeg,image/webp,image/*,*/*',
      },
    }
  )
  const blob = asDownloadBlob(payload)
  return isUsableSignatureImageBlob(blob) ? blob : null
}

/** signed-document + 서명 이미지. content 실패 시 회원 서명 파일 민감 다운로드로 폴백 */
export async function loadConsentSignedSignatureBlobRemote(input: {
  memberId: number
  consentType: string
  reason: string
  consentRecordId?: number
}): Promise<Blob | null> {
  let signed: SignedConsentDocumentResponse
  try {
    signed = await fetchConsentSignedDocumentRemote(
      input.memberId,
      input.consentType,
      { reason: input.reason },
      input.consentRecordId
    )
  } catch {
    return null
  }
  const field = resolveConsentSignedSignatureField(signed.signatureFields)
  if (field == null) return null
  try {
    const blob = await fetchConsentSignedSignatureImageRemote(
      input.memberId,
      input.consentType,
      field.fieldKey,
      { reason: input.reason },
      input.consentRecordId
    )
    if (blob) return blob
  } catch {
    /* fileObjectId 폴백 */
  }
  if (field.signatureFileObjectId == null) return null
  try {
    const blob = await loadSensitiveAdminFileBlob({
      fileObjectId: field.signatureFileObjectId,
      reason: input.reason,
    })
    return isUsableSignatureImageBlob(blob) ? blob : null
  } catch {
    return null
  }
}

function mimeFromEvidenceFileName(fileName: string | null | undefined): string | null {
  const name = fileName?.trim().toLowerCase() ?? ''
  if (name.endsWith('.pdf')) return 'application/pdf'
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  if (name.endsWith('.webp')) return 'image/webp'
  return null
}

/** 스트림이 octet-stream이면 img·PDF 미리보기가 파일을 열지 못한다. */
function blobWithEvidenceMime(blob: Blob, fileName: string | null | undefined): Blob {
  if (blob.type && blob.type !== 'application/octet-stream') return blob
  const mime = mimeFromEvidenceFileName(fileName)
  if (!mime) return blob
  return new Blob([blob], { type: mime })
}

function shouldRethrowProtectedConsentDownloadError(error: unknown): boolean {
  const data =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined
  const code = extractApiErrorCode(data)
  return Boolean(messageForProtectedDownloadErrorCode(code) || isFileDownloadPasswordErrorCode(code))
}

/** 성범죄 첨부. claim으로 relayToken을 받은 뒤 stream으로 바이트를 받는다. */
export async function fetchConsentEvidenceBlobRemote(
  filled: FilledDocumentResponse,
  reason: string,
  password?: string
): Promise<Blob | null> {
  if (filled.evidenceFileObjectId == null) return null
  try {
    const blob = await loadSensitiveAdminFileBlob({
      fileObjectId: filled.evidenceFileObjectId,
      reason,
      claimPath: filled.evidenceDownloadEndpoint,
      password,
    })
    return blobWithEvidenceMime(blob, filled.evidenceOriginalFileName)
  } catch (error) {
    if (shouldRethrowProtectedConsentDownloadError(error)) throw error
    return null
  }
}

const CRIME_ORIGINAL_FALLBACK_FILENAME = '성범죄_경력조회_동의서.pdf'

/** 성범죄 업로드 원본. signed-document의 originalDownloadApi + SENSITIVE_FILE_DOWNLOAD. */
export async function fetchConsentOriginalFileBlobRemote(
  signed: SignedConsentDocumentResponse,
  reason: string,
  password?: string
): Promise<Blob | null> {
  if (signed.originalFileObjectId == null) return null
  try {
    const blob = await loadSensitiveAdminFileBlob({
      fileObjectId: signed.originalFileObjectId,
      reason,
      claimPath: signed.originalDownloadApi,
      password,
    })
    return blobWithEvidenceMime(blob, CRIME_ORIGINAL_FALLBACK_FILENAME)
  } catch (error) {
    if (shouldRethrowProtectedConsentDownloadError(error)) throw error
    return null
  }
}

/** signed-document originalFileObjectId → 민감 파일 relay. 없으면 filled evidence 폴백. */
export async function fetchConsentCrimeOriginalBlobRemote(input: {
  memberId: number
  consentType: string
  reason: string
  consentRecordId?: number
  filled?: FilledDocumentResponse | null
  password?: string
}): Promise<Blob | null> {
  try {
    const signed = await fetchConsentSignedDocumentRemote(
      input.memberId,
      input.consentType,
      { reason: input.reason },
      input.consentRecordId
    )
    const original = await fetchConsentOriginalFileBlobRemote(
      signed,
      input.reason,
      input.password
    )
    if (original != null) return original
  } catch (error) {
    if (shouldRethrowProtectedConsentDownloadError(error)) throw error
    /* filled evidence 폴백 */
  }
  if (input.filled == null) return null
  return fetchConsentEvidenceBlobRemote(input.filled, input.reason, input.password)
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
      reason: '회원 정보 수정',
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
  // OpenAPI members subset removed deprecated pre-register/school; keep runtime path.
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/users/pre-register/school`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
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

/** `POST /api/admin/users/{memberId}/teacher/privacy/unmask` — 순수 교사(`school_teacher`) 원문 */
export async function unmaskTeacherMemberPrivacyRemote(
  memberId: number,
  body: AdminPrivacyUnmaskRequest
): Promise<TeacherMemberDetailResponse> {
  return unwrapApiBody(await membersApi.unmaskTeacherMemberDetail(memberId, body))
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

export async function deleteMemberRemote(
  memberId: number,
  body: AdminMemberDeleteRequest | { reason: string; confirmationText: string }
) {
  await membersApi.deleteAndAnonymize(memberId, body as AdminMemberDeleteRequest)
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

export async function resetInstructorRoleRequestPendingRemote(
  requestId: number,
  body: ApprovalResetRequest
) {
  await membersApi.resetPending(requestId, body)
}

export async function cancelInstructorRoleApprovalRemote(
  requestId: number,
  body: ApprovalResetRequest
) {
  await membersApi.cancelApproval(requestId, body)
}

export async function bulkApproveInstructorRoleRequestsRemote(
  body: InstructorRoleBulkReviewRequest
) {
  const result = unwrapApiBody<MembersBulkActionResponse>(await membersApi.bulkApprove(body))
  assertBulkActionSucceeded(result, '강사 권한 일괄 승인에 실패했습니다.')
}

export async function bulkRejectInstructorRoleRequestsRemote(
  body: InstructorRoleBulkReviewRequest
) {
  const result = unwrapApiBody<MembersBulkActionResponse>(await membersApi.bulkReject(body))
  assertBulkActionSucceeded(result, '강사 권한 일괄 반려에 실패했습니다.')
}

/** Swagger `getAdminApprovalRequest` — `GET /api/admin/admin-approval-requests/{adminAccountId}` */
export async function fetchAdminApprovalRequestDetailRemote(
  adminAccountId: number
): Promise<AdminAccountApprovalDetailResponse> {
  return unwrapApiBody(await membersApi.getAdminApprovalRequest(adminAccountId))
}

export async function resetAdminApprovalRequestPendingRemote(
  adminAccountId: number,
  body: ApprovalResetRequest
) {
  await membersApi.resetAdminApprovalToPending(adminAccountId, body)
}

export async function cancelAdminApprovalRemote(
  adminAccountId: number,
  body: ApprovalResetRequest
) {
  await membersApi.cancelAdminApproval(adminAccountId, body)
}

export async function resendAdminApprovalNotificationRemote(
  adminAccountId: number,
  body?: NotificationResendRequestBody
): Promise<void> {
  await customInstance({
    url: `/api/admin/admin-approval-requests/${adminAccountId}/resend-notification`,
    method: 'POST',
    ...(body && (body.timing || body.scheduledAt) ? { data: body } : {}),
  })
}

export async function bulkApproveAdminApprovalRequestsRemote(
  body: AdminApprovalBulkDecisionRequest
) {
  const result = unwrapApiBody<MembersBulkActionResponse>(
    await membersApi.bulkApproveAdminApprovalRequests(body)
  )
  assertBulkActionSucceeded(result, '관리자 권한 일괄 승인에 실패했습니다.')
}

export async function bulkRejectAdminApprovalRequestsRemote(
  body: AdminApprovalBulkDecisionRequest
) {
  const result = unwrapApiBody<MembersBulkActionResponse>(
    await membersApi.bulkRejectAdminApprovalRequests(body)
  )
  assertBulkActionSucceeded(result, '관리자 권한 일괄 반려에 실패했습니다.')
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

/** Swagger `currentJaEvaluation` — GET /api/admin/instructors/{id}/ja-evaluation */
export async function fetchInstructorJaEvaluationRemote(
  instructorMemberId: number
): Promise<InstructorJaEvaluationResponse> {
  return unwrapApiBody(await membersApi.currentJaEvaluation(instructorMemberId))
}

/** Swagger `submitJaEvaluation` — POST /api/admin/instructors/{id}/ja-evaluation */
export async function submitInstructorJaEvaluationRemote(
  instructorMemberId: number,
  body: InstructorJaEvaluationInput
): Promise<InstructorJaEvaluationResponse> {
  return unwrapApiBody(await membersApi.submitJaEvaluation(instructorMemberId, body))
}

export async function withdrawAdminSelfRemote(
  body: AdminSelfWithdrawalRequest & { currentPassword: string }
): Promise<void> {
  await customInstance({
    url: '/api/admin/me/withdrawals',
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
