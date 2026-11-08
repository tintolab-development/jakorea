import { describe, expect, it } from 'vitest'
import { geminiRecruitmentTablePageConfig } from './table.config'
import type { GeminiRecruitmentRow } from './types'

function row(
  id: string,
  patch: Partial<GeminiRecruitmentRow> = {}
): GeminiRecruitmentRow {
  return {
    id,
    displayNo: Number(id),
    title: `공고 ${id}`,
    applicationPeriodStart: '2026-10-01',
    applicationPeriodEnd: '2026-12-31',
    trainingRequestPeriodStart: '2026-10-01',
    trainingRequestPeriodEnd: '2026-12-31',
    ...patch,
  }
}

describe('geminiRecruitmentTablePageConfig.filterFn', () => {
  const context = { todayKey: '2026-10-25' }
  const outOfRangeRow = row('2', {
    title: '다른 공고',
    trainingRequestPeriodStart: '2027-03-01',
    trainingRequestPeriodEnd: '2027-04-30',
  })
  const draftRow = row('1', { isDraft: true, trainingRequestPeriodStart: '', trainingRequestPeriodEnd: '' })

  it('서버 검색 결과를 화면에서 다시 거르지 않는다(총 N건 = 표 행)', () => {
    const data = [outOfRangeRow, draftRow]
    const result = geminiRecruitmentTablePageConfig.filterFn({
      context,
      data,
      searchParams: new URLSearchParams(
        'gvt_title=새 공고&gvt_status=IN_PROGRESS&gvt_from=2026-01-01&gvt_to=2026-10-25'
      ),
    })
    expect(result.dataForTable.map(item => item.id)).toEqual(['2', '1'])
    expect(result.filteredData).toHaveLength(2)
  })
})
