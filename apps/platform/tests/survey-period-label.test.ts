import { describe, expect, it } from 'vitest'
import type { TitleWithPeriodParagraph } from '@jakorea/form-schema/writing-form'
import { resolveEducationSurveyPeriodLabel } from '../src/features/mypage/education/surveys/lib/survey-period-label'

function titleParagraph(patch: Partial<TitleWithPeriodParagraph> = {}): TitleWithPeriodParagraph {
  return {
    id: 'survey-paragraph-title',
    kind: 'description',
    variant: 'survey_title_with_period',
    requiredMark: true,
    paragraphTitle: '',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    surveyTitle: '설문조사ㅋㅋㅋㅋㅋ',
    surveyDescription: '',
    periodMode: 'custom',
    startPeriodMode: 'custom',
    endPeriodMode: 'custom',
    startAt: '2026-10-31T22:15:00.000Z',
    endAt: '2026-11-04T16:00:00.000Z',
    startPeriodPresetLabel: null,
    endPeriodPresetLabel: null,
    showWritingPeriodOnForm: true,
    ...patch,
  }
}

describe('education survey period label', () => {
  it('uses the platform date-time range format', () => {
    expect(resolveEducationSurveyPeriodLabel(titleParagraph())).toBe(
      '2026년 11월 1일(일) 07:15 ~ 2026년 11월 5일(목) 01:00'
    )
  })

  it('omits midnight clocks like other platform datetime labels', () => {
    expect(
      resolveEducationSurveyPeriodLabel(
        titleParagraph({
          startAt: '2026-11-01T00:00:00+09:00',
          endAt: '2026-11-05T00:00:00+09:00',
        })
      )
    ).toBe('2026년 11월 1일(일) ~ 2026년 11월 5일(목)')
  })

  it('omits the end date when there is no deadline', () => {
    expect(
      resolveEducationSurveyPeriodLabel(titleParagraph({ endPeriodMode: 'immediate', endAt: null }))
    ).toBe('2026년 11월 1일(일) 07:15 ~')
  })

  it('resolves lecture-report activity end preset to next-month 5th 24:00', () => {
    expect(
      resolveEducationSurveyPeriodLabel(
        titleParagraph({
          startAt: null,
          endAt: null,
          startPeriodPresetLabel: '활동일 (09:00)',
          endPeriodPresetLabel: '활동일 익월 5일 (24:00)',
        }),
        '2026-10-27T03:55:00+09:00',
      ),
    ).toBe('2026년 10월 27일(화) 03:55 ~ 2026년 11월 5일(목) 24:00')
  })

  it('rolls lecture-report activity end into the next year', () => {
    expect(
      resolveEducationSurveyPeriodLabel(
        titleParagraph({
          startAt: null,
          endAt: null,
          endPeriodPresetLabel: '활동일 익월 5일 (24:00)',
        }),
        '2026-12-10T10:00:00+09:00',
      ),
    ).toBe('2026년 12월 10일(목) 10:00 ~ 2027년 1월 5일(화) 24:00')
  })
})
