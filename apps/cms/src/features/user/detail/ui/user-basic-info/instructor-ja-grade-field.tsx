/**
 * 강사 JA 평가 등급 — 직접 수정 불가. 조회·수정 모드 모두 동일하게
 * 등급 라인 + `등급 평가` 버튼(모달 진입)만 노출한다.
 */

import type { User } from '@/types/user'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui'
import { jaEvaluationGradeLine } from './display'

export function InstructorJaEvaluationGradeField({
  user,
  wrapClassName,
  onOpenJaGradeEvaluation,
}: {
  user: Omit<User, 'password'>
  /** 등급 라인 + 버튼을 감싸는 래퍼 클래스 (조회 카드·수정 폼이 서로 다른 스타일을 유지) */
  wrapClassName: string
  onOpenJaGradeEvaluation?: () => void
}) {
  const hasGrade = Boolean(user.listMetrics?.jaEvaluationGrade?.trim())
  const gradeEvaluateButton = (
    <CmsButton
      type="button"
      variant="secondary"
      size="small"
      onClick={() => {
        onOpenJaGradeEvaluation?.()
      }}
    >
      등급 평가
    </CmsButton>
  )

  if (!hasGrade) {
    return gradeEvaluateButton
  }

  return (
    <span className={wrapClassName}>
      <span>{jaEvaluationGradeLine(user)}</span>
      <DetailInfoForm.InputsSeparator />
      {gradeEvaluateButton}
    </span>
  )
}
