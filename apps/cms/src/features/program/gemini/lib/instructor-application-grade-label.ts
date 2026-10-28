import { formatJaEvaluationGradeCellDisplay } from '@/features/program/general/lib/ja-evaluation-grade-display'
import { toInstructorFeeGradeCode } from '@/shared/constants/instructor-fee-grade'

function formatFeeGradeAsNGeup(value: string | null | undefined): string | null {
  const code = toInstructorFeeGradeCode(value)
  if (!code) return null
  return `${code.replace('GRADE_', '')}급`
}

/** CMS 강사 신청 목록 JA 평가 등급. GRADE_n → n급. 원시 코드는 노출하지 않는다. */
export function formatGeminiInstructorApplicationGrade(
  grade: string | null | undefined,
  feeGradeSnapshot?: string | null
): string {
  const fromGradeFee = formatFeeGradeAsNGeup(grade)
  if (fromGradeFee) return fromGradeFee
  const fromGrade = formatJaEvaluationGradeCellDisplay(grade)
  if (fromGrade !== '-') return fromGrade
  return formatFeeGradeAsNGeup(feeGradeSnapshot) ?? formatJaEvaluationGradeCellDisplay(feeGradeSnapshot)
}
