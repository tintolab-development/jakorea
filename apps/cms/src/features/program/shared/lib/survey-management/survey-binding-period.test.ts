import { describe, expect, it } from 'vitest'
import {
  ensureSurveyCreateSubmissionPeriod,
  resolveSurveyBindingPeriodForFormSave,
  SURVEY_OPEN_ENDED_END_AT,
} from '@/features/program/shared/lib/survey-management/survey-binding-period'

describe('ensureSurveyCreateSubmissionPeriod', () => {
  it('템플릿 custom 기간이 있으면 그대로 둔다', () => {
    expect(
      ensureSurveyCreateSubmissionPeriod({
        submissionStartAt: '2026-11-01T00:00:00.000+09:00',
        submissionEndAt: '2026-11-30T23:59:59.999+09:00',
      })
    ).toEqual({
      submissionStartAt: '2026-11-01T00:00:00.000+09:00',
      submissionEndAt: '2026-11-30T23:59:59.999+09:00',
    })
  })

  it('기간이 없으면 Asia/Seoul 다음 날 시작과 열린 종료를 채워 위저드 진입이 가능하게 한다', () => {
    const now = new Date('2026-10-24T12:00:00.000Z')
    expect(ensureSurveyCreateSubmissionPeriod({}, now)).toEqual({
      submissionStartAt: '2026-10-25T00:00:00.000+09:00',
      submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
    })
  })

  it('시작일만 있으면 열린 종료를 채운다', () => {
    expect(
      ensureSurveyCreateSubmissionPeriod(
        { submissionStartAt: '2026-12-01T00:00:00.000+09:00' },
        new Date('2026-10-24T12:00:00.000Z')
      )
    ).toEqual({
      submissionStartAt: '2026-12-01T00:00:00.000+09:00',
      submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
    })
  })
})

describe('resolveSurveyBindingPeriodForFormSave', () => {
  it('바로 시작·마감 없음은 오늘 00:00(KST)과 열린 종료일로 저장한다', () => {
    expect(
      resolveSurveyBindingPeriodForFormSave({}, new Date('2026-10-24T12:25:00.000Z'))
    ).toEqual({
      submissionStartAt: '2026-10-24T00:00:00.000+09:00',
      submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
    })
  })

  it('custom 기간은 그대로 둔다', () => {
    expect(
      resolveSurveyBindingPeriodForFormSave({
        submissionStartAt: '2026-11-01T00:00:00.000+09:00',
        submissionEndAt: '2026-11-30T23:59:59.999+09:00',
      })
    ).toEqual({
      submissionStartAt: '2026-11-01T00:00:00.000+09:00',
      submissionEndAt: '2026-11-30T23:59:59.999+09:00',
    })
  })
})
