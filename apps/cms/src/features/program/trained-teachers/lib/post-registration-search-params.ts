import { GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/general/model/registration-flow'
import { patchGeneralProgramDetailLnbTab } from '@/features/program/general/lib/general-program-detail-route'
import { REGISTRATION_DRAFT_MODE_QUERY_KEY } from '@/features/program/shared/lib/registration-draft-notice'
import type { Program } from '@/types/domain'

export const TRAINED_TEACHERS_REGISTRATION_NEW_QUERY_KEY = 'new'

/** 등록 완료 팝업 [확인] 후 URL — 등록 쿼리 제거 + 새 programId 상세(공통 정보) */
export function buildTrainedTeachersSearchParamsAfterRegistrationComplete(
  prev: URLSearchParams,
  createdProgram?: Program
): URLSearchParams {
  const next = new URLSearchParams(prev)
  next.delete(TRAINED_TEACHERS_REGISTRATION_NEW_QUERY_KEY)
  next.delete(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
  next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
  next.delete('userPreview')

  const createdId = createdProgram?.id?.trim()
  if (!createdId) return next

  const withDetail = patchGeneralProgramDetailLnbTab(next, {
    programId: createdId,
    lnb: 'info',
    tab: 'info',
  })
  withDetail.delete('subTab')
  return withDetail
}
