import { describe, expect, it } from 'vitest'
import { aggregateScaleResults, aggregateTextResults } from './aggregate-survey-poll-results'
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
