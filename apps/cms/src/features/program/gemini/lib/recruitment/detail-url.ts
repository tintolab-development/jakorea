/** 찾아가는 연수 목록 URL — 모집 공고 상세 풀페이지 */
export const GEMINI_RECRUITMENT_ID_PARAM = 'recruitmentId'
export const GEMINI_RECRUITMENT_LNB_PARAM = 'lnb'
/** UJAT·일반 프로그램 상세와 동일 — `edit=info` 일 때 모집 정보 탭 수정 모드 */
export const GEMINI_RECRUITMENT_EDIT_PARAM = 'edit'
export const GEMINI_RECRUITMENT_EDIT_INFO_VALUE = 'info'

export type GeminiRecruitmentDetailLnbKey = 'info' | 'institutions' | 'managers'

export function parseGeminiRecruitmentDetailLnb(
  raw: string | null
): GeminiRecruitmentDetailLnbKey {
  if (raw === 'institutions') return 'institutions'
  if (raw === 'managers') return 'managers'
  return 'info'
}
