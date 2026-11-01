import { describe, expect, it } from 'vitest'
import {
  buildTemporaryScheduleSaveRequest,
  collectStudentCountByClass,
  normalizeClassNameForSlot,
  serializeRemoteTemporaryScheduleSlots,
  serializeTemporaryScheduleSlots,
  studentCountLookupKey,
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

  it('API slots studentCount만 쓰고 없으면 PUT에 0을 보낸다', () => {
    const body = buildTemporaryScheduleSaveRequest({
      regionKey: 'seoul',
      regionState: {
        estimation: {
          h1: { maxClassesPerDay: '', expectedVolunteerCount: '' },
          h2: { maxClassesPerDay: '', expectedVolunteerCount: '' },
        },
        days: {
          '2026-11-06': {
            isoDate: '2026-11-06',
            rows: [
              {
                id: 'r1',
                institutionRowId: '1691554',
                gradeValues: ['2학년:1', '2학년:2'],
              },
            ],
          },
        },
      },
      institutionRowId: '1691554',
      scheduleIdByIsoDate: new Map([['2026-11-06', 187580]]),
      studentCountByClass: collectStudentCountByClass(
        [
          {
            scheduleId: 187580,
            organizationApplicationId: 1691554,
            grade: '2',
            className: '1반',
            studentCount: 21,
          },
          {
            scheduleId: 187580,
            organizationApplicationId: 1691554,
            grade: '2',
            className: '2반',
            studentCount: 20,
          },
        ],
        '1691554'
      ),
    })
    expect(body?.slots).toEqual([
      { scheduleId: 187580, grade: '2', className: '1반', studentCount: 21 },
      { scheduleId: 187580, grade: '2', className: '2반', studentCount: 20 },
    ])
  })

  it('슬롯 인원이 없으면 studentCount 0으로 PUT한다', () => {
    const body = buildTemporaryScheduleSaveRequest({
      regionKey: 'seoul',
      regionState: {
        estimation: {
          h1: { maxClassesPerDay: '', expectedVolunteerCount: '' },
          h2: { maxClassesPerDay: '', expectedVolunteerCount: '' },
        },
        days: {
          '2026-11-06': {
            isoDate: '2026-11-06',
            rows: [
              {
                id: 'r1',
                institutionRowId: '1691554',
                gradeValues: ['2학년:1'],
              },
            ],
          },
        },
      },
      institutionRowId: '1691554',
      scheduleIdByIsoDate: new Map([['2026-11-06', 187580]]),
    })
    expect(body?.slots).toEqual([
      { scheduleId: 187580, grade: '2', className: '1반', studentCount: 0 },
    ])
  })
})

describe('normalizeClassNameForSlot', () => {
  it('classNo 표기를 1반으로 정규화한다', () => {
    expect(normalizeClassNameForSlot('1')).toBe('1반')
    expect(normalizeClassNameForSlot('1반')).toBe('1반')
    expect(normalizeClassNameForSlot(2)).toBe('2반')
  })
})

describe('collectStudentCountByClass', () => {
  it('양수 API studentCount만 수집한다', () => {
    const map = collectStudentCountByClass(
      [
        {
          organizationApplicationId: 10,
          grade: '2',
          className: '1반',
          studentCount: 21,
        },
        {
          organizationApplicationId: 10,
          grade: '2',
          className: '2반',
          studentCount: 0,
        },
      ],
      '10'
    )
    expect(map.get(studentCountLookupKey('10', '2', '1반'))).toBe(21)
    expect(map.has(studentCountLookupKey('10', '2', '2반'))).toBe(false)
  })
})

describe('serializeRemoteTemporaryScheduleSlots', () => {
  it('서버 hydrate studentCount를 서명에 유지한다', () => {
    const remote = serializeRemoteTemporaryScheduleSlots([
      {
        scheduleId: 187580,
        grade: '2',
        className: '1반',
        studentCount: 21,
      },
      {
        scheduleId: 187580,
        grade: '2',
        className: '2반',
        studentCount: 20,
      },
    ])
    expect(remote).toContain('|21')
    expect(remote).toContain('|20')
  })
})
