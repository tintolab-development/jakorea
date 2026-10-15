import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import type { TitleWithPeriodParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  patchSurveyTitleWritingPeriodCustomRange,
  resolveSurveyTitleWritingPeriodAppliedSurfaceRange,
} from '@/features/template/lib/survey-title-writing-period'

function titleParagraph(
  partial: Partial<TitleWithPeriodParagraph> = {}
): TitleWithPeriodParagraph {
  return {
    id: 'survey-title',
    kind: 'description',
    variant: 'survey_title_with_period',
    requiredMark: true,
    paragraphTitle: '',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    surveyTitle: '설문',
    surveyDescription: '',
    periodMode: 'immediate',
    startPeriodMode: 'immediate',
    endPeriodMode: 'immediate',
    startAt: null,
    endAt: null,
    startPeriodPresetLabel: null,
    endPeriodPresetLabel: null,
    showWritingPeriodOnForm: true,
    ...partial,
  }
}

describe('survey-title-writing-period', () => {
  it('직접 설정 시작·종료가 모두 있을 때만 듀얼 표면 구간을 만든다', () => {
    expect(
      resolveSurveyTitleWritingPeriodAppliedSurfaceRange(
        titleParagraph({
          startPeriodMode: 'custom',
          endPeriodMode: 'immediate',
          startAt: '2026-10-01T00:00:00.000Z',
        })
      )
    ).toBeNull()

    const start = dayjs('2026-10-10').startOf('day')
    const end = dayjs('2026-10-20').endOf('day')
    const range = resolveSurveyTitleWritingPeriodAppliedSurfaceRange(
      titleParagraph({
        startPeriodMode: 'custom',
        endPeriodMode: 'custom',
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      })
    )
    expect(range?.[0].format('YYYY-MM-DD')).toBe('2026-10-10')
    expect(range?.[1].format('YYYY-MM-DD')).toBe('2026-10-20')
  })

  it('날짜만 선택 시 마감일은 해당일 종료 시각으로 저장한다', () => {
    const next = patchSurveyTitleWritingPeriodCustomRange(
      titleParagraph(),
      [dayjs('2026-10-05'), dayjs('2026-10-12')],
      false
    )
    expect(next.startAt).toBe(dayjs('2026-10-05').startOf('day').toISOString())
    expect(next.endAt).toBe(dayjs('2026-10-12').endOf('day').toISOString())
  })
})
