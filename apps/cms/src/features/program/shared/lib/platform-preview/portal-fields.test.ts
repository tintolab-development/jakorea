import { describe, expect, it } from 'vitest'
import {
  parseScheduleLabelRange,
  toPortalDateTime,
  toPortalOperationMethod,
  toPortalProgramId,
  toPortalSponsorNames,
} from './portal-fields'

describe('toPortalDateTime', () => {
  it('keeps date-only values at local midnight', () => {
    expect(toPortalDateTime('2026-09-01')).toBe('2026-09-01T00:00:00')
    expect(toPortalDateTime('2026.9.1')).toBe('2026-09-01T00:00:00')
  })

  it('formats Date objects in local time', () => {
    expect(toPortalDateTime(new Date(2026, 8, 1, 9, 30))).toBe('2026-09-01T09:30:00')
  })

  it('returns undefined for empty or invalid values', () => {
    expect(toPortalDateTime('')).toBeUndefined()
    expect(toPortalDateTime('not a date')).toBeUndefined()
    expect(toPortalDateTime(undefined)).toBeUndefined()
  })
})

describe('toPortalOperationMethod', () => {
  it('maps registration values and labels', () => {
    expect(toPortalOperationMethod('online')).toBe('ONLINE')
    expect(toPortalOperationMethod('오프라인')).toBe('OFFLINE')
    expect(toPortalOperationMethod('온/오프라인')).toBe('HYBRID')
    expect(toPortalOperationMethod('participant_selection')).toBe('PARTICIPANT_CHOICE')
    expect(toPortalOperationMethod('참여자 선택')).toBe('PARTICIPANT_CHOICE')
    expect(toPortalOperationMethod('기타')).toBeUndefined()
  })
})

describe('parseScheduleLabelRange', () => {
  it('reads the first and last dates with times', () => {
    expect(parseScheduleLabelRange('2026년 9월 1일(화) 09:00 ~ 2026년 9월 3일(목) 12:00')).toEqual({
      startAt: '2026-09-01T09:00:00',
      endAt: '2026-09-03T12:00:00',
    })
  })

  it('applies a trailing end time to a single date', () => {
    expect(parseScheduleLabelRange('2026년 10월 2일(금) 10:00 ~ 12:00')).toEqual({
      startAt: '2026-10-02T10:00:00',
      endAt: '2026-10-02T12:00:00',
    })
  })

  it('reads dotted dates', () => {
    expect(parseScheduleLabelRange('2026.09.01 ~ 2026.09.05')).toEqual({
      startAt: '2026-09-01T00:00:00',
      endAt: '2026-09-05T00:00:00',
    })
  })

  it('returns null when no date is present', () => {
    expect(parseScheduleLabelRange('그룹 A : 09:30 ~ 09:40')).toBeNull()
  })
})

describe('ids and sponsors', () => {
  it('uses numeric ids only', () => {
    expect(toPortalProgramId('170001')).toBe(170001)
    expect(toPortalProgramId('registration-preview')).toBe(0)
  })

  it('splits sponsor display names', () => {
    expect(toPortalSponsorNames('현대 자동차, 한국씨티은행')).toEqual(['현대 자동차', '한국씨티은행'])
    expect(toPortalSponsorNames('-')).toBeUndefined()
  })
})
