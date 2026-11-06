import { describe, expect, it } from 'vitest'
import type { SurveyPollResultSection } from './aggregate-survey-poll-results'
import { paginateSurveyPollPdfSections } from './paginate-survey-poll-pdf-pages'

function scale(id: string): SurveyPollResultSection {
  return { kind: 'scale', paragraphId: id, title: id, data: [] }
}

function text(id: string): SurveyPollResultSection {
  return { kind: 'text', paragraphId: id, title: id, rows: [] }
}

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
