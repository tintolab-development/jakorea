import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resetProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  applyGeneralRegistrationOverlayToProgram,
  type GeneralRegistrationEditorExtras,
} from './registration-overlay-to-program'
import {
  buildGeneralRegistrationOverlayFromProgram,
  extrasFromGeneralProgram,
  getGeneralRegistrationDetailEditExtras,
  hasIncompleteGeneralProgramDetailEditRequiredFields,
  mergeRegistrationOverlayNestedSsot,
  readGeneralRegistrationOverlayForSave,
  seedGeneralRegistrationOverlayFromProgram,
  writeGeneralRegistrationOverlayFromCommonInfoFormValues,
} from './registration-overlay-sync'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'

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

  it('공통정보 공고명이 없으면 overlay에 있던 공고명을 비우지 않는다', () => {
    const { announcementTitle: _omit, ...common } = baseProgram().generalCommonInfo ?? {}
    void _omit
    const overlay = buildGeneralRegistrationOverlayFromProgram({
      ...baseProgram(),
      generalCommonInfo: common,
      registrationOverlay: {
        'generalRegistration.basicInfo.publicProgramTitle': '남아 있는 공고명',
      },
    })
    expect(overlay['generalRegistration.basicInfo.publicProgramTitle']).toBe('남아 있는 공고명')
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

  it('후원사만 있고 담당자가 없으면 수정 overlay에 미선택을 시드한다', () => {
    const overlay = buildGeneralRegistrationOverlayFromProgram({
      ...baseProgram(),
      sponsorId: '1627251',
      managerName: '미선택',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        sponsorManagementIds: ['1627251'],
        sponsorManagerContactIds: [],
        sponsorManagerLine: '미선택',
      },
    })
    expect(overlay['generalRegistration.basicInfo.localManagerContactIds']).toEqual([
      SPONSOR_CONTACT_UNSELECTED_VALUE,
    ])
    expect(overlay['generalRegistration.basicInfo.localManagerContactId']).toBe(
      SPONSOR_CONTACT_UNSELECTED_VALUE
    )
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

  it('sessionRound가 single이면 overlay 회차 맵이 있어도 extras는 단수다', () => {
    const extras = extrasFromGeneralProgram({
      ...baseProgram(),
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          {
            sessionLabel: '1차시',
            title: '필요와 욕구, 현명한 소비',
            description: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
          },
          { sessionLabel: '2차시', title: '', description: '' },
        ],
      },
      registrationOverlay: {
        'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '1' },
        'generalRegistration.educationCurriculum.roundContentByRound': {
          1: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
        },
        'generalRegistration.educationCurriculum.assignmentByRound': {
          1: { enabled: true, period: '26년 10월 13일(화) 10:00 ~ 12:00' },
        },
      },
    })
    expect(extras.sessionRoundType).toBe('single')
    expect(extras.curriculumChartSessionCount).toBe(1)
  })

  it('sessionRound가 multi여도 차시 행이면 extras 회차 수는 overlay다', () => {
    const extras = extrasFromGeneralProgram({
      ...baseProgram(),
      generalProgramSessionRound: 'multi',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionLabel: '1차시', title: '필요와 욕구, 현명한 소비', description: '본문' },
          { sessionLabel: '2차시', title: '', description: '' },
        ],
      },
      registrationOverlay: {
        'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '1' },
        'generalRegistration.educationCurriculum.roundContentByRound': { 1: '본문' },
        'generalRegistration.educationCurriculum.assignmentByRound': {
          1: { enabled: true, period: '26년 10월 13일(화) 10:00 ~ 12:00' },
        },
        'generalRegistration.educationCurriculum.ipsBySession': {
          1: { category: 'succeed', detail: 'conference' },
        },
      },
    })
    expect(extras.sessionRoundType).toBe('multi')
    expect(extras.curriculumSessionCount).toBe(1)
  })

  it('sessionRound가 single이어도 seed는 중첩 차시 행으로 단원·회차 맵을 채운다', () => {
    const program = {
      ...baseProgram(),
      generalProgramSessionRound: 'single' as const,
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionLabel: '1차시', title: '필요와 욕구, 현명한 소비', description: '본문' },
          { sessionLabel: '2차시', title: '', description: '' },
        ],
      },
      registrationOverlay: {
        'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '1' },
        'generalRegistration.educationCurriculum.roundContentByRound': { 1: '본문' },
        'generalRegistration.educationCurriculum.assignmentByRound': {
          1: { enabled: true, period: '26년 10월 13일(화) 10:00 ~ 12:00' },
        },
      },
    }
    seedGeneralRegistrationOverlayFromProgram(program)
    const saved = readGeneralRegistrationOverlayForSave()
    expect(saved['generalRegistration.educationCurriculum.unitNameBySession']).toEqual({
      1: '필요와 욕구, 현명한 소비',
    })
    expect(saved['generalRegistration.educationCurriculum.unitContentBySession']).toEqual({
      1: '본문',
    })
    expect(saved['generalRegistration.educationCurriculum.progressSessionByRound']).toEqual({
      1: '필요와 욕구, 현명한 소비',
    })
    expect(saved['generalRegistration.educationCurriculum.roundContentByRound']).toEqual({
      1: '본문',
    })
  })

  it('sessionRound가 multi여도 차시 행이면 seed는 중첩 행으로 맵을 채운다', () => {
    const program = {
      ...baseProgram(),
      generalProgramSessionRound: 'multi' as const,
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        ipsScheduleDetail: 'perSchedule' as const,
        curriculumSessions: [
          { sessionLabel: '1차시', title: '필요와 욕구, 현명한 소비', description: '본문' },
          { sessionLabel: '2차시', title: '', description: '' },
        ],
      },
      registrationOverlay: {
        'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '1' },
        'generalRegistration.educationCurriculum.roundContentByRound': { 1: '본문' },
        'generalRegistration.educationCurriculum.assignmentByRound': {
          1: { enabled: true, period: '26년 10월 13일(화) 10:00 ~ 12:00' },
        },
        'generalRegistration.educationCurriculum.ipsBySession': {
          1: { category: 'succeed', detail: 'conference' },
        },
      },
    }
    seedGeneralRegistrationOverlayFromProgram(program)
    const saved = readGeneralRegistrationOverlayForSave()
    expect(saved['generalRegistration.educationCurriculum.unitNameBySession']).toEqual({
      1: '필요와 욕구, 현명한 소비',
    })
    expect(saved['generalRegistration.educationCurriculum.progressSessionByRound']).toEqual({
      1: '필요와 욕구, 현명한 소비',
    })
    expect(saved['generalRegistration.educationCurriculum.roundContentByRound']).toEqual({
      1: '본문',
    })
    expect(saved['generalRegistration.educationCurriculum.assignmentByRound']).toEqual({
      1: { enabled: false, period: '' },
    })
    expect(saved['generalRegistration.educationCurriculum.ipsBySession']).toEqual({})
    expect(extrasFromGeneralProgram(program).curriculumSessionCount).toBe(1)
  })

  it('복수 회차여도 overlay 단원 맵이 더 많으면 extras 회차 수는 단원 맵이다', () => {
    const extras = extrasFromGeneralProgram({
      ...baseProgram(),
      generalProgramSessionRound: 'multi',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionLabel: '1회차', title: '1차시', description: '옛 본문' },
        ],
      },
      registrationOverlay: {
        'generalRegistration.educationCurriculum.unitNameBySession': {
          1: '개인 커리큘럼 단일1',
          2: '개인 커리큘럼 단일2',
        },
        'generalRegistration.educationCurriculum.unitContentBySession': {
          1: '개인 커리큘럼 단일11',
          2: '개인 커리큘럼 단일22',
        },
        'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '1' },
        'generalRegistration.educationCurriculum.roundContentByRound': { 1: '옛 본문' },
      },
    })
    expect(extras.sessionRoundType).toBe('multi')
    expect(extras.curriculumSessionCount).toBe(2)
    expect(extras.curriculumChartSessionCount).toBe(2)
  })

  it('사전 교육이 단원 맵 1번이면 회차 수를 키 최댓값으로 늘리지 않는다', () => {
    const extras = extrasFromGeneralProgram({
      ...baseProgram(),
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        scheduleCurriculumPreEducation: true,
        curriculumSessions: [
          { sessionLabel: '사전 교육', title: '사전 교육', description: '' },
          { sessionLabel: '1회차', title: '1차시', description: '첫 회차' },
          { sessionLabel: '2회차', title: '2차시', description: '둘째 회차' },
          { sessionLabel: '3회차', title: '3차시', description: '셋째 회차' },
        ],
      },
      registrationOverlay: {
        'generalRegistration.educationCurriculum.unitNameBySession': {
          1: '사전 교육',
          2: '1차시',
          3: '2차시',
          4: '3차시',
        },
        'generalRegistration.educationCurriculum.unitContentBySession': {
          2: '첫 회차',
          3: '둘째 회차',
          4: '셋째 회차',
        },
        'generalRegistration.educationCurriculum.progressSessionByRound': {
          1: '1',
          2: '2',
          3: '3',
        },
        'generalRegistration.educationCurriculum.roundContentByRound': {
          1: '첫 회차',
          2: '둘째 회차',
          3: '셋째 회차',
        },
      },
    })
    expect(extras.curriculumSessionCount).toBe(3)
    expect(extras.curriculumChartSessionCount).toBe(3)
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

  it('커리큘럼형 seed는 leftover 일정 overlay 맵을 비운다', () => {
    const program = {
      ...baseProgram(),
      generalProgramEducationStructure: 'curriculum' as const,
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionLabel: '1차시', title: '단원', description: '본문' },
        ],
      },
      registrationOverlay: {
        'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
          1: '옛 일정',
        },
        'generalRegistration.educationScheduleCurriculum.educationFormByDetail': {
          1: 'hybrid',
        },
      },
    }
    seedGeneralRegistrationOverlayFromProgram(program)
    const saved = readGeneralRegistrationOverlayForSave()
    expect(saved['generalRegistration.educationScheduleCurriculum.eventNameByDetail']).toEqual({})
    expect(
      saved['generalRegistration.educationScheduleCurriculum.educationFormByDetail']
    ).toEqual({})
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

  it('일정별 교육 형태는 저장된 행 라벨로 다시 연다', () => {
    const program = {
      ...baseProgram(),
      generalProgramSessionRound: 'multi' as const,
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        educationFormScheduleDetail: 'perSchedule' as const,
        curriculumSessions: [
          { sessionLabel: '1회차', title: '1회차', description: '', educationFormLabel: '오프라인' },
          { sessionLabel: '2회차', title: '2회차', description: '', educationFormLabel: '온라인' },
        ],
      },
    }
    seedGeneralRegistrationOverlayFromProgram(program)
    const saved = readGeneralRegistrationOverlayForSave()
    expect(saved['generalRegistration.educationCurriculum.educationFormBySession']).toEqual({
      1: 'offline',
      2: 'online',
    })
  })

  it('일정별 교육 형태는 stale overlay보다 canonical 행 라벨을 우선한다', () => {
    const program = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        educationFormScheduleDetail: 'perSchedule' as const,
        curriculumSessions: [
          { sessionLabel: '1회차', title: '1회차', description: '', educationFormLabel: '오프라인' },
        ],
      },
      registrationOverlay: {
        'generalRegistration.educationCurriculum.educationFormBySession': {
          1: 'hybrid',
        },
      },
    }
    seedGeneralRegistrationOverlayFromProgram(program)
    const saved = readGeneralRegistrationOverlayForSave()
    expect(saved['generalRegistration.educationCurriculum.educationFormBySession']).toEqual({
      1: 'offline',
    })
  })

  it('canonical 커리큘럼이 있으면 stale overlay 테이블 값보다 우선한다', () => {
    const program = {
      ...baseProgram(),
      generalProgramSessionRound: 'single' as const,
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          {
            sessionLabel: '1차시',
            title: '최신 단원명',
            description: '최신 교육 내용',
            educationFormLabel: '오프라인',
          },
        ],
      },
      registrationOverlay: {
        'generalRegistration.educationCurriculum.unitNameBySession': {
          1: '구 단원명',
        },
        'generalRegistration.educationCurriculum.unitContentBySession': {
          1: '구 교육 내용',
        },
        'generalRegistration.educationCurriculum.educationFormBySession': {
          1: 'hybrid',
        },
      },
    }

    seedGeneralRegistrationOverlayFromProgram(program)
    const saved = readGeneralRegistrationOverlayForSave()
    expect(saved['generalRegistration.educationCurriculum.unitNameBySession']).toEqual({
      1: '최신 단원명',
    })
    expect(saved['generalRegistration.educationCurriculum.unitContentBySession']).toEqual({
      1: '최신 교육 내용',
    })
    expect(saved['generalRegistration.educationCurriculum.educationFormBySession']).toEqual({
      1: 'offline',
    })
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

  it('상세 수정 필수검사는 후원사 담당자 미선택·복수 회차 overlay를 통과한다', () => {
    const extras: GeneralRegistrationEditorExtras = {
      programType: 'curriculum',
      sessionRoundType: 'multi',
      educationScheduleMode: 'date',
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'perSchedule',
      ipsScheduleDetail: 'perSchedule',
      curriculumSessionCount: 2,
      curriculumChartSessionCount: 2,
      participantIndividual: true,
      participantOrganization: false,
    }
    const overlay = {
      'generalRegistration.basicInfo.localProgramTitleKo': '개인 커리큘럼 복수 2회치',
      'generalRegistration.basicInfo.programTitleEn': 'Entrepreneurship Startup Experience',
      'generalRegistration.basicInfo.publicProgramTitle': '개인 커리큘럼 복수 2회치',
      'generalRegistration.basicInfo.detailedProgramId': '163007',
      'generalRegistration.basicInfo.operationRangeSeal': {
        start: '2026-10-20',
        end: '2026-12-17',
      },
      'generalRegistration.basicInfo.businessField': 'economy_finance',
      'generalRegistration.basicInfo.educationVenueKind': 'other',
      'generalRegistration.basicInfo.educationVenueDetail': '혼합 수업(교실 + 화상)',
      'generalRegistration.basicInfo.educationCourse': 'traditional_paper',
      'generalRegistration.basicInfo.ipOwned': 'ja',
      'generalRegistration.basicInfo.courseDeliveredBy': 'jointly',
      'generalRegistration.basicInfo.localSponsorId': '163342',
      'generalRegistration.basicInfo.localManagerContactId': SPONSOR_CONTACT_UNSELECTED_VALUE,
      'generalRegistration.kpi.participantCount': 24,
      'generalRegistration.wageInfo.grade1Fee': 100000,
      'generalRegistration.wageInfo.grade2Fee': 80000,
      'generalRegistration.wageInfo.grade3Fee': 60000,
      'generalRegistration.wageInfo.paymentItemValues': ['p-166201'],
      'generalRegistration.typeSettings.multiCommonEducationForm': 'offline',
      'generalRegistration.typeSettings.educationPlaceScheduleDetail': 'common',
      'generalRegistration.typeSettings.educationPlaceAddress': '서울특별시 중구 세종대로 110',
      'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '3', 2: '6' },
      'generalRegistration.educationCurriculum.roundContentByRound': {
        1: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
        2: '용돈 사용 내역을 보고 한 달 저축 목표와 방법을 정합니다.',
      },
      'generalRegistration.educationCurriculum.assignmentByRound': {
        1: { enabled: true, period: '26년 10월 14일(수) 10:00 ~ 12:00' },
        2: { enabled: true, period: '26년 10월 21일(수) 13:30 ~ 16:00' },
      },
      'generalRegistration.educationCurriculum.ipsBySession': {
        1: { category: 'succeed', detail: 'Scholarship (장학 프로그램)' },
        2: { category: 'succeed', detail: 'Award (시상)' },
      },
      'generalRegistration.educationScheduleSettings.scheduleLines': [
        '26년 10월 14일(수) 10:00 ~ 12:00',
      ],
    }
    expect(hasIncompleteGeneralProgramDetailEditRequiredFields(overlay, extras)).toBe(false)
  })
})

