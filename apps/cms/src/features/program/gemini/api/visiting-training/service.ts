import type { GeminiApprovedTrainingDetail } from '@/features/program/gemini/model/approved/detail-types'
import type { GeminiInstructorApplicationRow } from '@/features/program/gemini/model/approved/instructor-application-types'
import type { GeminiApprovedTrainingRow } from '@/features/program/gemini/model/approved/types'
import type { GeminiRecruitmentDetail } from '@/features/program/gemini/model/recruitment/detail-types'
import type { GeminiInstitutionApplicationRow } from '@/features/program/gemini/model/recruitment/institution-application-types'
import type { GeminiRecruitmentAddFormSnapshot } from '@/features/program/gemini/lib/recruitment/add-local-save'
import type { GeminiRecruitmentInfoEditDraft } from '@/features/program/gemini/model/recruitment/info-edit-draft'
import type { GeminiRecruitmentRow } from '@/features/program/gemini/model/recruitment/types'
import {
  mapGeminiApprovedTrainingDetailResponseToDetail,
  mapGeminiInstructorApplicationItemToRow,
} from '@/features/program/gemini/model/approved/approved-detail-resolver'
import {
  mapGeminiOrganizationApplicationToRow,
  mapGeminiRecruitmentDetailToDetail,
  mapGeminiRecruitmentDetailToUpdateRequest,
  mapGeminiRecruitmentItemToApprovedRow,
  mapGeminiRecruitmentItemToRow,
  mapGeminiRecruitmentSnapshotToCreateRequest,
  toGeminiNumericIds,
} from './adapters'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import {
  fetchProgramAttachments,
  putProgramAttachments,
} from '@/features/program/shared/api/program-attachments'
import { putProgramThumbnail } from '@/features/program/shared/api/program-thumbnail'
import {
  pickProgramInlineImageHtmlPatch,
  putProgramInlineImages,
  prepareProgramInlineImageBind,
  syncProgramInlineImagesKeepProgram,
} from '@/features/program/shared/api/program-inline-images'
import { resolveGeminiAttachmentFileObjectIdsForSave } from '../../lib/recruitment/attachment-file-objects'
import {
  mapGeminiApprovedTrainingPrivacyUnmask,
  toGeminiApprovedTrainingUnmaskError,
  type GeminiApprovedTrainingPrivacyUnmasked,
} from '../../lib/approved/privacy-unmask'
import { shouldUseGeminiVisitingTrainingRemoteApi } from './capabilities'
import { canGeminiRecruitmentInfoEdit } from '../../lib/recruitment/info-edit-policy'
import {
  approveGeminiInstructorApplicationRemote,
  approveGeminiOrganizationApplicationRemote,
  bulkApproveGeminiOrganizationApplicationsRemote,
  bulkDeleteGeminiApprovedTrainingsRemote,
  bulkDeleteGeminiRecruitmentsRemote,
  bulkRejectGeminiOrganizationApplicationsRemote,
  createGeminiRecruitmentRemote,
  deleteGeminiApprovedTrainingRemote,
  deleteGeminiRecruitmentRemote,
  fetchGeminiApprovedInstructorApplicationsRemote,
  fetchGeminiInstructorApplicationDetailRemote,
  fetchGeminiApprovedTrainingDetailRemote,
  fetchGeminiApprovedTrainingsRemote,
  fetchGeminiOrganizationApplicationsRemote,
  fetchGeminiRecruitmentDetailRemote,
  fetchGeminiRecruitmentsRemotePage,
  rejectGeminiInstructorApplicationRemote,
  resendGeminiInstructorApplicationNotificationRemote,
  rejectGeminiOrganizationApplicationRemote,
  resendGeminiOrganizationApplicationNotificationRemote,
  unmaskGeminiApprovedTrainingPrivacyRemote,
  updateGeminiRecruitmentRemote,
  type GeminiApprovedTrainingRemoteFilters,
  type GeminiInstructorApplicationRemoteFilters,
  type GeminiInstructorNotificationResendPayload,
  type GeminiOrganizationApplicationApprovePayload,
  type GeminiOrganizationNotificationResendPayload,
  type GeminiRecruitmentRemoteFilters,
} from './client'

