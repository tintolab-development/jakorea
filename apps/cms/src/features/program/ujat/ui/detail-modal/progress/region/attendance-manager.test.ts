import { describe, expect, it } from 'vitest'
import {
  collectAttendanceManagerPuts,
  formatAttendanceManagerScheduleLabel,
  getRegionAttendanceManagerScheduleItemsFromData,
} from './attendance-manager'
import type { RegionAssignmentTableData } from './types'

describe('formatAttendanceManagerScheduleLabel', () => {
  it('isoDate가 있으면 M월 D일 (기관명)으로 만든다', () => {
    expect(
      formatAttendanceManagerScheduleLabel('2026-04-03', '4/3', '제이초등학교')
    ).toBe('4월 3일 (제이초등학교)')
  })

  it('isoDate가 없으면 dateLabel을 그대로 쓴다', () => {
    expect(formatAttendanceManagerScheduleLabel(undefined, '4/3', '리라초')).toBe('4/3 (리라초)')
  })
})

describe('getRegionAttendanceManagerScheduleItemsFromData', () => {
  it('배정된 봉사자만 옵션에 넣고 포기자는 제외한다', () => {
    const data: RegionAssignmentTableData = {
      regionKey: 'seoul',
      regionLabel: '서울',
      volunteerCount: 2,
      columns: [
        {
          id: 'c1',
          scheduleId: '10',
          dateLabel: '4/3',
          isoDate: '2026-04-03',
          institutionName: '제이초',
          location: '강서구',
          classSlots: [{ id: '501', classLabel: '2-1' }],
        },
      ],
      rows: [
        {
          id: '1',
          name: '김제이',
          totalAssignedDays: 1,
          cells: [
            {
              kind: 'assigned',
              classLabel: '2-1',
              isAttendanceManager: true,
              assignmentStatus: 'ASSIGNED',
            },
          ],
        },
        {
          id: '2',
          name: '이포기',
          totalAssignedDays: 0,
          isWithdrawnVolunteer: true,
          cells: [{ kind: 'assigned', classLabel: '2-1', assignmentStatus: 'ASSIGNED' }],
        },
      ],
    }

    const items = getRegionAttendanceManagerScheduleItemsFromData(data)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      columnId: 'c1',
      label: '4월 3일 (제이초)',
      currentManagerId: '1',
      volunteerOptions: [{ value: '1', label: '김제이' }],
    })
  })

  it('ASSIGNED 셀만 출결 담당 옵션에 넣고 UNASSIGNED·재배정 필요·라벨만 있는 행은 제외한다', () => {
    const data: RegionAssignmentTableData = {
      regionKey: 'seoul',
      regionLabel: '서울',
      volunteerCount: 6,
      columns: [
        {
          id: '187580:1',
          scheduleId: '187580',
          dateLabel: '11/1',
          isoDate: '2026-11-01',
          institutionName: '테스트초',
          location: '강남구',
          classSlots: [],
        },
      ],
      rows: [
        {
          id: '1695055',
          name: '안재원',
          totalAssignedDays: 1,
          cells: [
            {
              kind: 'assigned',
              classLabel: '1학년 2반',
              isAttendanceManager: true,
              assignmentStatus: 'ASSIGNED',
            },
          ],
        },
        {
          id: '1695054',
          name: '백소리',
          totalAssignedDays: 1,
          cells: [
            { kind: 'assigned', classLabel: '1학년 2반', assignmentStatus: 'ASSIGNED' },
          ],
        },
        {
          id: '1695056',
          name: '김민수',
          totalAssignedDays: 1,
          cells: [
            { kind: 'assigned', classLabel: '2학년 2반', assignmentStatus: 'ASSIGNED' },
          ],
        },
        {
          id: '1695057',
          name: '이서연',
          totalAssignedDays: 1,
          cells: [
            { kind: 'assigned', classLabel: '2학년 2반', assignmentStatus: 'ASSIGNED' },
          ],
        },
        {
          id: '1695064',
          name: '여지은',
          totalAssignedDays: 0,
          cells: [{ kind: 'empty' }],
        },
        {
          id: '1695065',
          name: '라벨만',
          totalAssignedDays: 0,
          cells: [{ kind: 'assigned', classLabel: '1학년 1반' }],
        },
        {
          id: '1695066',
          name: '재배정',
          totalAssignedDays: 1,
          cells: [
            {
              kind: 'assigned',
              classLabel: '1학년 1반',
              isInvalidAssignment: true,
              assignmentStatus: 'REASSIGNMENT_REQUIRED',
            },
          ],
        },
      ],
    }

    const items = getRegionAttendanceManagerScheduleItemsFromData(data)
    expect(items[0]?.volunteerOptions.map(option => option.value)).toEqual([
      '1695055',
      '1695054',
      '1695056',
      '1695057',
    ])
    expect(items[0]?.currentManagerId).toBe('1695055')
    expect(collectAttendanceManagerPuts(data, { '187580:1': '1695056' })).toEqual([
      { scheduleId: 187580, participantId: 1695056 },
    ])
    expect(collectAttendanceManagerPuts(data, { '187580:1': '1695064' })).toEqual([])
    expect(collectAttendanceManagerPuts(data, { '187580:1': '0' })).toEqual([])
  })

  it('같은 scheduleId 여러 기관 열이면 PUT은 1건만 만든다', () => {
    const assigned = (classLabel: string, manager?: boolean) =>
      ({
        kind: 'assigned' as const,
        classLabel,
        assignmentStatus: 'ASSIGNED' as const,
        isAttendanceManager: manager,
      })
    const data: RegionAssignmentTableData = {
      regionKey: 'seoul',
      regionLabel: '서울',
      volunteerCount: 2,
      columns: [
        {
          id: '187580:1',
          scheduleId: '187580',
          dateLabel: '11월 1일',
          isoDate: '2026-11-01',
          institutionName: '학교A',
          location: '강남구',
          classSlots: [],
        },
        {
          id: '187580:2',
          scheduleId: '187580',
          dateLabel: '11월 1일',
          isoDate: '2026-11-01',
          institutionName: '학교B',
          location: '서초구',
          classSlots: [],
        },
      ],
      rows: [
        {
          id: '11',
          name: '김',
          totalAssignedDays: 1,
          cells: [assigned('1-1', true), assigned('2-1')],
        },
        {
          id: '22',
          name: '이',
          totalAssignedDays: 1,
          cells: [assigned('1-1'), assigned('2-1')],
        },
      ],
    }

    expect(collectAttendanceManagerPuts(data, { '187580:2': '22' })).toEqual([
      { scheduleId: 187580, participantId: 22 },
    ])
    expect(
      collectAttendanceManagerPuts(data, { '187580:1': '11', '187580:2': '22' })
    ).toEqual([{ scheduleId: 187580, participantId: 22 }])
    expect(collectAttendanceManagerPuts(data, { '187580:1': null })).toEqual([
      { scheduleId: 187580, participantId: null },
    ])
    expect(
      collectAttendanceManagerPuts(data, { '187580:1': null, '187580:2': '22' })
    ).toEqual([{ scheduleId: 187580, participantId: 22 }])
  })
})
