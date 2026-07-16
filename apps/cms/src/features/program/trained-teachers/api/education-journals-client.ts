import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { EducationJournalBulkDownloadRequest } from '@/shared/api/generated/dashboard/schemas/educationJournalBulkDownloadRequest'
import type { EducationJournalBulkDownloadResponse } from '@/shared/api/generated/dashboard/schemas/educationJournalBulkDownloadResponse'
import type { EducationJournalCreateRequest } from '@/shared/api/generated/dashboard/schemas/educationJournalCreateRequest'
import type { EducationJournalDownloadResponse } from '@/shared/api/generated/dashboard/schemas/educationJournalDownloadResponse'
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

/** downloadEndpoint가 상대 경로일 때 Bearer로 blob 수신 */
export async function fetchTrainedTeacherEducationJournalFileBlob(
  downloadEndpoint: string
): Promise<Blob> {
  return customInstance<Blob>({
    url: downloadEndpoint,
    method: 'GET',
    responseType: 'blob',
  })
}
