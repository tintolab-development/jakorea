import {
  JA_GRADE_PENALTY_PER_EVENT,
  JA_GRADE_SCALE_QUESTION_IDS,
} from '@/features/user/detail/lib/ja-grade-evaluation-constants'
import type {
  ScaleTypeParagraph,
  WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

export type JaEvaluationLetterGrade = 'A' | 'B' | 'C' | 'D'

export type JaGradeEvaluationValidationResult = { valid: true } | { valid: false }

export interface JaGradeEvaluationScoreResult {
  qScores: [number, number, number, number]
  qItemIds: [string, string, string, string]
  fixedTotal: number
  penalty: number
  penaltyEventCount: number
  totalScore: number
  grade: JaEvaluationLetterGrade
  comment: string
}

export function resolveScaleTypeScore(paragraph: ScaleTypeParagraph): number | null {
  const selectedId = paragraph.selectedPreviewItemId
  if (selectedId == null || selectedId === '') return null
  const items = paragraph.items ?? []
  const index = items.findIndex(item => item.id === selectedId)
  if (index < 0) return null
  return (index + 1) * 5
}

/** 행정 감점 반영 후 totalScore 밴드: A 85~100 / B 60~84 / C 50~59 / D 0~49 (localOnly 미리보기용. remote는 서버 SSOT) */
export function resolveJaEvaluationLetterGrade(totalScore: number): JaEvaluationLetterGrade {
  if (totalScore >= 85) return 'A'
  if (totalScore >= 60) return 'B'
  if (totalScore >= 50) return 'C'
  return 'D'
}

export function calculateJaGradePenalty(scheduleChangeCount: number, lateReportCount: number): {
  penaltyEventCount: number
  penalty: number
} {
  const penaltyEventCount = Math.max(0, scheduleChangeCount) + Math.max(0, lateReportCount)
  return {
    penaltyEventCount,
    penalty: penaltyEventCount * JA_GRADE_PENALTY_PER_EVENT,
  }
}

export function validateJaGradeEvaluationDraft(
  draft: WritingFormDraft
): JaGradeEvaluationValidationResult {
  for (const questionId of JA_GRADE_SCALE_QUESTION_IDS) {
    const paragraph = draft.paragraphs.find(p => p.id === questionId)
    if (
      paragraph?.kind !== 'single_item' ||
      paragraph.variant !== 'scale_type' ||
      paragraph.selectedPreviewItemId == null ||
      paragraph.selectedPreviewItemId === ''
    ) {
      return { valid: false }
    }
  }
  return { valid: true }
}

export function calculateJaGradeEvaluationFromDraft(
  draft: WritingFormDraft,
  options?: { scheduleChangeCount?: number; lateReportCount?: number }
): JaGradeEvaluationScoreResult {
  const qScores: number[] = []
  const qItemIds: string[] = []

  for (const questionId of JA_GRADE_SCALE_QUESTION_IDS) {
    const paragraph = draft.paragraphs.find(p => p.id === questionId)
    if (paragraph?.kind !== 'single_item' || paragraph.variant !== 'scale_type') {
      throw new Error(`JA 등급 평가지에 ${questionId} 문항이 없습니다.`)
    }
    const score = resolveScaleTypeScore(paragraph)
    if (score == null) {
      throw new Error('모든 평가 항목(Q1~Q4)에 답변해 주세요.')
    }
    qScores.push(score)
    qItemIds.push(paragraph.selectedPreviewItemId ?? '')
  }

  const fixedTotal = qScores.reduce((sum, score) => sum + score, 0)
  const { penaltyEventCount, penalty } = calculateJaGradePenalty(
    options?.scheduleChangeCount ?? 0,
    options?.lateReportCount ?? 0
  )
  const totalScore = Math.max(0, fixedTotal - penalty)
  const grade = resolveJaEvaluationLetterGrade(totalScore)

  return {
    qScores: qScores as [number, number, number, number],
    qItemIds: qItemIds as [string, string, string, string],
    fixedTotal,
    penalty,
    penaltyEventCount,
    totalScore,
    grade,
    comment: '',
  }
}

export function buildJaGradeEvaluationReason(result: JaGradeEvaluationScoreResult): string {
  return [
    `Q1~Q4=${result.qScores.join('+')}(${result.fixedTotal})`,
    `penaltyEvents=${result.penaltyEventCount}`,
    `penalty=${result.penalty}`,
    `total=${result.totalScore}`,
    `grade=${result.grade}`,
  ].join(', ')
}
