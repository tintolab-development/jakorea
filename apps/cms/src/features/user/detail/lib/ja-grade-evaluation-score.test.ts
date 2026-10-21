import { describe, expect, it } from 'vitest'
import { buildJaGradeEvaluationDraft } from '@/features/user/detail/lib/ja-grade-evaluation-draft'
import {
  calculateJaGradeEvaluationFromDraft,
  calculateJaGradePenalty,
  resolveJaEvaluationLetterGrade,
  resolveScaleTypeScore,
  validateJaGradeEvaluationDraft,
} from '@/features/user/detail/lib/ja-grade-evaluation-score'
import { JA_GRADE_PARAGRAPH_IDS } from '@/features/user/detail/lib/ja-grade-evaluation-constants'
import type { ScaleTypeParagraph } from '@/features/template/model/writing-form-draft.schema'

function draftWithSelections(selections: [string, string, string, string]) {
  let draft = buildJaGradeEvaluationDraft(null)
  const ids: readonly string[] = [
    JA_GRADE_PARAGRAPH_IDS.q1,
    JA_GRADE_PARAGRAPH_IDS.q2,
    JA_GRADE_PARAGRAPH_IDS.q3,
    JA_GRADE_PARAGRAPH_IDS.q4,
  ]
  draft = {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      const index = ids.indexOf(paragraph.id)
      if (
        index >= 0 &&
        paragraph.kind === 'single_item' &&
        paragraph.variant === 'scale_type'
      ) {
        return { ...paragraph, selectedPreviewItemId: selections[index] }
      }
      return paragraph
    }),
  }
  return draft
}

describe('ja-grade-evaluation-score', () => {
  it('resolveScaleTypeScore는 1~5 선택을 5~25점으로 환산한다', () => {
    const paragraph = buildJaGradeEvaluationDraft(null).paragraphs.find(
      p => p.id === JA_GRADE_PARAGRAPH_IDS.q1
    ) as ScaleTypeParagraph

    expect(resolveScaleTypeScore({ ...paragraph, selectedPreviewItemId: 'ja-scale-1' })).toBe(5)
    expect(resolveScaleTypeScore({ ...paragraph, selectedPreviewItemId: 'ja-scale-5' })).toBe(25)
  })

  it('등급 구간을 스크린샷 기준으로 산출한다', () => {
    expect(resolveJaEvaluationLetterGrade(100)).toBe('A')
    expect(resolveJaEvaluationLetterGrade(85)).toBe('A')
    expect(resolveJaEvaluationLetterGrade(84)).toBe('B')
    expect(resolveJaEvaluationLetterGrade(60)).toBe('B')
    expect(resolveJaEvaluationLetterGrade(59)).toBe('C')
    expect(resolveJaEvaluationLetterGrade(50)).toBe('C')
    expect(resolveJaEvaluationLetterGrade(49)).toBe('D')
    expect(resolveJaEvaluationLetterGrade(0)).toBe('D')
  })

  it('Q1~Q4 미선택 시 검증에 실패한다', () => {
    const draft = buildJaGradeEvaluationDraft(null)
    expect(validateJaGradeEvaluationDraft(draft).valid).toBe(false)
  })

  it('고정 점수에서 항목별 2회당 감점을 차감해 최종 등급을 계산한다', () => {
    const draft = draftWithSelections(['ja-scale-5', 'ja-scale-5', 'ja-scale-5', 'ja-scale-4'])
    const result = calculateJaGradeEvaluationFromDraft(draft, {
      scheduleChangeCount: 2,
      lateReportCount: 3,
    })

    expect(result.fixedTotal).toBe(95)
    expect(calculateJaGradePenalty(2, 3)).toEqual({ penaltyEventCount: 2, penalty: 10 })
    expect(calculateJaGradePenalty(1, 1)).toEqual({ penaltyEventCount: 0, penalty: 0 })
    expect(result.penalty).toBe(10)
    expect(result.totalScore).toBe(85)
    expect(result.grade).toBe('A')
  })

  it('감점 후 총점은 음수일 수 있고 등급은 D다', () => {
    const draft = draftWithSelections(['ja-scale-1', 'ja-scale-1', 'ja-scale-1', 'ja-scale-1'])
    const result = calculateJaGradeEvaluationFromDraft(draft, {
      scheduleChangeCount: 6,
      lateReportCount: 6,
    })

    expect(result.fixedTotal).toBe(20)
    expect(result.penalty).toBe(30)
    expect(result.totalScore).toBe(-10)
    expect(result.grade).toBe('D')
  })
})
