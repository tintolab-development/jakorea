import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resetProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { applyGeneralRegistrationOverlayToProgram } from './registration-overlay-to-program'
import {
  buildGeneralRegistrationOverlayFromProgram,
  extrasFromGeneralProgram,
  hasIncompleteGeneralProgramDetailEditRequiredFields,
  readGeneralRegistrationOverlayForSave,
  seedGeneralRegistrationOverlayFromProgram,
} from './registration-overlay-sync'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'

function baseProgram(): Program {
  return {
    id: 'general-1',
    title: '청소년 경제',
    mainTitle: '청소년 경제',
    titleEn: 'Youth Economy',
    type: 'offline',
    format: 'course',
    category: 'school',
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-11-30T00:00:00.000Z',
    status: 'active',
    detailedProgramId: '163006',
    businessArea: '경제금융',
    educationProcess: 'Digital (Computer)',
    ipOwned: 'JA',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    generalCommonInfo: {
      announcementTitle: '공고용 청소년 경제',
      detailedProgramName: '캠프 A',
      kpi: {
        finalParticipants: 20,
        instructorCount: 2,
        volunteerCount: 0,
        finalSchools: 4,
        finalClasses: 8,
      },
    },
  } as Program
}

describe('buildGeneralRegistrationOverlayFromProgram → apply', () => {
  beforeEach(() => {
    resetProgramRegistrationOverlay()
  })

  it('대표명·공고명·세부프로그램·교육구조를 왕복한다', () => {
    const program = baseProgram()
    const overlay = buildGeneralRegistrationOverlayFromProgram(program)
    const extras = extrasFromGeneralProgram(program)
    expect(overlay['generalRegistration.basicInfo.publicProgramTitle']).toBe('공고용 청소년 경제')
    expect(overlay['generalRegistration.basicInfo.detailedProgramId']).toBe('163006')
    expect(extras.programType).toBe('curriculum')

    const next = applyGeneralRegistrationOverlayToProgram(program, overlay, extras)
    expect(next.mainTitle).toBe('청소년 경제')
    expect(next.detailedProgramId).toBe('163006')
    expect(next.generalCommonInfo?.announcementTitle).toBe('공고용 청소년 경제')
  })

  it('일정형은 세부 프로그램명을 해당없음으로 시드하고 apply extras가 구조를 유지한다', () => {
    const program = {
      ...baseProgram(),
      generalProgramEducationStructure: 'schedule' as const,
      generalProgramSessionRound: 'single' as const,
    }
    const overlay = buildGeneralRegistrationOverlayFromProgram(program)
    const extras = extrasFromGeneralProgram(program)
    expect(overlay['generalRegistration.basicInfo.detailedProgramId']).toBe(
      TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
    )
    expect(extras.programType).toBe('schedule')
    const next = applyGeneralRegistrationOverlayToProgram(program, overlay, extras)
    expect(next.detailedProgramId).toBeUndefined()
    expect(extras.sessionRoundType).toBe('single')
  })

  it('seed 후 read는 generalRegistration prefix만 반환한다', () => {
    seedGeneralRegistrationOverlayFromProgram(baseProgram())
    const saved = readGeneralRegistrationOverlayForSave()
    expect(Object.keys(saved).every(key => key.startsWith('generalRegistration.'))).toBe(true)
  })

  it('임금은 급수 라벨·지급 항목 라벨을 overlay에 시드한다', () => {
    const program = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        wageGradeRows: [
          { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 120,000원' },
          { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 240,000원' },
        ],
        paymentItems: '교통비, 숙박비',
        deductionItems: '일용근로자 원천징수세액',
      },
      registrationOverlay: {
        'generalRegistration.wageInfo.paymentItemValues': [],
        'generalRegistration.wageInfo.grade1Fee': null,
      },
    }
    const overlay = buildGeneralRegistrationOverlayFromProgram(program)
    expect(overlay['generalRegistration.wageInfo.grade1Fee']).toBe(240_000)
    expect(overlay['generalRegistration.wageInfo.grade2Fee']).toBeNull()
    expect(overlay['generalRegistration.wageInfo.grade3Fee']).toBe(120_000)
    expect(overlay['generalRegistration.wageInfo.paymentItemValues']).toEqual(['p-1', 'p-3'])

    seedGeneralRegistrationOverlayFromProgram(program)
    const saved = readGeneralRegistrationOverlayForSave()
    expect(saved['generalRegistration.wageInfo.grade1Fee']).toBe(240_000)
    expect(saved['generalRegistration.wageInfo.paymentItemValues']).toEqual(['p-1', 'p-3'])
  })

  it('교육 진행 extras 회차 수는 사전 교육을 제외한다', () => {
    const program = {
      ...baseProgram(),
      generalProgramSessionRound: 'multi' as const,
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        scheduleCurriculumPreEducation: true,
        curriculumSessions: [
          { sessionLabel: '사전 교육', title: '사전 교육', description: '' },
          { sessionLabel: '1회차', title: '1차시', description: '첫 회차' },
          { sessionLabel: '2회차', title: '2차시', description: '둘째 회차' },
        ],
        scheduleDetails: [
          { scheduleLabel: '사전 교육', name: '사전 교육' },
          { scheduleLabel: '세부 일정 01', name: '오전 세션' },
          { scheduleLabel: '세부 일정 02', name: '오후 세션' },
        ],
      },
    }
    const extras = extrasFromGeneralProgram(program)
    expect(extras.curriculumSessionCount).toBe(2)
    expect(extras.curriculumChartSessionCount).toBe(2)
    expect(extras.scheduleCurriculumDetailCount).toBe(2)
    expect(extras.scheduleCurriculumPreEducation).toBe(true)
  })

  it('seed는 조회 커리큘럼·일정 줄을 우선하고 오래된 overlay 회차를 버린다', () => {
    const program = {
      ...baseProgram(),
      generalProgramSessionRound: 'multi' as const,
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        scheduleCurriculumPreEducation: true,
        educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20', '26년 4월 20일(월) 13:00 ~ 15:50'],
        curriculumSessions: [
          { sessionLabel: '사전 교육', title: '사전 교육', description: '' },
          { sessionLabel: '1회차', title: '1차시', description: '첫 회차' },
          { sessionLabel: '2회차', title: '2차시', description: '둘째 회차' },
        ],
      },
      registrationOverlay: {
        'generalRegistration.educationScheduleSettings.scheduleLines': [
          'stale-1',
          'stale-2',
          'stale-3',
        ],
        'generalRegistration.educationCurriculum.progressSessionByRound': {
          1: '1',
          2: '2',
          3: '3',
        },
        'generalRegistration.educationCurriculum.roundContentByRound': {
          1: 'old',
          2: 'old',
          3: 'extra',
        },
      },
    }
    seedGeneralRegistrationOverlayFromProgram(program)
    const saved = readGeneralRegistrationOverlayForSave()
    expect(saved['generalRegistration.educationScheduleSettings.scheduleLines']).toEqual([
      '26년 4월 20일(월) 09:30 ~ 12:20',
      '26년 4월 20일(월) 13:00 ~ 15:50',
    ])
    expect(saved['generalRegistration.educationCurriculum.progressSessionByRound']).toEqual({
      1: '1',
      2: '2',
    })
    expect(saved['generalRegistration.educationCurriculum.roundContentByRound']).toEqual({
      1: '첫 회차',
      2: '둘째 회차',
    })
    expect(extrasFromGeneralProgram(program).curriculumSessionCount).toBe(2)
  })

  it('상세 수정 필수검사는 등록 overlay 빈 값을 막는다', () => {
    const extras = extrasFromGeneralProgram({
      ...baseProgram(),
      generalParticipantTypes: ['individual'],
    })
    expect(hasIncompleteGeneralProgramDetailEditRequiredFields({}, extras)).toBe(true)
  })

  it('상세 수정 필수검사는 등록과 같은 overlay를 채우면 통과한다', () => {
    const extras = extrasFromGeneralProgram({
      ...baseProgram(),
      generalParticipantTypes: ['individual'],
    })
    const overlay = {
      'generalRegistration.basicInfo.localProgramTitleKo': '청소년 경제',
      'generalRegistration.basicInfo.programTitleEn': 'Youth Economy',
      'generalRegistration.basicInfo.publicProgramTitle': '공고용 청소년 경제',
      'generalRegistration.basicInfo.detailedProgramId': '163006',
      'generalRegistration.basicInfo.operationRangeSeal': {
        start: '2026-03-01T00:00:00.000Z',
        end: '2026-11-30T00:00:00.000Z',
      },
      'generalRegistration.basicInfo.businessField': 'economy',
      'generalRegistration.basicInfo.educationCourse': 'ja',
      'generalRegistration.basicInfo.ipOwned': 'ja',
      'generalRegistration.basicInfo.courseDeliveredBy': 'ja',
      'generalRegistration.basicInfo.localSponsorId': 'sponsor-1',
      'generalRegistration.basicInfo.localManagerContactId': 'contact-1',
      'generalRegistration.kpi.participantCount': 20,
      'generalRegistration.wageInfo.grade1Fee': 100000,
      'generalRegistration.wageInfo.grade2Fee': 80000,
      'generalRegistration.wageInfo.grade3Fee': 60000,
      'generalRegistration.wageInfo.paymentItemValues': ['instructor_fee'],
      'generalRegistration.typeSettings.ipsType': { category: 'prepare', detail: 'none' },
      'generalRegistration.educationCurriculum.unitNameBySession': { 1: '단원 1' },
      'generalRegistration.educationCurriculum.unitContentBySession': { 1: '교육 내용' },
      'generalRegistration.educationScheduleSettings.scheduleLines': ['2026-04-01 10:00-12:00'],
    }
    expect(hasIncompleteGeneralProgramDetailEditRequiredFields(overlay, extras)).toBe(false)
    expect(
      hasIncompleteGeneralProgramDetailEditRequiredFields(
        { ...overlay, 'generalRegistration.basicInfo.localProgramTitleKo': '' },
        extras
      )
    ).toBe(true)
  })
})
