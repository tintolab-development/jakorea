import { describe, expect, it } from 'vitest'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import {
  resolveInstitutionFixedScheduleDescription,
  resolveInstitutionPreferredScheduleDescription,
  resolveInstitutionPreferredScheduleInitialBlockCount,
  resolveInstitutionPreferredScheduleMaxBlocks,
  shouldUseInstitutionFixedScheduleCardCopy,
  shouldUseInstitutionPreferredScheduleCardCopy,
  shouldUseProgramApplicationScheduleTemplateAuthoringMode,
} from './institution-application-schedule-copy'

const CURRICULUM_MULTI_PERIOD: InstitutionApplicationProgramBridge = {
  preEducationNoticeRequired: true,
  educationStructure: 'curriculum',
  sessionRound: 'multi',
  educationScheduleMode: 'period',
}

const CURRICULUM_SINGLE_PERIOD: InstitutionApplicationProgramBridge = {
  preEducationNoticeRequired: true,
  educationStructure: 'curriculum',
  sessionRound: 'single',
  educationScheduleMode: 'period',
}

const SCHEDULE_SINGLE_PERIOD: InstitutionApplicationProgramBridge = {
  preEducationNoticeRequired: true,
  educationStructure: 'schedule',
  sessionRound: 'single',
  educationScheduleMode: 'period',
}

const SCHEDULE_SINGLE_DATE_LINES = [
  '26년 4월 20일(월) 09:30 ~ 12:20',
  '26년 4월 20일(월) 13:00 ~ 15:50',
  '26년 4월 27일(월) 09:30 ~ 12:20',
  '26년 4월 27일(월) 13:00 ~ 15:50',
]

const SCHEDULE_SINGLE_DATE: InstitutionApplicationProgramBridge = {
  preEducationNoticeRequired: true,
  educationStructure: 'schedule',
  sessionRound: 'single',
  educationScheduleMode: 'date',
  educationScheduleLines: SCHEDULE_SINGLE_DATE_LINES,
}

describe('program application schedule template authoring mode', () => {
  it('등록 위저드 program-linked 미리보기에서는 authoring도 연동 본문을 쓴다', () => {
    expect(
      shouldUseProgramApplicationScheduleTemplateAuthoringMode(
        PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice,
        'authoring',
        { programLinkedInstitutionApplicationForm: true }
      )
    ).toBe(false)
    expect(
      shouldUseProgramApplicationScheduleTemplateAuthoringMode(
        PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice,
        'authoring',
        { programLinkedIndividualApplicationForm: true }
      )
    ).toBe(false)
  })

  it('템플릿 관리 authoring은 기본 힌트를 쓴다', () => {
    expect(
      shouldUseProgramApplicationScheduleTemplateAuthoringMode(
        PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice,
        'authoring',
        {}
      )
    ).toBe(true)
  })
})

