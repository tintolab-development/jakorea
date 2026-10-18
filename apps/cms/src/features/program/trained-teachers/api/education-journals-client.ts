import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { toSameOriginApiPath } from '@/shared/lib/admin-file-upload/attachments'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
import customInstance from '@/shared/api/orval-mutator'
import type { EducationJournalBulkDownloadRequest } from '@/shared/api/generated/dashboard/schemas/educationJournalBulkDownloadRequest'
import type { EducationJournalBulkDownloadResponse } from '@/shared/api/generated/dashboard/schemas/educationJournalBulkDownloadResponse'
import type { EducationJournalCreateRequest } from '@/shared/api/generated/dashboard/schemas/educationJournalCreateRequest'
import type { EducationJournalDownloadResponse } from '@/shared/api/generated/dashboard/schemas/educationJournalDownloadResponse'
import type { EducationJournalGeneratedFileJobResponse } from '@/shared/api/generated/dashboard/schemas/educationJournalGeneratedFileJobResponse'
import type { GeneratedFileJobResponse } from '@/shared/api/generated/dashboard/schemas/generatedFileJobResponse'
import type { EducationJournalResponse } from '@/shared/api/generated/dashboard/schemas/educationJournalResponse'

function journalsUrl(programId: string): string {
  return `/api/admin/programs/${encodeURIComponent(programId)}/trained-teacher/education-journals`
}

export async function fetchTrainedTeacherEducationJournalsRemote(
  programId: string,
  organizationApplicationId?: string
): Promise<EducationJournalResponse[]> {
  const body = await unwrapApiBody<
    EducationJournalResponse[] | { content?: EducationJournalResponse[] }
  >(
    await customInstance({
      url: journalsUrl(programId),
      method: 'GET',
      params: organizationApplicationId
        ? { organizationApplicationId: Number(organizationApplicationId) || organizationApplicationId }
        : undefined,
    })
  )
  if (Array.isArray(body)) return body
  return body.content ?? []
}

export async function createTrainedTeacherEducationJournalRemote(
  programId: string,
  request: EducationJournalCreateRequest
): Promise<EducationJournalResponse> {
  return unwrapApiBody<EducationJournalResponse>(
    await customInstance({
      url: journalsUrl(programId),
      method: 'POST',
      data: request,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

export async function fetchTrainedTeacherEducationJournalDownloadRemote(
  programId: string,
  journalId: string
): Promise<EducationJournalDownloadResponse> {
  return unwrapApiBody<EducationJournalDownloadResponse>(
    await customInstance({
      url: `${journalsUrl(programId)}/${encodeURIComponent(journalId)}/download`,
      method: 'GET',
    })
  )
}

export async function bulkDownloadTrainedTeacherEducationJournalsRemote(
  programId: string,
  request: EducationJournalBulkDownloadRequest
): Promise<EducationJournalBulkDownloadResponse> {
  return unwrapApiBody<EducationJournalBulkDownloadResponse>(
    await customInstance({
      url: `${journalsUrl(programId)}/bulk-download`,
      method: 'POST',
      data: request,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

/** POST .../education-journals/bulk-download/jobs — 비동기 ZIP 생성 요청 */
export async function createTrainedTeacherEducationJournalBulkDownloadJobRemote(
  programId: string,
  request: EducationJournalBulkDownloadRequest
): Promise<EducationJournalGeneratedFileJobResponse> {
  return unwrapApiBody<EducationJournalGeneratedFileJobResponse>(
    await customInstance({
      url: `${journalsUrl(programId)}/bulk-download/jobs`,
      method: 'POST',
      data: request,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

/** GET /api/admin/generated-files/jobs/{jobId} — 생성 파일 Job 상태 조회 */
export async function fetchAdminGeneratedFileJobRemote(
  jobId: number
): Promise<EducationJournalGeneratedFileJobResponse> {
  const raw = await unwrapApiBody<GeneratedFileJobResponse & {
    jobId?: number
    generatedFileEndpoint?: string
    availableActions?: string[]
  }>(
    await customInstance({
      url: `/api/admin/generated-files/jobs/${encodeURIComponent(jobId)}`,
      method: 'GET',
    })
  )
  return {
    ...raw,
    jobId: raw.jobId ?? raw.id,
    generatedFileEndpoint: raw.generatedFileEndpoint,
    availableActions: raw.availableActions,
  }
}

/** downloadEndpoint가 상대 경로일 때 Bearer로 blob 수신 */
export async function fetchTrainedTeacherEducationJournalFileBlob(
  downloadEndpoint: string
): Promise<Blob> {
  return customInstance<Blob>({
    url: toSameOriginApiPath(downloadEndpoint, getApiBaseUrl()) ?? downloadEndpoint,
    method: 'GET',
    responseType: 'blob',
  })
}
