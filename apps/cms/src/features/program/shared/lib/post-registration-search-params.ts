import { GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/general/model/registration-flow'
import { patchGeneralProgramDetailLnbTab } from '@/features/program/general/lib/general-program-detail-route'
import { UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/ujat/model/ujat-program-registration-flow'
import { REGISTRATION_DRAFT_MODE_QUERY_KEY } from '@/features/program/shared/lib/registration-draft-notice'

/** 목록 페이지 등록 위저드 쿼리. 완료 후 상세로 넘길 때 제거한다. */
const PROGRAM_REGISTRATION_WIZARD_QUERY_KEYS = [
  'new',
  GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY,
  UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
  'userPreview',
] as const

/** 등록 완료 팝업 [확인] 후 URL — 등록 쿼리 제거 + 새 programId 상세(공통 정보) */
export function buildProgramListSearchParamsAfterRegistrationComplete(
  prev: URLSearchParams,
  createdProgramId?: string | null
): URLSearchParams {
  const next = new URLSearchParams(prev)
  for (const key of PROGRAM_REGISTRATION_WIZARD_QUERY_KEYS) {
    next.delete(key)
  }

  const createdId = createdProgramId?.trim()
  if (!createdId) return next

  const withDetail = patchGeneralProgramDetailLnbTab(next, {
    programId: createdId,
    lnb: 'info',
    tab: 'info',
  })
  withDetail.delete('subTab')
  return withDetail
}