function assertRemoteReady(): void {
  if (shouldUseGeminiVisitingTrainingRemoteApi()) return
  throw new Error(
    'Gemini 찾아가는 연수 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

async function persistGeminiRecruitmentInlineHtml(
  programId: string,
  rewritten: unknown
): Promise<void> {
  const patch = pickProgramInlineImageHtmlPatch(rewritten)
  if (Object.keys(patch).length === 0) return
  await updateGeminiRecruitmentRemote(programId, patch as ProgramUpdateRequest)
}

export type GeminiRecruitmentsPage = {
  rows: GeminiRecruitmentRow[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

export type GeminiOrganizationApplicationsPage = {
  rows: GeminiInstitutionApplicationRow[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

export type GeminiApprovedTrainingsPage = {
  rows: GeminiApprovedTrainingRow[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

export type GeminiInstructorApplicationsPage = {
  rows: GeminiInstructorApplicationRow[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

export async function listGeminiRecruitmentsPage(
  filters: GeminiRecruitmentRemoteFilters,
  pageParam = 0
): Promise<GeminiRecruitmentsPage> {
  assertRemoteReady()
  const page = await fetchGeminiRecruitmentsRemotePage(filters, pageParam)
  const baseNo = page.page * page.size
  return {
    rows: page.items.map((item, index) =>
      // No. 오름차순 — 정렬 순서대로 1부터, 페이지가 넘어가도 이어진다(QA-0385·0423)
      mapGeminiRecruitmentItemToRow(item, baseNo + index)
    ),
    page: page.page,
    size: page.size,
    totalElements: page.totalElements,
    hasMore: page.hasMore,
  }
}

export async function getGeminiRecruitmentDetail(
  programId: string
): Promise<GeminiRecruitmentDetail | null> {
  assertRemoteReady()
  const dto = await fetchGeminiRecruitmentDetailRemote(programId)
  const detail = mapGeminiRecruitmentDetailToDetail(dto)
  const numericId = Number(dto.programId ?? programId)
  if (!Number.isFinite(numericId) || numericId < 1) return detail
  try {
    const attachments = await fetchProgramAttachments(numericId)
    const attachmentFileObjectIds = attachments
      .map(item => item.fileObjectId)
      .filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0)
    const attachmentFileNames = attachments
      .map(item => item.originalFileName?.trim())
      .filter((name): name is string => Boolean(name))
    return {
      ...detail,
      ...(attachmentFileObjectIds.length > 0 ? { attachmentFileObjectIds } : {}),
      attachmentFileNames:
        attachmentFileNames.length > 0 ? attachmentFileNames : detail.attachmentFileNames,
    }
  } catch {
    return detail
  }
}

export async function listGeminiOrganizationApplicationsPage(
  programId: string,
  filters: {
    status?: string
    organizationName?: string
    regionSido?: string
    regionSigungu?: string
    teacherName?: string
  } = {},
  pageParam = 0
): Promise<GeminiOrganizationApplicationsPage> {
  assertRemoteReady()
  const page = await fetchGeminiOrganizationApplicationsRemote(programId, filters, pageParam)
  const baseNo = page.page * page.size
  return {
    rows: page.items.map((item, index) =>
      mapGeminiOrganizationApplicationToRow(item, baseNo + index)
    ),
    page: page.page,
    size: page.size,
    totalElements: page.totalElements,
    hasMore: page.hasMore,
  }
}

export async function listGeminiApprovedTrainingsPage(
  filters: GeminiApprovedTrainingRemoteFilters,
  pageParam = 0
): Promise<GeminiApprovedTrainingsPage> {
  assertRemoteReady()
  const page = await fetchGeminiApprovedTrainingsRemote(filters, pageParam)
  const baseNo = page.page * page.size
  return {
    rows: page.items.map((item, index) =>
      mapGeminiRecruitmentItemToApprovedRow(item, baseNo + index)
    ),
    page: page.page,
    size: page.size,
    totalElements: page.totalElements,
    hasMore: page.hasMore,
  }
}

export async function getGeminiApprovedTrainingDetail(
  approvedTrainingId: string
): Promise<GeminiApprovedTrainingDetail> {
  assertRemoteReady()
  const dto = await fetchGeminiApprovedTrainingDetailRemote(approvedTrainingId)
  return mapGeminiApprovedTrainingDetailResponseToDetail(dto)
}

export type { GeminiApprovedTrainingPrivacyUnmasked }

/** 승인 연수 id 하나로 교사·배정 강사 원문을 조회한다. 응답은 쿼리 캐시에 넣지 않는다. */
export async function revealGeminiApprovedTrainingPersonalInfo(
  detail: Pick<GeminiApprovedTrainingDetail, 'id'>,
  reason: string
): Promise<GeminiApprovedTrainingPrivacyUnmasked> {
  assertRemoteReady()
  try {
    const dto = await unmaskGeminiApprovedTrainingPrivacyRemote(detail.id, reason)
    return mapGeminiApprovedTrainingPrivacyUnmask(dto)
  } catch (error) {
    throw toGeminiApprovedTrainingUnmaskError(error)
  }
}

export async function listGeminiApprovedInstructorApplicationsPage(
  approvedTrainingId: string,
  filters: GeminiInstructorApplicationRemoteFilters = {},
  pageParam = 0
): Promise<GeminiInstructorApplicationsPage> {
  assertRemoteReady()
  const page = await fetchGeminiApprovedInstructorApplicationsRemote(
    approvedTrainingId,
    filters,
    pageParam
  )
  const baseNo = page.page * page.size
  return {
    rows: page.items.map((item, index) =>
      mapGeminiInstructorApplicationItemToRow(item, approvedTrainingId, baseNo + index)
    ),
    page: page.page,
    size: page.size,
    totalElements: page.totalElements,
    hasMore: page.hasMore,
  }
}

export async function getGeminiInstructorApplicationDetail(
  approvedTrainingId: string,
  applicationId: string
): Promise<
  import('@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse').InstructorApplicationDetailResponse
> {
  assertRemoteReady()
  return fetchGeminiInstructorApplicationDetailRemote(approvedTrainingId, applicationId)
}

export async function approveGeminiInstructorApplication(
  applicationId: string,
  options?: {
    timing?: 'IMMEDIATE' | 'SCHEDULED' | null
    scheduledAt?: string | null
    replacement?: boolean | null
  }
): Promise<void> {
  assertRemoteReady()
  await approveGeminiInstructorApplicationRemote(applicationId, options)
}

export async function rejectGeminiInstructorApplication(
  applicationId: string,
  reason?: string
): Promise<void> {
  assertRemoteReady()
  await rejectGeminiInstructorApplicationRemote(applicationId, reason)
}

export async function resendGeminiInstructorApplicationNotification(
  applicationId: string,
  payload: GeminiInstructorNotificationResendPayload
): Promise<void> {
  assertRemoteReady()
  await resendGeminiInstructorApplicationNotificationRemote(applicationId, payload)
}

export async function createGeminiRecruitment(
  snapshot: GeminiRecruitmentAddFormSnapshot
): Promise<{ id: string; detail: GeminiRecruitmentDetail | null }> {
  assertRemoteReady()
  const request = mapGeminiRecruitmentSnapshotToCreateRequest(snapshot)
  const created = await createGeminiRecruitmentRemote(request)
  const id = String(created.id ?? '')
  if (id) {
    await syncProgramInlineImagesKeepProgram(id, request, rewritten =>
      persistGeminiRecruitmentInlineHtml(id, rewritten)
    )
  }
  const thumbnailFileObjectId = snapshot.thumbnailFileObjectId
  const numericId = Number(id)
  if (thumbnailFileObjectId != null && Number.isFinite(numericId) && numericId > 0) {
    try {
      await putProgramThumbnail(numericId, thumbnailFileObjectId)
    } catch (error) {
      // 썸네일 없이 등록 완료로 남지 않도록 방금 만든 공고를 지운다.
      await deleteGeminiRecruitmentRemote(id).catch(() => undefined)
      throw error
    }
  }
  const attachmentFileObjectIds = resolveGeminiAttachmentFileObjectIdsForSave(snapshot)
  if (attachmentFileObjectIds != null && Number.isFinite(numericId) && numericId > 0) {
    try {
      await putProgramAttachments(numericId, attachmentFileObjectIds)
    } catch (error) {
      // 첨부 연결 없이 등록 완료로 남지 않도록 방금 만든 공고를 지운다.
      await deleteGeminiRecruitmentRemote(id).catch(() => undefined)
      throw error
    }
  }
  let detail: GeminiRecruitmentDetail | null = null
  if (id) {
    try {
      detail = await getGeminiRecruitmentDetail(id)
    } catch {
      detail = null
    }
  }
  return { id, detail }
}

export async function updateGeminiRecruitment(
  programId: string,
  draft: GeminiRecruitmentInfoEditDraft,
  options?: { existingApplicationPeriodStart?: string | null }
): Promise<GeminiRecruitmentDetail | null> {
  assertRemoteReady()
  const recruitmentWindowLocked = !canGeminiRecruitmentInfoEdit(
    options?.existingApplicationPeriodStart ?? draft.applicationPeriodStart
  )
  const request = mapGeminiRecruitmentDetailToUpdateRequest(draft, { recruitmentWindowLocked })
  const prepared = await prepareProgramInlineImageBind(programId, request)
  const body = (prepared.didAdopt ? prepared.rewritten : request) as ProgramUpdateRequest
  await updateGeminiRecruitmentRemote(programId, body)
  if (prepared.fileObjectIds.length > 0) {
    await putProgramInlineImages(programId, prepared.fileObjectIds)
  }
  const numericId = Number(programId)
  if (draft.thumbnailFileObjectId !== undefined && Number.isFinite(numericId) && numericId > 0) {
    await putProgramThumbnail(numericId, draft.thumbnailFileObjectId)
  }
  if (draft.attachmentFileObjectIds !== undefined && Number.isFinite(numericId) && numericId > 0) {
    // PUT은 GENERAL 첨부 전체 교체 — 이미 연결된 첨부는 파일명으로 이어 붙인다.
    const existing = await fetchProgramAttachments(numericId)
    const attachmentFileObjectIds = resolveGeminiAttachmentFileObjectIdsForSave(draft, existing)
    if (attachmentFileObjectIds != null) {
      await putProgramAttachments(numericId, attachmentFileObjectIds)
    }
  }
  return getGeminiRecruitmentDetail(programId)
}

export async function deleteGeminiRecruitments(ids: string[]): Promise<void> {
  assertRemoteReady()
  const numericIds = toGeminiNumericIds(ids)
  if (numericIds.length === 0) {
    throw new Error('삭제할 모집 공고 ID가 올바르지 않습니다.')
  }
  if (numericIds.length === 1) {
    await deleteGeminiRecruitmentRemote(String(numericIds[0]))
    return
  }
  await bulkDeleteGeminiRecruitmentsRemote(numericIds)
}

export type GeminiApprovedTrainingsDeleteResult = {
  successIds: string[]
  failureCount: number
  failures: Array<{
    id: string
    code?: string
    message?: string
  }>
}

export async function deleteGeminiApprovedTrainings(
  ids: string[]
): Promise<GeminiApprovedTrainingsDeleteResult> {
  assertRemoteReady()
  const numericIds = toGeminiNumericIds(ids)
  if (numericIds.length === 0) {
    throw new Error('삭제할 승인 연수 ID가 올바르지 않습니다.')
  }
  if (numericIds.length === 1) {
    await deleteGeminiApprovedTrainingRemote(String(numericIds[0]))
    return { successIds: [String(numericIds[0])], failureCount: 0, failures: [] }
  }
  const result = await bulkDeleteGeminiApprovedTrainingsRemote(numericIds)
  const successIds = (result?.successIds ?? []).map(String)
  const failures = (result?.failures ?? [])
    .filter(failure => failure.id != null)
    .map(failure => ({
      id: String(failure.id),
      ...(failure.code ? { code: failure.code } : {}),
      ...(failure.message ? { message: failure.message } : {}),
    }))
  return {
    successIds,
    failureCount: result?.failureCount ?? numericIds.length - successIds.length,
    failures,
  }
}

export type GeminiOrganizationApplicationsApproveResult = {
  successIds: string[]
  failureCount: number
  failures: Array<{
    id: string
    code?: string
    message?: string
  }>
}

function mapGeminiBulkApproveResult(
  result: Awaited<ReturnType<typeof bulkApproveGeminiOrganizationApplicationsRemote>>,
  requestedIds: number[]
): GeminiOrganizationApplicationsApproveResult {
  const successIds = (result?.successIds ?? []).map(String)
  const failures = (result?.failures ?? [])
    .filter(failure => failure.id != null)
    .map(failure => ({
      id: String(failure.id),
      ...(failure.code ? { code: failure.code } : {}),
      ...(failure.message ? { message: failure.message } : {}),
    }))
  return {
    successIds,
    failureCount: result?.failureCount ?? requestedIds.length - successIds.length,
    failures,
  }
}

export async function approveGeminiOrganizationApplications(
  ids: string[],
  payload?: GeminiOrganizationApplicationApprovePayload
): Promise<GeminiOrganizationApplicationsApproveResult> {
  assertRemoteReady()
  const numericIds = toGeminiNumericIds(ids)
  if (numericIds.length === 0) {
    throw new Error('승인할 신청 ID가 올바르지 않습니다.')
  }
  if (numericIds.length === 1) {
    await approveGeminiOrganizationApplicationRemote(String(numericIds[0]), payload)
    return {
      successIds: [String(numericIds[0])],
      failureCount: 0,
      failures: [],
    }
  }
  const timing = payload?.timing ?? 'IMMEDIATE'
  if (timing === 'ON_ANNOUNCEMENT') {
    for (const id of numericIds) {
      await approveGeminiOrganizationApplicationRemote(String(id), payload)
    }
    return {
      successIds: numericIds.map(String),
      failureCount: 0,
      failures: [],
    }
  }
  const result = await bulkApproveGeminiOrganizationApplicationsRemote(numericIds, payload)
  return mapGeminiBulkApproveResult(result, numericIds)
}

export async function rejectGeminiOrganizationApplications(
  ids: string[],
  payload: { reason: string; timing?: string; scheduledAt?: string }
): Promise<void> {
  assertRemoteReady()
  const numericIds = toGeminiNumericIds(ids)
  if (numericIds.length === 0) {
    throw new Error('반려할 신청 ID가 올바르지 않습니다.')
  }
  if (numericIds.length === 1) {
    await rejectGeminiOrganizationApplicationRemote(String(numericIds[0]), payload)
    return
  }
  await bulkRejectGeminiOrganizationApplicationsRemote(numericIds, payload)
}

export async function resendGeminiOrganizationApplicationNotification(
  applicationId: string,
  payload: GeminiOrganizationNotificationResendPayload,
  idempotencyKey: string
): Promise<void> {
  assertRemoteReady()
  await resendGeminiOrganizationApplicationNotificationRemote(
    applicationId,
    payload,
    idempotencyKey
  )
}
