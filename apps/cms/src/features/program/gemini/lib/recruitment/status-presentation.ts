import type { GeminiRecruitmentDisplayStatus } from '../../model/recruitment/types'

/** 모집 공고 기간 축. 승인 연수 진행 축·사용자 게시 축과 합치지 않는다. */
export const GEMINI_RECRUITMENT_STATUS_LABEL: Record<GeminiRecruitmentDisplayStatus, string> = {
  SCHEDULED: '예정',
  IN_PROGRESS: '진행 중',
  ENDED: '종료',
  DRAFT: '임시저장',
}

const RECRUITMENT_STATUS_ACCENT: Record<GeminiRecruitmentDisplayStatus, string> = {
  SCHEDULED: 'var(--color-green, #1e8c29)',
  IN_PROGRESS: 'var(--color-blue, #017eaf)',
  ENDED: 'var(--color-red, #c32f4a)',
  DRAFT: 'var(--color-gray-600, #6b7280)',
}

export function getGeminiRecruitmentStatusPresentation(status: GeminiRecruitmentDisplayStatus) {
  return { label: GEMINI_RECRUITMENT_STATUS_LABEL[status], accentColor: RECRUITMENT_STATUS_ACCENT[status] }
}
