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

describe('geminiRecruitmentTablePageConfig 기본 조회 조건 (QA-0103)', () => {
  it('기본 연수 요청 가능기간은 비어 있다(전체 기간)', () => {
    expect(geminiRecruitmentTablePageConfig.filters.initialPending.trainingRequestPeriodRange).toBeNull()
  })

  it('URL에 기간이 없으면 기간을 채우지 않고, 조회해도 기간 쿼리를 쓰지 않는다', () => {
    let pending = geminiRecruitmentTablePageConfig.filters.initialPending
    geminiRecruitmentTablePageConfig.filters.syncPendingFromUrl({
      context: { todayKey: '2026-11-12' },
      searchParams: new URLSearchParams('gvt_title=공고'),
      setPendingFilters: next => {
        pending = typeof next === 'function' ? next(pending) : next
      },
    } as Parameters<typeof geminiRecruitmentTablePageConfig.filters.syncPendingFromUrl>[0])
    expect(pending.title).toBe('공고')
    expect(pending.trainingRequestPeriodRange).toBeNull()

    const rules = geminiRecruitmentTablePageConfig.getSearchSync({ todayKey: '2026-11-12' })
      .paramConfig
    const next = new URLSearchParams()
    for (const rule of rules) {
      if (rule.kind === 'apply') rule.apply(next, pending)
    }
    expect(next.has('gvt_from')).toBe(false)
    expect(next.has('gvt_to')).toBe(false)
  })
})
