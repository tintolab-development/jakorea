import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { TrainedTeacherProgramDetailRequest } from '@/shared/api/generated/dashboard/schemas/trainedTeacherProgramDetailRequest'
import type { TrainedTeacherProgramDetailResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherProgramDetailResponse'

function detailUrl(programId: string): string {
  return `/api/admin/programs/${encodeURIComponent(programId)}/trained-teacher/detail`
}

export async function fetchTrainedTeacherInfoDetailRemote(
  programId: string
): Promise<TrainedTeacherProgramDetailResponse> {
  return unwrapApiBody<TrainedTeacherProgramDetailResponse>(
    await customInstance({
      url: detailUrl(programId),
      method: 'GET',
    })
  )
}

export async function patchTrainedTeacherInfoDetailRemote(
  programId: string,
  request: TrainedTeacherProgramDetailRequest
): Promise<TrainedTeacherProgramDetailResponse> {
  return unwrapApiBody<TrainedTeacherProgramDetailResponse>(
    await customInstance({
      url: detailUrl(programId),
      method: 'PATCH',
      data: request,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}
