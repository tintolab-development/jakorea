import { afterEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import {
  GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID,
  GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_DATE_ONE_DAY_ID,
  GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID,
} from '@/features/program/general/lib/detail-common-info-display'
import { EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  resetProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  getInstitutionApplicationFormHiddenParagraphIds,
  getInstitutionApplicationProgramBridge,
  patchInstitutionApplicationProgramBridge,
  resetInstitutionApplicationProgramBridge,
  resolveInstitutionApplicationProgramBridge,
  resolveInstitutionApplicationRecruitLimitsVisibilityBridge,
  shouldShowInstitutionApplicationMaxScheduleFields,
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
  shouldShowInstitutionApplicationPreferredScheduleParagraph,
  shouldShowInstitutionApplicationPreferredScheduleSessionSelect,
  shouldShowInstitutionApplicationSchedulePeriodDateOnlyPreferred,
  shouldShowInstitutionApplicationGuidanceParagraph,
  shouldShowInstitutionApplicationScheduleParagraph,
  syncInstitutionApplicationPreferredEducationFormFromOverlay,
} from './institution-application-program-bridge'

afterEach(() => {
  resetInstitutionApplicationProgramBridge()
  resetProgramRegistrationOverlay()
})

describe('resolveInstitutionApplicationProgramBridge', () => {
  it('GET 온라인 라벨 + overlay 참여자 선택이면 희망 교육 형태를 켠다', () => {
    const bridge = resolveInstitutionApplicationProgramBridge({
      id: 'prog-preferred',
      generalCommonInfo: { educationFormLabel: '온라인' },
      registrationOverlay: {
        'generalRegistration.typeSettings.multiCommonEducationForm':
          EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
      },
    } as unknown as Program)

    expect(bridge.showPreferredEducationForm).toBe(true)
  })

  it('모집 사전 안내 해당 없음이면 preEducationNoticeRequired가 false다', () => {
    const bridge = resolveInstitutionApplicationProgramBridge({
      id: 'prog-no-preguidance',
      generalCommonInfo: {
        participantRecruitmentInfo: { preEducationNoticeRequired: false },
      },
    } as unknown as Program)
    expect(bridge.preEducationNoticeRequired).toBe(false)
    expect(shouldShowInstitutionApplicationGuidanceParagraph(bridge)).toBe(false)
  })

  it('프로그램 공통 정보의 교육 진행 예정일을 브리지에 포함한다', () => {
    const bridge = resolveInstitutionApplicationProgramBridge({
      id: GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID,
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
    } as Parameters<typeof resolveInstitutionApplicationProgramBridge>[0])

    expect(bridge.educationScheduleMode).toBe('date')
    expect(bridge.educationScheduleLines).toEqual([
      '26년 4월 20일(월) 9:30 ~ 12:20',
      '26년 4월 27일(월) 13:00 ~ 15:50',
    ])
  })

  it('educationScheduleRange를 commonInfo에서 우선한다', () => {
    const bridge = resolveInstitutionApplicationProgramBridge({
      id: 'tt-range',
      startDate: '2026-01-01T00:00:00+09:00',
      endDate: '2026-12-31T00:00:00+09:00',
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        educationScheduleMode: 'period',
        educationScheduleRange: {
          start: '2026-04-01T00:00:00.000Z',
          end: '2026-06-30T00:00:00.000Z',
        },
      },
    } as Parameters<typeof resolveInstitutionApplicationProgramBridge>[0])

    expect(bridge.educationScheduleRange).toBeDefined()
    expect(
      new Date(bridge.educationScheduleRange!.start).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Seoul',
      })
    ).toBe('2026-04-01')
    expect(
      new Date(bridge.educationScheduleRange!.end).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Seoul',
      })
    ).toBe('2026-06-30')
  })

  it('range 없으면 program 사업 운영 기간을 쓴다', () => {
    const bridge = resolveInstitutionApplicationProgramBridge({
      id: 'tt-business',
      startDate: '2026-03-01T00:00:00+09:00',
      endDate: '2026-09-30T00:00:00+09:00',
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        educationScheduleMode: 'period',
      },
    } as Parameters<typeof resolveInstitutionApplicationProgramBridge>[0])

    expect(bridge.educationScheduleRange).toBeDefined()
    const start = new Date(bridge.educationScheduleRange!.start)
    const end = new Date(bridge.educationScheduleRange!.end)
    expect(start.getTime()).toBeLessThan(end.getTime())
    // +09:00 자정 → UTC 전날 15:00 — 로컬 달력일 기준으로 3월/9월
    expect(start.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })).toBe('2026-03-01')
    expect(end.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })).toBe('2026-09-30')
  })
})

