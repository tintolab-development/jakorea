import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  buildParticipatingSchoolSessionKey,
  formatParticipatingInstitutionActivityWithdrawScheduleOptionLabel,
  getParticipatingInstitutionActivityWithdrawScheduleOptions,
  resolveParticipatingInstitutionActivityWithdrawPatch,
  resolveParticipatingInstitutionActivityWithdrawStopScheduleId,
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
  it('단일 회차 라벨은 날짜·시간·차시 수로 표시한다(회차·교시를 쓰지 않음)', () => {
    const label = formatParticipatingInstitutionActivityWithdrawScheduleOptionLabel(
      baseProgram({
        generalProgramSessionRound: 'single',
        generalCommonInfo: {
          curriculumSessions: [{ sessionLabel: '1차시', title: '1차시', description: '' }],
        },
      }),
      baseSession()
    )

    expect(label).toBe('2026.01.09(금) 09:20 ~ 11:20 | 1차시')
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

  it('일정형은 세부 일정명만 쓰고 회차·교시를 붙이지 않는다', () => {
    const label = formatParticipatingInstitutionActivityWithdrawScheduleOptionLabel(
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '워크숍' }],
        },
      }),
      baseSession({ sessionNo: 1, scheduleName: '워크숍', classNum: '3교시' })
    )

    expect(label).toBe('워크숍 | 2026.01.09(금) 09:20 ~ 11:20')
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
      activityWithdrawStopScheduleLabel: '2026.01.09(금) 09:20 ~ 11:20 | 1차시',
    })
  })

  it('선택된 회차 resolvedScheduleId를 활동 포기 stopScheduleId로 반환한다', () => {
    const sessions = [baseSession({ resolvedScheduleId: 801 }), baseSession({ resolvedScheduleId: 802 })]
    expect(
      resolveParticipatingInstitutionActivityWithdrawStopScheduleId(
        sessions,
        buildParticipatingSchoolSessionKey(sessions[1]!, 1)
      )
    ).toBe(802)
    expect(
      resolveParticipatingInstitutionActivityWithdrawStopScheduleId(
        [baseSession()],
        buildParticipatingSchoolSessionKey(baseSession(), 0)
      )
    ).toBeUndefined()
  })
})
