import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  mapParticipatingSessionsToInstructorAssignOptions,
  resolveInstructorAssignSessionDisplayLabels,
} from './instructor-assign-session-options'

function session(overrides: Partial<ParticipatingSchoolSession> = {}): ParticipatingSchoolSession {
  return {
    round: 1,
    date: '2026.04.20',
    dayOfWeek: '월',
    duration: '2',
    format: '오프라인',
    classNum: '1',
    timeRange: '09:30~12:20',
    ...overrides,
  }
}

describe('resolveInstructorAssignSessionDisplayLabels', () => {
  it('날짜가 있으면 날짜+시간을 유지한다', () => {
    expect(resolveInstructorAssignSessionDisplayLabels(session())).toEqual({
      dateLabel: '2026.04.20(월)',
      timeLabel: '09:30 ~ 12:20',
      scheduleLabel: '2026.04.20(월) 09:30 ~ 12:20',
    })
  })

  it('시각만 슬롯에 넣은 경우 요일을 붙이지 않고 시간만 노출한다', () => {
    expect(
      resolveInstructorAssignSessionDisplayLabels(
        session({
          date: '10:00 ~ 12:00',
          dayOfWeek: '월',
          timeRange: '10:00~12:00',
          scheduleLabel: '10:00 ~ 12:00',
        })
      )
    ).toEqual({
      dateLabel: '',
      timeLabel: '10:00 ~ 12:00',
      scheduleLabel: '10:00 ~ 12:00',
    })
  })

  it('날짜가 비어 있으면 시간만 슬롯 라벨로 쓴다', () => {
    const options = mapParticipatingSessionsToInstructorAssignOptions([
      session({ date: '', dayOfWeek: '', timeRange: '10:00~12:00' }),
    ])
    expect(options[0]?.scheduleLabel).toBe('10:00 ~ 12:00')
    expect(options[0]?.dateLabel).toBeUndefined()
    expect(options[0]?.timeLabel).toBe('10:00 ~ 12:00')
  })
})

describe('mapParticipatingSessionsToInstructorAssignOptions — 회차/차시/시간대', () => {
  it('UTC instant는 서울 시각으로 바꾸고 round를 회차로 표시한다', () => {
    const options = mapParticipatingSessionsToInstructorAssignOptions([
      session({
        round: 1,
        date: '2026.11.06',
        dayOfWeek: '금',
        classNum: '',
        duration: '2차시',
        timeRange: '06:05~06:10',
        startAt: '2026-11-06T06:05:00Z',
        endAt: '2026-11-06T06:10:00Z',
      }),
      session({
        round: 2,
        date: '2026.11.06',
        dayOfWeek: '금',
        classNum: '',
        duration: '2차시',
        timeRange: '06:15~06:20',
        startAt: '2026-11-06T06:15:00Z',
        endAt: '2026-11-06T06:20:00Z',
      }),
    ])
    expect(options[0]?.scheduleLabel).toBe('2026.11.06(금) 15:05 ~ 15:10')
    expect(options[0]?.sessionRoundLabel).toBe('1회차 (2차시)')
    expect(options[1]?.scheduleLabel).toBe('2026.11.06(금) 15:15 ~ 15:20')
    expect(options[1]?.sessionRoundLabel).toBe('2회차 (2차시)')
  })

  it('이미 KST offset이 있으면 중복 변환하지 않는다', () => {
    const options = mapParticipatingSessionsToInstructorAssignOptions([
      session({
        round: 3,
        date: '2026.11.06',
        dayOfWeek: '금',
        classNum: '',
        duration: '1차시',
        startAt: '2026-11-06T15:05:00+09:00',
        endAt: '2026-11-06T15:10:00+09:00',
      }),
    ])
    expect(options[0]?.scheduleLabel).toBe('2026.11.06(금) 15:05 ~ 15:10')
    expect(options[0]?.sessionRoundLabel).toBe('3회차 (1차시)')
  })

  it('차시 정보가 없으면 회차만 표시한다', () => {
    const options = mapParticipatingSessionsToInstructorAssignOptions([
      session({ round: 1, classNum: '1교시', duration: '2시간' }),
    ])
    expect(options[0]?.sessionRoundLabel).toBe('1회차')
  })
})

describe('mapParticipatingSessionsToInstructorAssignOptions — isSessionDisabled', () => {
  it('isSessionDisabled가 true인 회차(강사 정원 도달)는 disabled, 나머지는 선택 가능', () => {
    const options = mapParticipatingSessionsToInstructorAssignOptions(
      [
        session({ round: 1, resolvedScheduleId: 101 }),
        session({ round: 2, date: '2026.04.21', dayOfWeek: '화', resolvedScheduleId: 102 }),
      ],
      { isSessionDisabled: s => s.resolvedScheduleId === 101 }
    )
    expect(options.map(o => o.disabled)).toEqual([true, false])
  })

  it('옵션 미지정 시 기존 동작 유지', () => {
    const options = mapParticipatingSessionsToInstructorAssignOptions([
      session({ resolvedScheduleId: 101 }),
    ])
    expect(options[0]?.disabled).toBe(false)
  })
})
