import { describe, expect, it } from 'vitest'
import {
  clientFilterGeneralPrograms,
  generalProgramListParamsFromFilters,
} from '@/features/program/general/api/general-program-list-filter-params'
import type { Program } from '@/types/domain'

const baseProgram: Program = {
  id: '1',
  sponsorId: 's1',
  title: 'Alpha',
  type: 'offline',
  format: 'workshop',
  category: 'school',
  rounds: [],
  startDate: '2026-04-01',
  endDate: '2026-12-31',
  status: 'pending',
  lifecycleStatus: 'recruiting_students',
  targetLevel: 'elementary',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('general-program-list-filter-params', () => {
  it('maps overview status and title to API query', () => {
    expect(
      generalProgramListParamsFromFilters('scheduled', { title: '테스트' })
    ).toEqual({
      programType: 'GENERAL',
      keyword: '테스트',
      periodStatus: 'RECRUITING',
      page: 0,
      size: 500,
    })
  })

  it('filters programs by target level on the client', () => {
    const programs = [
      baseProgram,
      { ...baseProgram, id: '2', targetLevel: 'middle' as const },
    ]

    expect(
      clientFilterGeneralPrograms(programs, { targetLevel: 'elementary' })
    ).toHaveLength(1)
  })

  it('treats overview lifecycleStatus as progress phase, not exact lifecycle match', () => {
    const programs = [
      baseProgram,
      {
        ...baseProgram,
        id: '2',
        lifecycleStatus: 'education_in_progress' as const,
      },
    ]

    expect(
      clientFilterGeneralPrograms(programs, { lifecycleStatus: 'scheduled' })
    ).toEqual([baseProgram])
    expect(
      clientFilterGeneralPrograms(programs, { lifecycleStatus: 'in_progress' })
    ).toHaveLength(1)
  })
})
