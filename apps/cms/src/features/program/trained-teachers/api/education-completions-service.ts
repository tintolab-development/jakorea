import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import {
  countActiveEducationCompletions,
  mapEducationCompletionResponseToView,
  type TrainedTeacherEducationCompletionView,
} from './education-completions-adapters'
import {
  cancelTrainedTeacherEducationCompletionRemote,
  createTrainedTeacherEducationCompletionRemote,
  fetchTrainedTeacherEducationCompletionsRemote,
} from './education-completions-client'
import type { EducationCompletionAdminCreateRequest } from '@/shared/api/generated/dashboard/schemas/educationCompletionAdminCreateRequest'
import type { EducationCompletionCancelRequest } from '@/shared/api/generated/dashboard/schemas/educationCompletionCancelRequest'

function assertRemoteReady(): void {
  if (shouldUseTrainedTeacherProgramsRemoteApi()) return
  throw new Error(
    '교육받은 교사 학생교육 완료 API가 활성화되지 않았습니다. VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED(또는 trainedTeacherPrograms)와 programs 모듈을 확인해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

export async function listTrainedTeacherEducationCompletions(
  programId: string,
  organizationApplicationId?: string
): Promise<TrainedTeacherEducationCompletionView[]> {
  assertRemoteReady()
  const items = await fetchTrainedTeacherEducationCompletionsRemote(
    programId,
    organizationApplicationId
  )
  return items.map(mapEducationCompletionResponseToView)
}

export async function createTrainedTeacherEducationCompletion(
  programId: string,
  request: EducationCompletionAdminCreateRequest
): Promise<TrainedTeacherEducationCompletionView> {
  assertRemoteReady()
  const dto = await createTrainedTeacherEducationCompletionRemote(programId, request)
  return mapEducationCompletionResponseToView(dto)
}

export async function cancelTrainedTeacherEducationCompletion(
  programId: string,
  completionId: string,
  request: EducationCompletionCancelRequest
): Promise<TrainedTeacherEducationCompletionView> {
  assertRemoteReady()
  const dto = await cancelTrainedTeacherEducationCompletionRemote(
    programId,
    completionId,
    request
  )
  return mapEducationCompletionResponseToView(dto)
}

export { countActiveEducationCompletions }
