import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  applyChangedDatesToEducationScheduleLines,
  applyChangedRangesToEducationScheduleLines,
  applyDateToEducationScheduleLine,
  educationOperationRangeSealKeyFromSchedulePrefix,
  formatEducationScheduleLineForChangeModal,
  isOutsideEducationOperationRange,
  padEducationScheduleChangeLabel,
  parseEducationScheduleLineToChangeRange,
} from './education-schedule-change'

describe('education-schedule-change', () => {
  it('회차 라벨을 01부터 패딩한다', () => {
    expect(padEducationScheduleChangeLabel(0)).toBe('01')
    expect(padEducationScheduleChangeLabel(1)).toBe('02')
  })

  it('기존 일정 줄을 달력 기본 구간으로 파싱한다', () => {
    const range = parseEducationScheduleLineToChangeRange('26년 4월 20일(월) 9:30 ~ 12:20')
    expect(range?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-04-20 09:30')
    expect(range?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-04-20 12:20')
  })

  it('조회 줄을 변경 모달 표기로 맞춘다', () => {
    expect(formatEducationScheduleLineForChangeModal('26년 4월 20일(월) 9:30 ~ 12:20')).toBe(
      '2026.04.20(월) 9:30 ~ 12:20'
    )
  })

  it('날짜만 바꾸고 시각은 유지한다', () => {
    expect(
      applyDateToEducationScheduleLine('26년 4월 20일(월) 9:30 ~ 12:20', dayjs('2026-05-04'))
    ).toBe('26년 5월 4일(월) 9:30 ~ 12:20')
  })

  it('선택한 줄만 바꾼다', () => {
    expect(
      applyChangedDatesToEducationScheduleLines(
        ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50'],
        { 1: dayjs('2026-05-11') }
      )
    ).toEqual(['26년 4월 20일(월) 9:30 ~ 12:20', '26년 5월 11일(월) 13:00 ~ 15:50'])
  })

  it('paragraph 달력 구간으로 해당 줄만 바꾼다', () => {
    expect(
      applyChangedRangesToEducationScheduleLines(
        ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50'],
        { 1: [dayjs('2026-05-11T14:00:00'), dayjs('2026-05-11T16:00:00')] }
      )
    ).toEqual(['26년 4월 20일(월) 9:30 ~ 12:20', '26년 5월 11일(월) 14:00 ~ 16:00'])
  })

  it('일정 설정 prefix에서 사업 운영 기간 overlay 키를 만든다', () => {
    expect(
      educationOperationRangeSealKeyFromSchedulePrefix(
        'generalRegistration.educationScheduleSettings'
      )
    ).toBe('generalRegistration.basicInfo.operationRangeSeal')
  })

  it('사업 운영 기간 밖 날짜를 비활성으로 본다', () => {
    const start = dayjs('2026-10-01')
    const end = dayjs('2026-12-31')
    expect(isOutsideEducationOperationRange(dayjs('2026-09-30'), start, end)).toBe(true)
    expect(isOutsideEducationOperationRange(dayjs('2026-10-12'), start, end)).toBe(false)
    expect(isOutsideEducationOperationRange(dayjs('2027-01-01'), start, end)).toBe(true)
  })
})
