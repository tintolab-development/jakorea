import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resetProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { applyGeneralRegistrationOverlayToProgram } from './registration-overlay-to-program'
import {
  buildGeneralRegistrationOverlayFromProgram,
  extrasFromGeneralProgram,
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

  it('일정별 교육 형태 overlay가 있으면 행 라벨로 덮지 않는다', () => {
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
      1: 'hybrid',
    })
  })
})
