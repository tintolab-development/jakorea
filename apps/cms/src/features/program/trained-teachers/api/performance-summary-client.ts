import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { TrainedTeacherPerformanceSummaryResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherPerformanceSummaryResponse'

export async function fetchTrainedTeacherPerformanceSummaryRemote(
  programId: string
): Promise<TrainedTeacherPerformanceSummaryResponse> {
  return unwrapApiBody<TrainedTeacherPerformanceSummaryResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/trained-teacher/performance-summary`,
      method: 'GET',
    })
  )
}
