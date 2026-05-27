/** 찾아가는 연수 목록 URL — 모집 공고 상세 풀페이지 */
export const GEMINI_RECRUITMENT_ID_PARAM = 'recruitmentId'
export const GEMINI_RECRUITMENT_LNB_PARAM = 'lnb'

export type GeminiRecruitmentDetailLnbKey = 'info' | 'institutions'

export function parseGeminiRecruitmentDetailLnb(
  raw: string | null
): GeminiRecruitmentDetailLnbKey {
  if (raw === 'institutions') return 'institutions'
  return 'info'
}
