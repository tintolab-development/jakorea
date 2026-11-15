import { createContext, useContext } from 'react'
import type { GeneralVolunteerInterviewEvaluationPayload } from '@/features/program/general/model/volunteer-applicant'
import type { GeneralVolunteerApplicantInterviewEvaluationSectionHandle } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/interview-evaluation-section'

/**
 * 개인 참여자 2차 면접 상세 — 면접 평가 입력.
 * 상세 헤더 「면접 평가」 버튼(참여자 상세 뷰)과 평가 섹션(기본 정보 안)이 같은 편집 상태를 쓴다.
 * Provider가 없으면 평가 섹션은 기존처럼 조회 전용이다.
 */
export type IndividualInterviewEvaluationEditValue = {
  isEditing: boolean
  canFillBothSlots: boolean
  currentAdminId: number | null
  /** 평가 섹션 제출 핸들 등록(callback ref) — 헤더 「면접 평가」 저장 시 submit 호출 */
  bindSection: (handle: GeneralVolunteerApplicantInterviewEvaluationSectionHandle | null) => void
  onSave: (payload: GeneralVolunteerInterviewEvaluationPayload) => Promise<boolean>
}

export const IndividualInterviewEvaluationEditContext =
  createContext<IndividualInterviewEvaluationEditValue | null>(null)

export function useIndividualInterviewEvaluationEdit(): IndividualInterviewEvaluationEditValue | null {
  return useContext(IndividualInterviewEvaluationEditContext)
}
