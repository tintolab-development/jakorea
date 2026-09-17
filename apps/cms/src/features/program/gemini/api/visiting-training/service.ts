import type { GeminiApprovedTrainingRow } from '@/features/program/gemini/model/approved/types'
import type { GeminiRecruitmentDetail } from '@/features/program/gemini/model/recruitment/detail-types'
import type { GeminiInstitutionApplicationRow } from '@/features/program/gemini/model/recruitment/institution-application-types'
import type { GeminiRecruitmentAddFormSnapshot } from '@/features/program/gemini/lib/recruitment/add-local-save'
import type { GeminiRecruitmentInfoEditDraft } from '@/features/program/gemini/model/recruitment/info-edit-draft'
import type { GeminiRecruitmentRow } from '@/features/program/gemini/model/recruitment/types'
import {
  mapGeminiOrganizationApplicationToRow,
  mapGeminiRecruitmentDetailToDetail,
  mapGeminiRecruitmentDetailToUpdateRequest,
  mapGeminiRecruitmentItemToApprovedRow,
  mapGeminiRecruitmentItemToRow,
  mapGeminiRecruitmentSnapshotToCreateRequest,
  toGeminiNumericIds,
} from './adapters'
import { shouldUseGeminiVisitingTrainingRemoteApi } from './capabilities'
import {
  approveGeminiOrganizationApplicationRemote,
  bulkApproveGeminiOrganizationApplicationsRemote,
  bulkDeleteGeminiRecruitmentsRemote,
  bulkRejectGeminiOrganizationApplicationsRemote,
  createGeminiRecruitmentRemote,
  deleteGeminiRecruitmentRemote,
  fetchGeminiApprovedTrainingsRemote,
  fetchGeminiOrganizationApplicationsRemote,
  fetchGeminiRecruitmentDetailRemote,
  fetchGeminiRecruitmentsRemotePage,
  rejectGeminiOrganizationApplicationRemote,
  updateGeminiRecruitmentRemote,
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
  status: string | undefined,
  pageParam = 0
): Promise<GeminiOrganizationApplicationsPage> {
  assertRemoteReady()
  const page = await fetchGeminiOrganizationApplicationsRemote(programId, status, pageParam)
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
  keyword: string | undefined,
  pageParam = 0
): Promise<GeminiApprovedTrainingsPage> {
  assertRemoteReady()
  const page = await fetchGeminiApprovedTrainingsRemote(keyword, pageParam)
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

export async function createGeminiRecruitment(
  snapshot: GeminiRecruitmentAddFormSnapshot
): Promise<{ id: string }> {
  assertRemoteReady()
  const created = await createGeminiRecruitmentRemote(
    mapGeminiRecruitmentSnapshotToCreateRequest(snapshot)
  )
  return { id: String(created.id ?? '') }
}

export async function updateGeminiRecruitment(
  programId: string,
  draft: GeminiRecruitmentInfoEditDraft
): Promise<void> {
  assertRemoteReady()
  await updateGeminiRecruitmentRemote(programId, mapGeminiRecruitmentDetailToUpdateRequest(draft))
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
