import { describe, expect, it } from 'vitest'
import {
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
  it('wageGradeRows가 1원이어도 overlay 강사비를 조회에 쓴다', () => {
    const common = resolveGeneralProgramCommonInfo(
      baseProgram({
        generalCommonInfo: {
          wageGradeRows: [
            { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 1원' },
            { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 1원' },
            { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 1원' },
          ],
          paymentItems: '학생 교통비, 강사 교통비',
        },
        registrationOverlay: {
          'generalRegistration.wageInfo.grade1Fee': 100_000,
          'generalRegistration.wageInfo.grade2Fee': 80_000,
          'generalRegistration.wageInfo.grade3Fee': 60_000,
        },
      })
    )
    expect(parseWageGradeAmount(common.wageGradeRows?.[0]?.pricing)).toBe(100_000)
    expect(parseWageGradeAmount(common.wageGradeRows?.[1]?.pricing)).toBe(80_000)
    expect(parseWageGradeAmount(common.wageGradeRows?.[2]?.pricing)).toBe(60_000)
  })
})

describe('resolveGeneralProgramCommonInfo 교육 형태', () => {
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
