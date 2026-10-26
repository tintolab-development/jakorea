import { describe, expect, it } from 'vitest'
import {
  clientFilterGeneralPrograms,
  generalProgramListParamsFromFilters,
} from '@/features/program/general/api/general-program-list-filter-params'
import type { Program, TargetLevel } from '@/types/domain'

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
      size: 20,
    })
  })

  it('forwards server-supported overview filters to the API query', () => {
    expect(
      generalProgramListParamsFromFilters(null, {
        lifecycleStatus: 'in_progress',
        participantType: 'school',
        targetLevel: 'middle',
        operationStartDate: '2026-04-01',
        operationEndDate: '2026-04-30',
      })
    ).toMatchObject({
      participantType: 'school',
      progressPhase: 'in_progress',
      targetLevel: 'middle',
      operationStartDate: '2026-04-01',
      operationEndDate: '2026-04-30',
    })
    expect(
      generalProgramListParamsFromFilters(null, {
        lifecycleStatus: 'education_in_progress',
      })
    ).toHaveProperty('progressPhase', undefined)
  })

  it.each(['school', 'individual', 'instructor', 'volunteer'])(
    'forwards participantType=%s without client-side remapping',
    participantType => {
      expect(
        generalProgramListParamsFromFilters(null, { participantType })
      ).toHaveProperty('participantType', participantType)
    }
  )

  it('filters programs by target level on the client', () => {
    const programs = [
      baseProgram,
      { ...baseProgram, id: '2', targetLevel: 'middle' as const },
    ]

    expect(
      clientFilterGeneralPrograms(programs, { targetLevel: 'elementary' })
    ).toHaveLength(1)
  })

  it('matches 교육 대상 when only targetLevels[] is set', () => {
    const programs = [
      { ...baseProgram, id: '1', targetLevel: undefined, targetLevels: ['elementary', 'middle'] as TargetLevel[] },
      { ...baseProgram, id: '2', targetLevel: undefined, targetLevels: ['high'] as TargetLevel[] },
    ]

    expect(
      clientFilterGeneralPrograms(programs, { targetLevel: 'middle' }).map(p => p.id)
    ).toEqual(['1'])
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

  it('matches typed lifecycleStatus values in progress phase filter', () => {
    const programs = [
      { ...baseProgram, id: '1', lifecycleStatus: 'scheduled' as const },
      { ...baseProgram, id: '2', lifecycleStatus: 'in_progress' as const },
      { ...baseProgram, id: '3', lifecycleStatus: 'completed' as const },
    ]

    expect(
      clientFilterGeneralPrograms(programs, { lifecycleStatus: 'scheduled' }).map(p => p.id)
    ).toEqual(['1'])
    expect(
      clientFilterGeneralPrograms(programs, { lifecycleStatus: 'in_progress' }).map(p => p.id)
    ).toEqual(['2'])
    expect(
      clientFilterGeneralPrograms(programs, { lifecycleStatus: 'completed' }).map(p => p.id)
    ).toEqual(['3'])
  })
})
