import { formatJaEvaluationGradeCellDisplay } from '@/features/program/general/lib/ja-evaluation-grade-display'

/** CMS 강사 신청 목록 JA 평가 등급. GRADE_2 등 원시 코드는 라벨로 바꾼다. */
export function formatGeminiInstructorApplicationGrade(
  grade: string | null | undefined,
  feeGradeSnapshot?: string | null
): string {
  const fromGrade = formatJaEvaluationGradeCellDisplay(grade)
  if (fromGrade !== '-') return fromGrade
  return formatJaEvaluationGradeCellDisplay(feeGradeSnapshot)
}
