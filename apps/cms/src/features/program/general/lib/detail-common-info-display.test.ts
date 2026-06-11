import { describe, expect, it } from 'vitest'
import {
  resolveGeneralProgramDetailedProgramNameDisplay,
  resolveScheduleTypeDetailedProgramNameFromDetails,
} from './detail-common-info-display'
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
  it('일정형은 stored detailedProgramName 대신 일정명을 노출한다', () => {
    const display = resolveGeneralProgramDetailedProgramNameDisplay(
      baseProgram({
        generalProgramEducationStructure: 'schedule',
        generalProgramSessionRound: 'single',
      }),
      {
        detailedProgramName: '해당없음',
        scheduleDetails: [
          { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
          { scheduleLabel: '세부 일정 02', name: '온라인 워크숍' },
        ],
      }
    )

    expect(display).toBe('오리엔테이션, 온라인 워크숍')
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
