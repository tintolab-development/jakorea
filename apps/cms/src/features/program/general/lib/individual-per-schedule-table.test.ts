import { describe, expect, it } from 'vitest'
import { getIndividualMultiRoundPerScheduleTableRows } from './individual-per-schedule-table'

const ALL_COMMON = {
  educationFormScheduleDetail: 'common',
  participationScheduleDetail: 'common',
  ipsScheduleDetail: 'common',
} as const

const ALL_PER_SCHEDULE = {
  educationFormScheduleDetail: 'perSchedule',
  participationScheduleDetail: 'perSchedule',
  ipsScheduleDetail: 'perSchedule',
} as const

describe('getIndividualMultiRoundPerScheduleTableRows', () => {
  it('모두 일정 공통이면 과제 설정만 1단이다', () => {
    expect(getIndividualMultiRoundPerScheduleTableRows(ALL_COMMON)).toEqual([
      { type: 'single', field: 'assignment' },
    ])
  })

  it('교육 형태만 상이면 과제 설정과 한 줄이다', () => {
    expect(
      getIndividualMultiRoundPerScheduleTableRows({
        educationFormScheduleDetail: 'perSchedule',
        participationScheduleDetail: 'common',
        ipsScheduleDetail: 'common',
      })
    ).toEqual([{ type: 'double', left: 'assignment', right: 'education' }])
  })

  it('IPS만 상이면 과제 설정과 한 줄이다', () => {
    expect(
      getIndividualMultiRoundPerScheduleTableRows({
        educationFormScheduleDetail: 'common',
        participationScheduleDetail: 'common',
        ipsScheduleDetail: 'perSchedule',
      })
    ).toEqual([{ type: 'double', left: 'assignment', right: 'ips' }])
  })

  it('참여 방식만 상이면 과제 설정과 한 줄이다', () => {
    expect(
      getIndividualMultiRoundPerScheduleTableRows({
        educationFormScheduleDetail: 'common',
        participationScheduleDetail: 'perSchedule',
        ipsScheduleDetail: 'common',
      })
    ).toEqual([{ type: 'double', left: 'assignment', right: 'participation' }])
  })

  it('교육 형태·IPS가 상이하면 두 항목 한 줄 + 과제 설정 1단이다', () => {
    expect(
      getIndividualMultiRoundPerScheduleTableRows({
        educationFormScheduleDetail: 'perSchedule',
        participationScheduleDetail: 'common',
        ipsScheduleDetail: 'perSchedule',
      })
    ).toEqual([
      { type: 'double', left: 'education', right: 'ips' },
      { type: 'single', field: 'assignment' },
    ])
  })

  it('교육 형태·참여 방식이 상이하면 교육>참여 순 한 줄 + 과제 설정 1단이다', () => {
    expect(
      getIndividualMultiRoundPerScheduleTableRows({
        educationFormScheduleDetail: 'perSchedule',
        participationScheduleDetail: 'perSchedule',
        ipsScheduleDetail: 'common',
      })
    ).toEqual([
      { type: 'double', left: 'education', right: 'participation' },
      { type: 'single', field: 'assignment' },
    ])
  })

  it('IPS·참여 방식이 상이하면 IPS>참여 순 한 줄 + 과제 설정 1단이다', () => {
    expect(
      getIndividualMultiRoundPerScheduleTableRows({
        educationFormScheduleDetail: 'common',
        participationScheduleDetail: 'perSchedule',
        ipsScheduleDetail: 'perSchedule',
      })
    ).toEqual([
      { type: 'double', left: 'ips', right: 'participation' },
      { type: 'single', field: 'assignment' },
    ])
  })

  it('세 항목 모두 상이면 교육|IPS, 과제|참여 두 줄이다', () => {
    expect(getIndividualMultiRoundPerScheduleTableRows(ALL_PER_SCHEDULE)).toEqual([
      { type: 'double', left: 'education', right: 'ips' },
      { type: 'double', left: 'assignment', right: 'participation' },
    ])
  })
})
