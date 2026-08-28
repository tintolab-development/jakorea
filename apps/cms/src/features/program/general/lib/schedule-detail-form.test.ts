import { describe, expect, it } from 'vitest'
import {
  applyCurriculumPreEducationBlock,
  applySchedulePreEducationBlock,
  buildDefaultCurriculumSessionsForEdit,
  buildDefaultScheduleDetailsForEdit,
  coerceScheduleDetailsToEventLayout,
  getScheduleEventPerScheduleExtraPlan,
  hasScheduleEventPerScheduleExtraRows,
  inferScheduleDetailBlockKind,
  isIndividualAllPerScheduleLayout,
  PRE_EDUCATION_SCHEDULE_LABEL,
  shouldDisableEducationSchedulePeriodMode,
  shouldLockEducationScheduleCalendarToggles,
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

  it('기관 + 복수 회차이면 유형 설정과 무관하게 행사 일정 레이아웃을 쓴다', () => {
    expect(
      shouldUseScheduleEventBlockLayout({
        sessionRound: 'multi',
        participantOrganization: true,
        ...COMMON,
      })
    ).toBe(true)
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

  it('기관 + 일정 공통 복수 회차이면 행사 일정을 시드한다', () => {
    const details = buildDefaultScheduleDetailsForEdit({
      sessionRound: 'multi',
      scheduleGroupCount: 2,
      participantOrganization: true,
      ...COMMON,
    })
    expect(details[0]?.blockKind).toBe('event')
    expect(details[0]?.scheduleLabel).toBe('행사 일정 01')
  })
})

describe('coerceScheduleDetailsToEventLayout', () => {
  it('세부 일정을 행사 일정으로 승격하고 사전 교육은 유지한다', () => {
    const next = coerceScheduleDetailsToEventLayout([
      {
        scheduleLabel: '사전 교육',
        blockKind: 'preEducation',
        name: '사전 교육',
        groupTimes: [{ startTime: '', endTime: '' }],
      },
      {
        scheduleLabel: '세부 일정 01',
        blockKind: 'sub',
        name: '오리엔테이션',
        groupTimes: [{ startTime: '', endTime: '' }],
      },
    ])
    expect(next[0]?.blockKind).toBe('preEducation')
    expect(next[1]?.blockKind).toBe('event')
    expect(next[1]?.scheduleLabel).toBe('행사 일정 01')
    expect(next[1]?.name).toBe('오리엔테이션')
  })
})

describe('getScheduleEventPerScheduleExtraPlan', () => {
  it('개인 + 일정 공통이면 과제 설정 extra만 연다', () => {
    const plan = getScheduleEventPerScheduleExtraPlan({
      participantOrganization: false,
      ...COMMON,
    })
    expect(hasScheduleEventPerScheduleExtraRows(plan)).toBe(true)
    expect(plan).toEqual({
      showEducation: false,
      showParticipation: false,
      showIps: false,
      showAssignment: true,
      educationWithParticipation: false,
    })
  })

  it('기관 + 일정 공통이면 extra 행이 없다', () => {
    const plan = getScheduleEventPerScheduleExtraPlan({
      participantOrganization: true,
      ...COMMON,
    })
    expect(hasScheduleEventPerScheduleExtraRows(plan)).toBe(false)
    expect(plan.showAssignment).toBe(false)
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

  it('기관이면 참여 방식이 상이해도 참여 방식·과제 행을 열지 않는다', () => {
    const plan = getScheduleEventPerScheduleExtraPlan({
      participantOrganization: true,
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'perSchedule',
      ipsScheduleDetail: 'common',
    })
    expect(plan.showParticipation).toBe(false)
    expect(plan.showAssignment).toBe(false)
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
    expect(plan.showAssignment).toBe(true)
  })

  it('기관이면 과제 설정 행을 열지 않는다', () => {
    const plan = getScheduleEventPerScheduleExtraPlan({
      participantOrganization: true,
      ...ALL_PER_SCHEDULE,
    })
    expect(plan.showAssignment).toBe(false)
    expect(plan.showEducation).toBe(true)
    expect(plan.showIps).toBe(true)
    expect(plan.showParticipation).toBe(false)
  })

  it('개인이면 과제 설정 행을 연다', () => {
    const plan = getScheduleEventPerScheduleExtraPlan({
      participantOrganization: false,
      ...ALL_PER_SCHEDULE,
    })
    expect(plan.showAssignment).toBe(true)
  })
})

describe('isIndividualAllPerScheduleLayout', () => {
  it('개인 + 교육·참여·IPS 모두 일정 별 상이면 true', () => {
    expect(
      isIndividualAllPerScheduleLayout({
        participantOrganization: false,
        ...ALL_PER_SCHEDULE,
      })
    ).toBe(true)
  })

  it('기관이면 false', () => {
    expect(
      isIndividualAllPerScheduleLayout({
        participantOrganization: true,
        ...ALL_PER_SCHEDULE,
      })
    ).toBe(false)
  })

  it('하나라도 일정 공통이면 false', () => {
    expect(
      isIndividualAllPerScheduleLayout({
        participantOrganization: false,
        educationFormScheduleDetail: 'perSchedule',
        participationScheduleDetail: 'perSchedule',
        ipsScheduleDetail: 'common',
      })
    ).toBe(false)
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

  it('이미 있는 사전 교육 일정명은 다시 켜도 유지한다', () => {
    const seeded = buildDefaultScheduleDetailsForEdit({
      sessionRound: 'multi',
      scheduleGroupCount: 1,
      participantOrganization: false,
      ...COMMON,
    })
    const withPre = applySchedulePreEducationBlock(seeded, true, { groupCount: 1 })
    withPre[0]!.name = '오리엔테이션'
    const next = applySchedulePreEducationBlock(withPre, true, { groupCount: 1 })
    expect(next[0]?.blockKind).toBe('preEducation')
    expect(next[0]?.name).toBe('오리엔테이션')
  })
})

describe('applyCurriculumPreEducationBlock', () => {
  it('켜면 사전 교육 세션을 앞에 추가하고 1회차는 유지한다', () => {
    const seeded = buildDefaultCurriculumSessionsForEdit('multi')
    const next = applyCurriculumPreEducationBlock(seeded, true, 'multi')
    expect(next).toHaveLength(2)
    expect(next[0]?.sessionLabel).toBe(PRE_EDUCATION_SCHEDULE_LABEL)
    expect(next[0]?.title).toBe(PRE_EDUCATION_SCHEDULE_LABEL)
    expect(next[0]?.ipsCategory).toBe('prepare')
    expect(next[1]?.sessionLabel).toBe('1회차')
  })

  it('끄면 사전 교육만 제거하고 회차 번호를 다시 매긴다', () => {
    const withPre = applyCurriculumPreEducationBlock(
      buildDefaultCurriculumSessionsForEdit('multi'),
      true,
      'multi'
    )
    const next = applyCurriculumPreEducationBlock(withPre, false, 'multi')
    expect(next).toHaveLength(1)
    expect(next[0]?.sessionLabel).toBe('1회차')
  })

  it('이미 사전 교육이 있으면 중복 추가하지 않는다', () => {
    const once = applyCurriculumPreEducationBlock(
      buildDefaultCurriculumSessionsForEdit('multi'),
      true,
      'multi'
    )
    const twice = applyCurriculumPreEducationBlock(once, true, 'multi')
    expect(twice.filter(s => s.sessionLabel === PRE_EDUCATION_SCHEDULE_LABEL)).toHaveLength(1)
    expect(twice).toHaveLength(2)
  })

  it('단일 회차 차시 앞에도 사전 교육 세션을 추가한다', () => {
    const next = applyCurriculumPreEducationBlock(
      buildDefaultCurriculumSessionsForEdit('single'),
      true,
      'single'
    )
    expect(next).toHaveLength(2)
    expect(next[0]?.sessionLabel).toBe(PRE_EDUCATION_SCHEDULE_LABEL)
    expect(next[1]?.sessionLabel).toBe('1차시')
  })

  it('이미 있는 사전 교육 일정명은 다시 켜도 유지한다', () => {
    const once = applyCurriculumPreEducationBlock(
      buildDefaultCurriculumSessionsForEdit('single'),
      true,
      'single'
    )
    once[0]!.title = '사전 워크숍'
    const twice = applyCurriculumPreEducationBlock(once, true, 'single')
    expect(twice[0]?.sessionLabel).toBe(PRE_EDUCATION_SCHEDULE_LABEL)
    expect(twice[0]?.title).toBe('사전 워크숍')
  })
})

describe('shouldLockEducationScheduleCalendarToggles', () => {
  it('일반 커리큘럼형이면 개인·기관 모두 true', () => {
    expect(
      shouldLockEducationScheduleCalendarToggles({
        participantOrganization: true,
        educationStructure: 'curriculum',
      })
    ).toBe(true)
    expect(
      shouldLockEducationScheduleCalendarToggles({
        participantOrganization: false,
        educationStructure: 'curriculum',
      })
    ).toBe(true)
    expect(
      shouldLockEducationScheduleCalendarToggles({
        participantOrganization: true,
        educationStructure: 'schedule',
      })
    ).toBe(false)
    expect(
      shouldLockEducationScheduleCalendarToggles({
        participantOrganization: false,
        educationStructure: 'schedule',
      })
    ).toBe(false)
  })
})

describe('shouldDisableEducationSchedulePeriodMode', () => {
  it('일반 개인 + 단일 회차만 기간 지정을 막는다', () => {
    expect(
      shouldDisableEducationSchedulePeriodMode({
        participantOrganization: false,
        sessionRound: 'single',
      })
    ).toBe(true)
    expect(
      shouldDisableEducationSchedulePeriodMode({
        participantOrganization: false,
        sessionRound: 'multi',
      })
    ).toBe(false)
    expect(
      shouldDisableEducationSchedulePeriodMode({
        participantOrganization: true,
        sessionRound: 'single',
      })
    ).toBe(false)
  })
})

describe('inferScheduleDetailBlockKind', () => {
  it('사전 교육 라벨을 구분한다', () => {
    expect(inferScheduleDetailBlockKind('사전 교육')).toBe('preEducation')
    expect(inferScheduleDetailBlockKind('행사 일정 01')).toBe('event')
    expect(inferScheduleDetailBlockKind('세부 일정 01')).toBe('sub')
  })
})
