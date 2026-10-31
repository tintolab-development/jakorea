import { describe, expect, it } from 'vitest'
import type { UjatOrganizationScheduleSlotResponse } from '@/features/program/ujat/api/temporary-schedule-api'
import type { UjatInstitutionApplicationRow } from '../list/types'
import {
  buildScheduleSheetPreviewFromAssignments,
  groupScheduleSheetPreviewColumnsByDate,
  SCHEDULE_SHEET_EMPTY_PLACEHOLDER,
} from './build-schedule-sheet-preview'

function slot(
  partial: Partial<UjatOrganizationScheduleSlotResponse> &
    Pick<
      UjatOrganizationScheduleSlotResponse,
      'organizationApplicationId' | 'scheduleStartAt' | 'educationRegionCode'
    >
): UjatOrganizationScheduleSlotResponse {
  return {
    grade: '3',
    className: '1반',
    organizationName: '테스트초',
    ...partial,
  }
}

function row(
  partial: Partial<UjatInstitutionApplicationRow> & Pick<UjatInstitutionApplicationRow, 'id'>
): UjatInstitutionApplicationRow {
  return {
    no: 1,
    institutionName: '목록기관',
    regionKey: 'seoul',
    tempAssignmentStatus: 'temp_assigned',
    gradeClassCounts: [{ gradeLabel: '3학년', classCount: 2 }],
    totalClassCount: 2,
    scheduleSlots: { '2026-11-06': 'O', '2026-11-13': 'O' },
    preferredScheduleIdByIso: {},
    sessionIsoDates: [],
    teacherName: '-',
    ...partial,
  }
}

describe('buildScheduleSheetPreviewFromAssignments', () => {
  it('슬롯의 organizationName·학급을 날짜 열로 묶고, 희망일만 있는 날짜는 - 열을 둔다', () => {
    const regions = buildScheduleSheetPreviewFromAssignments({
      slots: [
        slot({
          organizationApplicationId: 10,
          educationRegionCode: 'SEOUL',
          scheduleStartAt: '2026-11-06T00:00:00+09:00',
          organizationName: '서울초',
          grade: '3',
          className: '1반',
        }),
        slot({
          organizationApplicationId: 10,
          educationRegionCode: 'SEOUL',
          scheduleStartAt: '2026-11-06T00:00:00+09:00',
          organizationName: '서울초',
          grade: '3',
          className: '2반',
        }),
      ],
      applicationRows: [row({ id: '10', institutionName: '목록무시' })],
    })

    expect(regions.map(region => region.regionKey)).toEqual(['seoul'])
    const seoul = regions[0]!
    expect(seoul.columns).toHaveLength(2)

    const assigned = seoul.columns.find(column => column.isoDate === '2026-11-06')
    expect(assigned).toMatchObject({
      institutionName: '서울초',
      totalClassCount: 2,
    })
    expect(assigned!.gradeClassLines).toEqual(['3학년 2학급'])

    const empty = seoul.columns.find(column => column.isoDate === '2026-11-13')
    expect(empty).toMatchObject({
      institutionName: SCHEDULE_SHEET_EMPTY_PLACEHOLDER,
      totalClassCount: 0,
      gradeClassLines: [],
    })
  })

  it('신청 행이 없어도 슬롯 organizationName으로 기관명을 표시한다', () => {
    const regions = buildScheduleSheetPreviewFromAssignments({
      slots: [
        slot({
          organizationApplicationId: 99,
          educationRegionCode: 'INCHEON',
          scheduleStartAt: '2026-11-20T09:00:00+09:00',
          organizationName: '인천초',
          grade: '1',
          className: '3반',
        }),
      ],
      applicationRows: [],
    })

    expect(regions.map(region => region.regionKey)).toEqual(['incheon'])
    expect(regions[0]?.columns).toEqual([
      expect.objectContaining({
        isoDate: '2026-11-20',
        institutionName: '인천초',
        totalClassCount: 1,
        gradeClassLines: ['1학년 1학급(3반)'],
      }),
    ])
  })

  it('scheduleStartAt이 없어도 scheduleId로 날짜를 복원한다', () => {
    const scheduleIdByIsoDate = new Map<string, number>([['2026-11-06', 501]])
    const regions = buildScheduleSheetPreviewFromAssignments({
      slots: [
        slot({
          organizationApplicationId: 10,
          educationRegionCode: 'SEOUL',
          scheduleStartAt: null,
          scheduleId: 501,
          organizationName: '서울초',
          grade: '3',
          className: '1반',
        }),
      ],
      applicationRows: [row({ id: '10' })],
      scheduleIdByIsoDate,
    })

    expect(regions.map(region => region.regionKey)).toEqual(['seoul'])
    expect(
      regions[0]?.columns.find(column => column.isoDate === '2026-11-06')
    ).toMatchObject({
      institutionName: '서울초',
      totalClassCount: 1,
    })
  })

  it('배정이 없는 지역은 미리보기에서 제외한다', () => {
    const regions = buildScheduleSheetPreviewFromAssignments({
      slots: [
        slot({
          organizationApplicationId: 10,
          educationRegionCode: 'SEOUL',
          scheduleStartAt: '2026-11-06T00:00:00+09:00',
          organizationName: '서울초',
        }),
      ],
      applicationRows: [
        row({ id: '10' }),
        row({
          id: '20',
          regionKey: 'busan',
          institutionName: '부산초',
          scheduleSlots: { '2026-11-06': 'O' },
        }),
      ],
    })

    expect(regions.map(region => region.regionKey)).toEqual(['seoul'])
  })

  it('같은 날짜 복수 기관은 연속 열로 두고 날짜 그룹 colSpan용으로 묶는다', () => {
    const regions = buildScheduleSheetPreviewFromAssignments({
      slots: [
        slot({
          organizationApplicationId: 1,
          educationRegionCode: 'SEOUL',
          scheduleStartAt: '2026-04-03T00:00:00+09:00',
          organizationName: '구일초등학교',
          grade: '2',
          className: '1반',
        }),
        slot({
          organizationApplicationId: 1,
          educationRegionCode: 'SEOUL',
          scheduleStartAt: '2026-04-03T00:00:00+09:00',
          organizationName: '구일초등학교',
          grade: '2',
          className: '2반',
        }),
        slot({
          organizationApplicationId: 2,
          educationRegionCode: 'SEOUL',
          scheduleStartAt: '2026-04-03T00:00:00+09:00',
          organizationName: '청운초등학교',
          grade: '1',
          className: '1반',
        }),
      ],
      applicationRows: [
        row({
          id: '1',
          institutionName: '구일초등학교',
          gradeClassCounts: [{ gradeLabel: '2학년', classCount: 7 }],
          scheduleSlots: { '2026-04-03': 'O' },
        }),
        row({
          id: '2',
          institutionName: '청운초등학교',
          gradeClassCounts: [{ gradeLabel: '1학년', classCount: 4 }],
          scheduleSlots: { '2026-04-03': 'O' },
        }),
      ],
    })

    const seoul = regions.find(region => region.regionKey === 'seoul')
    const groups = groupScheduleSheetPreviewColumnsByDate(seoul?.columns ?? [])
    const april3 = groups.find(group => group.isoDate === '2026-04-03')
    expect(april3?.columns.map(column => column.institutionName)).toEqual([
      '구일초등학교',
      '청운초등학교',
    ])
    expect(april3?.columns.map(column => column.totalClassCount)).toEqual([2, 1])
  })
})
