import { describe, expect, it } from 'vitest'
import {
  JA_GRADE_INTRO_GRADE_RANGE_BOLD,
  createJaGradeEvaluationDraft,
} from '@/features/user/detail/lib/ja-grade-evaluation-draft'
import { JA_GRADE_PARAGRAPH_IDS } from '@/features/user/detail/lib/ja-grade-evaluation-constants'

describe('ja-grade-evaluation-draft', () => {
  it('등급 구간 안내에 50점=C와 50점 미만=D를 포함한다', () => {
    expect(JA_GRADE_INTRO_GRADE_RANGE_BOLD).toBe(
      'A 85~100점 / B 60~84점 / C 50~59점 / D 50점 미만'
    )
  })

  it('행정 평가 문구는 항목별 2회당 감점이며 정산 기한 행이 없다', () => {
    const draft = createJaGradeEvaluationDraft()
    const q5 = draft.paragraphs.find(p => p.id === JA_GRADE_PARAGRAPH_IDS.q5)
    const lines =
      q5 && q5.kind === 'description' && q5.variant === 'static_description_lines'
        ? q5.lines.join('\n')
        : ''
    expect(lines).toContain('강의 취소 이력: 2회당 -5점')
    expect(lines).toContain('강의보고서 제출기한 미준수: 2회당 -5점')
    expect(lines).not.toContain('정산신청')
    expect(lines).not.toContain('1회당')
  })
})
