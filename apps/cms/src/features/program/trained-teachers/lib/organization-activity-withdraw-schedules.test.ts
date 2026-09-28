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

  it('stopScheduleId를 파싱한다', () => {
    expect(parseTrainedTeacherStopScheduleId('186501')).toBe(186501)
    expect(parseTrainedTeacherStopScheduleId('0')).toBeNull()
    expect(parseTrainedTeacherStopScheduleId(undefined)).toBeNull()
  })
})
