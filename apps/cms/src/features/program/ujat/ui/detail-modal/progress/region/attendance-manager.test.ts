import { describe, expect, it } from 'vitest'
import {
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
            },
          ],
        },
        {
          id: '2',
          name: '이포기',
          totalAssignedDays: 0,
          isWithdrawnVolunteer: true,
          cells: [{ kind: 'assigned', classLabel: '2-1' }],
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
})
