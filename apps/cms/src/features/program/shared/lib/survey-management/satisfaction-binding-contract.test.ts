import { describe, expect, it } from 'vitest'
import {
  SATISFACTION_RUN_MODE_ONCE_AT_END,
  SATISFACTION_RUN_MODE_PER_SCHEDULE,
  isSatisfactionPerScheduleWritingPeriodLocked,
  mergeSatisfactionQuestionSummaries,
  canDownloadSatisfactionResults,
  formatSatisfactionOnceAtEndScheduleLabel,
  formatSatisfactionOnceAtEndStartHint,
  formatSatisfactionWindowExampleLine,
  mapSatisfactionProgressStatus,
  readSatisfactionRunMode,
  satisfactionBindingRowKey,
} from './satisfaction-binding-contract'

describe('satisfaction-binding-contract', () => {
  it('locks writing-period input only for SATISFACTION PER_SCHEDULE', () => {
    expect(
      isSatisfactionPerScheduleWritingPeriodLocked({
        formType: 'SATISFACTION',
        runMode: 'PER_SCHEDULE',
      })
    ).toBe(true)
    expect(
      isSatisfactionPerScheduleWritingPeriodLocked({
        formType: 'SATISFACTION',
        targetScope: 'SCHEDULE',
      })
    ).toBe(true)
    expect(
      isSatisfactionPerScheduleWritingPeriodLocked({
        formType: 'SATISFACTION',
        runMode: 'ONCE_AT_END',
      })
    ).toBe(false)
    expect(
      isSatisfactionPerScheduleWritingPeriodLocked({
        formType: 'SURVEY',
        targetScope: 'SCHEDULE',
      })
    ).toBe(false)
  })

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

  it('always enables satisfaction result download', () => {
    expect(canDownloadSatisfactionResults({ resultDownloadable: false })).toBe(true)
    expect(canDownloadSatisfactionResults({ resultDownloadable: null })).toBe(true)
    expect(canDownloadSatisfactionResults({})).toBe(true)
    expect(canDownloadSatisfactionResults({ resultDownloadable: true })).toBe(true)
  })

  it('formats the once-at-end mint hint with the last education schedule', () => {
    expect(
      formatSatisfactionOnceAtEndScheduleLabel({
        sessionNo: 3,
        endAt: '2026-11-26T06:00:00.000Z',
      })
    ).toBe('3회차 11.26(목)')
    expect(formatSatisfactionOnceAtEndStartHint('3회차 11.26(목)')).toBe(
      '마지막 교육 일정(3회차 11.26(목))이 끝난 뒤에 시작할 수 있습니다.'
    )
    expect(formatSatisfactionOnceAtEndStartHint(null)).toBe(
      '마지막 교육 일정이 끝난 뒤에 시작할 수 있습니다.'
    )
  })

  it('builds the register-modal example from the selected window days', () => {
    expect(formatSatisfactionWindowExampleLine(3)).toBe(
      '예) 1회차 11.12(목) 12:00 종료 → 11.15(일) 23:59 마감'
    )
    expect(formatSatisfactionWindowExampleLine(7)).toBe(
      '예) 1회차 11.12(목) 12:00 종료 → 11.19(목) 23:59 마감'
    )
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
