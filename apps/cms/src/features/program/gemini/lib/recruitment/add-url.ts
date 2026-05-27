/** 찾아가는 연수 — 모집 공고 추가 풀페이지 */
export const GEMINI_RECRUITMENT_ADD_PARAM = 'recruitmentAdd'
export const GEMINI_RECRUITMENT_ADD_ACTIVE = '1'

export function isGeminiRecruitmentAddOpen(raw: string | null): boolean {
  return raw === GEMINI_RECRUITMENT_ADD_ACTIVE
}
