import { describe, expect, it } from 'vitest'
import { resolveEmployeeVolunteerSessionRows } from './employee-volunteer-session-rows'
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

describe('resolveEmployeeVolunteerSessionRows', () => {
  it('단일 회차는 프로그램 진행 1행만 노출한다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramSessionRound: 'single',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleCurriculumPreEducation: true,
          scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '오리엔테이션' }],
        },
      })
    )

    expect(rows).toEqual([
      expect.objectContaining({ id: 'program_progress', label: '프로그램 진행' }),
    ])
  })

  it('복수 커리큘럼형은 사전교육 + 회차 라벨을 노출한다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'curriculum',
        generalCommonInfo: {
          scheduleCurriculumPreEducation: true,
          curriculumSessions: [
            { sessionLabel: '1회차 교육', title: '1차시', description: '' },
            { sessionLabel: '2회차 교육', title: '2차시', description: '' },
          ],
        },
      })
    )

    expect(rows.map(row => row.label)).toEqual(['사전교육', '1회차 교육', '2회차 교육'])
    expect(rows[0]?.countsTowardParticipants).toBe(true)
  })

  it('복수 일정형은 scheduleDetails name을 노출한다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleDetails: [
            { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
            { scheduleLabel: '세부 일정 02', name: '국내대회' },
          ],
        },
      })
    )

    expect(rows.map(row => row.label)).toEqual(['오리엔테이션', '국내대회'])
  })

  it('복수 일정형 사전 교육 블록은 합성 사전교육 행과 중복하지 않는다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleCurriculumPreEducation: true,
          scheduleDetails: [
            { scheduleLabel: '사전 교육', name: '사전 교육' },
            { scheduleLabel: '행사 일정 01', name: '오리엔테이션' },
          ],
        },
      })
    )

    expect(rows.map(row => row.label)).toEqual(['사전교육', '오리엔테이션'])
  })
})
