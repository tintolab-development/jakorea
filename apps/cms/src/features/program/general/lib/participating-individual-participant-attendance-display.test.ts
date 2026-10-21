import { describe, expect, it } from 'vitest'
import {
  formatParticipatingIndividualParticipantAttendanceShortDateLabel,
  resolveParticipatingIndividualParticipantAbsenceDateLabel,
} from './participating-individual-participant-attendance-display'

describe('formatParticipatingIndividualParticipantAttendanceShortDateLabel', () => {
  it('keeps Korean month-day labels', () => {
    expect(formatParticipatingIndividualParticipantAttendanceShortDateLabel('5월 8일')).toBe(
      '5월 8일'
    )
  })

  it('extracts month-day from long Korean schedule labels', () => {
    expect(
      formatParticipatingIndividualParticipantAttendanceShortDateLabel(
        '26년 4월 3일 (금) | 오리엔테이션'
      )
    ).toBe('4월 3일')
  })

  it('formats ISO instants in Asia/Seoul', () => {
    expect(
      formatParticipatingIndividualParticipantAttendanceShortDateLabel('2026-10-30T04:03:00Z')
    ).toBe('10월 30일')
  })

  it('formats dotted calendar dates', () => {
    expect(formatParticipatingIndividualParticipantAttendanceShortDateLabel('2026. 10. 30')).toBe(
      '10월 30일'
    )
  })
})

describe('resolveParticipatingIndividualParticipantAbsenceDateLabel', () => {
  it('prefers the assigned schedule label over a raw ISO startAt', () => {
    expect(
      resolveParticipatingIndividualParticipantAbsenceDateLabel({
        scheduleLabel: '26년 10월 30일 (금) | 4차 교육',
        scheduleStartAt: '2026-10-30T04:03:00Z',
        scheduleName: '4차 교육',
      })
    ).toBe('10월 30일')
  })

  it('formats ISO startAt when no schedule label is present', () => {
    expect(
      resolveParticipatingIndividualParticipantAbsenceDateLabel({
        scheduleStartAt: '2026-10-30T04:03:00Z',
        scheduleName: 'L L L',
      })
    ).toBe('10월 30일')
  })
})
