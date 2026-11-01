import { buildProgramListSearchParamsAfterRegistrationComplete } from '@/features/program/shared/lib/post-registration-search-params'
import type { Program } from '@/types/domain'

export const TRAINED_TEACHERS_REGISTRATION_NEW_QUERY_KEY = 'new'

/** 등록 완료 팝업 [확인] 후 URL — 등록 쿼리 제거 + 새 programId 상세(공통 정보) */
export function buildTrainedTeachersSearchParamsAfterRegistrationComplete(
  prev: URLSearchParams,
  createdProgram?: Program
): URLSearchParams {
  return buildProgramListSearchParamsAfterRegistrationComplete(prev, createdProgram?.id)
}
