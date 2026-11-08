import { describe, expect, it } from 'vitest'
import {
  formatRegionAssignmentTotalAssignedDays,
  getRegionAssignedEducationDateOptionsFromData,
  getRegionEducationDateOptionsFromData,
  getRegionAssignmentDisplayedVolunteerCount,
  getRegionBlockedDateSubstituteVolunteerOptionsFromData,
  getRegionDirectAssignClassOptionsFromData,
  isRegionDirectAssignClassSlotSelectable,
  isRegionDirectAssignClassSlotFull,
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
    assignmentStatus: 'ASSIGNED',
  }
}

function reassignmentRequired(classLabel: string): RegionAssignmentCell {
  return {
    kind: 'assigned',
    classLabel,
    isInvalidAssignment: true,
    assignmentStatus: 'REASSIGNMENT_REQUIRED',
  }
}

/** 같은 날(4/3) 일정 2개(s10·s11) + 다른 날(4/10) 일정 1개(s20) */
function table(
  rows: Array<{
    id: string
    name: string
    cells: RegionAssignmentCell[]
    isWithdrawnVolunteer?: boolean
  }>
) {
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
  it('빈 슬롯·1인 슬롯만 넣고, 2인 만석 학급은 목록에서 제외한다', () => {
    const data = table([
      { id: '1', name: '김', cells: [assigned('3-1', '501'), EMPTY, EMPTY] },
      { id: '2', name: '이', cells: [assigned('3-1', '501'), EMPTY, EMPTY] },
      { id: '3', name: '박', cells: [assigned('3-2', '502'), EMPTY, EMPTY] },
    ])
    const options = getRegionDirectAssignClassOptionsFromData(data)
    expect(options.find(option => option.value === '501')).toBeUndefined()
    expect(isRegionDirectAssignClassSlotSelectable(data, '501')).toBe(false)
    expect(isRegionDirectAssignClassSlotFull(data, '501')).toBe(true)
    expect(isRegionDirectAssignClassSlotFull(data, '502')).toBe(false)
    expect(options.find(option => option.value === '502')).toEqual({
      value: '502',
      label: '4/3 ｜ 3학년 2반 (A초)',
    })
    expect(options.find(option => option.value === '503')).toEqual({
      value: '503',
      label: '4/3 ｜ 3학년 3반 (A초)',
    })
  })

  it('giveUp 행의 ASSIGNED는 점유에 넣지 않는다', () => {
    const data = table([
      { id: '1', name: '김', cells: [assigned('3-1', '501'), EMPTY, EMPTY] },
      {
        id: '2',
        name: '이포기',
        isWithdrawnVolunteer: true,
        cells: [assigned('3-1', '501'), EMPTY, EMPTY],
      },
    ])
    expect(isRegionDirectAssignClassSlotFull(data, '501')).toBe(false)
    expect(getRegionDirectAssignClassOptionsFromData(data).find(option => option.value === '501')).toEqual({
      value: '501',
      label: '4/3 ｜ 3학년 1반 (A초)',
    })
  })

  it('같은 봉사자의 ASSIGNED 셀이 여러 개여도 점유는 participant distinct다', () => {
    const data = table([
      {
        id: '1',
        name: '김',
        cells: [assigned('3-1', '501'), assigned('3-1', '501'), EMPTY],
      },
    ])
    expect(isRegionDirectAssignClassSlotFull(data, '501')).toBe(false)
    expect(getRegionDirectAssignClassOptionsFromData(data).find(option => option.value === '501')).toBeDefined()
  })

  it('활동 지역이 다른 파트너 ASSIGNED도 같은 educationSlotId 점유에 포함한다', () => {
    const data = table([
      { id: '111', name: '서울PRIMARY', cells: [assigned('3-1', '501'), EMPTY, EMPTY] },
      { id: '222', name: '부산SECONDARY', cells: [assigned('3-1', '501'), EMPTY, EMPTY] },
    ])
    expect(isRegionDirectAssignClassSlotFull(data, '501')).toBe(true)
    expect(getRegionDirectAssignClassOptionsFromData(data).find(option => option.value === '501')).toBeUndefined()
  })

  it('임시일정 slotId 학급은 직접 배정 목록에 넣지 않는다', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, EMPTY, EMPTY] }])
    data.columns[0] = {
      ...data.columns[0]!,
      classSlots: [{ id: '901', classLabel: '4-1', isEducationSlotId: false }],
    }
    expect(getRegionDirectAssignClassOptionsFromData(data).find(option => option.value === '901')).toBeUndefined()
    expect(isRegionDirectAssignClassSlotSelectable(data, '901')).toBe(false)
  })

  it('classSlots가 비면 직접 배정 옵션을 invent하지 않는다', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, EMPTY, EMPTY] }])
    data.columns = data.columns.map(column => ({ ...column, classSlots: [] }))
    expect(getRegionDirectAssignClassOptionsFromData(data)).toEqual([])
  })

  it('지난 교육일 빈 학급·1인 학급은 목록에서 제외한다', () => {
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
    expect(options.find(option => option.value === '503')).toBeUndefined()
    expect(options.find(option => option.value === '502')).toBeUndefined()
    expect(isRegionDirectAssignClassSlotSelectable(data, '503', now)).toBe(false)
    expect(isRegionDirectAssignClassSlotSelectable(data, '502', now)).toBe(false)
  })

  it('지난 교육일이어도 2인 만석은 목록에서 제외한다', () => {
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
    expect(options.find(option => option.value === '501')).toBeUndefined()
    expect(isRegionDirectAssignClassSlotSelectable(data, '501', Date.parse('2026-11-05T00:00:00+09:00'))).toBe(
      false
    )
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
    ).toBeUndefined()
    expect(isRegionDirectAssignClassSlotSelectable(data, '503', now)).toBe(false)
  })

  it('지난 빈 슬롯과 만석 슬롯은 선택 불가이고, 미래 빈 슬롯만 선택 가능하다', () => {
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
        assignedVolunteerCount: 0,
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

  it('existingPrimaryParticipantId는 봉사자 옵션에서 뺀다', () => {
    expect(
      mapRegionDirectAssignCandidateOptions({
        assignedVolunteerCount: 1,
        existingPrimaryParticipantId: 111,
        candidates: [
          { participantId: 111, volunteerName: '기존' },
          { participantId: 222, volunteerName: '대기' },
        ],
      })
    ).toEqual([{ value: '222', label: '대기' }])
  })

  it('후보 이름이 없으면 봉사자 id를 만들지 않고 -로 둔다', () => {
    expect(
      mapRegionDirectAssignCandidateOptions({
        assignedVolunteerCount: 0,
        candidates: [{ participantId: 3, volunteerName: '   ' }],
      })
    ).toEqual([{ value: '3', label: '-' }])
  })
})

