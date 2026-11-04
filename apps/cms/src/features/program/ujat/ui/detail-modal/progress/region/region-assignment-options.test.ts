import { describe, expect, it } from 'vitest'
import {
  getRegionAssignedEducationDateOptionsFromData,
  getRegionBlockedDateSubstituteVolunteerOptionsFromData,
  getRegionDirectAssignClassOptionsFromData,
  REGION_DIRECT_ASSIGN_NO_EDUCATION_SLOT_LABEL,
  isRegionDirectAssignClassSlotSelectable,
  mapRegionDirectAssignCandidateOptions,
  regionUnavailabilityRequiresReplacement,
  regionUnavailabilityRequiresReplacementForDate,
  selectRegionUnavailabilityScheduleIds,
} from './region-assignment-options'
import type { RegionAssignmentCell, RegionAssignmentTableData } from './types'

const EMPTY: RegionAssignmentCell = { kind: 'empty' }

function assigned(classLabel: string, educationSlotId?: string): RegionAssignmentCell {
  return {
    kind: 'assigned',
    classLabel,
    educationSlotId,
    assignmentStatus: educationSlotId ? 'ASSIGNED' : undefined,
  }
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
      { id: '1', name: '김', cells: [assigned('3-1', '501'), EMPTY, EMPTY] },
      { id: '2', name: '이', cells: [assigned('3-1', '501'), EMPTY, EMPTY] },
      { id: '3', name: '박', cells: [assigned('3-2', '502'), EMPTY, EMPTY] },
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

  it('임시일정 slotId 학급은 직접 배정 path에 쓰지 않고 disable한다', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, EMPTY, EMPTY] }])
    data.columns[0] = {
      ...data.columns[0]!,
      classSlots: [{ id: '901', classLabel: '4-1', isEducationSlotId: false }],
    }
    expect(getRegionDirectAssignClassOptionsFromData(data).find(option => option.value === '901')).toEqual({
      value: '901',
      label: `4/3 ｜ 4학년 1반 (A초) · ${REGION_DIRECT_ASSIGN_NO_EDUCATION_SLOT_LABEL}`,
      disabled: true,
    })
    expect(isRegionDirectAssignClassSlotSelectable(data, '901')).toBe(false)
  })

  it('classSlots가 비면 직접 배정 옵션을 invent하지 않는다', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, EMPTY, EMPTY] }])
    data.columns = data.columns.map(column => ({ ...column, classSlots: [] }))
    expect(getRegionDirectAssignClassOptionsFromData(data)).toEqual([])
  })

  it('지난 교육일 빈 학급·1인 학급은 교육 종료로 disable하고 배정 완료로 쓰지 않는다', () => {
    const data = table([
      { id: '1', name: '김', cells: [assigned('3-2', '502'), EMPTY, EMPTY] },
    ])
    data.columns[0] = {
      ...data.columns[0]!,
      dateLabel: '11월 1일',
      educationStartAt: '2026-10-31T15:00:00Z',
    }
    const now = Date.parse('2026-11-05T00:00:00+09:00')
    const options = getRegionDirectAssignClassOptionsFromData(data, now)
    expect(options.find(option => option.value === '503')).toEqual({
      value: '503',
      label: '11월 1일 ｜ 3학년 3반 (A초) · 교육 종료',
      disabled: true,
    })
    expect(options.find(option => option.value === '502')).toEqual({
      value: '502',
      label: '11월 1일 ｜ 3학년 2반 (A초) · 교육 종료',
      disabled: true,
    })
    expect(options.find(option => option.value === '502')?.label).not.toContain('두 번째 봉사자')
    expect(options.find(option => option.value === '503')?.label).not.toContain('배정 완료')
  })

  it('지난 교육일이어도 2인 만석은 배정 완료만 표시한다', () => {
    const data = table([
      { id: '1', name: '김', cells: [assigned('3-1', '501'), EMPTY, EMPTY] },
      { id: '2', name: '이', cells: [assigned('3-1', '501'), EMPTY, EMPTY] },
    ])
    data.columns[0] = {
      ...data.columns[0]!,
      dateLabel: '11월 1일',
      educationStartAt: '2026-10-31T15:00:00Z',
    }
    const options = getRegionDirectAssignClassOptionsFromData(
      data,
      Date.parse('2026-11-05T00:00:00+09:00')
    )
    expect(options.find(option => option.value === '501')).toEqual({
      value: '501',
      label: '11월 1일 ｜ 3학년 1반 (A초) · 배정 완료',
      disabled: true,
    })
  })

  it('미래 미만석 학급은 선택 가능하고, 표시일은 Seoul이어도 Instant로만 enabled를 본다', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, EMPTY, EMPTY] }])
    data.columns[0] = {
      ...data.columns[0]!,
      dateLabel: '11월 13일',
      educationStartAt: '2026-11-12T15:00:00Z',
    }
    const now = Date.parse('2026-11-05T00:00:00+09:00')
    expect(getRegionDirectAssignClassOptionsFromData(data, now).find(option => option.value === '503')).toEqual({
      value: '503',
      label: '11월 13일 ｜ 3학년 3반 (A초)',
    })
  })

  it('educationStartAt이 null이면 달력일과 무관하게 배정 가능으로 본다', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, EMPTY, EMPTY] }])
    data.columns[0] = {
      ...data.columns[0]!,
      dateLabel: '11월 1일',
      educationStartAt: null,
    }
    expect(
      getRegionDirectAssignClassOptionsFromData(data, Date.parse('2026-11-05T00:00:00+09:00')).find(
        option => option.value === '503'
      )
    ).toEqual({
      value: '503',
      label: '11월 1일 ｜ 3학년 3반 (A초)',
    })
  })

  it('REASSIGNMENT_REQUIRED 는 점유 인원에 넣지 않는다', () => {
    const data = table([
      {
        id: '1',
        name: '김',
        cells: [
          {
            kind: 'assigned',
            classLabel: '3-1',
            educationSlotId: '501',
            assignmentStatus: 'REASSIGNMENT_REQUIRED',
            isInvalidAssignment: true,
          },
          EMPTY,
          EMPTY,
        ],
      },
    ])
    expect(getRegionDirectAssignClassOptionsFromData(data).find(option => option.value === '501')).toEqual({
      value: '501',
      label: '4/3 ｜ 3학년 1반 (A초)',
    })
  })

  it('달력일이 오늘이어도 start Instant가 지났으면 선택 불가', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, EMPTY, EMPTY] }])
    data.columns[0] = {
      ...data.columns[0]!,
      dateLabel: '11월 5일',
      educationStartAt: '2026-11-04T15:00:00Z',
    }
    const now = Date.parse('2026-11-05T00:30:00+09:00')
    expect(
      getRegionDirectAssignClassOptionsFromData(data, now).find(option => option.value === '503')
    ).toMatchObject({ disabled: true, label: expect.stringContaining('교육 종료') })
    expect(isRegionDirectAssignClassSlotSelectable(data, '503', now)).toBe(false)
  })

  it('지난 슬롯·만석 슬롯은 selectable이 아니다', () => {
    const data = table([
      { id: '1', name: '김', cells: [assigned('3-1', '501'), EMPTY, EMPTY] },
      { id: '2', name: '이', cells: [assigned('3-1', '501'), EMPTY, EMPTY] },
    ])
    data.columns[0] = {
      ...data.columns[0]!,
      educationStartAt: '2026-10-31T15:00:00Z',
    }
    data.columns[2] = {
      ...data.columns[2]!,
      educationStartAt: '2026-11-12T15:00:00Z',
    }
    const now = Date.parse('2026-11-05T00:00:00+09:00')
    expect(isRegionDirectAssignClassSlotSelectable(data, '503', now)).toBe(false)
    expect(isRegionDirectAssignClassSlotSelectable(data, '501', now)).toBe(false)
    expect(isRegionDirectAssignClassSlotSelectable(data, '701', now)).toBe(true)
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

  it('후보 이름이 없으면 봉사자 id를 만들지 않고 -로 둔다', () => {
    expect(
      mapRegionDirectAssignCandidateOptions({
        candidates: [{ participantId: 3, volunteerName: '   ' }],
      })
    ).toEqual([{ value: '3', label: '-' }])
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

describe('regionUnavailabilityRequiresReplacementForDate', () => {
  it('선택한 날짜 column 에만 ASSIGNED 가 있을 때 true', () => {
    const data = table([
      { id: 'v', name: '봉사', cells: [assigned('3-1'), EMPTY, EMPTY] },
    ])
    expect(regionUnavailabilityRequiresReplacementForDate(data, 'v', '4/3')).toBe(true)
    expect(regionUnavailabilityRequiresReplacementForDate(data, 'v', '4/10')).toBe(false)
  })

  it('다른 날짜에만 배정돼 있으면 불가일 날짜에는 false', () => {
    const data = table([
      { id: 'v', name: '봉사', cells: [assigned('3-1'), EMPTY, EMPTY] },
    ])
    expect(regionUnavailabilityRequiresReplacement(data, 'v', ['4/10'])).toBe(false)
  })
})

describe('getRegionAssignedEducationDateOptionsFromData', () => {
  it('봉사자에게 활성 배정이 있는 교육일만 남긴다', () => {
    const data = table([
      { id: 'v', name: '봉사', cells: [assigned('3-1'), EMPTY, EMPTY] },
    ])
    expect(getRegionAssignedEducationDateOptionsFromData(data, 'v')).toEqual([
      { value: '4/3', label: '4/3' },
    ])
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
