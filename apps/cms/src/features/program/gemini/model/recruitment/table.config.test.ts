import { describe, expect, it } from 'vitest'
import { filterGeminiRecruitmentRowsBySearchParams } from './table.config'
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

describe('filterGeminiRecruitmentRowsBySearchParams', () => {
  const todayKey = '2026-10-25'
  const futureRow = row('186387', {
    title: '새 공고',
    trainingRequestPeriodStart: '2026-11-01',
    trainingRequestPeriodEnd: '2026-12-31',
  })
  const currentRow = row('1', {
    title: '진행 중 공고',
    trainingRequestPeriodStart: '2026-01-10',
    trainingRequestPeriodEnd: '2026-10-20',
  })

  it('URL에 기간이 없으면 기본 연수 요청 가능기간으로 응답 행을 걸러내지 않는다', () => {
    const filtered = filterGeminiRecruitmentRowsBySearchParams(
      [currentRow, futureRow],
      new URLSearchParams(),
      todayKey
    )
    expect(filtered.map(item => item.id)).toEqual(['186387', '1'])
  })

  it('공고명만 검색하면 기간 기본값과 무관하게 API와 같은 행을 남긴다', () => {
    const filtered = filterGeminiRecruitmentRowsBySearchParams(
      [futureRow],
      new URLSearchParams('gvt_title=새 공고'),
      todayKey
    )
    expect(filtered.map(item => item.id)).toEqual(['186387'])
  })

  it('조회한 기간이 URL에 있으면 그 기간으로만 걸러낸다', () => {
    const filtered = filterGeminiRecruitmentRowsBySearchParams(
      [currentRow, futureRow],
      new URLSearchParams('gvt_from=2026-01-01&gvt_to=2026-10-25'),
      todayKey
    )
    expect(filtered.map(item => item.id)).toEqual(['1'])
  })
})
