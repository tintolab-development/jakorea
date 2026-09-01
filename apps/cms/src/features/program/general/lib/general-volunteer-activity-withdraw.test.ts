import { describe, expect, it } from 'vitest'
import { getGeneralVolunteerActivityWithdrawScheduleOptions } from './general-volunteer-activity-withdraw'
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

describe('getGeneralVolunteerActivityWithdrawScheduleOptions', () => {
  it('단일 회차 프로그램은 프로그램 진행 1건을 노출한다', () => {
    const options = getGeneralVolunteerActivityWithdrawScheduleOptions(
      baseProgram({
        generalProgramSessionRound: 'single',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '오리엔테이션' }],
        },
      })
    )

    expect(options).toEqual([{ value: 'program_progress', label: '프로그램 진행' }])
  })

  it('복수 일정형은 일정명을 노출한다', () => {
    const options = getGeneralVolunteerActivityWithdrawScheduleOptions(
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

    expect(options.map(option => option.label)).toEqual(['오리엔테이션', '국내대회'])
  })
})
