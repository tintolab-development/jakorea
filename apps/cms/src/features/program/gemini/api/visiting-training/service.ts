import type { GeminiApprovedTrainingDetail } from '@/features/program/gemini/model/approved/detail-types'
import {
  mapGeminiApprovedTrainingPrivacyUnmask,
  toGeminiApprovedTrainingUnmaskError,
  type GeminiApprovedTrainingPrivacyUnmasked,
} from '@/features/program/gemini/lib/approved/privacy-unmask'
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
import { putProgramThumbnail } from '@/features/program/shared/api/program-thumbnail'
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
  fetchGeminiApprovedTrainingDetailRemote,
  fetchGeminiApprovedTrainingsRemote,
  fetchGeminiOrganizationApplicationsRemote,
  fetchGeminiRecruitmentDetailRemote,
  fetchGeminiRecruitmentsRemotePage,
  rejectGeminiInstructorApplicationRemote,
  rejectGeminiOrganizationApplicationRemote,
  resendGeminiOrganizationApplicationNotificationRemote,
  unmaskGeminiApprovedTrainingPrivacyRemote,
  updateGeminiRecruitmentRemote,
  type GeminiApprovedTrainingRemoteFilters,
  type GeminiInstructorApplicationRemoteFilters,
  type GeminiOrganizationNotificationResendPayload,
  type GeminiRecruitmentRemoteFilters,
} from './client'

function assertRemoteReady(): void {
  if (shouldUseGeminiVisitingTrainingRemoteApi()) return
  throw new Error(
    'Gemini 찾아가는 연수 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요. mock 폴백은 사용하지 않습니다.'
  )
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
      mapGeminiRecruitmentItemToRow(
        item,
        Math.max(page.totalElements - baseNo - index - 1, 0)
      )
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
  return mapGeminiRecruitmentDetailToDetail(dto)
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

export async function approveGeminiInstructorApplication(applicationId: string): Promise<void> {
  assertRemoteReady()
  await approveGeminiInstructorApplicationRemote(applicationId)
}

export async function rejectGeminiInstructorApplication(
  applicationId: string,
  reason?: string
): Promise<void> {
  assertRemoteReady()
  await rejectGeminiInstructorApplicationRemote(applicationId, reason)
}

export async function createGeminiRecruitment(
  snapshot: GeminiRecruitmentAddFormSnapshot
): Promise<{ id: string; detail: GeminiRecruitmentDetail | null }> {
  assertRemoteReady()
  const request = mapGeminiRecruitmentSnapshotToCreateRequest(snapshot)
  const created = await createGeminiRecruitmentRemote(request)
  const id = String(created.id ?? '')
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
  await updateGeminiRecruitmentRemote(
    programId,
    mapGeminiRecruitmentDetailToUpdateRequest(draft, { recruitmentWindowLocked })
  )
  const numericId = Number(programId)
  if (draft.thumbnailFileObjectId !== undefined && Number.isFinite(numericId) && numericId > 0) {
    await putProgramThumbnail(numericId, draft.thumbnailFileObjectId)
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
    return { successIds: [String(numericIds[0])], failureCount: 0 }
  }
  const result = await bulkDeleteGeminiApprovedTrainingsRemote(numericIds)
  const successIds = (result?.successIds ?? []).map(String)
  return {
    successIds,
    failureCount: result?.failureCount ?? numericIds.length - successIds.length,
  }
}

export async function approveGeminiOrganizationApplications(ids: string[]): Promise<void> {
  assertRemoteReady()
  const numericIds = toGeminiNumericIds(ids)
  if (numericIds.length === 0) {
    throw new Error('승인할 신청 ID가 올바르지 않습니다.')
  }
  if (numericIds.length === 1) {
    await approveGeminiOrganizationApplicationRemote(String(numericIds[0]))
    return
  }
  await bulkApproveGeminiOrganizationApplicationsRemote(numericIds)
}

export async function rejectGeminiOrganizationApplications(
  ids: string[],
  reason?: string
): Promise<void> {
  assertRemoteReady()
  const numericIds = toGeminiNumericIds(ids)
  if (numericIds.length === 0) {
    throw new Error('반려할 신청 ID가 올바르지 않습니다.')
  }
  if (numericIds.length === 1) {
    await rejectGeminiOrganizationApplicationRemote(String(numericIds[0]), reason)
    return
  }
  await bulkRejectGeminiOrganizationApplicationsRemote(numericIds, reason)
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
