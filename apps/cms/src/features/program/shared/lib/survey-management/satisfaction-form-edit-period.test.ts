import { describe, expect, it } from 'vitest'
import { createDefaultSurveyDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  addSeoulCalendarDaysEndOfDay,
  applySurveyTitleCustomPeriodToDraft,
  exclusiveMidnightToDisplayDeadline,
  resolveSatisfactionFormEditPeriod,
  resolveSatisfactionPreviewPeriod,
} from './satisfaction-form-edit-period'

describe('exclusiveMidnightToDisplayDeadline', () => {
  it('maps exclusive next-day 00:00 KST to previous day 23:59', () => {
    expect(exclusiveMidnightToDisplayDeadline('2026-11-16T00:00:00.000+09:00')).toBe(
      '2026-11-15T23:59:59.999+09:00'
    )
  })

  it('keeps a real 23:59 deadline', () => {
    expect(exclusiveMidnightToDisplayDeadline('2026-11-15T23:59:59.999+09:00')).toBe(
      '2026-11-15T23:59:59.999+09:00'
    )
  })
})

describe('addSeoulCalendarDaysEndOfDay', () => {
  it('adds window days from session end like the register modal example', () => {
    expect(addSeoulCalendarDaysEndOfDay('2026-11-12T12:00:00.000+09:00', 3)).toBe(
      '2026-11-15T23:59:59.999+09:00'
    )
  })
})

describe('resolveSatisfactionFormEditPeriod', () => {
  it('prefers binding displayDeadlineAt', () => {
    expect(
      resolveSatisfactionFormEditPeriod({
        submissionStartAt: '2026-11-12T12:00:00.000+09:00',
        displayDeadlineAt: '2026-11-19T23:59:59.999+09:00',
        submissionEndAt: '2026-11-20T00:00:00.000+09:00',
      })
    ).toEqual({
      startAt: '2026-11-12T12:00:00.000+09:00',
      endAt: '2026-11-19T23:59:59.999+09:00',
    })
  })

  it('computes from last education slot when binding dates are empty', () => {
    expect(
      resolveSatisfactionFormEditPeriod(
        {
          targetScope: 'PROGRAM',
          satisfactionWindowDays: 3,
        },
        [
          { id: 1, endAt: '2026-11-10T12:00:00.000+09:00' },
          { id: 2, endAt: '2026-11-12T12:00:00.000+09:00' },
        ]
      )
    ).toEqual({
      startAt: '2026-11-12T12:00:00.000+09:00',
      endAt: '2026-11-15T23:59:59.999+09:00',
    })
  })

  it('uses the bound schedule slot for PER_SCHEDULE', () => {
    expect(
      resolveSatisfactionFormEditPeriod(
        {
          targetScope: 'SCHEDULE',
          targetScopeId: 1,
          satisfactionWindowDays: 7,
        },
        [
          { id: 1, endAt: '2026-11-12T12:00:00.000+09:00' },
          { id: 2, endAt: '2026-11-20T12:00:00.000+09:00' },
        ]
      )
    ).toEqual({
      startAt: '2026-11-12T12:00:00.000+09:00',
      endAt: '2026-11-19T23:59:59.999+09:00',
    })
  })

  it('uses FE windowDays and startDate when the create response has no period', () => {
    expect(
      resolveSatisfactionFormEditPeriod(
        { formType: 'SATISFACTION', targetScope: 'PROGRAM' },
        [{ id: 9, startDate: '2026-11-12T12:00:00.000+09:00' }],
        { windowDays: '3' }
      )
    ).toEqual({
      startAt: '2026-11-12T12:00:00.000+09:00',
      endAt: '2026-11-15T23:59:59.999+09:00',
    })
  })

  it('falls back to the latest slot when SCHEDULE id does not match', () => {
    expect(
      resolveSatisfactionFormEditPeriod(
        { formType: 'SATISFACTION', targetScope: 'SCHEDULE', targetScopeId: 99 },
        [
          { id: '1', endAt: '2026-11-10T12:00:00.000+09:00' },
          { id: '2', endAt: '2026-11-12T12:00:00.000+09:00' },
        ],
        { windowDays: 3, targetScope: 'SCHEDULE', targetScopeId: '99' }
      )
    ).toEqual({
      startAt: '2026-11-12T12:00:00.000+09:00',
      endAt: '2026-11-15T23:59:59.999+09:00',
    })
  })
})

describe('resolveSatisfactionPreviewPeriod', () => {
  it('uses the bound session end and window days for preview', () => {
    expect(
      resolveSatisfactionPreviewPeriod(
        {
          targetScope: 'SCHEDULE',
          targetScopeId: 3,
          satisfactionWindowDays: 7,
        },
        [
          { id: 1, endAt: '2026-11-03T12:00:00.000+09:00' },
          { id: 3, endAt: '2026-11-25T12:00:00.000+09:00' },
        ]
      )
    ).toEqual({
      startAt: '2026-11-25T12:00:00.000+09:00',
      endAt: '2026-12-02T23:59:59.999+09:00',
    })
  })
})

describe('applySurveyTitleCustomPeriodToDraft', () => {
  it('fills empty title period as custom dates', () => {
    const next = applySurveyTitleCustomPeriodToDraft(createDefaultSurveyDraft(), {
      startAt: '2026-11-12T12:00:00.000+09:00',
      endAt: '2026-11-15T23:59:59.999+09:00',
    })
    const title = next.paragraphs.find(
      paragraph => paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period'
    )
    expect(title).toMatchObject({
      showWritingPeriodOnForm: true,
      startPeriodMode: 'custom',
      endPeriodMode: 'custom',
      startAt: '2026-11-12T12:00:00.000+09:00',
      endAt: '2026-11-15T23:59:59.999+09:00',
    })
  })

  it('overwrites catalog title dates with the satisfaction run window', () => {
    const seeded = applySurveyTitleCustomPeriodToDraft(createDefaultSurveyDraft(), {
      startAt: '2020-01-01T00:00:00.000+09:00',
      endAt: '2020-01-02T23:59:59.999+09:00',
    })
    const next = applySurveyTitleCustomPeriodToDraft(seeded, {
      startAt: '2026-11-12T12:00:00.000+09:00',
      endAt: '2026-11-15T23:59:59.999+09:00',
    })
    const title = next.paragraphs.find(
      paragraph => paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period'
    )
    expect(title).toMatchObject({
      startAt: '2026-11-12T12:00:00.000+09:00',
      endAt: '2026-11-15T23:59:59.999+09:00',
    })
  })
})
