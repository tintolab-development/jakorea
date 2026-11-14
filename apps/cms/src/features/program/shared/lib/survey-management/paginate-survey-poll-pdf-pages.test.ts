import { describe, expect, it } from 'vitest'
import type { SurveyPollResultSection } from './aggregate-survey-poll-results'
import {
  paginateSurveyPollPdfSections,
  paginateSurveyPollPdfSectionsByHeight,
  type SurveyPollPdfPageItem,
} from './paginate-survey-poll-pdf-pages'

function scale(id: string): SurveyPollResultSection {
  return { kind: 'scale', paragraphId: id, title: id, data: [] }
}

function text(id: string, rowCount = 0): SurveyPollResultSection {
  return {
    kind: 'text',
    paragraphId: id,
    title: id,
    rows: Array.from({ length: rowCount }, (_, index) => ({
      content: `${id}-답변${index + 1}`,
      respondentName: `응답자${index + 1}`,
    })),
  }
}

function summarize(pages: SurveyPollPdfPageItem[][]) {
  return pages.map(page =>
    page.map(item =>
      item.section.kind === 'text'
        ? `${item.section.paragraphId}:${item.section.rows.length}`
        : item.section.paragraphId
    )
  )
}

describe('paginateSurveyPollPdfSectionsByHeight', () => {
  const base = { pageContentHeight: 800, sectionGap: 14, minSectionHeight: 176 }

  it('keeps an empty results page so the header still exports', () => {
    expect(paginateSurveyPollPdfSectionsByHeight([], { ...base, sections: [] })).toEqual([[]])
  })

  it('packs short scale and text questions onto the same page instead of one per page', () => {
    const sections = [scale('s1'), text('t1'), scale('s2'), text('t2'), text('t3')]
    const pages = paginateSurveyPollPdfSectionsByHeight(sections, {
      ...base,
      sections: [{ height: 200 }, { height: 120 }, { height: 200 }, { height: 120 }, { height: 120 }],
    })
    // 200 + 14 + 176 + 14 + 200 + 14 + 176 = 794 → 4문항, 다섯 번째는 다음 쪽
    expect(summarize(pages)).toEqual([['s1', 't1:0', 's2', 't2:0'], ['t3:0']])
  })

  it('moves a question that does not fit the remaining space to the next page', () => {
    const pages = paginateSurveyPollPdfSectionsByHeight([scale('s1'), scale('s2')], {
      ...base,
      sections: [{ height: 500 }, { height: 400 }],
    })
    expect(summarize(pages)).toEqual([['s1'], ['s2']])
  })

  it('continues a long text question on the next page row by row', () => {
    const rowHeights = Array.from({ length: 10 }, () => 100)
    const pages = paginateSurveyPollPdfSectionsByHeight([scale('s1'), text('t1', 10)], {
      ...base,
      // 문항 틀(제목·표 머리) 100 + 답변 10행 × 100
      sections: [{ height: 300 }, { height: 1100, rowHeights }],
    })
    // 1쪽: 300 + 14 + (100 + 3행) = 714, 2쪽: 100 + 7행 = 800
    expect(summarize(pages)).toEqual([['s1', 't1:3'], ['t1:7']])
    expect(pages[0][1].key).not.toEqual(pages[1][0].key)
  })

  it('uses the taller continuation capacity from the second page (summary only on page 1)', () => {
    const pages = paginateSurveyPollPdfSectionsByHeight(
      [scale('s1'), scale('s2'), scale('s3'), scale('s4'), scale('s5')],
      {
        ...base,
        pageContentHeight: 600,
        continuationPageContentHeight: 900,
        sections: Array.from({ length: 5 }, () => ({ height: 280 })),
      }
    )
    // 1쪽: 280 + 14 + 280 = 574 (세 번째는 868 > 600), 2쪽: 280 × 3 + 14 × 2 = 868 ≤ 900
    expect(summarize(pages)).toEqual([['s1', 's2'], ['s3', 's4', 's5']])
  })

  it('places a single oversized row on an empty page instead of looping', () => {
    const pages = paginateSurveyPollPdfSectionsByHeight([text('t1', 2)], {
      ...base,
      sections: [{ height: 2100, rowHeights: [1000, 1000] }],
    })
    expect(summarize(pages)).toEqual([['t1:1'], ['t1:1']])
  })
})

describe('paginateSurveyPollPdfSections', () => {
  it('keeps an empty results page so the header still exports', () => {
    expect(paginateSurveyPollPdfSections([])).toEqual([[]])
  })

  it('packs up to three scale questions per page', () => {
    const pages = paginateSurveyPollPdfSections([
      scale('s1'),
      scale('s2'),
      scale('s3'),
      scale('s4'),
    ])
    expect(pages.map(page => page.map(section => section.paragraphId))).toEqual([
      ['s1', 's2', 's3'],
      ['s4'],
    ])
  })

  it('puts each text question on its own page', () => {
    const pages = paginateSurveyPollPdfSections([
      scale('s1'),
      text('t1'),
      scale('s2'),
      scale('s3'),
      text('t2'),
    ])
    expect(pages.map(page => page.map(section => section.paragraphId))).toEqual([
      ['s1'],
      ['t1'],
      ['s2', 's3'],
      ['t2'],
    ])
  })
})
