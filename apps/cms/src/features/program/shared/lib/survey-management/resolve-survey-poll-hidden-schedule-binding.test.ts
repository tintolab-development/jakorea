import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'

const fetchAdminProgramSchedulesRemote = vi.fn()
const buildSurveyPollScheduleSelectOptionsForProgram = vi.fn()

vi.mock('@/features/program/general/api/program-schedules-api-client', () => ({
  fetchAdminProgramSchedulesRemote: (...args: unknown[]) => fetchAdminProgramSchedulesRemote(...args),
}))

vi.mock('@/features/program/shared/lib/survey-management/survey-poll-schedule-options', () => ({
  buildSurveyPollScheduleSelectOptionsForProgram: (...args: unknown[]) =>
    buildSurveyPollScheduleSelectOptionsForProgram(...args),
}))

import { resolveSurveyPollBindingTargetWhenScheduleFieldHidden } from './resolve-survey-poll-hidden-schedule-binding'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '186234',
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

describe('resolveSurveyPollBindingTargetWhenScheduleFieldHidden', () => {
  beforeEach(() => {
    fetchAdminProgramSchedulesRemote.mockReset()
    buildSurveyPollScheduleSelectOptionsForProgram.mockReset()
    fetchAdminProgramSchedulesRemote.mockResolvedValue([])
  })

  it('기간형 프로그램은 PROGRAM 바인딩', async () => {
    const program = baseProgram({
      generalCommonInfo: { educationScheduleMode: 'period' },
    })
    await expect(resolveSurveyPollBindingTargetWhenScheduleFieldHidden(program)).resolves.toEqual({
      targetScope: 'PROGRAM',
    })
  })

  it('옵션이 정확히 1개일 때만 SCHEDULE 바인딩', async () => {
    buildSurveyPollScheduleSelectOptionsForProgram.mockReturnValue([{ value: '100', label: '일정' }])
    await expect(resolveSurveyPollBindingTargetWhenScheduleFieldHidden(baseProgram())).resolves.toEqual({
      targetScope: 'SCHEDULE',
      targetScopeId: 100,
    })
  })

  it('옵션이 0개 또는 2개 이상이면 null', async () => {
    buildSurveyPollScheduleSelectOptionsForProgram.mockReturnValue([])
    await expect(resolveSurveyPollBindingTargetWhenScheduleFieldHidden(baseProgram())).resolves.toBeNull()

    buildSurveyPollScheduleSelectOptionsForProgram.mockReturnValue([
      { value: '1', label: 'a' },
      { value: '2', label: 'b' },
    ])
    await expect(resolveSurveyPollBindingTargetWhenScheduleFieldHidden(baseProgram())).resolves.toBeNull()
  })
})
