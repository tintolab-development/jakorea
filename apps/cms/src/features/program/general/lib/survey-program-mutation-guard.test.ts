import { describe, expect, it } from 'vitest'
import { mapGeneralProgramToUpdateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { listGeneralProgramSurveyCacheInvalidationQueryKeys } from '@/features/program/general/lib/general-program-survey-cache-invalidation'
import { resolveLectureEvalBindingTargetForCreate } from '@/features/program/shared/lib/survey-management/resolve-lecture-eval-binding-target'
import { programUpdateRequestIncludesSchedulesPayload } from '@/features/program/shared/lib/program-update-schedules-payload-guard'
import type { Program } from '@/types/domain'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '186903',
    title: '기관 일정 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    status: 'active',
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'schedule',
    generalProgramSessionRound: 'single',
    generalCommonInfo: {
      educationScheduleLines: ['26년 11월 2일(일) 9:30 ~ 11:30'],
    },
    ...overrides,
  } as Program
}

describe('survey program mutation guard', () => {
  it('general program PATCH mapper never includes schedules (partial patch)', () => {
    const program = baseProgram()
    const body = mapGeneralProgramToUpdateRequest(program, { title: '제목만 변경' }, program)
    expect(programUpdateRequestIncludesSchedulesPayload(body)).toBe(false)
  })

  it('general program PATCH mapper never includes schedules (full core sync)', () => {
    const body = mapGeneralProgramToUpdateRequest(baseProgram())
    expect(programUpdateRequestIncludesSchedulesPayload(body)).toBe(false)
  })

  it('survey cache invalidation does not touch program detail or schedules queries', () => {
    const programId = '186903'
    const keys = listGeneralProgramSurveyCacheInvalidationQueryKeys(programId)
    expect(keys).toContainEqual(generalProgramQueryKeys.surveys(programId))
    expect(keys).toContainEqual(generalProgramQueryKeys.formBindings(programId))
    expect(keys.some(key => key.includes('schedules'))).toBe(false)
    expect(keys.some(key => key.includes('detail'))).toBe(false)
  })

  it('lecture eval create binding uses PROGRAM scope without schedule mutation contract', async () => {
    await expect(resolveLectureEvalBindingTargetForCreate('186903')).resolves.toEqual({
      targetScope: 'PROGRAM',
      targetScopeId: null,
    })
  })
})
