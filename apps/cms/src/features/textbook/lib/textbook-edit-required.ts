import { isTextbookRegisterBusinessAreaFilled } from '@/features/textbook/model/textbook-business-areas'
import type { TextbookEducationStage } from '@/features/textbook/model/textbook.types'

export type TextbookEditRequiredInput = {
  textbookName: string
  textbookNameEn: string
  businessArea: string
  useStatus: string
  educationStages: readonly TextbookEducationStage[]
}

/** 교육 대상·학년을 하나 이상 골랐는지 (단계 전체 또는 학년 개별) */
export function hasTextbookEducationStageSelection(
  stages: readonly TextbookEducationStage[]
): boolean {
  return stages.some(stage => stage.selected || (stage.grades ?? []).some(grade => grade.selected))
}

/**
 * 교재 수정 저장 전 필수값 확인 (QA-0443) — 등록 팝업과 같은 항목(교재명 국·영문, 사업 분야, 사용 여부, 교육 대상).
 */
export function isTextbookEditRequiredFilled(input: TextbookEditRequiredInput): boolean {
  if (!input.textbookName.trim()) return false
  if (!input.textbookNameEn.trim()) return false
  if (!isTextbookRegisterBusinessAreaFilled(input.businessArea)) return false
  if (input.useStatus !== 'USED' && input.useStatus !== 'UNUSED') return false
  return hasTextbookEducationStageSelection(input.educationStages)
}
