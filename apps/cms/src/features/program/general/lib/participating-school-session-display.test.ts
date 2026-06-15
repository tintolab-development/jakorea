import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import { resolveParticipatingInstitutionScheduleRowLabel } from './participating-school-session-display'
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

function baseSession(overrides: Partial<ParticipatingSchoolSession> = {}): ParticipatingSchoolSession {
  return {
    round: 1,
    date: '2026.01.09',
    dayOfWeek: '금',
    duration: '2시간',
    format: '오프라인',
    classNum: '1교시',
    timeRange: '09:20~11:20',
    ...overrides,
  }
}

describe('resolveParticipatingInstitutionScheduleRowLabel', () => {
  it('단일 회차는 교육 일정을 노출한다', () => {
    const label = resolveParticipatingInstitutionScheduleRowLabel(
      baseProgram({
        generalProgramSessionRound: 'single',
        generalProgramEducationStructure: 'curriculum',
        generalCommonInfo: {
          curriculumSessions: [{ sessionLabel: '1차시', title: '1차시', description: '' }],
        },
      }),
      baseSession()
    )

    expect(label).toBe('교육 일정')
  })

  it('복수 커리큘럼형은 회차명(sessionLabel)을 노출한다', () => {
    const label = resolveParticipatingInstitutionScheduleRowLabel(
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'curriculum',
        generalCommonInfo: {
          curriculumSessions: [
            { sessionLabel: '1회차', title: '1차시', description: '' },
            { sessionLabel: '2회차', title: '2차시', description: '' },
          ],
        },
      }),
      baseSession({ round: 2 })
    )

    expect(label).toBe('2회차')
  })

  it('복수 일정형은 일정명(name)을 노출한다', () => {
    const label = resolveParticipatingInstitutionScheduleRowLabel(
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleDetails: [
            { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
            { scheduleLabel: '세부 일정 02', name: '국내대회' },
          ],
        },
      }),
      baseSession({ round: 1 })
    )

    expect(label).toBe('오리엔테이션')
  })
})
