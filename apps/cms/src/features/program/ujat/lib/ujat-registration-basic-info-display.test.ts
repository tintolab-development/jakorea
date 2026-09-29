import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resetUjatProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  applyUjatRegistrationOverlayToProgram,
  resolveUjatRegistrationBasicInfoDisplay,
} from './ujat-registration-basic-info-display'
import {
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
} from './ujat-registration-basic-info-defaults'
import {
  buildUjatRegistrationBasicInfoOverlayFromProgram,
  reconcileUjatRegistrationOverlayFromApi,
} from './ujat-registration-basic-info-overlay-sync'

function baseProgram(): Program {
  return {
    id: 'ujat-1',
    sponsorId: 'sponsor-1',
    title: 'UJAT',
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [],
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('resolveUjatRegistrationBasicInfoDisplay — 상세 overlay (세션 기본값 아님)', () => {
  beforeEach(() => {
    resetUjatProgramRegistrationOverlay()
  })

  it('세션 overlay가 비어도 프로그램에 붙은 등록 overlay를 화면에 쓴다', () => {
    const display = resolveUjatRegistrationBasicInfoDisplay(
      {
        ...baseProgram(),
        ujatRegistrationOverlay: {
          'ujat.basicInfo.repKo': '기업가정신 스타트업 체험',
          'ujat.basicInfo.repEn': 'Entrepreneurship Startup Experience',
          'ujat.basicInfo.programManagementName': '기업가정신 스타트업 체험 운영',
          'ujat.basicInfo.publicProgramTitle': '고등학생 기업가정신 캠프 참가자 모집',
          'ujat.basicInfo.businessField': 'economy_finance',
        },
      },
      '후원사'
    )
    expect(display.repKo).toBe('기업가정신 스타트업 체험')
    expect(display.repEn).toBe('Entrepreneurship Startup Experience')
    expect(display.programManagementName).toBe('기업가정신 스타트업 체험 운영')
    expect(display.publicProgramTitle).toBe('고등학생 기업가정신 캠프 참가자 모집')
    expect(display.businessField).toBe('경제금융')
  })

  it('announcementTitle이 대표명이면 공고용으로 쓰지 않는다', () => {
    const display = resolveUjatRegistrationBasicInfoDisplay({
      ...baseProgram(),
      mainTitle: '청소년 경제금융 탐험',
      title: '청소년 경제금융 탐험 운영',
      generalCommonInfo: {
        announcementTitle: '청소년 경제금융 탐험',
      },
    })
    expect(display.publicProgramTitle).toBe('-')
  })
  it('일정형이면 overlay에 남은 봉사단 세부명을 무시하고 해당없음으로 표시한다', () => {
    const display = resolveUjatRegistrationBasicInfoDisplay({
      ...baseProgram(),
      generalProgramEducationStructure: 'schedule',
      detailedProgramId: undefined,
      generalCommonInfo: { detailedProgramName: '해당없음' },
      ujatRegistrationOverlay: {
        'ujat.basicInfo.detailedProgramId': UJAT_DETAILED_PROGRAM_UJAT_VALUE,
        'ujat.basicInfo.detailedProgramName': UJAT_DETAILED_PROGRAM_UJAT_LABEL,
      },
    })
    expect(display.detailedProgramName).toBe('해당없음')
  })
})

describe('UJAT 상세 공통정보 overlay 시드', () => {
  it('API에 없는 일정·정원 목업 기본값을 수정 overlay에 주입하지 않는다', () => {
    const overlay = buildUjatRegistrationBasicInfoOverlayFromProgram(baseProgram())
    expect(overlay['ujat.h1.event.name']).toBeUndefined()
    expect(overlay['ujat.h1.eduSchedule.unavailableDates']).toBeUndefined()
    expect(overlay['ujat.capacity.byRegion']).toBeUndefined()
  })

  it('GET canonical KPI가 stale overlay 숫자를 교정한다', () => {
    const overlay = reconcileUjatRegistrationOverlayFromApi(
      {
        kpi: {
          finalParticipants: 20,
          instructorCount: 0,
          volunteerCount: 8,
          finalSchools: 4,
          finalClasses: 6,
        },
      },
      {
        'ujat.kpi.participantCount': 1,
        'ujat.kpi.volunteer': 1,
      }
    )
    expect(overlay['ujat.kpi.participantCount']).toBe(20)
    expect(overlay['ujat.kpi.volunteer']).toBe(8)
    expect(overlay['ujat.kpi.dispatchedClass']).toBe(6)
  })
})

describe('applyUjatRegistrationOverlayToProgram — detailedProgramId·detailedProgramName (id·name 둘 다 삽입, 버그 수정 확인)', () => {
  it('overlay가 비어 있으면 UJAT 고정값(id·name)이 그대로 Program에 반영된다', () => {
    const next = applyUjatRegistrationOverlayToProgram(baseProgram(), {})
    expect(next.detailedProgramId).toBe(UJAT_DETAILED_PROGRAM_UJAT_VALUE)
    expect(next.teamDivision).toBe(UJAT_DETAILED_PROGRAM_UJAT_LABEL)
    expect(next.generalCommonInfo?.detailedProgramName).toBe(UJAT_DETAILED_PROGRAM_UJAT_LABEL)
  })

  it('사업 분야 폼 코드를 BE 마스터명으로 정규화한다', () => {
    const next = applyUjatRegistrationOverlayToProgram(baseProgram(), {
      'ujat.basicInfo.businessField': 'economy_finance',
    })
    expect(next.businessArea).toBe('경제금융')
  })

  it('overlay에 명시적으로 저장된 id·name이 있으면 그 값을 그대로 반영한다', () => {
    const next = applyUjatRegistrationOverlayToProgram(baseProgram(), {
      'ujat.basicInfo.detailedProgramId': 'dp-1',
      'ujat.basicInfo.detailedProgramName': '실제 선택한 세부 프로그램명',
    })
    expect(next.detailedProgramId).toBe('dp-1')
    expect(next.generalCommonInfo?.detailedProgramName).toBe('실제 선택한 세부 프로그램명')
  })

  it('일정형 해당없음이면 teamDivision을 비운다', () => {
    const next = applyUjatRegistrationOverlayToProgram(
      { ...baseProgram(), teamDivision: '대학생경제교육봉사단' },
      {
        'ujat.basicInfo.detailedProgramId': '__detailed_program_none__',
        'ujat.basicInfo.detailedProgramName': '해당없음',
      }
    )
    expect(next.teamDivision).toBeUndefined()
  })

  it('후원사 담당자·설문 overlay를 generalCommonInfo·generalSurveyMenuKeys에 반영한다', () => {
    const next = applyUjatRegistrationOverlayToProgram(baseProgram(), {
      'ujat.basicInfo.sponsorContactIds': ['contact-9'],
      'ujat.basicInfo.sponsorContactId': 'contact-9',
      'ujat.basicInfo.sponsorManagerName': '담당자A',
      'ujat.basicInfo.surveyItems': {
        survey: true,
        volunteer_satisfaction: false,
        school_satisfaction: true,
        lecture_evaluation: true,
      },
    })
    expect(next.generalCommonInfo?.sponsorManagerContactIds).toEqual(['contact-9'])
    expect(next.generalCommonInfo?.sponsorManagerLine).toBe('담당자A')
    expect(next.generalSurveyMenuKeys).toEqual(['survey', 'satisfaction', 'lecture_evaluation'])
  })
})
