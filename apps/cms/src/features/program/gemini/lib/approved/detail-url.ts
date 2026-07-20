/** 찾아가는 연수 목록 URL — 승인 연수 상세 풀페이지 */
export const GEMINI_APPROVED_TRAINING_ID_PARAM = 'approvedTrainingId'
export const GEMINI_APPROVED_TRAINING_LNB_PARAM = 'approvedLnb'

export type GeminiApprovedTrainingDetailLnbKey = 'info' | 'instructors' | 'managers'

export function parseGeminiApprovedTrainingDetailLnb(
  raw: string | null
): GeminiApprovedTrainingDetailLnbKey {
  if (raw === 'instructors') return 'instructors'
  if (raw === 'managers') return 'managers'
  return 'info'
}
