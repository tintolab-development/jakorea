import { describe, expect, it } from 'vitest'
import {
  applyCurriculumPreEducationBlock,
  applyEducationStructureChangeToForm,
  applySchedulePreEducationBlock,
  buildDefaultCurriculumSessionsForEdit,
  buildDefaultScheduleDetailsForEdit,
  coerceScheduleDetailsToEventLayout,
  getScheduleEventPerScheduleExtraPlan,
  hasScheduleEventPerScheduleExtraRows,
  inferScheduleDetailBlockKind,
  isGeneralPreEducationName,
  isIndividualAllPerScheduleLayout,
  isPreEducationCurriculumSession,
  isPreEducationScheduleBlock,
  PRE_EDUCATION_SCHEDULE_LABEL,
  trimTrailingBlankRegularCurriculumSessions,
  shouldAllowScheduleProgressGroupAdd,
  getEducationScheduleSelectionDatePickerProps,
  shouldAutoFillEducationScheduleFromGroupTimes,
  shouldDisableEducationSchedulePeriodMode,
  shouldLockEducationScheduleDateMode,
  shouldDisableEducationSchedulePeriodTimeInput,
  shouldDisableEducationScheduleSelectionTimeInput,
  shouldLockEducationScheduleCalendarToggles,
  shouldLockProgressSchedulePeriodToggle,
  shouldUseScheduleEventBlockLayout,
  type ScheduleEventBlockLayoutInput,
} from './schedule-detail-form'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'

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

describe('GENERAL 사전교육 판별', () => {
  it('공백을 제거한 뒤 사전교육으로 시작하면 사전교육이다', () => {
    expect(isGeneralPreEducationName('사전 교육')).toBe(true)
    expect(isGeneralPreEducationName('사전교육 1회차')).toBe(true)
    expect(isPreEducationCurriculumSession({ sessionLabel: '사전교육 1회차' })).toBe(true)
    expect(
      isPreEducationScheduleBlock({ scheduleLabel: '세부 일정 01', name: '사전 교육' })
    ).toBe(true)
    expect(isPreEducationScheduleBlock({ blockKind: 'preEducation' })).toBe(true)
    expect(isPreEducationScheduleBlock({ isPreEducation: true })).toBe(true)
  })

  it('교사연수·UJAT 봉사자 사전교육을 GENERAL 사전교육으로 보지 않는다', () => {
    expect(isGeneralPreEducationName('교육 연수')).toBe(false)
    expect(isGeneralPreEducationName('봉사자 사전교육')).toBe(false)
    expect(isPreEducationCurriculumSession({ sessionLabel: '교육 연수' })).toBe(false)
  })
})

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