describe('selectRegionUnavailabilityScheduleIds', () => {
  it('같은 서울일에 일정이 여러 개면 날짜당 1건, ASSIGNED 일정을 고른다', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, assigned('4-1'), EMPTY] }])
    expect(
      selectRegionUnavailabilityScheduleIds(data, '1', ['2026-04-03', '2026-04-10'])
    ).toEqual(['11', '20'])
  })

  it('그 날 ASSIGNED가 없으면 그 날 첫 일정을 고른다', () => {
    const data = table([{ id: '1', name: '김', cells: [EMPTY, EMPTY, EMPTY] }])
    expect(selectRegionUnavailabilityScheduleIds(data, '1', ['2026-04-03'])).toEqual(['10'])
  })

  it('REASSIGNMENT_REQUIRED만 있으면 ASSIGNED 일정이 아니므로 그날 첫 일정을 고른다', () => {
    const data = table([
      { id: '1', name: '김', cells: [reassignmentRequired('3-1'), EMPTY, EMPTY] },
    ])
    expect(selectRegionUnavailabilityScheduleIds(data, '1', ['2026-04-03'])).toEqual(['10'])
  })
})

describe('regionUnavailabilityRequiresReplacementForDate', () => {
  it('선택한 서울일의 어느 열에라도 ASSIGNED가 있으면 true', () => {
    const data = table([
      { id: 'v', name: '봉사', cells: [assigned('3-1'), EMPTY, EMPTY] },
    ])
    expect(regionUnavailabilityRequiresReplacementForDate(data, 'v', '2026-04-03')).toBe(
      true
    )
    expect(regionUnavailabilityRequiresReplacementForDate(data, 'v', '2026-04-10')).toBe(
      false
    )
  })

  it('다른 날짜에만 배정돼 있으면 불가일 날짜에는 false', () => {
    const data = table([
      { id: 'v', name: '봉사', cells: [assigned('3-1'), EMPTY, EMPTY] },
    ])
    expect(regionUnavailabilityRequiresReplacement(data, 'v', ['2026-04-10'])).toBe(false)
  })

  it('REASSIGNMENT_REQUIRED / UNASSIGNED만 있으면 대체가 필요 없다', () => {
    const data = table([
      { id: 'v', name: '봉사', cells: [reassignmentRequired('3-1'), EMPTY, EMPTY] },
    ])
    expect(regionUnavailabilityRequiresReplacementForDate(data, 'v', '2026-04-03')).toBe(
      false
    )
  })
})

