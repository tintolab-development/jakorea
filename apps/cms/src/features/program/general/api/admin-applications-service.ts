import {
  filterVolunteerDoc1Rows,
  filterVolunteerDocPassedRows,
  filterVolunteerInterview2Rows,
  filterIndividualDoc1Rows,
  filterIndividualDocPassedRows,
  filterIndividualInterview2Rows,
  mapIndividualApplicationToApplicantRow,
  mapInstructorApplicationToApplicantInstructorRow,
  mapOrganizationApplicationToApplicantSchoolRow,
  mapVolunteerApplicationToGeneralVolunteerApplicantRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { mapParticipantsToVolunteerScreeningRows } from '@/features/program/general/lib/participant-volunteer-row-adapter'
import { shouldUseApplicationsHttpRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import type { QueryClient } from '@tanstack/react-query'
export {
  hydrateOrganizationApplicationSchedules,
  mergeHydratedOrganizationRows,
  schoolRowNeedsScheduleHydration,
} from '@/features/program/general/api/organization-application-schedules-hydrate'
import {
  approveIndividualApplicationRemote,
  approveIndividualApplicationWithEducationScopeRemote,
  approveVolunteerApplicationWithEducationScopeRemote,
  bulkApproveIndividualApplicationsWithEducationScopeRemote,
  bulkApproveVolunteerApplicationsWithEducationScopeRemote,
  bulkRejectIndividualApplicationsRemote,
  approveInstructorApplicationRemote,
  approveOrganizationApplicationRemote,
  bulkApproveInstructorApplicationsRemote,
  bulkApproveOrganizationApplicationsRemote,
  bulkRejectInstructorApplicationsRemote,
  bulkRejectOrganizationApplicationsRemote,
  cancelOrganizationApplicationApprovalRemote,
  cancelOrganizationApplicationRejectionRemote,
  cancelInstructorApplicationApprovalRemote,
  cancelInstructorApplicationRejectionRemote,
  createInterviewAssignmentRemote,
  createInterviewSlotRemote,
  fetchIndividualApplicationsRemote,
  fetchInstructorApplicationsRemote,
  fetchOrganizationApplicationsRemote,
  fetchVolunteerApplicationsRemote,
  giveUpVolunteerApplicationRemote,
  listInterviewSlotsRemote,
  rejectIndividualApplicationRemote,
  cancelIndividualApplicationApprovalRemote,
  cancelIndividualApplicationRejectionRemote,
  cancelVolunteerApplicationApprovalRemote,
  cancelVolunteerApplicationRejectionRemote,
  rejectInstructorApplicationRemote,
  rejectOrganizationApplicationRemote,
  resendInstructorApplicationNotification,
  resendOrganizationApplicationNotification,
  bulkIndividualDocumentResultsRemote,
  bulkVolunteerDocumentResultsRemote,
  bulkVolunteerFinalResultsRemote,
  submitIndividualDocumentResultRemote,
  submitIndividualFinalResultRemote,
  submitInterviewAssignmentEvaluationRemote,
  submitVolunteerDocumentResultRemote,
  submitVolunteerFinalResultRemote,
  updateVolunteerDocumentEvaluationRemote,
  type ApplicationDecisionCancelRequestWithNotification,
  type ApplicationsListQuery,
  type InstructorApplicationApprovalRequest,
  type InstructorApplicationDecisionWithReasonRequest,
  type InstructorApplicationNotificationRequest,
  type OrganizationApplicationApprovePayload,
  type OrganizationDecisionNotifyRequest,
  type ScreeningResultNotifyFields,
  type InterviewAssignmentEvaluationPayload,
} from '@/features/program/general/api/applications-api-client'
import { toInterviewAssignmentNotifyFields } from '@/features/program/general/api/screening-notify-fields'
import {
  sortGeneralParticipantDocPassedVolunteerRows,
  sortGeneralVolunteerByInterviewSlotCount,
  sortGeneralVolunteerDocPassedApplicants,
  type GeneralVolunteerApplicantRow,
} from '@/features/program/general/model/volunteer-applicant'
import { sortGeneralVolunteerInterview2Applicants } from '@/features/program/general/lib/general-volunteer-interview2-display'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import type { ApplicationDecisionResponse } from '@/shared/api/generated/dashboard/schemas/applicationDecisionResponse'
import type { BulkActionResponse } from '@/shared/api/generated/dashboard/schemas/bulkActionResponse'
import type { DocumentResultRequest } from '@/shared/api/generated/dashboard/schemas/documentResultRequest'
import type { VolunteerFinalResultRequest } from '@/shared/api/generated/dashboard/schemas/volunteerFinalResultRequest'
import type { GeneralSecondInterviewScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'
import type { GeneralManagerEvaluation } from '@/features/program/general/lib/volunteer-screening-constants'

export const GENERAL_PROGRAM_DETAIL_PAGE_SIZE = 20

export interface GeneralApplicationsListPage<Row> {
  rows: Row[]
  page: number
  size: number
  totalElements: number
  totalPages?: number
  hasMore: boolean
}

function resolveApplicationsListPage<Row>(
  rows: Row[],
  response: {
    page?: number
    size?: number
    totalElements?: number
    totalPages?: number
  },
  requestedPage: number
): GeneralApplicationsListPage<Row> {
  const page = response.page ?? requestedPage
  const size = response.size ?? GENERAL_PROGRAM_DETAIL_PAGE_SIZE
  const totalElements = response.totalElements ?? page * size + rows.length
  const totalPages = response.totalPages
  const hasMore =
    totalPages != null
      ? page + 1 < totalPages
      : (page + 1) * size < totalElements || rows.length === size
  return { rows, page, size, totalElements, totalPages, hasMore }
}

function toBulkNumericApplicationIds(ids: string[]): number[] | null {
  const numericIds = ids.map(id => Number(id))
  if (numericIds.some(id => !Number.isFinite(id))) return null
  return numericIds
}

function assertApplicationsRemoteReady(): void {
  if (!shouldUseApplicationsHttpRemoteApi()) {
    throw new Error(
      '프로그램 신청 API가 활성화되지 않았습니다. programs(또는 1사1교 opt-in)·applications 모듈과 API 로그인을 확인해 주세요.'
    )
  }
}

export type FetchGeneralOrganizationApplicationsPageOptions = {
  /** @deprecated 목록 fetch는 queryClient를 사용하지 않음. hydrate 시에만 필요 */
  queryClient?: QueryClient
}

export async function fetchGeneralOrganizationApplications(
  programId: string,
  options: FetchGeneralOrganizationApplicationsPageOptions,
  params?: ApplicationsListQuery
): Promise<ApplicantSchoolRow[]> {
  return (await fetchGeneralOrganizationApplicationsPage(programId, options, params)).rows
}

export async function fetchGeneralOrganizationApplicationsPage(
  programId: string,
  _options: FetchGeneralOrganizationApplicationsPageOptions,
  params?: ApplicationsListQuery
): Promise<GeneralApplicationsListPage<ApplicantSchoolRow>> {
  assertApplicationsRemoteReady()
  const requestedPage = params?.page ?? 0
  const page = await fetchOrganizationApplicationsRemote(programId, {
    page: requestedPage,
    size: GENERAL_PROGRAM_DETAIL_PAGE_SIZE,
    ...params,
  })
  const items = page.items ?? []
  const rows = items.map((item, index) =>
    mapOrganizationApplicationToApplicantSchoolRow(
      item,
      requestedPage * GENERAL_PROGRAM_DETAIL_PAGE_SIZE + index,
      programId
    )
  )
  return resolveApplicationsListPage(rows, page, requestedPage)
}

export async function fetchGeneralInstructorApplications(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicantInstructorRow[]> {
  return (await fetchGeneralInstructorApplicationsPage(programId, params)).rows
}

export async function fetchGeneralInstructorApplicationsPage(
  programId: string,
  params?: ApplicationsListQuery
): Promise<GeneralApplicationsListPage<ApplicantInstructorRow>> {
  assertApplicationsRemoteReady()
  const requestedPage = params?.page ?? 0
  const page = await fetchInstructorApplicationsRemote(programId, {
    page: requestedPage,
    size: GENERAL_PROGRAM_DETAIL_PAGE_SIZE,
    ...params,
  })
  const rows = (page.items ?? []).map((item, index) =>
    mapInstructorApplicationToApplicantInstructorRow(
      item,
      requestedPage * GENERAL_PROGRAM_DETAIL_PAGE_SIZE + index,
      programId
    )
  )
  return resolveApplicationsListPage(rows, page, requestedPage)
}

export async function fetchGeneralIndividualApplications(
  programId: string,
  options?: { doc1?: boolean; query?: ApplicationsListQuery }
): Promise<GeneralIndividualApplicantRow[]> {
  return (await fetchGeneralIndividualApplicationsPage(programId, options)).rows
}

export async function fetchGeneralIndividualApplicationsPage(
  programId: string,
  options?: { doc1?: boolean; query?: ApplicationsListQuery }
): Promise<GeneralApplicationsListPage<GeneralIndividualApplicantRow>> {
  assertApplicationsRemoteReady()
  const requestedPage = options?.query?.page ?? 0
  const page = await fetchIndividualApplicationsRemote(programId, {
    page: requestedPage,
    size: GENERAL_PROGRAM_DETAIL_PAGE_SIZE,
    ...options?.query,
  })
  const rows = (page.items ?? []).map((item, index) =>
    mapIndividualApplicationToApplicantRow(
      item,
      requestedPage * GENERAL_PROGRAM_DETAIL_PAGE_SIZE + index,
      programId
    )
  )
  return resolveApplicationsListPage(
    options?.doc1 ? filterIndividualDoc1Rows(rows) : rows,
    page,
    requestedPage
  )
}

export async function fetchGeneralIndividualDocPassedAsVolunteerRows(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const rows = await fetchGeneralIndividualApplications(programId)
  return sortGeneralVolunteerDocPassedApplicants(
    mapParticipantsToVolunteerScreeningRows(filterIndividualDocPassedRows(rows))
  )
}

export async function fetchGeneralIndividualScreeningApplicationsPage(
  programId: string,
  stage: 'docPassed' | 'interview2',
  pageParam: number
): Promise<GeneralApplicationsListPage<GeneralVolunteerApplicantRow>> {
  const page = await fetchGeneralIndividualApplicationsPage(programId, {
    query: { page: pageParam },
  })
  const rows =
    stage === 'interview2'
      ? sortGeneralParticipantDocPassedVolunteerRows(
          mapParticipantsToVolunteerScreeningRows(filterIndividualInterview2Rows(page.rows))
        )
      : sortGeneralVolunteerDocPassedApplicants(
          mapParticipantsToVolunteerScreeningRows(filterIndividualDocPassedRows(page.rows))
        )
  return { ...page, rows }
}

export async function fetchGeneralIndividualInterview2AsVolunteerRows(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const rows = await fetchGeneralIndividualApplications(programId)
  return sortGeneralParticipantDocPassedVolunteerRows(
    mapParticipantsToVolunteerScreeningRows(filterIndividualInterview2Rows(rows))
  )
}

export async function fetchGeneralVolunteerApplications(
  programId: string,
  params?: ApplicationsListQuery
): Promise<GeneralVolunteerApplicantRow[]> {
  return (await fetchGeneralVolunteerApplicationsPage(programId, params)).rows
}

export async function fetchGeneralVolunteerApplicationsPage(
  programId: string,
  params?: ApplicationsListQuery
): Promise<GeneralApplicationsListPage<GeneralVolunteerApplicantRow>> {
  assertApplicationsRemoteReady()
  const requestedPage = params?.page ?? 0
  const page = await fetchVolunteerApplicationsRemote(programId, {
    page: requestedPage,
    size: GENERAL_PROGRAM_DETAIL_PAGE_SIZE,
    ...params,
  })
  const rows = (page.items ?? []).map((item, index) =>
    mapVolunteerApplicationToGeneralVolunteerApplicantRow(
      item,
      requestedPage * GENERAL_PROGRAM_DETAIL_PAGE_SIZE + index,
      programId
    )
  )
  return resolveApplicationsListPage(rows, page, requestedPage)
}

export async function fetchGeneralVolunteerDoc1Applications(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerByInterviewSlotCount(filterVolunteerDoc1Rows(rows))
}

export async function fetchGeneralVolunteerDocPassedApplications(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerDocPassedApplicants(filterVolunteerDocPassedRows(rows))
}

export async function fetchGeneralVolunteerInterview2Applications(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerInterview2Applicants(filterVolunteerInterview2Rows(rows))
}

export async function fetchGeneralVolunteerScreeningApplicationsPage(
  programId: string,
  stage: 'doc1' | 'docPassed' | 'interview2',
  pageParam: number,
  query?: ApplicationsListQuery
): Promise<GeneralApplicationsListPage<GeneralVolunteerApplicantRow>> {
  const page = await fetchGeneralVolunteerApplicationsPage(programId, {
    ...query,
    page: pageParam,
  })
  const rows =
    stage === 'docPassed'
      ? sortGeneralVolunteerDocPassedApplicants(page.rows)
      : stage === 'interview2'
        ? sortGeneralVolunteerInterview2Applicants(page.rows)
        : sortGeneralVolunteerByInterviewSlotCount(page.rows)
  return { ...page, rows }
}

export async function approveGeneralOrganizationApplication(
  applicationId: string,
  payload?: OrganizationApplicationApprovePayload
): Promise<void> {
  assertApplicationsRemoteReady()
  await approveOrganizationApplicationRemote(applicationId, payload)
}

export async function rejectGeneralOrganizationApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await rejectOrganizationApplicationRemote(applicationId, payload)
}

export async function cancelGeneralOrganizationApplicationApproval(
  applicationId: string,
  payload: ApplicationDecisionCancelRequestWithNotification
): Promise<ApplicationDecisionResponse> {
  assertApplicationsRemoteReady()
  return cancelOrganizationApplicationApprovalRemote(applicationId, payload)
}

export async function cancelGeneralOrganizationApplicationRejection(
  applicationId: string,
  payload: ApplicationDecisionCancelRequestWithNotification
): Promise<void> {
  assertApplicationsRemoteReady()
  await cancelOrganizationApplicationRejectionRemote(applicationId, payload)
}

export async function bulkApproveGeneralOrganizationApplications(
  applicationIds: string[],
  notify?: OrganizationDecisionNotifyRequest
): Promise<BulkActionResponse> {
  assertApplicationsRemoteReady()
  const ids = toBulkNumericApplicationIds(applicationIds)
  if (!ids?.length) {
    throw new Error('기관 신청 ID를 확인할 수 없습니다.')
  }
  return bulkApproveOrganizationApplicationsRemote(ids, notify)
}

export async function bulkRejectGeneralOrganizationApplications(
  applicationIds: string[],
  payload: ApplicationRejectRequest
): Promise<BulkActionResponse> {
  assertApplicationsRemoteReady()
  const ids = toBulkNumericApplicationIds(applicationIds)
  if (!ids?.length) {
    throw new Error('기관 신청 ID를 확인할 수 없습니다.')
  }
  return bulkRejectOrganizationApplicationsRemote(ids, payload.reason, {
    ...(payload.timing ? { timing: payload.timing } : {}),
    ...(payload.scheduledAt ? { scheduledAt: payload.scheduledAt } : {}),
  })
}

export async function approveGeneralInstructorApplication(
  applicationId: string,
  payload?: InstructorApplicationApprovalRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await approveInstructorApplicationRemote(applicationId, payload)
}

export async function rejectGeneralInstructorApplication(
  applicationId: string,
  payload: ApplicationRejectRequest | InstructorApplicationDecisionWithReasonRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await rejectInstructorApplicationRemote(applicationId, payload)
}

export async function cancelGeneralInstructorApplicationApproval(
  applicationId: string,
  reason: string,
  notification?: InstructorApplicationNotificationRequest,
  faultParty?: 'USER' | 'ADMIN'
): Promise<void> {
  assertApplicationsRemoteReady()
  await cancelInstructorApplicationApprovalRemote(applicationId, {
    reason: reason.trim() || '승인 취소',
    ...(notification ? { notification } : {}),
    ...(faultParty ? { faultParty } : {}),
  })
}

export async function cancelGeneralInstructorApplicationRejection(
  applicationId: string,
  reason: string,
  notification?: InstructorApplicationNotificationRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await cancelInstructorApplicationRejectionRemote(applicationId, {
    reason: reason.trim() || '반려 취소',
    ...(notification ? { notification } : {}),
  })
}

export async function resendGeneralInstructorApplicationNotification(
  applicationId: string,
  payload: InstructorApplicationNotificationRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await resendInstructorApplicationNotification(applicationId, payload)
}

export async function resendGeneralOrganizationApplicationNotification(
  applicationId: string,
  payload: {
    timing: 'IMMEDIATE' | 'SCHEDULED'
    scheduledAt: string | null
    reason: string | null
  },
  idempotencyKey: string
): Promise<void> {
  assertApplicationsRemoteReady()
  await resendOrganizationApplicationNotification(applicationId, payload, idempotencyKey)
}

export async function bulkApproveGeneralInstructorApplications(
  applicationIds: string[],
  notify?: OrganizationDecisionNotifyRequest
): Promise<BulkActionResponse> {
  assertApplicationsRemoteReady()
  const ids = toBulkNumericApplicationIds(applicationIds)
  if (!ids?.length) {
    throw new Error('강사 신청 ID를 확인할 수 없습니다.')
  }
  return bulkApproveInstructorApplicationsRemote(ids, notify)
}

export async function bulkRejectGeneralInstructorApplications(
  applicationIds: string[],
  payload: ApplicationRejectRequest
): Promise<BulkActionResponse> {
  assertApplicationsRemoteReady()
  const ids = toBulkNumericApplicationIds(applicationIds)
  if (!ids?.length) {
    throw new Error('강사 신청 ID를 확인할 수 없습니다.')
  }
  return bulkRejectInstructorApplicationsRemote(ids, payload.reason, {
    ...(payload.timing ? { timing: payload.timing } : {}),
    ...(payload.scheduledAt ? { scheduledAt: payload.scheduledAt } : {}),
  })
}

/** 일정 없는 `/approve`. GENERAL_INDIVIDUAL 최종 승인 버튼에서는 호출하지 않는다. */
export async function approveGeneralIndividualApplication(applicationId: string): Promise<void> {
  assertApplicationsRemoteReady()
  await approveIndividualApplicationRemote(applicationId)
}

export async function approveGeneralIndividualApplicationWithEducationScope(
  applicationId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/individualApprovalWithScopeRequest').IndividualApprovalWithScopeRequest
) {
  assertApplicationsRemoteReady()
  return approveIndividualApplicationWithEducationScopeRemote(applicationId, payload)
}

export async function bulkApproveGeneralIndividualApplicationsWithEducationScope(
  payload: {
    reason: string
    targets: import('@/shared/api/generated/dashboard/schemas/individualApprovalWithScopeBulkTarget').IndividualApprovalWithScopeBulkTarget[]
  } & import('@/features/program/general/api/applications-api-client').OrganizationDecisionNotifyRequest
) {
  assertApplicationsRemoteReady()
  return bulkApproveIndividualApplicationsWithEducationScopeRemote(payload)
}

export async function rejectGeneralIndividualApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await rejectIndividualApplicationRemote(applicationId, payload)
}

export async function bulkRejectGeneralIndividualApplications(
  applicationIds: string[],
  payload: ApplicationRejectRequest
): Promise<BulkActionResponse> {
  assertApplicationsRemoteReady()
  const ids = toBulkNumericApplicationIds(applicationIds)
  if (!ids?.length) {
    throw new Error('개인 신청 ID를 확인할 수 없습니다.')
  }
  return bulkRejectIndividualApplicationsRemote(ids, payload.reason, {
    ...(payload.timing ? { timing: payload.timing } : {}),
    ...(payload.scheduledAt ? { scheduledAt: payload.scheduledAt } : {}),
  })
}

export async function cancelGeneralIndividualApplicationRejection(
  applicationId: string,
  reason: string,
  notification?: InstructorApplicationNotificationRequest
): Promise<ApplicationDecisionResponse> {
  assertApplicationsRemoteReady()
  const payload: ApplicationDecisionCancelRequestWithNotification = {
    reason: reason.trim() || '반려 취소',
    ...(notification ? { notification } : {}),
  }
  return cancelIndividualApplicationRejectionRemote(applicationId, payload)
}

export async function cancelGeneralIndividualApplicationApproval(
  applicationId: string,
  reason: string,
  notification?: InstructorApplicationNotificationRequest
): Promise<ApplicationDecisionResponse> {
  assertApplicationsRemoteReady()
  return cancelIndividualApplicationApprovalRemote(applicationId, {
    reason: reason.trim() || '승인 취소',
    ...(notification ? { notification } : {}),
  })
}

export async function cancelGeneralVolunteerApplicationRejection(
  applicationId: string,
  reason: string,
  notification?: InstructorApplicationNotificationRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await cancelVolunteerApplicationRejectionRemote(applicationId, {
    reason: reason.trim() || '반려 취소',
    ...(notification ? { notification } : {}),
  })
}

export async function cancelGeneralVolunteerApplicationApproval(
  applicationId: string,
  reason: string,
  notification?: InstructorApplicationNotificationRequest
): Promise<ApplicationDecisionResponse> {
  assertApplicationsRemoteReady()
  return cancelVolunteerApplicationApprovalRemote(applicationId, {
    reason: reason.trim() || '승인 취소',
    ...(notification ? { notification } : {}),
  })
}

export async function submitGeneralVolunteerDocumentResult(
  applicationId: string,
  payload: DocumentResultRequest & ScreeningResultNotifyFields
): Promise<void> {
  assertApplicationsRemoteReady()
  await submitVolunteerDocumentResultRemote(applicationId, payload)
}

export async function updateGeneralVolunteerDocumentEvaluation(
  applicationId: string,
  managerSlot: 'A' | 'B',
  evaluation: GeneralManagerEvaluation
): Promise<void> {
  assertApplicationsRemoteReady()
  await updateVolunteerDocumentEvaluationRemote(applicationId, managerSlot, {
    // BE pattern: PASS|NEUTRAL|FAIL|UNREVIEWED
    evaluation: evaluation.toUpperCase(),
  })
}

/**
 * 봉사자 서류 결과 일괄 처리.
 * `POST /api/admin/volunteer-applications/document-results/bulk`
 */
export async function submitGeneralVolunteerDocumentResultBulk(
  applicationIds: string[],
  payload: Pick<DocumentResultRequest, 'result' | 'reason'> & ScreeningResultNotifyFields
): Promise<BulkActionResponse> {
  assertApplicationsRemoteReady()
  const ids = toBulkNumericApplicationIds(applicationIds)
  if (!ids?.length) {
    throw new Error('봉사자 신청 ID를 확인할 수 없습니다.')
  }
  return bulkVolunteerDocumentResultsRemote({
    ids,
    result: payload.result,
    reason: payload.reason,
    ...(payload.notifyTiming ? { notifyTiming: payload.notifyTiming } : {}),
    ...(payload.scheduledAt ? { scheduledAt: payload.scheduledAt } : {}),
  })
}

export async function submitGeneralIndividualDocumentResult(
  applicationId: string,
  payload: DocumentResultRequest & ScreeningResultNotifyFields
): Promise<void> {
  assertApplicationsRemoteReady()
  await submitIndividualDocumentResultRemote(applicationId, payload)
}

export async function submitGeneralIndividualDocumentResultBulk(
  applicationIds: string[],
  payload: Pick<DocumentResultRequest, 'result' | 'reason'> & ScreeningResultNotifyFields
): Promise<BulkActionResponse> {
  assertApplicationsRemoteReady()
  const ids = toBulkNumericApplicationIds(applicationIds)
  if (!ids?.length) throw new Error('참여자 신청 ID를 확인할 수 없습니다.')
  return bulkIndividualDocumentResultsRemote({
    ids,
    result: payload.result,
    reason: payload.reason,
    ...(payload.notifyTiming ? { notifyTiming: payload.notifyTiming } : {}),
    ...(payload.scheduledAt ? { scheduledAt: payload.scheduledAt } : {}),
  })
}

export async function submitGeneralVolunteerFinalResult(
  applicationId: string,
  payload: VolunteerFinalResultRequest & ScreeningResultNotifyFields
): Promise<ApplicationDecisionResponse> {
  assertApplicationsRemoteReady()
  return submitVolunteerFinalResultRemote(applicationId, payload)
}

export async function approveGeneralVolunteerApplicationWithEducationScope(
  applicationId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/individualApprovalWithScopeRequest').IndividualApprovalWithScopeRequest
) {
  assertApplicationsRemoteReady()
  return approveVolunteerApplicationWithEducationScopeRemote(applicationId, payload)
}

export async function bulkApproveGeneralVolunteerApplicationsWithEducationScope(
  payload: {
    reason: string
    targets: import('@/shared/api/generated/dashboard/schemas/individualApprovalWithScopeBulkTarget').IndividualApprovalWithScopeBulkTarget[]
  } & import('@/features/program/general/api/applications-api-client').OrganizationDecisionNotifyRequest
) {
  assertApplicationsRemoteReady()
  return bulkApproveVolunteerApplicationsWithEducationScopeRemote(payload)
}

/**
 * 봉사자 최종(2차 면접) 결과 일괄 처리.
 * `POST /api/admin/volunteer-applications/final-results/bulk`
 */
export async function submitGeneralVolunteerFinalResultBulk(
  applicationIds: string[],
  payload: VolunteerFinalResultRequest & ScreeningResultNotifyFields
): Promise<BulkActionResponse> {
  assertApplicationsRemoteReady()
  const ids = toBulkNumericApplicationIds(applicationIds)
  if (!ids?.length) {
    throw new Error('봉사자 신청 ID를 확인할 수 없습니다.')
  }
  return bulkVolunteerFinalResultsRemote({
    ids,
    result: payload.result,
    reason: payload.reason,
    reserveRank: payload.reserveRank,
    ...(payload.notifyTiming ? { notifyTiming: payload.notifyTiming } : {}),
    ...(payload.scheduledAt ? { scheduledAt: payload.scheduledAt } : {}),
  })
}

export async function submitGeneralInterviewAssignmentEvaluation(
  assignmentId: string | number,
  payload: InterviewAssignmentEvaluationPayload
): Promise<void> {
  assertApplicationsRemoteReady()
  await submitInterviewAssignmentEvaluationRemote(assignmentId, payload)
}

export async function submitGeneralIndividualFinalResult(
  applicationId: string,
  payload: VolunteerFinalResultRequest & ScreeningResultNotifyFields
): Promise<void> {
  assertApplicationsRemoteReady()
  await submitIndividualFinalResultRemote(applicationId, payload)
}

export async function giveUpGeneralVolunteerApplication(
  applicationId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/applicationGiveUpRequest').ApplicationGiveUpRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  const trimmed = payload.reason.trim()
  await giveUpVolunteerApplicationRemote(applicationId, {
    reason: trimmed,
    ...(payload.stopScheduleId != null ? { stopScheduleId: payload.stopScheduleId } : {}),
    ...(payload.faultParty != null ? { faultParty: payload.faultParty } : {}),
  })
}

/**
 * 동일 일시 슬롯이 있으면 재사용, 없으면 생성.
 */
async function resolveInterviewSlotId(params: {
  programId: string
  slotDate: string
  startAt: string
  endAt: string
  maxAssignCount?: number
}): Promise<number> {
  const existing = await listInterviewSlotsRemote(params.programId, {
    from: params.slotDate,
    to: params.slotDate,
  })
  const matched = existing.find(
    row =>
      row.interviewSlotId != null &&
      row.slotDate === params.slotDate &&
      row.startAt === params.startAt &&
      row.endAt === params.endAt
  )
  if (matched?.interviewSlotId != null) {
    return matched.interviewSlotId
  }

  const slot = await createInterviewSlotRemote(params.programId, {
    slotDate: params.slotDate,
    startAt: params.startAt,
    endAt: params.endAt,
    maxAssignCount: params.maxAssignCount ?? 1,
    exceptionSlot: false,
  })
  if (slot.interviewSlotId == null) {
    throw new Error('면접 슬롯 생성 응답에 interviewSlotId가 없습니다.')
  }
  return slot.interviewSlotId
}

/**
 * 면접 슬롯 생성(또는 재사용) 후 봉사자 신청에 배정.
 * Canonical: POST /api/admin/interview-assignments + volunteerApplicationId
 */
export async function assignGeneralVolunteerInterview(params: {
  programId: string
  applicationId: string
  slotDate: string
  startAt: string
  endAt: string
  maxAssignCount?: number
  notifyTiming?: string
  scheduledAt?: string
}): Promise<{ interviewSlotId?: number; interviewAssignmentId?: number }> {
  assertApplicationsRemoteReady()

  const volunteerApplicationId = Number(params.applicationId)
  if (!Number.isFinite(volunteerApplicationId)) {
    throw new Error('봉사자 신청 ID가 올바르지 않습니다.')
  }

  const interviewSlotId = await resolveInterviewSlotId(params)

  const notifyFields = toInterviewAssignmentNotifyFields({
    notifyTiming: params.notifyTiming,
    scheduledAt: params.scheduledAt,
  })
  const assignment = await createInterviewAssignmentRemote({
    volunteerApplicationId,
    interviewSlotId,
    ...notifyFields,
  })

  return {
    interviewSlotId,
    interviewAssignmentId: assignment.interviewAssignmentId,
  }
}

/**
 * 면접 슬롯 생성(또는 재사용) 후 개인 신청에 배정.
 * Canonical: POST /api/admin/interview-assignments + individualApplicationId
 */
export async function assignGeneralIndividualInterview(params: {
  programId: string
  applicationId: string
  slotDate: string
  startAt: string
  endAt: string
  maxAssignCount?: number
  notifyTiming?: string
  scheduledAt?: string
}): Promise<{ interviewSlotId?: number; interviewAssignmentId?: number }> {
  assertApplicationsRemoteReady()

  const individualApplicationId = Number(params.applicationId)
  if (!Number.isFinite(individualApplicationId)) {
    throw new Error('개인 신청 ID가 올바르지 않습니다.')
  }

  const interviewSlotId = await resolveInterviewSlotId(params)

  const notifyFields = toInterviewAssignmentNotifyFields({
    notifyTiming: params.notifyTiming,
    scheduledAt: params.scheduledAt,
  })
  const assignment = await createInterviewAssignmentRemote({
    individualApplicationId,
    interviewSlotId,
    ...notifyFields,
  })

  return {
    interviewSlotId,
    interviewAssignmentId: assignment.interviewAssignmentId,
  }
}

export function mapSecondInterviewStatusToFinalResultPayload(
  status: Extract<
    GeneralSecondInterviewScreeningStatus,
    'pass' | 'fail' | 'reserve1' | 'reserve2' | 'reserve3' | 'reserve4'
  >,
  reason?: string,
  notify?: ScreeningResultNotifyFields
): VolunteerFinalResultRequest & ScreeningResultNotifyFields {
  const notifyFields: ScreeningResultNotifyFields = {
    ...(notify?.notifyTiming ? { notifyTiming: notify.notifyTiming } : {}),
    ...(notify?.scheduledAt ? { scheduledAt: notify.scheduledAt } : {}),
  }
  if (status === 'pass') return { result: 'PASS', reason, ...notifyFields }
  if (status === 'fail') return { result: 'FAIL', reason, ...notifyFields }
  const rank = Number(status.replace('reserve', '')) as 1 | 2 | 3 | 4
  return { result: 'RESERVE', reserveRank: rank, reason, ...notifyFields }
}

export type GeneralInterviewSlotListItem = {
  interviewSlotId: number
  slotDate: string
  startAt: string
  endAt: string
  maxAssignCount: number
  assignedCount: number
  exceptionSlot: boolean
}

/**
 * GET interview-slots. mock 폴백 없음 — 실패 시 throw.
 */
export async function listGeneralInterviewSlots(
  programId: string,
  range?: { from?: string; to?: string }
): Promise<GeneralInterviewSlotListItem[]> {
  assertApplicationsRemoteReady()
  const rows = await listInterviewSlotsRemote(programId, range)
  return rows
    .filter(row => row.interviewSlotId != null && row.slotDate && row.startAt && row.endAt)
    .map(row => ({
      interviewSlotId: row.interviewSlotId as number,
      slotDate: row.slotDate as string,
      startAt: row.startAt as string,
      endAt: row.endAt as string,
      maxAssignCount: row.maxAssignCount ?? 1,
      assignedCount: row.currentAssignCount ?? 0,
      exceptionSlot: row.exceptionSlot ?? false,
    }))
}