describe('trimTrailingBlankRegularCurriculumSessions', () => {
  it('맨 끝 빈 차시 행은 제거하고 최소 1개는 유지한다', () => {
    const trimmed = trimTrailingBlankRegularCurriculumSessions([
      {
        sessionLabel: '1차시',
        title: '필요와 욕구, 현명한 소비',
        description: '본문',
      },
      { sessionLabel: '2차시', title: '', description: '' },
    ])
    expect(trimmed).toHaveLength(1)
    expect(trimmed[0]?.sessionLabel).toBe('1차시')
  })

  it('사전 교육 뒤의 빈 차시만 제거한다', () => {
    const trimmed = trimTrailingBlankRegularCurriculumSessions([
      { sessionLabel: PRE_EDUCATION_SCHEDULE_LABEL, title: '사전 교육', description: '' },
      { sessionLabel: '1차시', title: '1차시', description: '내용' },
      { sessionLabel: '2차시', title: '', description: '' },
    ])
    expect(trimmed).toHaveLength(2)
    expect(trimmed[0]?.sessionLabel).toBe(PRE_EDUCATION_SCHEDULE_LABEL)
    expect(trimmed[1]?.sessionLabel).toBe('1차시')
  })

  it('기본 라벨만 있는 2차시 placeholder 는 제거한다', () => {
    const trimmed = trimTrailingBlankRegularCurriculumSessions([
      { sessionLabel: '1차시', title: '필요와 욕구, 현명한 소비12121212', description: '본문' },
      { sessionLabel: '2차시', title: '2차시', description: '' },
    ])
    expect(trimmed).toHaveLength(1)
    expect(trimmed[0]?.sessionLabel).toBe('1차시')
  })

  it('내용이 있는 2차시는 제거하지 않는다', () => {
    const trimmed = trimTrailingBlankRegularCurriculumSessions([
      { sessionLabel: '1차시', title: '단원1', description: '본문1' },
      { sessionLabel: '2차시', title: '단원2', description: '본문2' },
    ])
    expect(trimmed).toHaveLength(2)
  })

  it('단원명만 기본 라벨이어도 교육 형태 라벨이 있으면 보존한다', () => {
    const trimmed = trimTrailingBlankRegularCurriculumSessions([
      { sessionLabel: '1회차', title: '1회차', description: '', educationFormLabel: '오프라인' },
      { sessionLabel: '2회차', title: '2회차', description: '', educationFormLabel: '온라인' },
    ])
    expect(trimmed).toHaveLength(2)
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

describe('shouldLockProgressSchedulePeriodToggle', () => {
  it('개인·일정형·복수 회차 — 기간 토글 조작 허용', () => {
    expect(
      shouldLockProgressSchedulePeriodToggle({
        participantIndividual: true,
        participantOrganization: false,
        programType: 'schedule',
        sessionRound: 'multi',
      })
    ).toBe(false)
  })

  it('기관·일정형·복수 회차 — 기간 토글 조작 허용', () => {
    expect(
      shouldLockProgressSchedulePeriodToggle({
        participantIndividual: false,
        participantOrganization: true,
        programType: 'schedule',
        sessionRound: 'multi',
      })
    ).toBe(false)
  })

  it('일정형·복수 회차이나 개인·기관 참여가 아니면 잠금', () => {
    expect(
      shouldLockProgressSchedulePeriodToggle({
        participantIndividual: false,
        participantOrganization: false,
        programType: 'schedule',
        sessionRound: 'multi',
      })
    ).toBe(true)
  })

  it('일정형·단일 회차·커리큘럼형은 잠금', () => {
    expect(
      shouldLockProgressSchedulePeriodToggle({
        participantIndividual: true,
        participantOrganization: false,
        programType: 'schedule',
        sessionRound: 'single',
      })
    ).toBe(true)
    expect(
      shouldLockProgressSchedulePeriodToggle({
        participantIndividual: true,
        participantOrganization: false,
        programType: 'curriculum',
        sessionRound: 'multi',
      })
    ).toBe(true)
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

describe('shouldDisableEducationScheduleSelectionTimeInput', () => {
  it('커리큘럼형은 시간 입력을 막지 않는다', () => {
    expect(
      shouldDisableEducationScheduleSelectionTimeInput({ educationStructure: 'curriculum' })
    ).toBe(false)
  })

  it('일정형은 기본적으로 시간을 막고, 기관·단일·날짜 지정만 허용한다', () => {
    expect(
      shouldDisableEducationScheduleSelectionTimeInput({ educationStructure: 'schedule' })
    ).toBe(true)
    expect(
      shouldDisableEducationScheduleSelectionTimeInput({
        educationStructure: 'schedule',
        participantOrganization: true,
        sessionRound: 'single',
        educationScheduleMode: 'date',
      })
    ).toBe(false)
    expect(
      shouldDisableEducationScheduleSelectionTimeInput({
        educationStructure: 'schedule',
        participantOrganization: true,
        sessionRound: 'single',
        educationScheduleMode: 'period',
      })
    ).toBe(true)
    expect(
      shouldDisableEducationScheduleSelectionTimeInput({
        educationStructure: 'schedule',
        participantOrganization: false,
        sessionRound: 'single',
        educationScheduleMode: 'date',
      })
    ).toBe(true)
  })
})

describe('shouldAutoFillEducationScheduleFromGroupTimes', () => {
  it('일정형 단일 회차이면 기관·개인 모두 진행 시간 자동 반영', () => {
    expect(
      shouldAutoFillEducationScheduleFromGroupTimes({
        educationStructure: 'schedule',
        sessionRound: 'single',
      })
    ).toBe(true)
    expect(
      shouldAutoFillEducationScheduleFromGroupTimes({
        educationStructure: 'schedule',
        sessionRound: 'multi',
      })
    ).toBe(false)
    expect(
      shouldAutoFillEducationScheduleFromGroupTimes({
        educationStructure: 'curriculum',
        sessionRound: 'single',
      })
    ).toBe(false)
  })
})

describe('shouldDisableEducationSchedulePeriodTimeInput', () => {
  it('기간 지정이면 교육 구조·회차와 무관하게 시간 비활성(날짜만)', () => {
    expect(
      shouldDisableEducationSchedulePeriodTimeInput({
        educationStructure: 'curriculum',
        sessionRound: 'multi',
        educationScheduleMode: 'period',
      })
    ).toBe(true)
    expect(
      shouldDisableEducationSchedulePeriodTimeInput({
        educationStructure: 'schedule',
        sessionRound: 'multi',
        educationScheduleMode: 'period',
      })
    ).toBe(true)
    expect(
      shouldDisableEducationSchedulePeriodTimeInput({
        educationStructure: 'schedule',
        sessionRound: 'single',
        educationScheduleMode: 'period',
      })
    ).toBe(true)
  })

  it('날짜 지정이면 false', () => {
    expect(
      shouldDisableEducationSchedulePeriodTimeInput({
        educationStructure: 'schedule',
        educationScheduleMode: 'date',
      })
    ).toBe(false)
  })
})

describe('getEducationScheduleSelectionDatePickerProps', () => {
  it('기관·커리큘럼·복수·기간 — 시간 노출·비활성', () => {
    expect(
      getEducationScheduleSelectionDatePickerProps({
        educationStructure: 'curriculum',
        participantOrganization: true,
        sessionRound: 'multi',
        scheduleMode: 'period',
      })
    ).toEqual({
      presetMode: 'period',
      lockTimeToggleOn: true,
      disableTimeInputs: true,
    })
  })

  it('기관·일정·단일·날짜 — 시간 편집 허용 예외', () => {
    expect(
      getEducationScheduleSelectionDatePickerProps({
        educationStructure: 'schedule',
        participantOrganization: true,
        sessionRound: 'single',
        scheduleMode: 'date',
      })
    ).toEqual({
      presetMode: 'schedule',
      lockPeriodToggleOn: true,
      lockTimeToggleOn: true,
      disableTimeInputs: false,
    })
  })

  it('일정·단일·날짜·개인 — 시간 비활성', () => {
    expect(
      getEducationScheduleSelectionDatePickerProps({
        educationStructure: 'schedule',
        participantOrganization: false,
        sessionRound: 'single',
        scheduleMode: 'date',
      })
    ).toEqual({
      presetMode: 'schedule',
      lockPeriodToggleOn: true,
      lockTimeToggleOn: false,
      disableTimeInputs: true,
    })
  })
})

describe('shouldLockEducationScheduleDateMode', () => {
  it('기관·일정·단일 — 진행 시간 자동 반영과 별도로 기간 지정 잠금하지 않음', () => {
    expect(
      shouldLockEducationScheduleDateMode({
        participantOrganization: true,
        educationStructure: 'schedule',
        sessionRound: 'single',
      })
    ).toBe(false)
  })

  it('개인·일정·단일 — 날짜 지정 고정(기간 라디오 잠금)', () => {
    expect(
      shouldLockEducationScheduleDateMode({
        participantOrganization: false,
        educationStructure: 'schedule',
        sessionRound: 'single',
      })
    ).toBe(true)
  })

  it('개인·커리큘럼 — 기간 지정 정책으로 날짜 고정', () => {
    expect(
      shouldLockEducationScheduleDateMode({
        participantOrganization: false,
        educationStructure: 'curriculum',
        sessionRound: 'single',
      })
    ).toBe(true)
  })
})

describe('shouldDisableEducationSchedulePeriodMode', () => {
  it('단일 회차이면 기관은 기간 지정을 허용하고 개인만 막는다', () => {
    expect(
      shouldDisableEducationSchedulePeriodMode({
        participantOrganization: true,
        sessionRound: 'single',
      })
    ).toBe(false)
    expect(
      shouldDisableEducationSchedulePeriodMode({
        participantOrganization: false,
        sessionRound: 'single',
      })
    ).toBe(true)
  })

  it('복수 회차이면 개인만 기간 지정을 막고 기관은 허용한다', () => {
    expect(
      shouldDisableEducationSchedulePeriodMode({
        participantOrganization: false,
        sessionRound: 'multi',
      })
    ).toBe(true)
    expect(
      shouldDisableEducationSchedulePeriodMode({
        participantOrganization: true,
        sessionRound: 'multi',
      })
    ).toBe(false)
  })
})

describe('shouldAllowScheduleProgressGroupAdd', () => {
  it('일정형 단일 회차 + 날짜 지정만 진행 그룹 추가를 허용한다', () => {
    expect(
      shouldAllowScheduleProgressGroupAdd({
        sessionRound: 'single',
        educationScheduleMode: 'date',
      })
    ).toBe(true)
    expect(
      shouldAllowScheduleProgressGroupAdd({
        sessionRound: 'single',
        educationScheduleMode: 'period',
      })
    ).toBe(false)
    expect(
      shouldAllowScheduleProgressGroupAdd({
        sessionRound: 'multi',
        educationScheduleMode: 'date',
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

describe('applyEducationStructureChangeToForm', () => {
  it('일정형으로 바꾸면 세부 프로그램명을 해당없음으로 고정한다', () => {
    const values: Record<string, unknown> = {
      sessionRound: 'single',
      scheduleGroupCount: 1,
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
      participantOrganization: false,
      detailedProgramId: '163006',
      curriculumSessions: [{ id: 'c1' }],
      scheduleDetails: [],
    }
    const setValue = (key: string, value: unknown) => {
      values[key] = value
    }
    applyEducationStructureChangeToForm(
      setValue as never,
      (() => values) as never,
      'schedule'
    )
    expect(values.detailedProgramId).toBe(TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE)
    expect(values.curriculumSessions).toEqual([])
  })

  it('커리큘럼형으로 바꾸면 해당없음 센티널을 비운다', () => {
    const values: Record<string, unknown> = {
      sessionRound: 'single',
      detailedProgramId: TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
      curriculumSessions: [],
      scheduleDetails: [{ id: 's1' }],
    }
    const setValue = (key: string, value: unknown) => {
      values[key] = value
    }
    applyEducationStructureChangeToForm(
      setValue as never,
      (() => values) as never,
      'curriculum'
    )
    expect(values.detailedProgramId).toBe('')
    expect(values.scheduleDetails).toEqual([])
  })
})
