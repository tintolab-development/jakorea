import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  getUjatProgramRegistrationOverlayRecord,
  patchUjatProgramRegistrationOverlay,
  resetUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  applyUjatRegistrationOverlayToProgram,
  resolveUjatRegistrationBasicInfoDisplay,
  resolveUjatSurveyMenuItems,
} from './ujat-registration-basic-info-display'
import { resolveUjatBusinessKpiDisplay } from './ujat-business-kpi-display'
import {
  UJAT_BASIC_INFO_REP_KO_DEFAULT,
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
} from './ujat-registration-basic-info-defaults'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  buildUjatRegistrationBasicInfoOverlayFromProgram,
  reconcileUjatRegistrationOverlayFromApi,
  buildUjatProgramDraftWithSessionOverlay,
  resyncUjatPersistOverlayFromProgram,
  resyncUjatRegistrationOverlayFromProgram,
  seedUjatRegistrationBasicInfoOverlayFromProgram,
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
    expect(display.participantTypes).toBe('-')
  })

  it('빈 GET 공통정보는 FE 기본값 대신 - 이다', () => {
    const display = resolveUjatRegistrationBasicInfoDisplay({
      ...baseProgram(),
      title: '',
      mainTitle: '',
      titleEn: '',
      ujatRegistrationOverlay: {},
    })
    expect(display.repKo).toBe('-')
    expect(display.repEn).toBe('-')
    expect(display.programManagementName).toBe('-')
    expect(display.businessField).toBe('-')
    expect(display.ipOwned).toBe('-')
    expect(display.participantTypes).toBe('-')
  })

  it('신규 등록 빈 폼은 대표명 기본값을 유지한다', () => {
    const next = applyUjatRegistrationOverlayToProgram(baseProgram(), {})
    expect(next.mainTitle).toBe(UJAT_BASIC_INFO_REP_KO_DEFAULT)
  })

  it('overlay 참여자 플래그가 없어도 상세에 학교/기관, 봉사자가 보인다', () => {
    const display = resolveUjatRegistrationBasicInfoDisplay({
      ...baseProgram(),
      programRecruitments: [
        { recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION' },
        { recruitmentType: 'VOLUNTEER', targetType: 'COLLEGE_STUDENT' },
      ],
    })
    expect(display.participantTypes).toBe('학교/기관, 봉사자')
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

  it('educationProcess가 비어 있으면 curriculum 원문을 조회용으로 표시한다', () => {
    const display = resolveUjatRegistrationBasicInfoDisplay({
      ...baseProgram(),
      educationProcess: undefined,
      curriculum: 'UJAT-04 / EDUCATION_IN_PROGRESS',
      ujatRegistrationOverlay: {
        'ujat.basicInfo.educationCourse': '',
      },
    })
    expect(display.educationCourse).toBe('UJAT-04 / EDUCATION_IN_PROGRESS')
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

  it('후원사 담당자 미선택이면 generalCommonInfo에 sentinel을 넣지 않는다', () => {
    const next = applyUjatRegistrationOverlayToProgram(baseProgram(), {
      'ujat.basicInfo.sponsorContactIds': [SPONSOR_CONTACT_UNSELECTED_VALUE],
      'ujat.basicInfo.sponsorContactId': SPONSOR_CONTACT_UNSELECTED_VALUE,
      'ujat.basicInfo.sponsorManagerName': '미선택',
    })
    expect(next.generalCommonInfo?.sponsorManagerContactIds).toBeUndefined()
    expect(next.generalCommonInfo?.sponsorManagerContactId).toBeUndefined()
    expect(next.generalCommonInfo?.sponsorManagerLine).toBe('미선택')
  })

  it('overlay 참여 유형 체크가 GET types보다 저장 패치에 우선한다', () => {
    const next = applyUjatRegistrationOverlayToProgram(
      {
        ...baseProgram(),
        generalParticipantTypes: ['school_institution', 'volunteer'],
      },
      {
        'ujat.basicInfo.participant.organization': true,
        'ujat.basicInfo.participant.volunteer': false,
      }
    )
    expect(next.generalParticipantTypes).toEqual(['school_institution'])
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
    expect(next.generalSurveyMenuKeys).toEqual([
      'survey',
      'school_satisfaction',
      'lecture_evaluation',
    ])
  })

  it('저장된 overlay가 담당자 전체 기본값이어도 수정 시드에 미선택을 넣는다', () => {
    resetUjatProgramRegistrationOverlay()
    seedUjatRegistrationBasicInfoOverlayFromProgram({
      ...baseProgram(),
      sponsorId: '1627251',
      managerName: '미선택',
      generalCommonInfo: {
        sponsorManagementIds: ['1627251'],
        sponsorManagerContactIds: [],
        sponsorManagerLine: '미선택',
      },
      ujatRegistrationOverlay: {
        'ujat.basicInfo.sponsorId': '1627251',
        'ujat.basicInfo.sponsorContactId': UJAT_SPONSOR_ALL_VALUE,
        'ujat.basicInfo.sponsorContactIds': [],
      },
    })
    const overlay = getUjatProgramRegistrationOverlayRecord()
    expect(overlay['ujat.basicInfo.sponsorContactIds']).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    expect(overlay['ujat.basicInfo.sponsorContactId']).toBe(SPONSOR_CONTACT_UNSELECTED_VALUE)
  })

  it('시드 leftover overlay가 참여자 유형·KPI 강사보다 이기지 않는다', () => {
    resetUjatProgramRegistrationOverlay()
    seedUjatRegistrationBasicInfoOverlayFromProgram({
      ...baseProgram(),
      generalParticipantTypes: ['school_institution', 'volunteer'],
      generalCommonInfo: {
        kpi: {
          finalParticipants: 10,
          instructorCount: 7,
          volunteerCount: 3,
          finalSchools: 2,
          finalClasses: 4,
        },
      },
      ujatRegistrationOverlay: {
        'ujat.basicInfo.participant.individual': true,
        'ujat.basicInfo.participant.organization': false,
        'ujat.kpi.instructor': 99,
      },
    })
    const overlay = getUjatProgramRegistrationOverlayRecord()
    expect(overlay['ujat.basicInfo.participant.individual']).toBe(false)
    expect(overlay['ujat.basicInfo.participant.organization']).toBe(true)
    expect(overlay['ujat.basicInfo.participant.volunteer']).toBe(true)
    expect(overlay['ujat.kpi.instructor']).toBe(7)
  })

  it('기관 모집 leftover 기간이 중첩 기간보다 이기지 않는다', () => {
    const program: Program = {
      ...baseProgram(),
      applicationStartDate: '2026-03-01T00:00:00.000Z',
      applicationEndDate: '2026-03-31T00:00:00.000Z',
      targetLevels: ['elementary'],
    }
    const overlay = resyncUjatPersistOverlayFromProgram(
      program,
      {
        'ujat.recruit.institution.recruitRange': {
          start: '2025-01-01T00:00:00.000Z',
          end: '2025-01-31T00:00:00.000Z',
        },
        'ujat.recruit.institution.targetLevels': ['high', 'university'],
      },
      { includeRecruit: true }
    )
    expect(overlay['ujat.recruit.institution.recruitRange']).toEqual({
      start: '2026-03-01T00:00:00.000Z',
      end: '2026-03-31T00:00:00.000Z',
    })
    expect(overlay['ujat.recruit.institution.targetLevels']).toEqual(['elementary'])
  })
})

describe('UJAT 설문 4종 — 등록 체크와 상세', () => {
  beforeEach(() => {
    resetUjatProgramRegistrationOverlay()
  })

  it('합쳐진 satisfaction 키가 와도 overlay의 학교만 체크를 유지한다', () => {
    const overlay = {
      'ujat.basicInfo.surveyItems': {
        survey: true,
        volunteer_satisfaction: false,
        school_satisfaction: true,
        lecture_evaluation: false,
      },
    }
    const next = reconcileUjatRegistrationOverlayFromApi(
      { generalSurveyMenuKeys: ['survey', 'satisfaction'] },
      overlay
    )
    expect(next['ujat.basicInfo.surveyItems']).toEqual(overlay['ujat.basicInfo.surveyItems'])
  })

  it('상세 LNB는 세션이 아니라 프로그램 overlay 4종을 따른다', () => {
    resetUjatProgramRegistrationOverlay()
    const program: Program = {
      ...baseProgram(),
      generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
      ujatRegistrationOverlay: {
        'ujat.basicInfo.surveyItems': {
          survey: false,
          volunteer_satisfaction: true,
          school_satisfaction: false,
          lecture_evaluation: false,
        },
      },
    }
    expect(resolveUjatSurveyMenuItems(program).map(item => item.label)).toEqual([
      '봉사단 만족도조사',
    ])
    expect(resolveUjatRegistrationBasicInfoDisplay(program).surveyItems).toBe('봉사단 만족도조사')
  })

  it('수정 시드는 합쳐진 키로 봉사단·학교를 둘 다 켜지 않는다', () => {
    const program: Program = {
      ...baseProgram(),
      generalSurveyMenuKeys: ['satisfaction'],
      ujatRegistrationOverlay: {
        'ujat.basicInfo.surveyItems': {
          survey: false,
          volunteer_satisfaction: false,
          school_satisfaction: true,
          lecture_evaluation: false,
        },
      },
    }
    seedUjatRegistrationBasicInfoOverlayFromProgram(program)
    expect(getUjatProgramRegistrationOverlayRecord()['ujat.basicInfo.surveyItems']).toEqual({
      survey: false,
      volunteer_satisfaction: false,
      school_satisfaction: true,
      lecture_evaluation: false,
    })
  })

  it('저장 후 LNB는 overlay 4종 체크만 2depth로 남긴다', () => {
    const next = applyUjatRegistrationOverlayToProgram(baseProgram(), {
      'ujat.basicInfo.surveyItems': {
        survey: false,
        volunteer_satisfaction: true,
        school_satisfaction: true,
        lecture_evaluation: false,
      },
    })
    expect(next.generalSurveyMenuKeys).toEqual(['volunteer_satisfaction', 'school_satisfaction'])
    expect(resolveUjatSurveyMenuItems(next).map(item => item.label)).toEqual([
      '봉사단 만족도조사',
      '학교 만족도조사',
    ])
  })

  it('설문 0개면 LNB 항목이 비고, 1개여도 2depth 키는 유지한다', () => {
    const none = applyUjatRegistrationOverlayToProgram(baseProgram(), {
      'ujat.basicInfo.surveyItems': {
        survey: false,
        volunteer_satisfaction: false,
        school_satisfaction: false,
        lecture_evaluation: false,
      },
    })
    expect(none.generalSurveyMenuKeys).toEqual([])
    expect(resolveUjatSurveyMenuItems(none)).toEqual([])
    const one = applyUjatRegistrationOverlayToProgram(baseProgram(), {
      'ujat.basicInfo.surveyItems': {
        survey: true,
        volunteer_satisfaction: false,
        school_satisfaction: false,
        lecture_evaluation: false,
      },
    })
    expect(resolveUjatSurveyMenuItems(one)).toEqual([{ key: 'survey-poll', label: '설문조사' }])
  })
})

describe('UJAT 공통 저장 overlay/KPI roundtrip', () => {
  beforeEach(() => {
    resetUjatProgramRegistrationOverlay()
  })

  it('세션 extra 기본정보가 program-derived를 덮지 않고 저장 overlay에 남는다', () => {
    const overlay = resyncUjatRegistrationOverlayFromProgram(
      {
        ...baseProgram(),
        mainTitle: '서버 대표명',
        title: '서버 관리명',
      },
      {
        'ujat.basicInfo.repKo': '수정 대표명',
        'ujat.basicInfo.programManagementName': '수정 관리명',
      }
    )
    expect(overlay['ujat.basicInfo.repKo']).toBe('수정 대표명')
    expect(overlay['ujat.basicInfo.programManagementName']).toBe('수정 관리명')
  })

  it('GET KPI가 비면 stale overlay 숫자를 지우고 빈 KPI로 표시한다', () => {
    const overlay = reconcileUjatRegistrationOverlayFromApi(
      {
        kpi: { finalParticipants: null, volunteerCount: null } as unknown as NonNullable<
          Program['generalCommonInfo']
        >['kpi'],
      },
      { 'ujat.kpi.participantCount': 12, 'ujat.kpi.volunteer': 4 }
    )
    expect(overlay['ujat.kpi.participantCount']).toBe(null)
    expect(overlay['ujat.kpi.volunteer']).toBe(null)
    const display = resolveUjatBusinessKpiDisplay({
      ...baseProgram(),
      generalCommonInfo: {
        kpi: {
          finalParticipants: undefined,
          volunteerCount: undefined,
          finalSchools: undefined,
          finalClasses: undefined,
        } as unknown as NonNullable<Program['generalCommonInfo']>['kpi'],
      },
      ujatRegistrationOverlay: overlay,
    })
    expect(display.finalParticipants).toBe(null)
    expect(display.volunteerCount).toBe(null)
  })

  it('세션 overlay 설문 4종이 draft PATCH keys에 남는다', () => {
    patchUjatProgramRegistrationOverlay({
      'ujat.basicInfo.surveyItems': {
        survey: true,
        volunteer_satisfaction: false,
        school_satisfaction: true,
        lecture_evaluation: false,
      },
    })
    const draft = buildUjatProgramDraftWithSessionOverlay({
      ...baseProgram(),
      backendProgramType: 'UJAT',
      generalSurveyMenuKeys: ['satisfaction'],
    })
    expect(draft.generalSurveyMenuKeys).toEqual(['survey', 'school_satisfaction'])
    expect(resolveUjatSurveyMenuItems(draft).map(item => item.key)).toEqual([
      'survey-poll',
      'survey-school-satisfaction',
    ])
  })
})
