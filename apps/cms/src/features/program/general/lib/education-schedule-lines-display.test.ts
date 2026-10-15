import { describe, expect, it } from 'vitest'
import {
  normalizeEducationScheduleLineForView,
  resolveEducationScheduleLinesForView,
} from './education-schedule-lines-display'

const OVERLAY_KEY = 'generalRegistration.educationScheduleSettings.scheduleLines'
const REGISTERED = ['26년 9월 16일(수) 9:22 ~ 10:22', '26년 9월 24일(목) 9:19 ~ 10:19']
const FALLBACK_MOCK = ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50']

describe('normalizeEducationScheduleLineForView', () => {
  it('등록 화면과 같은 26년 표기·시간 패딩으로 맞춘다', () => {
    expect(normalizeEducationScheduleLineForView('26년 9월 16일(수) 09:22 ~ 10:22')).toBe(
      '26년 9월 16일(수) 9:22 ~ 10:22'
    )
    expect(normalizeEducationScheduleLineForView('26년 4월 20일(월) ~ 26년 4월 27일(월)')).toBe(
      '26년 4월 20일(월) ~ 26년 4월 27일(월)'
    )
  })
})

describe('resolveEducationScheduleLinesForView', () => {
  it('등록 overlay 예정일을 공통정보보다 우선한다', () => {
    expect(
      resolveEducationScheduleLinesForView({
        educationScheduleLines: FALLBACK_MOCK,
        overlay: { [OVERLAY_KEY]: REGISTERED },
      })
    ).toEqual(REGISTERED)
  })

  it('overlay가 비면 공통정보 예정일을 쓴다', () => {
    expect(
      resolveEducationScheduleLinesForView({
        educationScheduleLines: REGISTERED,
      })
    ).toEqual(REGISTERED)
  })

  it('예정일 줄이 없고 선택 ISO만 있으면 날짜 한 줄로 만든다', () => {
    expect(
      resolveEducationScheduleLinesForView({
        overlay: {
          'generalRegistration.educationScheduleSettings.singleDateIso': '2026-09-16',
        },
      })
    ).toEqual(['26년 9월 16일(수)'])
  })

  it('기관 일정형 단일 기간 — 예정일 표시는 날짜만', () => {
    expect(
      resolveEducationScheduleLinesForView({
        educationScheduleLines: ['26년 11월 1일(목) 9:00 ~ 26년 11월 2일(금) 13:00'],
        dateOnlyPeriodLines: true,
      })
    ).toEqual(['26년 11월 1일(일) ~ 26년 11월 2일(월)'])
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
    ).toEqual(['26년 9월 16일(수) 9:00 ~ 12:00', '26년 9월 16일(수) 13:00 ~ 15:00'])
  })
})
