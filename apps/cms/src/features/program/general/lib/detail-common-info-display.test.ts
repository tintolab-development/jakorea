import { describe, expect, it } from 'vitest'
import {
  formatGeneralParticipantTypesSummary,
  resolveGeneralProgramCommonInfo,
  resolveGeneralProgramDetailedProgramNameDisplay,
  resolveGeneralProgramDisplayTitle,
  resolveScheduleTypeDetailedProgramNameFromDetails,
} from './detail-common-info-display'
import { parseWageGradeAmount } from './wage-display'
import type { Program } from '@/types/domain'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'prog-1',
    title: '테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    ...overrides,
  } as Program
}

describe('resolveGeneralProgramDisplayTitle', () => {
  it('목록·모달 타이틀은 대표 프로그램명(mainTitle)을 쓴다', () => {
    expect(
      resolveGeneralProgramDisplayTitle(
        baseProgram({
          title: '생성 당시명',
          mainTitle: '수정1',
        })
      )
    ).toBe('수정1')
  })
})

describe('resolveScheduleTypeDetailedProgramNameFromDetails', () => {
  it('일정명을 쉼표로 연결한다', () => {
    expect(
      resolveScheduleTypeDetailedProgramNameFromDetails([
        { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
        { scheduleLabel: '세부 일정 02', name: '온라인 워크숍' },
      ])
    ).toBe('오리엔테이션, 온라인 워크숍')
  })

  it('일정명이 없으면 scheduleLabel을 사용한다', () => {
    expect(
      resolveScheduleTypeDetailedProgramNameFromDetails([
        { scheduleLabel: '행사 일정 01', name: '' },
        { scheduleLabel: '행사 일정 02', name: '' },
      ])
    ).toBe('행사 일정 01, 행사 일정 02')
  })
})

describe('resolveGeneralProgramDetailedProgramNameDisplay', () => {
  it('일정형에 일정명이 저장돼 있어도 해당없음이다', () => {
    const display = resolveGeneralProgramDetailedProgramNameDisplay(
      baseProgram({
        generalProgramEducationStructure: 'schedule',
        generalProgramSessionRound: 'multi',
        textbookName: '필요와 욕구, 현명한 소비, 저축 목표 세우기, 직업 세계 탐색',
      }),
      {
        detailedProgramName: '필요와 욕구, 현명한 소비, 저축 목표 세우기, 직업 세계 탐색',
        scheduleDetails: [
          { scheduleLabel: '세부 일정 01', name: '필요와 욕구, 현명한 소비' },
          { scheduleLabel: '세부 일정 02', name: '저축 목표 세우기' },
        ],
      }
    )

    expect(display).toBe('해당없음')
  })

  it('일정형도 세부 프로그램명만 노출하고 일정명·교재명을 쓰지 않는다', () => {
    const display = resolveGeneralProgramDetailedProgramNameDisplay(
      baseProgram({
        generalProgramEducationStructure: 'schedule',
        generalProgramSessionRound: 'single',
        textbookName: '필요와 욕구, 현명한 소비, 저축 목표 세우기, 직업 세계 탐색',
      }),
      {
        detailedProgramName: '해당없음',
        scheduleDetails: [
          { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
          { scheduleLabel: '세부 일정 02', name: '온라인 워크숍' },
        ],
      }
    )

    expect(display).toBe('해당없음')
  })

  it('커리큘럼형은 detailedProgramName을 우선한다', () => {
    const display = resolveGeneralProgramDetailedProgramNameDisplay(
      baseProgram({
        generalProgramEducationStructure: 'curriculum',
      }),
      {
        detailedProgramName: '특별한 JOB담',
      }
    )

    expect(display).toBe('특별한 JOB담')
  })
})

describe('resolveGeneralProgramCommonInfo 임금', () => {
  it('중첩 급수 행이 있으면 overlay 강사비보다 우선한다', () => {
    const common = resolveGeneralProgramCommonInfo(
      baseProgram({
        generalCommonInfo: {
          wageGradeRows: [
            { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 240,000원' },
            { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 120,000원' },
            { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 90,000원' },
          ],
          paymentItems: '강사 교통비, 숙박비',
        },
        registrationOverlay: {
          'generalRegistration.wageInfo.grade1Fee': 100_000,
          'generalRegistration.wageInfo.grade2Fee': 80_000,
          'generalRegistration.wageInfo.grade3Fee': 60_000,
        },
      })
    )
    expect(parseWageGradeAmount(common.wageGradeRows?.[0]?.pricing)).toBe(240_000)
    expect(parseWageGradeAmount(common.wageGradeRows?.[1]?.pricing)).toBe(120_000)
    expect(parseWageGradeAmount(common.wageGradeRows?.[2]?.pricing)).toBe(90_000)
  })
})

describe('resolveGeneralProgramCommonInfo 커리큘럼 복수', () => {
  it('중첩 행이 없으면 overlay 회차 맵으로 1회차를 조회한다', () => {
    const common = resolveGeneralProgramCommonInfo(
      baseProgram({
        generalProgramAudience: 'individual',
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'multi',
        generalCommonInfo: {
          educationFormScheduleDetail: 'common',
          participationScheduleDetail: 'common',
          ipsScheduleDetail: 'perSchedule',
        },
        registrationOverlay: {
          'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '1' },
          'generalRegistration.educationCurriculum.roundContentByRound': {
            1: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
          },
          'generalRegistration.educationCurriculum.assignmentByRound': {
            1: { enabled: true, period: '26년 10월 13일(화) 10:00 ~ 12:00' },
          },
          'generalRegistration.educationCurriculum.ipsBySession': {
            1: { category: 'succeed', detail: 'conference' },
          },
        },
      })
    )
    expect(common.curriculumSessions).toEqual([
      expect.objectContaining({
        sessionLabel: '1회차',
        title: '1차시',
        description: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
        assignmentEnabled: true,
        assignmentPeriod: '26년 10월 13일(화) 10:00 ~ 12:00',
      }),
    ])
    expect(common.curriculumSessions).toHaveLength(1)
  })

  it('명시적 빈 배열은 overlay 세션을 복원하지 않는다', () => {
    const common = resolveGeneralProgramCommonInfo(
      baseProgram({
        generalProgramAudience: 'organization',
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'multi',
        generalCommonInfo: {
          curriculumSessions: [],
        },
        registrationOverlay: {
          'generalRegistration.educationCurriculum.unitNameBySession': {
            1: 'stale1',
            2: 'stale2',
          },
        },
      })
    )
    expect(common.curriculumSessions).toEqual([])
  })

  it('중첩 행이 있으면 overlay 단원 맵이 더 많아도 중첩 행을 조회한다', () => {
    const common = resolveGeneralProgramCommonInfo(
      baseProgram({
        generalProgramAudience: 'individual',
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'multi',
        generalCommonInfo: {
          educationFormScheduleDetail: 'common',
          participationScheduleDetail: 'common',
          ipsScheduleDetail: 'perSchedule',
          curriculumSessions: [
            {
              sessionLabel: '1회차',
              title: '1차시',
              description: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
              ipsTypeSummary: 'Succeed | Competition (대회+시상)',
            },
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
        },
      })
    )
    expect(common.curriculumSessions).toEqual([
      expect.objectContaining({
        sessionLabel: '1회차',
        title: '1차시',
        description: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
      }),
    ])
    expect(common.curriculumSessions).toHaveLength(1)
  })

  it('중첩 행이 없으면 overlay 단원 맵으로 교육 진행을 조회한다', () => {
    const common = resolveGeneralProgramCommonInfo(
      baseProgram({
        generalProgramAudience: 'individual',
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'multi',
        generalCommonInfo: {
          educationFormScheduleDetail: 'common',
          participationScheduleDetail: 'common',
          ipsScheduleDetail: 'perSchedule',
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
          'generalRegistration.educationCurriculum.ipsBySession': {
            1: { category: 'succeed', detail: 'competition' },
            2: { category: 'prepare', detail: 'none' },
          },
        },
      })
    )
    expect(common.curriculumSessions).toEqual([
      expect.objectContaining({
        sessionLabel: '1회차',
        title: '개인 커리큘럼 단일1',
        description: '개인 커리큘럼 단일11',
      }),
      expect.objectContaining({
        sessionLabel: '2회차',
        title: '개인 커리큘럼 단일2',
        description: '개인 커리큘럼 단일22',
      }),
    ])
  })
})

describe('resolveGeneralProgramCommonInfo 교육 형태', () => {
  it('overlay 참여자 선택은 GET 온라인 라벨을 덮는다', () => {
    const common = resolveGeneralProgramCommonInfo(
      baseProgram({
        generalCommonInfo: {
          educationFormScheduleDetail: 'common',
          educationFormLabel: '온라인',
        },
        registrationOverlay: {
          'generalRegistration.typeSettings.singleEducationForm': 'participant_selection',
        },
      })
    )
    expect(common.educationFormLabel).toBe('참여자 선택')
  })

  it('generalCommonInfo 라벨이 없으면 registration overlay 일정 공통 값을 조회 라벨로 쓴다', () => {
    const common = resolveGeneralProgramCommonInfo(
      baseProgram({
        generalCommonInfo: {
          educationFormScheduleDetail: 'common',
        },
        registrationOverlay: {
          'generalRegistration.typeSettings.singleEducationForm': 'offline',
        },
      })
    )
    expect(common.educationFormLabel).toBe('오프라인')
  })
})

describe('formatGeneralParticipantTypesSummary (QA-0419)', () => {
  it('등록 선택지와 같은 라벨(학교/기관·교사/강사)로 보여 준다', () => {
    expect(
      formatGeneralParticipantTypesSummary(
        baseProgram({ generalParticipantTypes: ['school_institution', 'teacher_instructor'] })
      )
    ).toBe('학교/기관, 교사/강사')
  })
})
