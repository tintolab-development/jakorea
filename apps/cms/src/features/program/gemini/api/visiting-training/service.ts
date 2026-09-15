import type { GeminiApprovedTrainingRow } from '@/features/program/gemini/model/approved/types'
import type { GeminiRecruitmentDetail } from '@/features/program/gemini/model/recruitment/detail-types'
import type { GeminiInstitutionApplicationRow } from '@/features/program/gemini/model/recruitment/institution-application-mock'
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
  fetchGeminiRecruitmentsRemote,
  rejectGeminiOrganizationApplicationRemote,
  updateGeminiRecruitmentRemote,
} from './client'

function assertRemoteReady(): void {
  if (shouldUseGeminiVisitingTrainingRemoteApi()) return
  throw new Error(
    'Gemini 찾아가는 연수 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

export async function listGeminiRecruitments(): Promise<GeminiRecruitmentRow[]> {
  assertRemoteReady()
  const items = await fetchGeminiRecruitmentsRemote()
  return items.map((item, index) => mapGeminiRecruitmentItemToRow(item, index))
}

export async function getGeminiRecruitmentDetail(
  programId: string
): Promise<GeminiRecruitmentDetail | null> {
  assertRemoteReady()
  const dto = await fetchGeminiRecruitmentDetailRemote(programId)
  return mapGeminiRecruitmentDetailToDetail(dto)
}

export async function listGeminiOrganizationApplications(
  programId: string
): Promise<GeminiInstitutionApplicationRow[]> {
  assertRemoteReady()
  const items = await fetchGeminiOrganizationApplicationsRemote(programId)
  return items.map((item, index) => mapGeminiOrganizationApplicationToRow(item, index))
}

export async function listGeminiApprovedTrainings(): Promise<GeminiApprovedTrainingRow[]> {
  assertRemoteReady()
  const items = await fetchGeminiApprovedTrainingsRemote()
  return items.map((item, index) => mapGeminiRecruitmentItemToApprovedRow(item, index))
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
