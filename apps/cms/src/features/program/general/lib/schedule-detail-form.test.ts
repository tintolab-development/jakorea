import { describe, expect, it } from 'vitest'
import {
  applySchedulePreEducationBlock,
  buildDefaultScheduleDetailsForEdit,
  getScheduleEventPerScheduleExtraPlan,
  hasScheduleEventPerScheduleExtraRows,
  inferScheduleDetailBlockKind,
  PRE_EDUCATION_SCHEDULE_LABEL,
  shouldUseScheduleEventBlockLayout,
  type ScheduleEventBlockLayoutInput,
} from './schedule-detail-form'

const COMMON: Pick<
  ScheduleEventBlockLayoutInput,
  'educationFormScheduleDetail' | 'participationScheduleDetail' | 'ipsScheduleDetail'
> = {
  educationFormScheduleDetail: 'common',
  participationScheduleDetail: 'common',
  ipsScheduleDetail: 'common',
}

const ALL_PER_SCHEDULE: Pick<
  ScheduleEventBlockLayoutInput,
  'educationFormScheduleDetail' | 'participationScheduleDetail' | 'ipsScheduleDetail'
> = {
  educationFormScheduleDetail: 'perSchedule',
  participationScheduleDetail: 'perSchedule',
  ipsScheduleDetail: 'perSchedule',
}

describe('shouldUseScheduleEventBlockLayout', () => {
  it('개인 + 복수 회차이면 유형 설정과 무관하게 행사 일정 레이아웃을 쓴다', () => {
    expect(
      shouldUseScheduleEventBlockLayout({
        sessionRound: 'multi',
        participantOrganization: false,
        ...COMMON,
      })
    ).toBe(true)
  })

  it('기관 + 기본(일정 공통)이면 행사 일정 레이아웃을 쓰지 않는다', () => {
    expect(
      shouldUseScheduleEventBlockLayout({
        sessionRound: 'multi',
        participantOrganization: true,
        ...COMMON,
      })
    ).toBe(false)
  })

  it('기관 + 교육 형태·참여·IPS 모두 일정 별 상이면 행사 일정 레이아웃을 쓴다', () => {
    expect(
      shouldUseScheduleEventBlockLayout({
        sessionRound: 'multi',
        participantOrganization: true,
        ...ALL_PER_SCHEDULE,
      })
    ).toBe(true)
  })

  it('단일 회차이면 개인이어도 행사 일정 레이아웃을 쓰지 않는다', () => {
    expect(
      shouldUseScheduleEventBlockLayout({
        sessionRound: 'single',
        participantOrganization: false,
        ...ALL_PER_SCHEDULE,
      })
    ).toBe(false)
  })
})

describe('buildDefaultScheduleDetailsForEdit', () => {
  it('개인 + 복수 회차이면 행사 일정 1개를 시드한다', () => {
    const details = buildDefaultScheduleDetailsForEdit({
      sessionRound: 'multi',
      scheduleGroupCount: 2,
      participantOrganization: false,
      ...COMMON,
    })
    expect(details).toHaveLength(1)
    expect(details[0]?.blockKind).toBe('event')
    expect(details[0]?.scheduleLabel).toBe('행사 일정 01')
  })

  it('기관 + 일정 공통 복수 회차이면 세부 일정을 시드한다', () => {
    const details = buildDefaultScheduleDetailsForEdit({
      sessionRound: 'multi',
      scheduleGroupCount: 2,
      participantOrganization: true,
      ...COMMON,
    })
    expect(details[0]?.blockKind).toBe('sub')
  })
})

