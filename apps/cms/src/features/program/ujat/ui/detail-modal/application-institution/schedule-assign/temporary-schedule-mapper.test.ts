import { describe, expect, it } from 'vitest'
import {
  buildTemporaryScheduleSaveRequest,
  serializeTemporaryScheduleSlots,
} from './temporary-schedule-mapper'
import type { UjatScheduleAssignRegionState } from './types'

const draft: UjatScheduleAssignRegionState = {
  estimation: {
    h1: { maxClassesPerDay: '', expectedVolunteerCount: '' },
    h2: { maxClassesPerDay: '', expectedVolunteerCount: '' },
  },
  days: {
    '2027-04-30': {
      isoDate: '2027-04-30',
      rows: [
        {
          id: 'r1',
          institutionRowId: '1691444',
          gradeValues: ['1학년:1'],
        },
      ],
    },
    '2027-06-04': {
      isoDate: '2027-06-04',
      rows: [
        {
          id: 'r2',
          institutionRowId: '1691444',
          gradeValues: ['1학년:1'],
        },
      ],
    },
  },
}

describe('buildTemporaryScheduleSaveRequest', () => {
  it('서로 다른 금요일은 서로 다른 scheduleId를 쓰고 날짜 필드가 없다', () => {
    const body = buildTemporaryScheduleSaveRequest({
      regionKey: 'gyeonggi_south',
      regionState: draft,
      institutionRowId: '1691444',
      scheduleIdByIsoDate: new Map([
        ['2027-04-30', 111],
        ['2027-06-04', 222],
      ]),
      studentCountByClass: new Map([['1691444|1|1반', 28]]),
    })

    expect(body).toEqual({
      educationRegionCode: 'GYEONGGI_SOUTH',
      slots: [
        { scheduleId: 111, grade: '1', className: '1반', studentCount: 28 },
        { scheduleId: 222, grade: '1', className: '1반', studentCount: 28 },
      ],
    })
    expect(JSON.stringify(body)).not.toContain('scheduleDate')
    expect(body?.slots.every(slot => slot.scheduleId !== 187220)).toBe(true)
  })

  it('하루 행 id가 없으면 연간 id로 채우지 않고 null이다', () => {
    const body = buildTemporaryScheduleSaveRequest({
      regionKey: 'gyeonggi_south',
      regionState: draft,
      institutionRowId: '1691444',
      scheduleIdByIsoDate: new Map(),
    })
    expect(body).toBeNull()
  })

  it('슬롯 서명이 같으면 변경이 없다', () => {
    const slots = [
      { scheduleId: 111, grade: '1', className: '1반', studentCount: 28 },
      { scheduleId: 222, grade: '1', className: '1반', studentCount: 28 },
    ]
    expect(serializeTemporaryScheduleSlots(slots)).toBe(
      serializeTemporaryScheduleSlots([...slots].reverse())
    )
  })
})
