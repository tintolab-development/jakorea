import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { GeminiOrganizationApplicationItem } from '@/shared/api/generated/dashboard/schemas/geminiOrganizationApplicationItem'
import type { GeminiOrganizationApplicationListResponse } from '@/shared/api/generated/dashboard/schemas/geminiOrganizationApplicationListResponse'
import type { GeminiRecruitmentDetailResponse } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentDetailResponse'
import type { GeminiRecruitmentItem } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentItem'
import type { GeminiRecruitmentListResponse } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentListResponse'

const BASE = '/api/admin/gemini/trainings'

function asContentArray<T>(
  body: { content?: T[] } | T[] | null | undefined
): T[] {
  if (Array.isArray(body)) return body
  return body?.content ?? []
}

export async function fetchGeminiRecruitmentsRemote(): Promise<GeminiRecruitmentItem[]> {
  const body = await unwrapApiBody<GeminiRecruitmentListResponse | GeminiRecruitmentItem[]>(
    await customInstance({
      url: `${BASE}/recruitments`,
      method: 'GET',
    })
  )
  return asContentArray(body)
}

export async function fetchGeminiRecruitmentDetailRemote(
  programId: string
): Promise<GeminiRecruitmentDetailResponse> {
  return unwrapApiBody<GeminiRecruitmentDetailResponse>(
    await customInstance({
      url: `${BASE}/recruitments/${encodeURIComponent(programId)}`,
      method: 'GET',
    })
  )
}

export async function fetchGeminiOrganizationApplicationsRemote(
  programId: string
): Promise<GeminiOrganizationApplicationItem[]> {
  const body = await unwrapApiBody<
    GeminiOrganizationApplicationListResponse | GeminiOrganizationApplicationItem[]
  >(
    await customInstance({
      url: `${BASE}/recruitments/${encodeURIComponent(programId)}/organization-applications`,
      method: 'GET',
    })
  )
  return asContentArray(body)
}

export async function fetchGeminiApprovedTrainingsRemote(): Promise<GeminiRecruitmentItem[]> {
  const body = await unwrapApiBody<GeminiRecruitmentListResponse | GeminiRecruitmentItem[]>(
    await customInstance({
      url: `${BASE}/approved`,
      method: 'GET',
    })
  )
  return asContentArray(body)
}