describe('getRegionEducationDateOptionsFromData', () => {
  it('서울 달력일(isoDate) distinct, 표시는 dateLabel', () => {
    const data = table([{ id: 'v', name: '봉사', cells: [EMPTY, EMPTY, EMPTY] }])
    expect(getRegionEducationDateOptionsFromData(data)).toEqual([
      { value: '2026-04-03', label: '4/3' },
      { value: '2026-04-10', label: '4/10' },
    ])
  })
})

describe('getRegionAssignedEducationDateOptionsFromData', () => {
  it('봉사자에게 활성 배정이 있는 서울 달력일만 남긴다', () => {
    const data = table([
      { id: 'v', name: '봉사', cells: [assigned('3-1'), EMPTY, EMPTY] },
    ])
    expect(getRegionAssignedEducationDateOptionsFromData(data, 'v')).toEqual([
      { value: '2026-04-03', label: '4/3' },
    ])
  })
})

describe('getRegionBlockedDateSubstituteVolunteerOptionsFromData', () => {
  it('같은 서울일 다른 일정 ASSIGNED·unavailable·giveUp·REASSIGNMENT_REQUIRED는 대체자에서 뺀다', () => {
    const data = table([
      { id: '1', name: '대상', cells: [assigned('3-1'), EMPTY, EMPTY] },
      { id: '2', name: '같은날다른일정', cells: [EMPTY, assigned('4-1'), EMPTY] },
      { id: '3', name: '그날불가', cells: [EMPTY, { kind: 'empty', blockedEmpty: true }, EMPTY] },
      { id: '4', name: '다른날만배정', cells: [EMPTY, EMPTY, assigned('3-1')] },
      { id: '5', name: '재배정필요', cells: [reassignmentRequired('3-2'), EMPTY, EMPTY] },
    ])
    data.rows.push({
      id: '6',
      name: '포기자',
      totalAssignedDays: 0,
      isWithdrawnVolunteer: true,
      cells: [EMPTY, EMPTY, EMPTY],
    })
    expect(
      getRegionBlockedDateSubstituteVolunteerOptionsFromData(data, '1', ['2026-04-03']).map(
        option => option.label
      )
    ).toEqual(['다른날만배정'])
  })
})

describe('region assignment header totals', () => {
  it('교육일 열이 없어도 봉사자 행 수를 숨기지 않는다', () => {
    expect(
      getRegionAssignmentDisplayedVolunteerCount({
        volunteerCount: 5,
      })
    ).toBe(5)
  })

  it('totalAssignedDays null은 0일로 표시하고 cells로 다시 세지 않는다', () => {
    expect(formatRegionAssignmentTotalAssignedDays(null)).toBe('0일')
    expect(formatRegionAssignmentTotalAssignedDays(undefined)).toBe('0일')
    expect(formatRegionAssignmentTotalAssignedDays(0)).toBe('0일')
    expect(formatRegionAssignmentTotalAssignedDays(3)).toBe('3일')
  })
})
