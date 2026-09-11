import { describe, expect, it } from 'vitest'
import { buildJaGradeEvaluationDraft } from '@/features/user/detail/lib/ja-grade-evaluation-draft'
import { JA_GRADE_PARAGRAPH_IDS } from '@/features/user/detail/lib/ja-grade-evaluation-constants'
import {
  applyJaEvaluationResponseToDraft,
  mapJaGradeDraftToEvaluationInput,
  resolveJaEvaluationDisplayGrade,
  resolveScaleTypeCriteriaScore,
} from '@/features/user/detail/lib/ja-grade-evaluation-api'
import type { ScaleTypeParagraph } from '@/features/template/model/writing-form-draft.schema'

function draftWithSelections(selections: [string, string, string, string]) {
  const ids: string[] = [
    JA_GRADE_PARAGRAPH_IDS.q1,
    JA_GRADE_PARAGRAPH_IDS.q2,
    JA_GRADE_PARAGRAPH_IDS.q3,
    JA_GRADE_PARAGRAPH_IDS.q4,
  ]
  const draft = buildJaGradeEvaluationDraft(null)
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      const index = ids.indexOf(paragraph.id)
      if (index >= 0 && paragraph.kind === 'single_item' && paragraph.variant === 'scale_type') {
        return { ...paragraph, selectedPreviewItemId: selections[index] }
      }
      return paragraph
    }),
  }
}

describe('ja-grade-evaluation-api', () => {
  it('scale 선택을 1~5 점수로 매핑한다', () => {
    const paragraph = buildJaGradeEvaluationDraft(null).paragraphs.find(
      p => p.id === JA_GRADE_PARAGRAPH_IDS.q1
    ) as ScaleTypeParagraph
    expect(resolveScaleTypeCriteriaScore({ ...paragraph, selectedPreviewItemId: 'ja-scale-1' })).toBe(1)
    expect(resolveScaleTypeCriteriaScore({ ...paragraph, selectedPreviewItemId: 'ja-scale-5' })).toBe(5)
  })

  it('draft를 InstructorJaEvaluationInput으로 변환한다', () => {
    const draft = draftWithSelections(['ja-scale-5', 'ja-scale-4', 'ja-scale-3', 'ja-scale-2'])
    expect(mapJaGradeDraftToEvaluationInput(draft)).toEqual({
      contentExpertiseScore: 5,
      deliveryImmersionScore: 4,
      engagementInteractionScore: 3,
      contentUseLessonDesignScore: 2,
    })
  })

  it('서버 응답 criteria로 draft를 hydrate한다', () => {
    const draft = applyJaEvaluationResponseToDraft(buildJaGradeEvaluationDraft(null), {
      currentGrade: 'JA_A',
      totalScore: 90,
      criteria: [
        { criteriaCode: 'CONTENT_EXPERTISE', score: 5 },
        { criteriaCode: 'DELIVERY_IMMERSION', score: 4 },
        { criteriaCode: 'ENGAGEMENT_INTERACTION', score: 3 },
        { criteriaCode: 'CONTENT_USE_LESSON_DESIGN', score: 2 },
      ],
    })
    const q1 = draft.paragraphs.find(p => p.id === JA_GRADE_PARAGRAPH_IDS.q1)
    const q4 = draft.paragraphs.find(p => p.id === JA_GRADE_PARAGRAPH_IDS.q4)
    expect(
      q1?.kind === 'single_item' && q1.variant === 'scale_type' ? q1.selectedPreviewItemId : null
    ).toBe('ja-scale-5')
    expect(
      q4?.kind === 'single_item' && q4.variant === 'scale_type' ? q4.selectedPreviewItemId : null
    ).toBe('ja-scale-2')
    expect(resolveJaEvaluationDisplayGrade({ currentGrade: 'JA_A' }, 'B')).toBe('A')
    expect(resolveJaEvaluationDisplayGrade({ currentGrade: 'A' })).toBe('A')
    expect(resolveJaEvaluationDisplayGrade({ currentGrade: 'D' })).toBe('D')
    expect(resolveJaEvaluationDisplayGrade({})).toBeNull()
    expect(resolveJaEvaluationDisplayGrade({}, 'C')).toBe('C')
  })
})
