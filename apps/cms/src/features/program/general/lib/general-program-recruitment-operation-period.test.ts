import { describe, expect, it } from 'vitest'
import { detailEditValuesToProgramPatch } from '@/features/program/shared/model/program-detail-edit-schema'
import type { Program } from '@/types/domain'
import { resolveAudienceProgramOperationIsoRange } from './general-program-recruitment-operation-period'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '1',
    sponsorId: 's1',
    title: 'T',
    type: 'offline',
    format: 'offline',
    category: 'school',
    rounds: [],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    generalCommonInfo: {
      participantRecruitmentInfo: { operationPeriodLabel: '2026. 03. 01 ~ 2026. 03. 31' },
      instructorRecruitmentInfo: { operationPeriodLabel: '2026. 04. 01 ~ 2026. 04. 30' },
      volunteerRecruitmentInfo: { operationPeriodLabel: '2026. 05. 01 ~ 2026. 05. 31' },
    },
    ...overrides,
  } as Program
}

describe('general-program-recruitment-operation-period', () => {
  it('reads audience operation from nested label without business dates', () => {
    const program = baseProgram()
    const instructor = resolveAudienceProgramOperationIsoRange(program, 'instructor')
    expect(instructor.start).toBeTruthy()
    expect(instructor.end).toBeTruthy()
  })

  it('instructor recruitment save does not patch business startDate/endDate', () => {
    const existing = baseProgram()
    const patch = detailEditValuesToProgramPatch(
      {
        title: existing.title,
        category: 'school',
        type: 'offline',
        applicationStartDate: '2026-02-01',
        applicationEndDate: '2026-02-28',
        description: 'd',
        learningSupportContent: 'l',
        sponsorId: 's1',
        managerName: 'm',
        instructorProgramOperationStartDate: '2026-06-01T00:00:00.000Z',
        instructorProgramOperationEndDate: '2026-06-30T00:00:00.000Z',
      } as import('@/features/program/shared/model/program-detail-edit-schema').ProgramDetailEditFormValues,
      existing,
      { recruitmentAudience: 'instructor' }
    )
    expect(patch.startDate).toBe('2026-01-01')
    expect(patch.endDate).toBe('2026-12-31')
    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.operationPeriodLabel).toContain('2026')
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.operationPeriodLabel).toBe(
      '2026. 03. 01 ~ 2026. 03. 31'
    )
  })
})