describe('resolveInstitutionApplicationRecruitLimitsVisibilityBridge', () => {
  it('educationScheduleRange만으로 educationScheduleMode를 period로 덮지 않는다', () => {
    const bridge = resolveInstitutionApplicationRecruitLimitsVisibilityBridge({
      preEducationNoticeRequired: true,
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleRange: {
        start: '2026-04-01T00:00:00.000Z',
        end: '2026-06-30T00:00:00.000Z',
      },
    })
    expect(bridge.educationScheduleMode).toBe('date')
    expect(shouldShowInstitutionApplicationMaxScheduleFields(bridge)).toBe(false)
  })
})

describe('institution recruit limits field visibility', () => {
  const period = { educationScheduleMode: 'period' as const }
  const date = { educationScheduleMode: 'date' as const }
  const bridge = <T extends object>(input: T) => ({
    preEducationNoticeRequired: true,
    ...input,
  })

  it('신청 가능 최대 일정 수 — 기간 지정 + (커리큘럼 단일·복수 | 일정형 단일)만 노출', () => {
    expect(
      shouldShowInstitutionApplicationMaxScheduleFields(
        bridge({
          educationStructure: 'curriculum',
          sessionRound: 'single',
          ...period,
        })
      )
    ).toBe(true)
    expect(
      shouldShowInstitutionApplicationMaxScheduleFields(
        bridge({
          educationStructure: 'curriculum',
          sessionRound: 'multi',
          ...period,
        })
      )
    ).toBe(true)
    expect(
      shouldShowInstitutionApplicationMaxScheduleFields(
        bridge({
          educationStructure: 'schedule',
          sessionRound: 'single',
          ...period,
        })
      )
    ).toBe(true)
    expect(
      shouldShowInstitutionApplicationMaxScheduleFields(
        bridge({
          educationStructure: 'schedule',
          sessionRound: 'multi',
          ...period,
        })
      )
    ).toBe(false)
    expect(
      shouldShowInstitutionApplicationMaxScheduleFields(
        bridge({
          educationStructure: 'curriculum',
          sessionRound: 'single',
          ...date,
        })
      )
    ).toBe(false)
  })

  it('날짜 지정이면 최대 일정·1일 차시 필드를 모두 숨긴다', () => {
    const input = bridge({
      educationStructure: 'curriculum' as const,
      sessionRound: 'single' as const,
      educationScheduleMode: 'date' as const,
    })
    expect(shouldShowInstitutionApplicationMaxScheduleFields(input)).toBe(false)
    expect(shouldShowInstitutionApplicationMaxSessionsPerDayField(input)).toBe(false)
  })

  it('신청 가능 1일 최대 차시 — 커리큘럼형 + 복수 회차 + 기간 지정만 노출', () => {
    expect(
      shouldShowInstitutionApplicationMaxSessionsPerDayField(
        bridge({
          educationStructure: 'curriculum',
          sessionRound: 'multi',
          ...period,
        })
      )
    ).toBe(true)
    expect(
      shouldShowInstitutionApplicationMaxSessionsPerDayField(
        bridge({
          educationStructure: 'curriculum',
          sessionRound: 'single',
          ...period,
        })
      )
    ).toBe(false)
    expect(
      shouldShowInstitutionApplicationMaxSessionsPerDayField(
        bridge({
          educationStructure: 'schedule',
          sessionRound: 'single',
          ...period,
        })
      )
    ).toBe(false)
    expect(
      shouldShowInstitutionApplicationMaxSessionsPerDayField(
        bridge({
          educationStructure: 'curriculum',
          sessionRound: 'multi',
          ...date,
        })
      )
    ).toBe(false)
  })

  it('커리큘럼 기간 지망 — 단일·복수 모두 희망 차시 셀렉, 일정형 단일은 제외', () => {
    expect(
      shouldShowInstitutionApplicationPreferredScheduleSessionSelect(
        bridge({ educationStructure: 'curriculum', sessionRound: 'single', ...period })
      )
    ).toBe(true)
    expect(
      shouldShowInstitutionApplicationPreferredScheduleSessionSelect(
        bridge({ educationStructure: 'curriculum', sessionRound: 'multi', ...period })
      )
    ).toBe(true)
    expect(
      shouldShowInstitutionApplicationPreferredScheduleSessionSelect(
        bridge({ educationStructure: 'schedule', sessionRound: 'single', ...period })
      )
    ).toBe(false)
  })

  it('일정형 단일 기간 지망 — 날짜만 UI', () => {
    expect(
      shouldShowInstitutionApplicationSchedulePeriodDateOnlyPreferred(
        bridge({ educationStructure: 'schedule', sessionRound: 'single', ...period })
      )
    ).toBe(true)
    expect(
      shouldShowInstitutionApplicationSchedulePeriodDateOnlyPreferred(
        bridge({ educationStructure: 'curriculum', sessionRound: 'single', ...period })
      )
    ).toBe(false)
  })
})

