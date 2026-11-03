import { describe, expect, it } from 'vitest'
import type { UjatVolunteerAssignmentProgressRow } from './assignment-types'
import {
  formatScheduleShortDateLabel,
  partnerOptionsFromRecommendation,
  resolveVolunteerAssignmentAssignModalMode,
} from './volunteer-assign-modal-data'

describe('partnerOptionsFromRecommendation', () => {
  it('추천 후보를 배정일 적은 순으로 파트너 옵션에 넣는다', () => {
    expect(
      partnerOptionsFromRecommendation([
        {
          participantId: 8,
          volunteerName: '박봉사',
          assignmentDayCount: 3,
          hasPartnerHistoryWithVolunteer: false,
        },
        {
          participantId: 9,
          volunteerName: '최봉사',
          totalAssignedDays: 1,
          hasPartnerHistoryWithVolunteer: true,
        },
        { participantId: 10, volunteerName: ' ' },
      ]).map(option => option.value)
    ).toEqual(['9', '8'])
  })

  it('volunteerName·assignmentDayCount가 없으면 memberName·assignedScheduleCount를 쓴다', () => {
    expect(
      partnerOptionsFromRecommendation([
        {
          participantId: 11,
          memberName: '김별칭',
          assignedScheduleCount: 2,
        },
      ])
    ).toEqual([{ value: '11', label: '김별칭 (배정일 : 2일)' }])
  })
})

describe('formatScheduleShortDateLabel', () => {
  it('요일을 포함해 짧은 일자로 만든다', () => {
    expect(formatScheduleShortDateLabel('2026.05.08(금)')).toBe('5월 8일(금)')
  })

  it('요일이 없으면 달력일로 요일을 채운다', () => {
    expect(formatScheduleShortDateLabel('2026.05.08')).toBe('5월 8일(금)')
  })
})

describe('resolveVolunteerAssignmentAssignModalMode', () => {
  const base = {
    id: '1',
    scheduleLabel: '2026.04.03(금)',
    role: 'none',
    assignedInstitution: { kind: 'name', value: '제이초' },
    attendance: { kind: 'dash' },
    educationPlanSubmitted: false,
    educationLogSubmitted: false,
    educationProgress: 'dash',
    isWithdrawn: false,
  } as UjatVolunteerAssignmentProgressRow

  it('학급만 확정·파트너 미정이면 partner 모드다', () => {
    expect(
      resolveVolunteerAssignmentAssignModalMode({
        ...base,
        classDisplay: { kind: 'class', label: '1-1' },
        partner: { kind: 'undecided' },
      })
    ).toBe('partner')
  })

  it('미배정이면 education 모드다', () => {
    expect(
      resolveVolunteerAssignmentAssignModalMode({
        ...base,
        assignedInstitution: { kind: 'dash' },
        classDisplay: { kind: 'dash' },
        partner: { kind: 'dash' },
      })
    ).toBe('education')
  })
})
