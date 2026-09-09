import type { InstructorJaEvaluationInput } from '@/shared/api/generated/members/schemas/instructorJaEvaluationInput'
import type { InstructorJaEvaluationResponse } from '@/shared/api/generated/members/schemas/instructorJaEvaluationResponse'
import type { CriteriaScore } from '@/shared/api/generated/members/schemas/criteriaScore'
import {
  JA_GRADE_PARAGRAPH_IDS,
  JA_GRADE_SCALE_QUESTION_IDS,
} from '@/features/user/detail/lib/ja-grade-evaluation-constants'
import { calculateJaGradeEvaluationFromDraft } from '@/features/user/detail/lib/ja-grade-evaluation-score'
import type { JaEvaluationLetterGrade } from '@/features/user/detail/lib/ja-grade-evaluation-score'
import type { ScaleTypeParagraph, WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { applyJaGradeEvaluationRecordToDraft } from '@/features/user/detail/lib/ja-grade-evaluation-draft'

const CRITERIA_TO_QUESTION: Record<string, (typeof JA_GRADE_SCALE_QUESTION_IDS)[number]> = {
  CONTENT_EXPERTISE: JA_GRADE_PARAGRAPH_IDS.q1,
  CONTENTEXPERTISE: JA_GRADE_PARAGRAPH_IDS.q1,
  CONTENTEXPERTISESCORE: JA_GRADE_PARAGRAPH_IDS.q1,
  DELIVERY_IMMERSION: JA_GRADE_PARAGRAPH_IDS.q2,
  DELIVERYIMMERSION: JA_GRADE_PARAGRAPH_IDS.q2,
  DELIVERYIMMERSIONSCORE: JA_GRADE_PARAGRAPH_IDS.q2,
  ENGAGEMENT_INTERACTION: JA_GRADE_PARAGRAPH_IDS.q3,
  ENGAGEMENTINTERACTION: JA_GRADE_PARAGRAPH_IDS.q3,
  ENGAGEMENTINTERACTIONSCORE: JA_GRADE_PARAGRAPH_IDS.q3,
  CONTENT_USE_LESSON_DESIGN: JA_GRADE_PARAGRAPH_IDS.q4,
  CONTENTUSELESSONDESIGN: JA_GRADE_PARAGRAPH_IDS.q4,
  CONTENTUSELESSONDESIGNSCORE: JA_GRADE_PARAGRAPH_IDS.q4,
}

function normalizeCriteriaKey(value: string | undefined): string {
  return (value ?? '').replace(/[^A-Za-z]/g, '').toUpperCase()
}

export function resolveScaleTypeCriteriaScore(paragraph: ScaleTypeParagraph): number | null {
  const selectedId = paragraph.selectedPreviewItemId
  if (selectedId == null || selectedId === '') return null
  const fromId = /^ja-scale-([1-5])$/.exec(selectedId)
  if (fromId) return Number(fromId[1])
  const items = paragraph.items ?? []
  const index = items.findIndex(item => item.id === selectedId)
  if (index < 0) return null
  return index + 1
}

export function mapJaGradeDraftToEvaluationInput(
  draft: WritingFormDraft
): InstructorJaEvaluationInput {
  const scores: number[] = []
  for (const questionId of JA_GRADE_SCALE_QUESTION_IDS) {
    const paragraph = draft.paragraphs.find(p => p.id === questionId)
    if (paragraph?.kind !== 'single_item' || paragraph.variant !== 'scale_type') {
      throw new Error(`JA 등급 평가지에 ${questionId} 문항이 없습니다.`)
    }
    const score = resolveScaleTypeCriteriaScore(paragraph)
    if (score == null) {
      throw new Error('모든 평가 항목(Q1~Q4)에 답변해 주세요.')
    }
    scores.push(score)
  }

  const local = calculateJaGradeEvaluationFromDraft(draft)
  return {
    contentExpertiseScore: scores[0],
    deliveryImmersionScore: scores[1],
    engagementInteractionScore: scores[2],
    contentUseLessonDesignScore: scores[3],
    ...(local.comment ? { comment: local.comment } : {}),
  }
}

function criteriaScoreByQuestion(
  criteria: CriteriaScore[] | undefined
): Partial<Record<(typeof JA_GRADE_SCALE_QUESTION_IDS)[number], number>> {
  const mapped: Partial<Record<(typeof JA_GRADE_SCALE_QUESTION_IDS)[number], number>> = {}
  if (!criteria?.length) return mapped

  for (const item of criteria) {
    const questionId =
      CRITERIA_TO_QUESTION[normalizeCriteriaKey(item.criteriaCode)] ??
      CRITERIA_TO_QUESTION[normalizeCriteriaKey(item.criteriaName)]
    const score = item.score
    if (questionId && score != null && score >= 1 && score <= 5) {
      mapped[questionId] = score
    }
  }

  if (Object.keys(mapped).length === 0) {
    JA_GRADE_SCALE_QUESTION_IDS.forEach((questionId, index) => {
      const score = criteria[index]?.score
      if (score != null && score >= 1 && score <= 5) {
        mapped[questionId] = score
      }
    })
  }

  return mapped
}

export function applyJaEvaluationResponseToDraft(
  draft: WritingFormDraft,
  response: InstructorJaEvaluationResponse | null | undefined
): WritingFormDraft {
  if (response == null) return draft
  const scores = criteriaScoreByQuestion(response.criteria)
  return applyJaGradeEvaluationRecordToDraft(draft, {
    memberId: response.instructorMemberId ?? 0,
    storageKey: 'server',
    q1ItemId: scores[JA_GRADE_PARAGRAPH_IDS.q1]
      ? `ja-scale-${scores[JA_GRADE_PARAGRAPH_IDS.q1]}`
      : '',
    q2ItemId: scores[JA_GRADE_PARAGRAPH_IDS.q2]
      ? `ja-scale-${scores[JA_GRADE_PARAGRAPH_IDS.q2]}`
      : '',
    q3ItemId: scores[JA_GRADE_PARAGRAPH_IDS.q3]
      ? `ja-scale-${scores[JA_GRADE_PARAGRAPH_IDS.q3]}`
      : '',
    q4ItemId: scores[JA_GRADE_PARAGRAPH_IDS.q4]
      ? `ja-scale-${scores[JA_GRADE_PARAGRAPH_IDS.q4]}`
      : '',
    comment: undefined,
    grade: response.currentGrade ?? '',
    fixedTotal: response.fixedEvaluationScore ?? 0,
    penalty: 0,
    totalScore: response.totalScore ?? 0,
    savedAt: response.evaluatedAt ?? new Date().toISOString(),
  })
}

export function resolveJaEvaluationDisplayGrade(
  response: InstructorJaEvaluationResponse | null | undefined,
  fallbackGrade: JaEvaluationLetterGrade
): JaEvaluationLetterGrade {
  const current = response?.currentGrade?.trim()
  if (!current) return fallbackGrade
  const normalized = current.replace(/^JA_/i, '').toUpperCase()
  if (normalized === 'A' || normalized === 'B' || normalized === 'C' || normalized === 'D') {
    return normalized
  }
  return fallbackGrade
}
