import { describe, expect, it } from 'vitest'
import {
  filterGeneralProgramsByOverviewStatus,
  mapAdminProgramListItemToProgram,
} from '@/features/program/general/api/adapters/general-program-adapters'

describe('general-program-adapters', () => {
  it('maps API list item to Program domain', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 5001,
      nameKo: 'JA 코리아 금융교육',
      periodStatus: 'RECRUITING',
      businessStartDate: '2026-03-01',
      businessEndDate: '2026-12-31',
    })

    expect(program.id).toBe('5001')
    expect(program.title).toBe('JA 코리아 금융교육')
    expect(program.lifecycleStatus).toBe('recruiting_students')
    expect(program.startDate).toBe('2026-03-01')
  })

  it('filters overview status like mock list', () => {
    const programs = [
      mapAdminProgramListItemToProgram({ id: 1, nameKo: 'A', periodStatus: 'RECRUITING' }),
      mapAdminProgramListItemToProgram({ id: 2, nameKo: 'B', periodStatus: 'IN_PROGRESS' }),
      mapAdminProgramListItemToProgram({ id: 3, nameKo: 'C', periodStatus: 'COMPLETED' }),
    ]

    expect(filterGeneralProgramsByOverviewStatus(programs, 'scheduled')).toHaveLength(1)
    expect(filterGeneralProgramsByOverviewStatus(programs, 'in_progress')).toHaveLength(1)
    expect(filterGeneralProgramsByOverviewStatus(programs, 'completed')).toHaveLength(1)
  })
})
