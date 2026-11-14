import { describe, expect, it } from 'vitest'
import {
  buildTrainedTeacherActivityWithdrawScheduleOptions,
  parseTrainedTeacherStopScheduleId,
} from './organization-activity-withdraw-schedules'

describe('organization-activity-withdraw-schedules', () => {
  it('프로그램 일정 id를 모달 option value로 쓴다', () => {
    expect(
      buildTrainedTeacherActivityWithdrawScheduleOptions([
        {
          id: 186501,
          sessionNo: 1,
          scheduleName: '1차 교육',
          startAt: '2026-01-09T09:20:00+09:00',
          endAt: '2026-01-09T11:20:00+09:00',
        },
        { id: null as unknown as number, scheduleName: '무시' },
      ])
    ).toEqual([
      {
        value: '186501',
        label: expect.stringContaining('1차 교육'),
      },
    ])
  })

  it('시작 전·활성·학생 교육 일정이고 기관에 배정된 일정만 선택지로 남긴다', () => {
    const nowMs = Date.parse('2026-11-14T12:00:00+09:00')
    const options = buildTrainedTeacherActivityWithdrawScheduleOptions(
      [
        { id: 1, scheduleName: '1차 교육', startAt: '2026-11-10T09:00:00+09:00' },
        { id: 2, scheduleName: '교육 연수', startAt: '2026-11-20T09:00:00+09:00' },
        {
          id: 3,
          scheduleName: '2차 교육',
          startAt: '2026-11-21T09:00:00+09:00',
          scheduleStatus: 'CANCELLED',
        },
        { id: 4, scheduleName: '3차 교육', startAt: '2026-11-22T09:00:00+09:00' },
        { id: 5, scheduleName: '4차 교육', startAt: '2026-11-23T09:00:00+09:00' },
      ],
      { nowMs, assignedScheduleIds: new Set([1, 2, 3, 4]) }
    )
    expect(options.map(option => option.value)).toEqual(['4'])
  })

  it('기관 배정 일정이 없으면 배정 필터를 적용하지 않는다', () => {
    const options = buildTrainedTeacherActivityWithdrawScheduleOptions(
      [{ id: 5, scheduleName: '4차 교육', startAt: '2026-11-23T09:00:00+09:00' }],
      { nowMs: Date.parse('2026-11-14T12:00:00+09:00'), assignedScheduleIds: new Set() }
    )
    expect(options.map(option => option.value)).toEqual(['5'])
  })

  it('stopScheduleId를 파싱한다', () => {
    expect(parseTrainedTeacherStopScheduleId('186501')).toBe(186501)
    expect(parseTrainedTeacherStopScheduleId('0')).toBeNull()
    expect(parseTrainedTeacherStopScheduleId(undefined)).toBeNull()
  })
})