describe('getScheduleEventPerScheduleExtraPlan', () => {
  it('일정 공통이면 extra 행이 없다', () => {
    const plan = getScheduleEventPerScheduleExtraPlan({
      participantOrganization: false,
      ...COMMON,
    })
    expect(hasScheduleEventPerScheduleExtraRows(plan)).toBe(false)
    expect(plan).toEqual({
      showEducation: false,
      showParticipation: false,
      showIps: false,
      educationWithParticipation: false,
    })
  })

  it('개인 + 교육 형태만 상이면 교육 형태 행만 연다', () => {
    const plan = getScheduleEventPerScheduleExtraPlan({
      participantOrganization: false,
      educationFormScheduleDetail: 'perSchedule',
      participationScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
    })
    expect(plan.showEducation).toBe(true)
    expect(plan.showParticipation).toBe(false)
    expect(plan.showIps).toBe(false)
    expect(plan.educationWithParticipation).toBe(false)
  })

  it('개인 + 참여 방식만 상이면 참여 방식 행만 연다', () => {
    const plan = getScheduleEventPerScheduleExtraPlan({
      participantOrganization: false,
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'perSchedule',
      ipsScheduleDetail: 'common',
    })
    expect(plan.showParticipation).toBe(true)
    expect(plan.showEducation).toBe(false)
    expect(plan.educationWithParticipation).toBe(false)
  })

  it('기관이면 참여 방식이 상이해도 참여 방식 행을 열지 않는다', () => {
    const plan = getScheduleEventPerScheduleExtraPlan({
      participantOrganization: true,
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'perSchedule',
      ipsScheduleDetail: 'common',
    })
    expect(plan.showParticipation).toBe(false)
  })

  it('개인 + 교육·참여가 모두 상이면 한 줄(double)로 연다', () => {
    const plan = getScheduleEventPerScheduleExtraPlan({
      participantOrganization: false,
      educationFormScheduleDetail: 'perSchedule',
      participationScheduleDetail: 'perSchedule',
      ipsScheduleDetail: 'common',
    })
    expect(plan.educationWithParticipation).toBe(true)
    expect(plan.showIps).toBe(false)
  })

  it('IPS만 상이면 IPS 행만 연다', () => {
    const plan = getScheduleEventPerScheduleExtraPlan({
      participantOrganization: false,
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'common',
      ipsScheduleDetail: 'perSchedule',
    })
    expect(plan.showIps).toBe(true)
    expect(plan.showEducation).toBe(false)
    expect(plan.showParticipation).toBe(false)
  })
})

describe('applySchedulePreEducationBlock', () => {
  it('켜면 사전 교육 블록을 앞에 추가하고 행사 일정 번호는 유지한다', () => {
    const seeded = buildDefaultScheduleDetailsForEdit({
      sessionRound: 'multi',
      scheduleGroupCount: 1,
      participantOrganization: false,
      ...COMMON,
    })
    const next = applySchedulePreEducationBlock(seeded, true, { groupCount: 1 })
    expect(next).toHaveLength(2)
    expect(next[0]?.blockKind).toBe('preEducation')
    expect(next[0]?.scheduleLabel).toBe(PRE_EDUCATION_SCHEDULE_LABEL)
    expect(next[0]?.ipsCategory).toBe('prepare')
    expect(next[0]?.ipsDetail).toBe('none')
    expect(next[1]?.blockKind).toBe('event')
    expect(next[1]?.scheduleLabel).toBe('행사 일정 01')
  })

  it('끄면 사전 교육 블록만 제거하고 행사 일정을 다시 번호를 매긴다', () => {
    const seeded = buildDefaultScheduleDetailsForEdit({
      sessionRound: 'multi',
      scheduleGroupCount: 1,
      participantOrganization: false,
      ...COMMON,
    })
    const withPre = applySchedulePreEducationBlock(seeded, true, { groupCount: 1 })
    const next = applySchedulePreEducationBlock(withPre, false, { groupCount: 1 })
    expect(next).toHaveLength(1)
    expect(next[0]?.blockKind).toBe('event')
    expect(next[0]?.scheduleLabel).toBe('행사 일정 01')
  })

  it('이미 사전 교육이 있으면 중복 추가하지 않는다', () => {
    const seeded = buildDefaultScheduleDetailsForEdit({
      sessionRound: 'multi',
      scheduleGroupCount: 1,
      participantOrganization: false,
      ...COMMON,
    })
    const once = applySchedulePreEducationBlock(seeded, true, { groupCount: 1 })
    const twice = applySchedulePreEducationBlock(once, true, { groupCount: 1 })
    expect(twice.filter(d => d.blockKind === 'preEducation')).toHaveLength(1)
    expect(twice).toHaveLength(2)
  })

  it('단일 회차 세부 일정 앞에도 사전 교육 블록을 추가한다', () => {
    const seeded = buildDefaultScheduleDetailsForEdit({
      sessionRound: 'single',
      scheduleGroupCount: 2,
      participantOrganization: false,
      ...COMMON,
    })
    expect(seeded[0]?.blockKind).toBe('sub')
    const next = applySchedulePreEducationBlock(seeded, true, { groupCount: 2 })
    expect(next).toHaveLength(2)
    expect(next[0]?.blockKind).toBe('preEducation')
    expect(next[1]?.blockKind).toBe('sub')
    expect(next[1]?.scheduleLabel).toBe('세부 일정 01')
  })
})

describe('inferScheduleDetailBlockKind', () => {
  it('사전 교육 라벨을 구분한다', () => {
    expect(inferScheduleDetailBlockKind('사전 교육')).toBe('preEducation')
    expect(inferScheduleDetailBlockKind('행사 일정 01')).toBe('event')
    expect(inferScheduleDetailBlockKind('세부 일정 01')).toBe('sub')
  })
})