describe('shouldShowInstitutionApplicationScheduleParagraph', () => {
  it('일정형 + 복수 회차이면 진행 희망 교육 일정 단락을 숨긴다', () => {
    expect(
      shouldShowInstitutionApplicationScheduleParagraph({
        educationStructure: 'schedule',
        sessionRound: 'multi',
        educationScheduleMode: 'period',
        preEducationNoticeRequired: true,
      })
    ).toBe(false)
  })

  it('일정형 + 단일 회차 + 기간 지정이면 단락을 노출한다', () => {
    expect(
      shouldShowInstitutionApplicationScheduleParagraph({
        educationStructure: 'schedule',
        sessionRound: 'single',
        educationScheduleMode: 'period',
        preEducationNoticeRequired: true,
      })
    ).toBe(true)
  })

  it('날짜 지정 + 고유 일자 이틀이면 단락을 노출한다', () => {
    const input = {
      educationStructure: 'curriculum' as const,
      sessionRound: 'single' as const,
      educationScheduleMode: 'date' as const,
      educationScheduleLines: [
        '26년 4월 20일(월) 9:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
      preEducationNoticeRequired: true,
    }
    expect(shouldShowInstitutionApplicationScheduleParagraph(input)).toBe(true)
    expect(shouldShowInstitutionApplicationPreferredScheduleParagraph(input)).toBe(false)
  })

  it('날짜 지정 + 같은 날 슬롯 2개이면 단락을 노출한다', () => {
    expect(
      shouldShowInstitutionApplicationScheduleParagraph({
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: [
          '26년 4월 20일(월) 09:30 ~ 12:20',
          '26년 4월 20일(월) 13:00 ~ 15:50',
        ],
        preEducationNoticeRequired: true,
      })
    ).toBe(true)
  })

  it('날짜 지정 + 슬롯 1개이면 단락을 숨긴다', () => {
    expect(
      shouldShowInstitutionApplicationScheduleParagraph({
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20'],
        preEducationNoticeRequired: true,
      })
    ).toBe(false)
  })

  it('일정형 + 단일 + 날짜 — 고유 일자 이틀이면 고정 일정 단락 노출', () => {
    const input = {
      educationStructure: 'schedule' as const,
      sessionRound: 'single' as const,
      educationScheduleMode: 'date' as const,
      educationScheduleLines: [
        '26년 4월 20일(월) 9:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
      preEducationNoticeRequired: true,
    }
    expect(shouldShowInstitutionApplicationScheduleParagraph(input)).toBe(true)
    expect(shouldShowInstitutionApplicationPreferredScheduleParagraph(input)).toBe(false)
  })

  it('일정형 + 단일 + 날짜 — 같은 날 슬롯 2개이면 단락 노출', () => {
    expect(
      shouldShowInstitutionApplicationScheduleParagraph({
        educationStructure: 'schedule',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: [
          '26년 4월 20일(월) 09:30 ~ 12:20',
          '26년 4월 20일(월) 13:00 ~ 15:50',
        ],
        preEducationNoticeRequired: true,
      })
    ).toBe(true)
  })
})

describe('getInstitutionApplicationFormHiddenParagraphIds', () => {
  it('일정형 + 복수 회차이면 scheduleChoice 단락 id를 숨긴다', () => {
    const hidden = getInstitutionApplicationFormHiddenParagraphIds({
      educationStructure: 'schedule',
      sessionRound: 'multi',
      educationScheduleMode: 'period',
      preEducationNoticeRequired: true,
    })
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)).toBe(true)
  })

  it('사전 안내 불필요이면 guidance 단락 id를 숨긴다', () => {
    const hidden = getInstitutionApplicationFormHiddenParagraphIds({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      preEducationNoticeRequired: false,
    })
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance)).toBe(true)
  })

  it('사전 안내 필요이면 guidance 단락을 숨기지 않는다', () => {
    const hidden = getInstitutionApplicationFormHiddenParagraphIds({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      preEducationNoticeRequired: true,
    })
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance)).toBeFalsy()
  })

  it('일정형 + 단일 + 날짜 + 같은 날 슬롯 2개이면 scheduleChoice를 숨기지 않는다', () => {
    const hidden = getInstitutionApplicationFormHiddenParagraphIds({
      educationStructure: 'schedule',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 20일(월) 13:00 ~ 15:50',
      ],
      preEducationNoticeRequired: true,
    })
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)).toBeFalsy()
  })

  it('일정형 + 단일 + 날짜 + 슬롯 1개이면 scheduleChoice를 숨긴다', () => {
    const hidden = getInstitutionApplicationFormHiddenParagraphIds({
      educationStructure: 'schedule',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20'],
      preEducationNoticeRequired: true,
    })
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)).toBe(true)
  })
})

