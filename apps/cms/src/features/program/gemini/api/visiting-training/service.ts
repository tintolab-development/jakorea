import type { GeminiApprovedTrainingRow } from '@/features/program/gemini/model/approved/types'
import type { GeminiRecruitmentDetail } from '@/features/program/gemini/model/recruitment/detail-types'
import type { GeminiInstitutionApplicationRow } from '@/features/program/gemini/model/recruitment/institution-application-mock'
import { getGeminiInstitutionApplicationRows } from '@/features/program/gemini/model/recruitment/institution-application-mock'
import { getRecruitmentDetailById } from '@/features/program/gemini/model/recruitment/detail-mock'
import { getGeminiApprovedTrainingRowsSnapshot } from '@/features/program/gemini/model/approved/approved-training-store'
import { getGeminiRecruitmentRowsSnapshot } from '@/features/program/gemini/model/recruitment/recruitment-store'
import type { GeminiRecruitmentRow } from '@/features/program/gemini/model/recruitment/types'
import dayjs from 'dayjs'
import {
  mapGeminiOrganizationApplicationToRow,
  mapGeminiRecruitmentDetailToDetail,
  mapGeminiRecruitmentItemToApprovedRow,
  mapGeminiRecruitmentItemToRow,
} from './adapters'
import { shouldUseGeminiVisitingTrainingRemoteApi } from './capabilities'
import {
  fetchGeminiApprovedTrainingsRemote,
  fetchGeminiOrganizationApplicationsRemote,
  fetchGeminiRecruitmentDetailRemote,
  fetchGeminiRecruitmentsRemote,
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
