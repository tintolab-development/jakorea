import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import {
  buildParticipatingSchoolSessionKey,
  formatParticipatingInstitutionActivityWithdrawScheduleOptionLabel,
  getParticipatingInstitutionActivityWithdrawScheduleOptions,
  resolveParticipatingInstitutionActivityWithdrawPatch,
} from './participating-institution-activity-withdraw'
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

describe('participating-institution-activity-withdraw', () => {
  it('단일 회차 라벨은 날짜·시간·차시로 표시한다', () => {
    const label = formatParticipatingInstitutionActivityWithdrawScheduleOptionLabel(
      baseProgram({
        generalProgramSessionRound: 'single',
        generalCommonInfo: {
          curriculumSessions: [{ sessionLabel: '1차시', title: '1차시', description: '' }],
        },
      }),
      baseSession()
    )

    expect(label).toBe('2026. 01. 09(금) 09:20 ~ 11:20 | 1차시')
  })

  it('복수 커리큘럼형 옵션은 회차명을 포함한다', () => {
    const options = getParticipatingInstitutionActivityWithdrawScheduleOptions(
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
      [baseSession({ round: 1 }), baseSession({ round: 2, date: '2026.01.16' })]
    )

    expect(options).toHaveLength(2)
    expect(options[0]?.label).toContain('1회차')
    expect(options[1]?.label).toContain('2회차')
  })

  it('활동 포기 patch를 생성한다', () => {
    const sessions = [baseSession()]
    const key = buildParticipatingSchoolSessionKey(sessions[0]!, 0)
    const patch = resolveParticipatingInstitutionActivityWithdrawPatch(
      baseProgram({
        generalProgramSessionRound: 'single',
        generalCommonInfo: {
          curriculumSessions: [{ sessionLabel: '1차시', title: '1차시', description: '' }],
        },
      }),
      sessions,
      key
    )

    expect(patch).toEqual({
      activityWithdrawn: true,
      activityWithdrawStopSessionKey: key,
      activityWithdrawStopScheduleLabel: '2026. 01. 09(금) 09:20 ~ 11:20 | 1차시',
    })
  })
})