describe('mergeRegistrationOverlayNestedSsot', () => {
  const unitKey = 'generalRegistration.educationCurriculum.unitNameBySession'

  it('nested 2행이면 stale overlay 3·4 키를 버린다', () => {
    const program: Program = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '본문1' },
          { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '본문2' },
        ],
      },
    }
    const merged = mergeRegistrationOverlayNestedSsot(program, {
      [unitKey]: { 1: '단원1', 2: '단원2', 3: 'stale3', 4: 'stale4' },
      'recruit.keep': 'yes',
    })
    expect(merged[unitKey]).toEqual({ 1: '단원1', 2: '단원2', 3: null, 4: null })
    expect(merged['recruit.keep']).toBe('yes')
  })

  it('빈 nested 는 unit map 을 {} 로 덮어 삭제 회차를 복원하지 않는다', () => {
    const program: Program = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [],
      },
    }
    const merged = mergeRegistrationOverlayNestedSsot(program, {
      [unitKey]: { 1: '단원1', 2: '단원2', 3: 'stale3' },
    })
    expect(merged[unitKey]).toEqual({ 1: null, 2: null, 3: null })
  })

  it('sparse nested 는 GET overlay 의 장소·담당자·일정·교육형태를 빈값으로 덮지 않는다', () => {
    const program: Program = {
      ...baseProgram(),
      generalCommonInfo: {
        announcementTitle: '수정 공고',
      },
    }
    const merged = mergeRegistrationOverlayNestedSsot(program, {
      'generalRegistration.basicInfo.detailedProgramName': '캠프 A',
      'generalRegistration.basicInfo.educationVenueDetail': '서울시 강남구',
      'generalRegistration.basicInfo.localManagerContactId': 'contact-1',
      'generalRegistration.basicInfo.localManagerContactIds': ['contact-1'],
      'generalRegistration.educationScheduleSettings.scheduleLines': ['기존 일정'],
      'generalRegistration.kpi.participantCount': 20,
      'generalRegistration.typeSettings.educationForm': 'offline',
      'generalRegistration.typeSettings.singleEducationForm': 'offline',
      'generalRegistration.typeSettings.multiCommonEducationForm': 'offline',
    })
    expect(merged['generalRegistration.basicInfo.detailedProgramName']).toBe('캠프 A')
    expect(merged['generalRegistration.basicInfo.educationVenueDetail']).toBe('서울시 강남구')
    expect(merged['generalRegistration.basicInfo.localManagerContactId']).toBe('contact-1')
    expect(merged['generalRegistration.basicInfo.localManagerContactIds']).toEqual(['contact-1'])
    expect(merged['generalRegistration.educationScheduleSettings.scheduleLines']).toEqual(['기존 일정'])
    expect(merged['generalRegistration.kpi.participantCount']).toBe(20)
    expect(merged['generalRegistration.typeSettings.educationForm']).toBe('offline')
    expect(merged['generalRegistration.typeSettings.singleEducationForm']).toBe('offline')
    expect(merged['generalRegistration.typeSettings.multiCommonEducationForm']).toBe('offline')
  })
})

describe('writeGeneralRegistrationOverlayFromCommonInfoFormValues extras', () => {
  it('Independent extras 는 overlay 유령 회차를 일반 회차 수에 넣지 않는다', () => {
    const program: Program = {
      ...baseProgram(),
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionLabel: '사전 교육', title: '사전 교육ㅋㅋㅋ', description: '' },
          {
            sessionLabel: '1차시',
            title: '필요와 욕구, 현명한 소비12121212',
            description: '본문',
          },
        ],
        scheduleCurriculumPreEducation: true,
      },
      registrationOverlay: {
        'generalRegistration.educationCurriculum.unitNameBySession': {
          1: '필요와 욕구, 현명한 소비12121212',
        },
        'generalRegistration.educationCurriculum.unitContentBySession': { 1: '본문' },
      },
    }
    writeGeneralRegistrationOverlayFromCommonInfoFormValues(program)
    const extras = getGeneralRegistrationDetailEditExtras()
    expect(extras.curriculumChartSessionCount).toBe(1)
    expect(extras.scheduleCurriculumPreEducation).toBe(true)
  })
})
