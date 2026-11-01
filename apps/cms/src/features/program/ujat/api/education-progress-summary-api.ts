import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import type { EducationProgressSummaryResponse } from '@/shared/api/generated/dashboard/schemas/educationProgressSummaryResponse'
import customInstance from '@/shared/api/orval-mutator'

/**
 * GET /api/admin/program-execution/programs/{programId}/ujat/education-progress-summary
 *
 * 지역·반기 집계의 기준 API다. 기관/봉사자 목록을 FE에서 다시 집계하지 않는다.
 */
export async function fetchUjatEducationProgressSummary(
  programId: string,
  educationRegionCode?: string
): Promise<EducationProgressSummaryResponse> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/program-execution/programs/${encodeURIComponent(programId)}/ujat/education-progress-summary`,
      method: 'GET',
      params: educationRegionCode?.trim()
        ? { educationRegionCode: educationRegionCode.trim() }
        : undefined,
    })
  )
}
