import { afterEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID } from '@/features/program/general/lib/detail-common-info-display'
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
  shouldShowInstitutionApplicationPreferredScheduleParagraph,
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
    expect(
      shouldShowInstitutionApplicationScheduleParagraph({
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: [
          '26년 4월 20일(월) 9:30 ~ 12:20',
          '26년 4월 27일(월) 13:00 ~ 15:50',
        ],
        preEducationNoticeRequired: true,
      })
    ).toBe(true)
  })

  it('날짜 지정 + 고유 일자 하루이면 단락을 숨긴다', () => {
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
    ).toBe(false)
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

  it('날짜 지정 + 고유 일자 하루이면 희망 일정 본문도 숨긴다', () => {
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
