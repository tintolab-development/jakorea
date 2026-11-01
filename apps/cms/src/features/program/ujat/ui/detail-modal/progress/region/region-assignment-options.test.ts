import { describe, expect, it } from 'vitest'
import {
  getRegionBlockedDateSubstituteVolunteerOptionsFromData,
  getRegionDirectAssignClassOptionsFromData,
  mapRegionDirectAssignCandidateOptions,
  selectRegionUnavailabilityScheduleIds,
} from './region-assignment-options'
import type { RegionAssignmentCell, RegionAssignmentTableData } from './types'

const EMPTY: RegionAssignmentCell = { kind: 'empty' }

function assigned(classLabel: string): RegionAssignmentCell {
  return { kind: 'assigned', classLabel }
}

/** 같은 날(4/3) 일정 2개(s10·s11) + 다른 날(4/10) 일정 1개(s20) */
function table(rows: Array<{ id: string; name: string; cells: RegionAssignmentCell[] }>) {
  const data: RegionAssignmentTableData = {
    regionKey: 'seoul',
    regionLabel: '서울',
    volunteerCount: rows.length,
    columns: [
      {
        id: 'c10',
        scheduleId: '10',
        dateLabel: '4/3',
        isoDate: '2026-04-03',
        institutionName: 'A초',
        location: '강남구',
        classSlots: [
          { id: '501', classLabel: '3-1' },
          { id: '502', classLabel: '3-2' },
          { id: '503', classLabel: '3-3' },
        ],
      },
      {
        id: 'c11',
        scheduleId: '11',
        dateLabel: '4/3',
        isoDate: '2026-04-03',
        institutionName: 'B초',
        location: '서초구',
        classSlots: [{ id: '601', classLabel: '4-1' }],
      },
      {
        id: 'c20',
        scheduleId: '20',
        dateLabel: '4/10',
        isoDate: '2026-04-10',
        institutionName: 'A초',
        location: '강남구',
        classSlots: [{ id: '701', classLabel: '3-1' }],
      },
    ],
    rows: rows.map(row => ({ ...row, totalAssignedDays: 0 })),
  }
  return data
}

describe('getRegionDirectAssignClassOptionsFromData', () => {
  it('빈 슬롯은 그대로, 1인 슬롯은 두 번째 봉사자 배정, 2인 슬롯은 비활성으로 둔다', () => {
    const data = table([
      { id: '1', name: '김', cells: [assigned('3-1'), EMPTY, EMPTY] },
      { id: '2', name: '이', cells: [assigned('3-1'), EMPTY, EMPTY] },
      { id: '3', name: '박', cells: [assigned('3-2'), EMPTY, EMPTY] },
    ])
    const options = getRegionDirectAssignClassOptionsFromData(data)
    expect(options.find(option => option.value === '501')).toMatchObject({
      label: '4/3 ｜ 3학년 1반 (A초) · 배정 완료',
      disabled: true,
    })
    expect(options.find(option => option.value === '502')).toEqual({
      value: '502',
      label: '4/3 ｜ 3학년 2반 (A초) · 두 번째 봉사자 배정',
    })
    expect(options.find(option => option.value === '503')).toEqual({
      value: '503',
      label: '4/3 ｜ 3학년 3반 (A초)',
    })
  })

  it('classSlots가 비면 직접 배정 옵션을 invent하지 않는다', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, EMPTY, EMPTY] }])
    data.columns = data.columns.map(column => ({ ...column, classSlots: [] }))
    expect(getRegionDirectAssignClassOptionsFromData(data)).toEqual([])
  })
})

describe('mapRegionDirectAssignCandidateOptions', () => {
  it('서버 후보 순서를 유지하고 2인조 이동 후보에는 출처 학급을 붙인다', () => {
    expect(
      mapRegionDirectAssignCandidateOptions({
        candidates: [
          { participantId: 9, volunteerName: '최미배정' },
          {
            participantId: 4,
            volunteerName: '정이동',
            sourceAssignmentGroupId: 'g-1',
            sourceClassLabel: '5-2',
          },
          { participantId: null, volunteerName: '무시' },
        ],
      })
    ).toEqual([
      { value: '9', label: '최미배정' },
      { value: '4', label: '정이동 (5학년 2반 2인조에서 이동)' },
    ])
    expect(mapRegionDirectAssignCandidateOptions(undefined)).toEqual([])
  })
})

describe('selectRegionUnavailabilityScheduleIds', () => {
  it('같은 날 일정이 여러 개면 날짜당 1건, 봉사자가 배정된 일정을 고른다', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, assigned('4-1'), EMPTY] }])
    expect(selectRegionUnavailabilityScheduleIds(data, '1', ['4/3', '4/10'])).toEqual(['11', '20'])
  })

  it('그 날 배정이 없으면 그 날 첫 일정을 고른다', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, EMPTY, EMPTY] }])
    expect(selectRegionUnavailabilityScheduleIds(data, '1', ['4/3'])).toEqual(['10'])
  })
})

describe('getRegionBlockedDateSubstituteVolunteerOptionsFromData', () => {
  it('같은 날 다른 일정에 배정됐거나 그 날 활동 불가인 봉사자는 대체자에서 뺀다', () => {
    const data = table([
      { id: '1', name: '대상', cells: [assigned('3-1'), EMPTY, EMPTY] },
      { id: '2', name: '같은날다른일정', cells: [EMPTY, assigned('4-1'), EMPTY] },
      { id: '3', name: '그날불가', cells: [EMPTY, { kind: 'empty', blockedEmpty: true }, EMPTY] },
      { id: '4', name: '다른날만배정', cells: [EMPTY, EMPTY, assigned('3-1')] },
    ])
    expect(
      getRegionBlockedDateSubstituteVolunteerOptionsFromData(data, '1', ['4/3']).map(
        option => option.label
      )
    ).toEqual(['다른날만배정'])
  })
})
