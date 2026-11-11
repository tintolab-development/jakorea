import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  resolveGeneralProgramScheduleStructure,
  resolveGeneralScheduleUnitLabel,
} from './schedule-unit-label'

function program(input: {
  structure: 'curriculum' | 'schedule'
  round: 'single' | 'multi'
  curriculumLabels?: string[]
  scheduleDetailNames?: string[]
  backendProgramType?: string
}): Program {
  return {
    id: 'p-1',
    ...(input.backendProgramType ? { backendProgramType: input.backendProgramType } : {}),
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: input.structure,
    generalProgramSessionRound: input.round,
    generalCommonInfo: {
      curriculumSessions: (input.curriculumLabels ?? []).map(sessionLabel => ({
        sessionLabel,
        title: '',
        description: '',
      })),
      scheduleDetails: (input.scheduleDetailNames ?? []).map((name, index) => ({
        scheduleLabel: `세부 일정 ${String(index + 1).padStart(2, '0')}`,
        name,
      })),
    },
  } as unknown as Program
}

describe('resolveGeneralScheduleUnitLabel', () => {
  it('일정형은 회차 대신 서버 세부 일정명을 쓴다', () => {
    const p = program({ structure: 'schedule', round: 'multi', scheduleDetailNames: ['오리엔테이션', '워크숍'] })
    expect(resolveGeneralScheduleUnitLabel({ sessionNo: 2, scheduleName: '현장 실습' }, p)).toBe('현장 실습')
  })

  it('일정형 서버 일정명이 자동 기본명이면 공통정보 세부 일정명을 쓴다', () => {
    const p = program({ structure: 'schedule', round: 'multi', scheduleDetailNames: ['오리엔테이션', '워크숍'] })
    expect(resolveGeneralScheduleUnitLabel({ sessionNo: 2, scheduleName: '공통 교육 예정 2' }, p)).toBe(
      '워크숍'
    )
  })

  it('커리큘럼형 단일 회차는 회차 없이 차시 수만', () => {
    const p = program({ structure: 'curriculum', round: 'single', curriculumLabels: ['1차시', '2차시', '3차시'] })
    expect(resolveGeneralScheduleUnitLabel({ sessionNo: 1 }, p)).toBe('3차시')
    expect(resolveGeneralScheduleUnitLabel({ sessionNo: 1, curriculumSessionCount: 2 }, p)).toBe('2차시')
  })

  it('커리큘럼형 복수 회차는 sessionNo 회차, 모르면 지어내지 않는다', () => {
    const p = program({ structure: 'curriculum', round: 'multi', curriculumLabels: ['1회차', '2회차'] })
    expect(resolveGeneralScheduleUnitLabel({ sessionNo: 2 }, p)).toMatch(/^2회차/)
    expect(resolveGeneralScheduleUnitLabel({ sessionNo: null }, p)).toBeNull()
  })

  it('사전교육은 canonical 역할로만 판정한다', () => {
    const p = program({ structure: 'curriculum', round: 'multi', curriculumLabels: ['1회차'] })
    expect(resolveGeneralScheduleUnitLabel({ scheduleRole: 'PRE_EDUCATION' }, p)).toBe('사전교육')
  })

  it('1사1교·프로그램 없음은 undefined(호출부 기존 표기)', () => {
    const companySchool = program({
      structure: 'curriculum',
      round: 'single',
      backendProgramType: 'COMPANY_SCHOOL',
    })
    expect(resolveGeneralProgramScheduleStructure(companySchool)).toBeNull()
    expect(resolveGeneralScheduleUnitLabel({ sessionNo: 1 }, companySchool)).toBeUndefined()
    expect(resolveGeneralScheduleUnitLabel({ sessionNo: 1 }, null)).toBeUndefined()
  })
})
