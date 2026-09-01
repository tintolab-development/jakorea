import type { GeminiApprovedTrainingRow } from '@/features/program/gemini/model/approved/types'
import type { GeminiRecruitmentDetail } from '@/features/program/gemini/model/recruitment/detail-types'
import type { GeminiInstitutionApplicationRow } from '@/features/program/gemini/model/recruitment/institution-application-mock'
import { getGeminiInstitutionApplicationRows } from '@/features/program/gemini/model/recruitment/institution-application-mock'
import { getRecruitmentDetailById } from '@/features/program/gemini/model/recruitment/detail-mock'
import type { GeminiRecruitmentAddFormSnapshot } from '@/features/program/gemini/lib/recruitment/add-local-save'
import type { GeminiRecruitmentInfoEditDraft } from '@/features/program/gemini/model/recruitment/info-edit-draft'
import { getGeminiApprovedTrainingRowsSnapshot } from '@/features/program/gemini/model/approved/approved-training-store'
import { getGeminiRecruitmentRowsSnapshot } from '@/features/program/gemini/model/recruitment/recruitment-store'
import type { GeminiRecruitmentRow } from '@/features/program/gemini/model/recruitment/types'
import dayjs from 'dayjs'
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
    'Gemini 찾아가는 연수 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 geminiVisitingTraining을 추가해 주세요.'
  )
}

export async function listGeminiRecruitments(): Promise<GeminiRecruitmentRow[]> {
  if (!shouldUseGeminiVisitingTrainingRemoteApi()) {
    return getGeminiRecruitmentRowsSnapshot()
  }
  assertRemoteReady()
  const items = await fetchGeminiRecruitmentsRemote()
  return items.map((item, index) => mapGeminiRecruitmentItemToRow(item, index))
}

export async function getGeminiRecruitmentDetail(
  programId: string
): Promise<GeminiRecruitmentDetail | null> {
  if (!shouldUseGeminiVisitingTrainingRemoteApi()) {
    return getRecruitmentDetailById(programId, dayjs()) ?? null
  }
  assertRemoteReady()
  const dto = await fetchGeminiRecruitmentDetailRemote(programId)
  return mapGeminiRecruitmentDetailToDetail(dto)
}

export async function listGeminiOrganizationApplications(
  programId: string
): Promise<GeminiInstitutionApplicationRow[]> {
  if (!shouldUseGeminiVisitingTrainingRemoteApi()) {
    void programId
    return getGeminiInstitutionApplicationRows()
  }
  assertRemoteReady()
  const items = await fetchGeminiOrganizationApplicationsRemote(programId)
  return items.map((item, index) => mapGeminiOrganizationApplicationToRow(item, index))
}

export async function listGeminiApprovedTrainings(): Promise<GeminiApprovedTrainingRow[]> {
  if (!shouldUseGeminiVisitingTrainingRemoteApi()) {
    return getGeminiApprovedTrainingRowsSnapshot()
  }
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