describe('institution preferred schedule card copy', () => {
  it('커리큘럼형 + 복수 회차 + 기간 지정은 시안 설명과 기본 2지망을 쓴다', () => {
    expect(shouldUseInstitutionPreferredScheduleCardCopy(CURRICULUM_MULTI_PERIOD)).toBe(true)
    expect(resolveInstitutionPreferredScheduleDescription(CURRICULUM_MULTI_PERIOD)).toBe(
      '교육을 희망하는 날짜와 수업 시간을 모두 작성해 주세요. 수업은 1일, N차시 운영됩니다. (최대 N개까지 희망 일정 신청이 가능합니다.)'
    )
    expect(resolveInstitutionPreferredScheduleMaxBlocks(CURRICULUM_MULTI_PERIOD)).toBe(10)
    expect(resolveInstitutionPreferredScheduleInitialBlockCount(CURRICULUM_MULTI_PERIOD)).toBe(2)
  })

  it('커리큘럼형 + 단일 회차 + 기간 지정 — 차시 개수·1지망·미입력 상한 10', () => {
    expect(shouldUseInstitutionPreferredScheduleCardCopy(CURRICULUM_SINGLE_PERIOD)).toBe(true)
    expect(resolveInstitutionPreferredScheduleDescription(CURRICULUM_SINGLE_PERIOD)).toBe(
      '교육을 희망하는 날짜와 수업 시간을 모두 작성해 주세요. 수업은 1일, N차시 운영됩니다. (최대 N개까지 희망 일정 신청이 가능합니다.)'
    )
    expect(resolveInstitutionPreferredScheduleMaxBlocks(CURRICULUM_SINGLE_PERIOD)).toBe(10)
    expect(resolveInstitutionPreferredScheduleInitialBlockCount(CURRICULUM_SINGLE_PERIOD)).toBe(1)
    const bridge: InstitutionApplicationProgramBridge = {
      ...CURRICULUM_SINGLE_PERIOD,
      curriculumChartSessionCount: 3,
      maxScheduleCount: 4,
    }
    expect(resolveInstitutionPreferredScheduleDescription(bridge)).toBe(
      '교육을 희망하는 날짜와 수업 시간을 모두 작성해 주세요. 수업은 1일, 3차시 운영됩니다. (최대 4개까지 희망 일정 신청이 가능합니다.)'
    )
    expect(resolveInstitutionPreferredScheduleMaxBlocks(bridge)).toBe(4)
  })

  it('일정형 + 단일 회차 + 기간 지정 — 날짜만 지망 설명·1지망', () => {
    expect(shouldUseInstitutionPreferredScheduleCardCopy(SCHEDULE_SINGLE_PERIOD)).toBe(true)
    expect(resolveInstitutionPreferredScheduleDescription(SCHEDULE_SINGLE_PERIOD)).toBe(
      '교육을 희망하는 날짜를 모두 작성해 주세요. (최대 N개까지 희망 일정 신청이 가능합니다.)'
    )
    expect(resolveInstitutionPreferredScheduleInitialBlockCount(SCHEDULE_SINGLE_PERIOD)).toBe(1)
    const bridge: InstitutionApplicationProgramBridge = {
      ...SCHEDULE_SINGLE_PERIOD,
      maxScheduleCount: 4,
    }
    expect(resolveInstitutionPreferredScheduleDescription(bridge)).toBe(
      '교육을 희망하는 날짜를 모두 작성해 주세요. (최대 4개까지 희망 일정 신청이 가능합니다.)'
    )
    expect(resolveInstitutionPreferredScheduleMaxBlocks(bridge)).toBe(4)
  })

  it('모집 상한이 있으면 설명·지망 수에 반영한다', () => {
    const bridge: InstitutionApplicationProgramBridge = {
      ...CURRICULUM_MULTI_PERIOD,
      maxSessionsPerDay: 3,
      maxScheduleCount: 4,
      sessionsPerRound: 2,
    }
    // ④ N = 모집 희망 차시 상한(maxSessionsPerDay), 회차당 차시 아님
    expect(resolveInstitutionPreferredScheduleDescription(bridge)).toBe(
      '교육을 희망하는 날짜와 수업 시간을 모두 작성해 주세요. 수업은 1일, 3차시 운영됩니다. (최대 4개까지 희망 일정 신청이 가능합니다.)'
    )
    expect(resolveInstitutionPreferredScheduleMaxBlocks(bridge)).toBe(4)
    expect(resolveInstitutionPreferredScheduleInitialBlockCount(bridge)).toBe(2)
  })

  it('날짜 지정(고정 일정)이면 희망 일정 카드 카피를 쓰지 않는다', () => {
    const bridge: InstitutionApplicationProgramBridge = {
      ...CURRICULUM_MULTI_PERIOD,
      educationScheduleMode: 'date',
      educationScheduleLines: ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월) 13:00 ~ 15:50'],
    }
    expect(shouldUseInstitutionPreferredScheduleCardCopy(bridge)).toBe(false)
    expect(shouldUseInstitutionFixedScheduleCardCopy(bridge)).toBe(true)
    expect(resolveInstitutionFixedScheduleDescription(bridge)).toBe(
      'N차시*N회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'
    )
    expect(
      resolveInstitutionFixedScheduleDescription({
        ...bridge,
        educationRoundCount: 2,
        sessionsPerRound: 2,
      })
    ).toBe('2차시*2회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.')
    expect(resolveInstitutionPreferredScheduleInitialBlockCount(bridge)).toBe(1)
  })

  it('커리큘럼 + 복수 + 날짜 지정 — N차시*N회 설명(1회차 차시 기준)', () => {
    const bridge: InstitutionApplicationProgramBridge = {
      preEducationNoticeRequired: true,
      educationStructure: 'curriculum',
      sessionRound: 'multi',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 9:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
      educationRoundCount: 2,
      sessionsPerRound: 2,
    }
    expect(shouldUseInstitutionFixedScheduleCardCopy(bridge)).toBe(true)
    expect(resolveInstitutionFixedScheduleDescription(bridge)).toBe(
      '2차시*2회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'
    )
  })

  it('일정형 + 단일 + 날짜 지정 — 고정 일정 1타임 설명·희망 카드 아님', () => {
    expect(shouldUseInstitutionPreferredScheduleCardCopy(SCHEDULE_SINGLE_DATE)).toBe(false)
    expect(shouldUseInstitutionFixedScheduleCardCopy(SCHEDULE_SINGLE_DATE)).toBe(true)
    expect(resolveInstitutionFixedScheduleDescription(SCHEDULE_SINGLE_DATE)).toBe(
      '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
    )
  })

  it('커리큘럼 날짜 지정 + 단일 회차는 1일 N차시 안내를 카드 설명으로 쓴다', () => {
    const bridge: InstitutionApplicationProgramBridge = {
      preEducationNoticeRequired: true,
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 10월 13일(화) 13:30 ~ 15:30',
        '26년 10월 13일(화) 9:30 ~ 11:30',
        '26년 10월 20일(화) 13:30 ~ 15:30',
      ],
    }
    expect(shouldUseInstitutionFixedScheduleCardCopy(bridge)).toBe(true)
    expect(resolveInstitutionFixedScheduleDescription(bridge)).toBe(
      '진행 가능한 일정을 모두 선택해 주세요. 수업은 1일, N차시 운영됩니다.'
    )
    expect(
      resolveInstitutionFixedScheduleDescription({ ...bridge, curriculumChartSessionCount: 3 })
    ).toBe('진행 가능한 일정을 모두 선택해 주세요. 수업은 1일, 3차시 운영됩니다.')
  })
})