describe('resolveInstitutionApplicationProgramBridge — 일정형 단일 날짜 mock', () => {
  it('GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID — date 모드·예정일 줄', () => {
    const bridge = resolveInstitutionApplicationProgramBridge({
      id: GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID,
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
    } as Program)

    expect(bridge.educationStructure).toBe('schedule')
    expect(bridge.sessionRound).toBe('single')
    expect(bridge.educationScheduleMode).toBe('date')
    expect(bridge.educationScheduleLines?.length).toBe(4)
    expect(shouldShowInstitutionApplicationScheduleParagraph(bridge)).toBe(true)
    expect(shouldShowInstitutionApplicationPreferredScheduleParagraph(bridge)).toBe(false)
  })

  it('GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_DATE_ONE_DAY_ID — 같은 날 슬롯 2개면 scheduleChoice 노출', () => {
    const bridge = resolveInstitutionApplicationProgramBridge({
      id: GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_DATE_ONE_DAY_ID,
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
    } as Program)

    expect(bridge.educationScheduleMode).toBe('date')
    expect(bridge.educationScheduleLines?.length).toBe(2)
    expect(shouldShowInstitutionApplicationScheduleParagraph(bridge)).toBe(true)
    const hidden = getInstitutionApplicationFormHiddenParagraphIds({
      ...bridge,
      preEducationNoticeRequired: bridge.preEducationNoticeRequired ?? true,
    })
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)).toBeFalsy()
  })
})

describe('syncInstitutionApplicationPreferredEducationFormFromOverlay', () => {
  it('overlay reset 후에도 브리지 플래그를 유지한다', () => {
    patchInstitutionApplicationProgramBridge({ showPreferredEducationForm: true })
    expect(getInstitutionApplicationProgramBridge().showPreferredEducationForm).toBe(true)

    resetProgramRegistrationOverlay()
    syncInstitutionApplicationPreferredEducationFormFromOverlay({})

    expect(getInstitutionApplicationProgramBridge().showPreferredEducationForm).toBe(true)
  })

  it('overlay 참여자 선택이면 플래그를 켠다', () => {
    syncInstitutionApplicationPreferredEducationFormFromOverlay({
      'generalRegistration.typeSettings.singleEducationForm':
        EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
    })
    expect(getInstitutionApplicationProgramBridge().showPreferredEducationForm).toBe(true)
  })

  it('복수회차 online이 남아 있어도 단일 회차 참여자 선택이면 켠다', () => {
    syncInstitutionApplicationPreferredEducationFormFromOverlay({
      'generalRegistration.typeSettings.multiCommonEducationForm': 'online',
      'generalRegistration.typeSettings.singleEducationForm':
        EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
    })
    expect(getInstitutionApplicationProgramBridge().showPreferredEducationForm).toBe(true)
  })

  it('overlay에 참여자 선택이 없으면 기존 true를 끄지 않는다', () => {
    patchInstitutionApplicationProgramBridge({ showPreferredEducationForm: true })
    syncInstitutionApplicationPreferredEducationFormFromOverlay({
      'generalRegistration.typeSettings.multiCommonEducationForm': 'online',
    })
    expect(getInstitutionApplicationProgramBridge().showPreferredEducationForm).toBe(true)
  })
})

describe('shouldShowInstitutionApplicationPreferredScheduleParagraph', () => {
  it('일정형 + 복수 회차이면 희망 일정 본문도 노출하지 않는다', () => {
    expect(
      shouldShowInstitutionApplicationPreferredScheduleParagraph({
        educationStructure: 'schedule',
        sessionRound: 'multi',
        educationScheduleMode: 'period',
        preEducationNoticeRequired: true,
      })
    ).toBe(false)
  })

  it('커리큘럼 단일 + 기간 지정이면 희망 일정 본문을 노출한다', () => {
    expect(
      shouldShowInstitutionApplicationPreferredScheduleParagraph({
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'period',
        educationScheduleLines: ['26년 4월 20일(월) ~ 26년 4월 27일(월)'],
        preEducationNoticeRequired: true,
      })
    ).toBe(true)
  })

  it('날짜 지정(고정 일정)이면 희망 일정 본문을 숨긴다', () => {
    expect(
      shouldShowInstitutionApplicationPreferredScheduleParagraph({
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: [
          '26년 4월 20일(월) 09:30 ~ 12:20',
          '26년 4월 20일(월) 13:00 ~ 15:50',
        ],
        preEducationNoticeRequired: true,
      })
    ).toBe(false)
  })
})
