import { describe, expect, it } from 'vitest'
import {
  aggregateScaleResults,
  aggregateTextResults,
  buildSurveyPollResultSectionsFromSummary,
  toOptionSummaryChartData,
} from './aggregate-survey-poll-results'
import type { SurveyPollRawResponse } from './survey-management-types'

const responses: SurveyPollRawResponse[] = [
  {
    respondentId: 'r1',
    respondentName: '김교사',
    addressRegion: '서울',
    answers: {
      score: 'scale-1',
      subjective: '좋았습니다.',
    },
  },
  {
    respondentId: 'r2',
    respondentName: '이학생',
    addressRegion: '부산',
    answers: {
      score: 'scale-2',
      subjective: '',
    },
  },
  {
    respondentId: 'r3',
    respondentName: '박학생',
    addressRegion: '대전',
    answers: {
      score: 'scale-1',
      subjective: '다시 참여하고 싶습니다.',
    },
  },
]

describe('survey poll result aggregation', () => {
  it('척도형 응답이 항목 라벨로 와도 같은 항목으로 집계한다', () => {
    const result = aggregateScaleResults(
      [
        { respondentId: 'a', respondentName: 'A', addressRegion: '', answers: { score: '만족' } },
        {
          respondentId: 'b',
          respondentName: 'B',
          addressRegion: '',
          answers: { score: 'scale-1' },
        },
      ],
      'score',
      [
        { id: 'scale-1', label: '만족' },
        { id: 'scale-2', label: '보통' },
      ]
    )
    expect(result.map(row => row.count)).toEqual([2, 0])
  })

  it('척도형 응답을 항목별로 집계한다', () => {
    const result = aggregateScaleResults(responses, 'score', [
      { id: 'scale-1', label: '만족' },
      { id: 'scale-2', label: '보통' },
      { id: 'scale-3', label: '불만족' },
    ])

    expect(result.map(item => item.count)).toEqual([2, 1, 0])
  })

  it('주관식 응답은 빈 답변을 제외하고 답변자를 보존한다', () => {
    const result = aggregateTextResults(responses, 'subjective')

    expect(result).toEqual([
      { content: '좋았습니다.', respondentName: '김교사' },
      { content: '다시 참여하고 싶습니다.', respondentName: '박학생' },
    ])
  })
})

describe('toOptionSummaryChartData', () => {
  it('orders by displayOrder and keeps zero-count options', () => {
    expect(
      toOptionSummaryChartData([
        { value: 'b', label: '그렇다', displayOrder: 1, count: 0 },
        { value: 'a', label: '보통', displayOrder: 0, count: 2 },
      ]).map(({ itemId, label, count }) => ({ itemId, label, count }))
    ).toEqual([
      { itemId: 'a', label: '보통', count: 2 },
      { itemId: 'b', label: '그렇다', count: 0 },
    ])
  })
})

describe('buildSurveyPollResultSectionsFromSummary', () => {
  it('skips title, closing and user-info from Q numbers', () => {
    const sections = buildSurveyPollResultSectionsFromSummary(
      [
        {
          questionKey: 'title',
          questionLabel: '제목',
          questionType: 'SURVEY_TITLE_WITH_PERIOD',
          displayOrder: 0,
          required: true,
        },
        {
          questionKey: 'user',
          questionLabel: '설문자 정보',
          questionType: 'USER_INFO',
          displayOrder: 1,
          required: true,
        },
        {
          questionKey: 'score',
          questionLabel: '만족도',
          questionType: 'SCALE_TYPE',
          displayOrder: 2,
          required: true,
          options: [{ value: 's1', label: '보통', displayOrder: 0, count: 1 }],
        },
        {
          questionKey: 'private-scale',
          questionLabel: '비공개',
          questionType: 'SCALE_TYPE',
          displayOrder: 3,
          required: false,
        },
        {
          questionKey: 'subjective',
          questionLabel: '의견',
          questionType: 'SHORT_ESSAY',
          displayOrder: 4,
          required: false,
        },
        {
          questionKey: 'closing',
          questionLabel: '마무리',
          questionType: 'CLOSING',
          displayOrder: 5,
          required: false,
        },
        {
          questionKey: 'orphan',
          questionLabel: '옛 문항',
          questionType: 'SHORT_ESSAY',
          displayOrder: null,
          required: false,
        },
      ],
      responses
    )
    expect(
      sections.map(({ kind, paragraphId, title, required }) => ({
        kind,
        paragraphId,
        title,
        required,
      }))
    ).toEqual([
      { kind: 'scale', paragraphId: 'score', title: 'Q1. 만족도', required: true },
      { kind: 'text', paragraphId: 'subjective', title: 'Q3. 의견', required: false },
    ])
    expect(sections[1]).toMatchObject({
      rows: [
        { content: '좋았습니다.', respondentName: '김교사' },
        { content: '다시 참여하고 싶습니다.', respondentName: '박학생' },
      ],
    })
  })
})
