import { describe, expect, it } from 'vitest'
import {
  SATISFACTION_RUN_MODE_ONCE_AT_END,
  SATISFACTION_RUN_MODE_PER_SCHEDULE,
  aggregateSatisfactionCounts,
  mergeSatisfactionQuestionSummaries,
  canDownloadSatisfactionAggregate,
  canDownloadSatisfactionResults,
  mapSatisfactionProgressStatus,
  readSatisfactionRunMode,
  satisfactionBindingRowKey,
} from './satisfaction-binding-contract'

describe('satisfaction-binding-contract', () => {
  it('maps runMode from targetScope when the field is absent', () => {
    expect(readSatisfactionRunMode(undefined, 'SCHEDULE')).toBe(SATISFACTION_RUN_MODE_PER_SCHEDULE)
    expect(readSatisfactionRunMode(undefined, 'PROGRAM')).toBe(SATISFACTION_RUN_MODE_ONCE_AT_END)
    expect(readSatisfactionRunMode('ONCE_AT_END')).toBe(SATISFACTION_RUN_MODE_ONCE_AT_END)
  })

  it('trusts progressStatus instead of response counts', () => {
    expect(
      mapSatisfactionProgressStatus({ progressStatus: 'IN_PROGRESS' }, 'finished')
    ).toBe('in_progress')
    expect(mapSatisfactionProgressStatus({ progressStatus: 'FINISHED' }, 'in_progress')).toBe(
      'finished'
    )
  })

  it('does not enable download from completion rate', () => {
    expect(canDownloadSatisfactionResults({ resultDownloadable: false })).toBe(false)
    expect(canDownloadSatisfactionResults({ resultDownloadable: null })).toBe(false)
    expect(canDownloadSatisfactionResults({})).toBe(false)
    expect(canDownloadSatisfactionResults({ resultDownloadable: true })).toBe(true)
    expect(
      canDownloadSatisfactionAggregate([
        { resultDownloadable: true },
        { resultDownloadable: false },
      ])
    ).toBe(false)
    expect(
      canDownloadSatisfactionAggregate([
        { resultDownloadable: true },
        { resultDownloadable: true },
      ])
    ).toBe(true)
  })

  it('aggregates expected as null when any row is unknown', () => {
    expect(
      aggregateSatisfactionCounts([
        { responseCount: 12, expectedRespondentCount: 20 },
        { responseCount: 3, expectedRespondentCount: null },
      ])
    ).toEqual({ submittedCount: 15, expectedRespondentCount: null })
    expect(
      aggregateSatisfactionCounts([
        { responseCount: 12, expectedRespondentCount: 20 },
        { responseCount: 8, expectedRespondentCount: 10 },
      ])
    ).toEqual({ submittedCount: 20, expectedRespondentCount: 30 })
  })

  it('keys rows by bindingId + targetScopeId, not session_no', () => {
    expect(satisfactionBindingRowKey({ bindingId: 501, targetScopeId: 3001 })).toBe('501:3001')
  })

  it('sums option counts across schedule summaries without inventing questions', () => {
    expect(
      mergeSatisfactionQuestionSummaries([
        [
          {
            questionKey: 'survey-paragraph-score',
            questionLabel: '일정',
            questionType: 'SCALE_TYPE',
            displayOrder: 2,
            required: true,
            options: [
              { value: 'yes', label: '그렇다', displayOrder: 0, count: 1 },
              { value: 'no', label: '아니다', displayOrder: 1, count: 0 },
            ],
          },
        ],
        [
          {
            questionKey: 'survey-paragraph-score',
            questionLabel: '일정',
            questionType: 'SCALE_TYPE',
            displayOrder: 2,
            required: true,
            options: [
              { value: 'yes', label: '그렇다', displayOrder: 0, count: 1 },
              { value: 'no', label: '아니다', displayOrder: 1, count: 0 },
            ],
          },
        ],
      ])
    ).toEqual([
      {
        questionKey: 'survey-paragraph-score',
        questionLabel: '일정',
        questionType: 'SCALE_TYPE',
        displayOrder: 2,
        required: true,
        options: [
          { value: 'yes', label: '그렇다', displayOrder: 0, count: 2 },
          { value: 'no', label: '아니다', displayOrder: 1, count: 0 },
        ],
      },
    ])
  })
})
