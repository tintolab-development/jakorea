import { describe, expect, it } from 'vitest'
import {
  buildAddAssignWaitingScheduleChipOptions,
  buildVolunteerInstitutionAddAssignOptions,
  pruneAddAssignSessionSelection,
  splitAddAssignScheduleLabel,
  toggleAddAssignSessionSelection,
} from './general-add-assign-session-chips'

describe('toggleAddAssignSessionSelection', () => {
  it('multiple: 여러 개 선택·해제', () => {
    expect(toggleAddAssignSessionSelection([], 'a', 'multiple')).toEqual(['a'])
    expect(toggleAddAssignSessionSelection(['a'], 'b', 'multiple')).toEqual(['a', 'b'])
    expect(toggleAddAssignSessionSelection(['a', 'b'], 'a', 'multiple')).toEqual(['b'])
  })
  it('single: 1개만 유지, 같은 칩 다시 누르면 해제', () => {
    expect(toggleAddAssignSessionSelection(['a'], 'b', 'single')).toEqual(['b'])
    expect(toggleAddAssignSessionSelection(['b'], 'b', 'single')).toEqual([])
  })
})

describe('pruneAddAssignSessionSelection', () => {
  it('없어졌거나 선택 불가가 된 일정은 뺀다 (기관·강사 변경 시)', () => {
    const options = [
      { id: 'a', scheduleLabel: '', sessionRoundLabel: '', capacityLabel: '' },
      { id: 'b', scheduleLabel: '', sessionRoundLabel: '', capacityLabel: '', disabled: true },
    ]
    expect(pruneAddAssignSessionSelection(['a', 'b', 'c'], options)).toEqual(['a'])
  })
})

describe('splitAddAssignScheduleLabel', () => {
  it('일정 | 차시를 칩 영역으로 나눈다', () => {
    const r = splitAddAssignScheduleLabel('2026.04.20(월) 09:30 ~ 12:20 | 2차시')
    expect(r.sessionRoundLabel).toBe('2차시')
    expect(r.scheduleLabel).toContain('09:30 ~ 12:20')
  })
  it('차시 없으면 빈 라벨', () => {
    expect(splitAddAssignScheduleLabel('2026.04.20(월) 09:30 ~ 12:20').sessionRoundLabel).toBe('')
  })
})

describe('buildAddAssignWaitingScheduleChipOptions', () => {
  it('waiting만 선택 가능, 배지는 서버 배정 인원 라벨 그대로', () => {
    const r = buildAddAssignWaitingScheduleChipOptions([
      { id: 'w1', scheduleLabel: 'A | 1차시', assignmentStatus: 'waiting', countLabel: '3명' },
      { id: 'w2', scheduleLabel: 'B | 2차시', assignmentStatus: 'unavailable', countLabel: '2명' },
      { id: 'w3', scheduleLabel: 'C', assignmentStatus: 'waiting', countLabel: '0명', disabled: true },
    ])
    expect(r.map(o => [o.id, o.disabled, o.capacityLabel])).toEqual([
      ['w1', false, '3명'],
      ['w2', true, '2명'],
      ['w3', true, '0명'],
    ])
  })
  it('같은 일정·차시가 여러 건이면 출강지로 구분', () => {
    const r = buildAddAssignWaitingScheduleChipOptions([
      { id: '1', scheduleLabel: 'A | 1차시', assignmentStatus: 'waiting', countLabel: '0명', locationLabel: '서울' },
      { id: '2', scheduleLabel: 'A | 1차시', assignmentStatus: 'waiting', countLabel: '0명', locationLabel: '부산' },
      { id: '3', scheduleLabel: 'B | 1차시', assignmentStatus: 'waiting', countLabel: '0명', locationLabel: '대구' },
    ])
    expect(r.map(o => o.sessionRoundLabel)).toEqual(['1차시 · 서울', '1차시 · 부산', '1차시'])
  })
})

describe('buildVolunteerInstitutionAddAssignOptions', () => {
  it('선택 가능한 일정이 있는 기관만 옵션, 기관별 칩', () => {
    const r = buildVolunteerInstitutionAddAssignOptions([
      { id: 's1__a', schoolId: 's1', schoolName: 'JA초', hopeScheduleLine: 'A | 1차시', assignmentStatus: 'waiting', assignedVolunteerCountLabel: '1명' },
      { id: 's1__b', schoolId: 's1', schoolName: 'JA초', hopeScheduleLine: 'B | 2차시', assignmentStatus: 'unavailable', assignedVolunteerCountLabel: '2명' },
      { id: 's2__a', schoolId: 's2', schoolName: '불가초', hopeScheduleLine: 'A', assignmentStatus: 'unavailable', assignedVolunteerCountLabel: '0명' },
    ])
    expect(r.institutionOptions).toEqual([{ value: 's1', label: 'JA초' }])
    expect(r.sessionOptionsBySchoolId.get('s1')?.map(o => o.disabled)).toEqual([false, true])
    expect(r.sessionOptionsBySchoolId.has('s2')).toBe(false)
  })
})
