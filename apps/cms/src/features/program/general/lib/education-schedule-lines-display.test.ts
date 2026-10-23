import { describe, expect, it } from 'vitest'
import {
  normalizeEducationScheduleLineForView,
  resolveEducationScheduleGroupTimeSlots,
  resolveEducationScheduleLinesForView,
} from './education-schedule-lines-display'

const GROUP_TIMES_OVERLAY_KEY =
  'generalRegistration.educationScheduleCurriculum.groupTimesByDetail'

const OVERLAY_KEY = 'generalRegistration.educationScheduleSettings.scheduleLines'
const REGISTERED = ['26년 9월 16일(수) 9:22 ~ 10:22', '26년 9월 24일(목) 9:19 ~ 10:19']
const REGISTERED_VIEW = ['2026.09.16(수) 09:22 ~ 10:22', '2026.09.24(목) 09:19 ~ 10:19']
const FALLBACK_MOCK = ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50']

describe('normalizeEducationScheduleLineForView', () => {
  it('등록 한글 표기를 YYYY.MM.DD(요일) HH:mm으로 맞춘다', () => {
    expect(normalizeEducationScheduleLineForView('26년 9월 16일(수) 09:22 ~ 10:22')).toBe(
      '2026.09.16(수) 09:22 ~ 10:22'
    )
    expect(normalizeEducationScheduleLineForView('26년 4월 20일(월) ~ 26년 4월 27일(월)')).toBe(
      '2026.04.20(월) ~ 2026.04.27(월)'
    )
  })
})

describe('resolveEducationScheduleGroupTimeSlots', () => {
  it('scheduleDetails.groupTimes가 있으면 summary·overlay보다 우선한다', () => {
    expect(
      resolveEducationScheduleGroupTimeSlots({
        scheduleDetails: [
          {
            groupTimes: [
              { startTime: '13:30', endTime: '15:30' },
              { startTime: '09:30', endTime: '11:30' },
            ],
            progressTimeSummary: '그룹 A : 1:00 ~ 2:00',
          },
        ],
        overlay: {
          [GROUP_TIMES_OVERLAY_KEY]: {
            1: [{ startTime: '20:00', endTime: '21:00' }],
          },
        },
      })
    ).toEqual([
      { startTime: '13:30', endTime: '15:30' },
      { startTime: '09:30', endTime: '11:30' },
    ])
  })

  it('groupTimes가 비어 있으면 progressTimeSummary를 쓴다', () => {
    expect(
      resolveEducationScheduleGroupTimeSlots({
        scheduleDetails: [
          {
            groupTimes: [{ startTime: '', endTime: '' }],
            progressTimeSummary: '그룹 A : 9:00 ~ 12:00 | 그룹 B : 13:00 ~ 15:00',
          },
        ],
      })
    ).toEqual([
      { startTime: '9:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '15:00' },
    ])
  })

  it('summary도 없으면 overlay groupTimesByDetail을 쓴다', () => {
    expect(
      resolveEducationScheduleGroupTimeSlots({
        overlay: {
          [GROUP_TIMES_OVERLAY_KEY]: {
            1: [
              { startTime: '10:00', endTime: '12:00' },
              { startTime: '13:30', endTime: '15:30' },
            ],
          },
        },
      })
    ).toEqual([
      { startTime: '10:00', endTime: '12:00' },
      { startTime: '13:30', endTime: '15:30' },
    ])
  })
})

describe('resolveEducationScheduleLinesForView', () => {
  it('등록 overlay 예정일을 공통정보보다 우선한다', () => {
    expect(
      resolveEducationScheduleLinesForView({
        educationScheduleLines: FALLBACK_MOCK,
        overlay: { [OVERLAY_KEY]: REGISTERED },
      })
    ).toEqual(REGISTERED_VIEW)
  })

  it('overlay가 비면 공통정보 예정일을 쓴다', () => {
    expect(
      resolveEducationScheduleLinesForView({
        educationScheduleLines: REGISTERED,
      })
    ).toEqual(REGISTERED_VIEW)
  })

  it('예정일 줄이 없고 선택 ISO만 있으면 날짜 한 줄로 만든다', () => {
    expect(
      resolveEducationScheduleLinesForView({
        overlay: {
          'generalRegistration.educationScheduleSettings.singleDateIso': '2026-09-16',
        },
      })
    ).toEqual(['2026.09.16(수)'])
  })

  it('기관 일정형 단일 기간 — 예정일 표시는 날짜만', () => {
    expect(
      resolveEducationScheduleLinesForView({
        educationScheduleLines: ['26년 11월 1일(목) 9:00 ~ 26년 11월 2일(금) 13:00'],
        dateOnlyPeriodLines: true,
      })
    ).toEqual(['2026.11.01(일) ~ 2026.11.02(월)'])
  })

  it('기관 커리큘럼 복수 기간 — 예정일 표시는 날짜만', () => {
    expect(
      resolveEducationScheduleLinesForView({
        educationScheduleLines: ['26년 11월 1일(목) 9:00 ~ 26년 11월 5일(월) 18:00'],
        dateOnlyPeriodLines: true,
      })
    ).toEqual(['2026.11.01(일) ~ 2026.11.05(목)'])
  })

  it('기간 지정 모드 — 진행 시간 자동 반영으로 예정일에 시각을 넣지 않는다', () => {
    expect(
      resolveEducationScheduleLinesForView({
        educationScheduleLines: ['26년 9월 16일(수)'],
        autoFillFromScheduleGroupTimes: true,
        dateOnlyPeriodLines: true,
        scheduleDetails: [
          { progressTimeSummary: '그룹 A : 9:00 ~ 12:00 | 그룹 B : 13:00 ~ 15:00' },
        ],
      })
    ).toEqual(['2026.09.16(수)'])
  })

  it('개인 일정형 단일은 진행 시간으로 예정일 시각을 다시 입힌다', () => {
    expect(
      resolveEducationScheduleLinesForView({
        educationScheduleLines: ['26년 9월 16일(수)'],
        autoFillFromScheduleGroupTimes: true,
        scheduleDetails: [
          { progressTimeSummary: '그룹 A : 9:00 ~ 12:00 | 그룹 B : 13:00 ~ 15:00' },
        ],
      })
    ).toEqual(['2026.09.16(수) 09:00 ~ 12:00', '2026.09.16(수) 13:00 ~ 15:00'])
  })

  it('groupTimes만 있어도 진행 시간으로 예정일 시각을 다시 입힌다', () => {
    expect(
      resolveEducationScheduleLinesForView({
        educationScheduleLines: ['26년 9월 16일(수)'],
        autoFillFromScheduleGroupTimes: true,
        scheduleDetails: [
          {
            groupTimes: [
              { startTime: '13:30', endTime: '15:30' },
              { startTime: '09:30', endTime: '11:30' },
            ],
          },
        ],
      })
    ).toEqual(['2026.09.16(수) 13:30 ~ 15:30', '2026.09.16(수) 09:30 ~ 11:30'])
  })
})
