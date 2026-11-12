import { describe, expect, it } from 'vitest'
import { assignRecruitmentDisplayNumbers } from './recruitment-display-numbers'
import type { GeminiRecruitmentRow } from './types'

function row(id: string, isDraft = false): GeminiRecruitmentRow {
  return { id, isDraft, displayNo: 0 } as unknown as GeminiRecruitmentRow
}

describe('assignRecruitmentDisplayNumbers (QA-0385·0423)', () => {
  it('정렬(임시저장 최상단 → 최신순)은 그대로 두고 No.를 위에서부터 1, 2, 3…으로 매긴다', () => {
    const out = assignRecruitmentDisplayNumbers([row('10'), row('30'), row('draft', true), row('20')])
    expect(out.map(r => [r.id, r.displayNo])).toEqual([
      ['draft', 1],
      ['30', 2],
      ['20', 3],
      ['10', 4],
    ])
  })
})
